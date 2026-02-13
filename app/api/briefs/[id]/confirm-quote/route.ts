import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { createNotification } from "@/lib/server-utils"; // Make sure server-utils also uses Admin SDK (I will check next)

export const runtime = "nodejs";

/**
 * POST /api/briefs/[id]/confirm-quote
 * Customer confirms or declines a quote
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { confirmed, customerId } = body;

        // Validation
        if (typeof confirmed !== "boolean" || !customerId) {
            return NextResponse.json(
                { error: "Missing required fields: confirmed (boolean), customerId" },
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

        // Verify brief is in correct status
        if (briefData.status === "quote_confirmed" && confirmed) {
            // Already confirmed - return success (idempotent)
            return NextResponse.json({
                success: true,
                message: "Quote already confirmed.",
            });
        }

        if (briefData.status !== "quote_submitted") {
            return NextResponse.json(
                { error: `Invalid status: Brief must be in 'quote_submitted' status, currently '${briefData.status}'` },
                { status: 400 }
            );
        }

        if (confirmed) {
            // Customer confirmed the quote
            await briefRef.update({
                status: "quote_confirmed",
                quoteConfirmedAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            });

            // Notify designer
            if (briefData.designerId) {
                await createNotification(
                    briefData.designerId,
                    "quote_confirmed",
                    id,
                    `Quote confirmed! Start working on "${briefData.summary?.substring(0, 50) || 'the brief'}..."`
                );
            }

            return NextResponse.json({
                success: true,
                message: "Quote confirmed. Designer will start working on your brief.",
            });
        } else {
            // Customer declined the quote - return brief to pool
            await briefRef.update({
                status: "open",
                designerId: null,
                designerName: null,
                designerEmail: null,
                designerQuote: null,
                customerPrice: null,
                estimatedDays: null,
                quoteSubmittedAt: null,
                assignedAt: null,
                updatedAt: FieldValue.serverTimestamp(),
            });

            // Notify designer
            if (briefData.designerId) {
                await createNotification(
                    briefData.designerId,
                    "quote_confirmed", // Using same type, but message is different - todo: check if we should add quote_declined type
                    id,
                    `Quote declined for "${briefData.summary?.substring(0, 50) || 'the brief'}...". Brief returned to pool.`
                );
            }

            return NextResponse.json({
                success: true,
                message: "Quote declined. Brief returned to the pool.",
            });
        }
    } catch (error: any) {
        console.error("[confirm-quote] Error:", error);
        return NextResponse.json(
            { error: "Failed to process quote confirmation", details: error.message },
            { status: 500 }
        );
    }
}
