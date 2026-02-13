import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { calculatePlatformFee, calculateDesignerEarning } from "@/lib/brief-utils";
import { createNotification } from "@/lib/server-utils"; // Assumes server-utils is compatible

export const runtime = "nodejs";

/**
 * POST /api/briefs/[id]/review-draft
 * Customer reviews a draft (adds feedback for draft 1, or approves/declines draft 2)
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { draftNumber, approved, feedback, customerId } = body;

        // Validation
        if (!draftNumber || !customerId) {
            return NextResponse.json(
                { error: "Missing required fields: draftNumber, customerId" },
                { status: 400 }
            );
        }

        if (draftNumber !== 1 && draftNumber !== 2) {
            return NextResponse.json(
                { error: "Invalid draftNumber: must be 1 or 2" },
                { status: 400 }
            );
        }

        // Get the brief using Admin SDK
        const briefRef = adminDb.collection("briefs").doc(id);
        const briefSnap = await briefRef.get();

        if (!briefSnap.exists) {
            return NextResponse.json(
                { error: "Brief not found" },
                { status: 404 }
            );
        }

        const briefData = briefSnap.data() as any;

        // Verify the customer owns this brief
        if (briefData.customerId !== customerId) {
            return NextResponse.json(
                { error: "Unauthorized: You do not own this brief" },
                { status: 403 }
            );
        }

        if (draftNumber === 1) {
            // Draft 1 review - customer provides feedback
            if (!feedback || typeof feedback !== "string") {
                return NextResponse.json(
                    { error: "Feedback is required for draft 1 review" },
                    { status: 400 }
                );
            }

            // Verify brief status
            if (briefData.status !== "draft_1_uploaded") {
                return NextResponse.json(
                    { error: `Invalid status: Brief must be in 'draft_1_uploaded' status` },
                    { status: 400 }
                );
            }

            // Update brief with feedback
            await briefRef.update({
                draft1Feedback: feedback,
                draft1ReviewedAt: FieldValue.serverTimestamp(),
                status: "draft_1_reviewed",
                updatedAt: FieldValue.serverTimestamp(),
            });

            // Notify designer
            if (briefData.designerId) {
                await createNotification(
                    briefData.designerId,
                    "feedback_received",
                    id,
                    `Feedback received for "${briefData.summary?.substring(0, 50) || 'the brief'}..."`
                );
            }

            return NextResponse.json({
                success: true,
                message: "Feedback submitted. Designer will create draft 2.",
            });
        } else {
            // Draft 2 review - customer approves or declines
            if (typeof approved !== "boolean") {
                return NextResponse.json(
                    { error: "approved (boolean) is required for draft 2 review" },
                    { status: 400 }
                );
            }

            // Verify brief status
            if (briefData.status !== "draft_2_uploaded") {
                return NextResponse.json(
                    { error: `Invalid status: Brief must be in 'draft_2_uploaded' status` },
                    { status: 400 }
                );
            }

            if (approved) {
                // Customer approved - create payment record
                const customerPrice = briefData.customerPrice || 0;
                const platformFee = calculatePlatformFee(customerPrice);
                const designerEarning = calculateDesignerEarning(customerPrice);

                // Create payment record using Admin SDK
                await adminDb.collection("payments").add({
                    briefId: id,
                    customerId: briefData.customerId,
                    designerId: briefData.designerId,
                    customerPaid: customerPrice,
                    designerEarning,
                    platformFee,
                    status: "pending",
                    createdAt: FieldValue.serverTimestamp(),
                });

                // Update brief status
                await briefRef.update({
                    status: "approved",
                    updatedAt: FieldValue.serverTimestamp(),
                });

                // Notify designer
                if (briefData.designerId) {
                    await createNotification(
                        briefData.designerId,
                        "payment_pending",
                        id,
                        `Design approved! Payment pending for "${briefData.summary?.substring(0, 50) || 'the brief'}..."`
                    );
                }

                return NextResponse.json({
                    success: true,
                    message: "Design approved! Please proceed to payment.",
                    customerPrice,
                });
            } else {
                // Customer declined
                await briefRef.update({
                    status: "declined",
                    updatedAt: FieldValue.serverTimestamp(),
                });

                // Notify designer
                if (briefData.designerId) {
                    await createNotification(
                        briefData.designerId,
                        "brief_completed", // Reusing type
                        id,
                        `Final design declined for "${briefData.summary?.substring(0, 50) || 'the brief'}..."`
                    );
                }

                return NextResponse.json({
                    success: true,
                    message: "Design declined. Brief marked as declined.",
                });
            }
        }
    } catch (error: any) {
        console.error("[review-draft] Error:", error);
        return NextResponse.json(
            { error: "Failed to review draft", details: error.message },
            { status: 500 }
        );
    }
}
