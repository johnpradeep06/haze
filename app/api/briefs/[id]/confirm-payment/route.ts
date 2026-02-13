import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc, serverTimestamp, query, collection, where, getDocs, limit } from "firebase/firestore";
import { createNotification } from "@/lib/server-utils";

export const runtime = "nodejs";

/**
 * POST /api/briefs/[id]/confirm-payment
 * Customer confirms they have made the payment
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { transactionId, customerId } = body;

        // Validation
        if (!transactionId || !customerId) {
            return NextResponse.json(
                { error: "Missing requred fields: transactionId, customerId" },
                { status: 400 }
            );
        }

        // Get the brief
        const briefRef = doc(db, "briefs", id);
        const briefSnap = await getDoc(briefRef);

        if (!briefSnap.exists()) {
            return NextResponse.json(
                { error: "Brief not found" },
                { status: 404 }
            );
        }

        const briefData = briefSnap.data();

        // Verify the customer owns this brief
        if (briefData.customerId !== customerId) {
            return NextResponse.json(
                { error: "Unauthorized: You do not own this brief" },
                { status: 403 }
            );
        }

        // Verify brief status
        if (briefData.status !== "approved") {
            return NextResponse.json(
                { error: `Invalid status: Brief must be in 'approved' status` },
                { status: 400 }
            );
        }

        // Update brief
        await updateDoc(briefRef, {
            paymentTransactionId: transactionId,
            paymentConfirmedAt: serverTimestamp(),
            status: "paid",
            updatedAt: serverTimestamp(),
        });

        // Update payment record
        const paymentsQuery = query(
            collection(db, "payments"),
            where("briefId", "==", id),
            where("status", "==", "pending"),
            limit(1)
        );
        const paymentSnap = await getDocs(paymentsQuery);

        if (!paymentSnap.empty) {
            const paymentDoc = paymentSnap.docs[0];
            await updateDoc(paymentDoc.ref, {
                status: "customer_paid",
                customerPaidAt: serverTimestamp(),
                transactionId,
            });
        }

        // Notify designer and admin
        if (briefData.designerId) {
            await createNotification(
                briefData.designerId,
                "payment_received",
                id,
                `Payment received for "${briefData.summary?.substring(0, 50) || 'the brief'}..."`
            );
        }

        // Get admin users to notify them
        const usersQuery = query(
            collection(db, "users"),
            where("role", "==", "admin")
        );
        const adminSnap = await getDocs(usersQuery);

        for (const adminDoc of adminSnap.docs) {
            await createNotification(
                adminDoc.id,
                "payment_received",
                id,
                `Payment received for brief. Transaction ID: ${transactionId}`
            );
        }

        return NextResponse.json({
            success: true,
            downloadUrl: briefData.draft2Url,
            message: "Payment confirmed! You can now download your design.",
        });
    } catch (error: any) {
        console.error("[confirm-payment] Error:", error);
        return NextResponse.json(
            { error: "Failed to confirm payment", details: error.message },
            { status: 500 }
        );
    }
}
