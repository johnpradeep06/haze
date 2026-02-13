import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { calculateCustomerPrice } from "@/lib/brief-utils";
import { createNotification } from "@/lib/server-utils"; // Assume this internally handles Admin SDK or needs update too? I should check this.
// Checking imports... createNotification uses adminDb internally? I should verify. 
// But first let's fix this file.

export const runtime = "nodejs";

/**
 * POST /api/briefs/[id]/quote
 * Designer submits a quote for a brief
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { designerQuote, estimatedDays, designerId, designerName, designerEmail } = body;

        // Validation
        if (!designerQuote || !estimatedDays || !designerId) {
            return NextResponse.json(
                { error: "Missing required fields: designerQuote, estimatedDays, designerId" },
                { status: 400 }
            );
        }

        if (typeof designerQuote !== "number" || designerQuote <= 0) {
            return NextResponse.json(
                { error: "Invalid designerQuote: must be a positive number" },
                { status: 400 }
            );
        }

        if (typeof estimatedDays !== "number" || estimatedDays <= 0) {
            return NextResponse.json(
                { error: "Invalid estimatedDays: must be a positive number" },
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

        const briefData = briefSnap.data() as any; // Cast to any or Brief type if available

        // Check if brief is available (either open or already assigned to this designer)
        if (briefData.status !== "open" && briefData.designerId !== designerId) {
            return NextResponse.json(
                { error: "This brief is not available or you are not assigned to it" },
                { status: 403 }
            );
        }

        // Calculate customer price (designer quote + 25% platform fee)
        const customerPrice = calculateCustomerPrice(designerQuote);

        // Update the brief with quote information and assign designer using Admin SDK
        await briefRef.update({
            designerId,
            designerName: designerName || briefData.designerName || null,
            designerEmail: designerEmail || briefData.designerEmail || null,
            designerQuote,
            customerPrice,
            estimatedDays,
            status: "quote_submitted",
            assignedAt: briefData.assignedAt || FieldValue.serverTimestamp(),
            quoteSubmittedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        // Create notification for customer
        if (briefData.customerId) {
            await createNotification(
                briefData.customerId,
                "quote_ready",
                id,
                `Quote ready for "${briefData.summary?.substring(0, 50) || 'your brief'}..."`
            );
        }

        return NextResponse.json({
            success: true,
            customerPrice,
            message: "Quote submitted successfully",
        });
    } catch (error: any) {
        console.error("[quote] Error:", error);
        return NextResponse.json(
            { error: "Failed to submit quote", details: error.message },
            { status: 500 }
        );
    }
}
