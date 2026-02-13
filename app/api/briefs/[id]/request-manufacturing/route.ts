import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc, serverTimestamp, query, collection, where, getDocs } from "firebase/firestore";
import { createNotification } from "@/lib/server-utils";

export const runtime = "nodejs";

/**
 * POST /api/briefs/[id]/request-manufacturing
 * Customer requests manufacturing after payment
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { notes, customerId } = body;

        // Validation
        if (!customerId) {
            return NextResponse.json(
                { error: "Missing required field: customerId" },
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

        // Verify brief is paid
        if (briefData.status !== "paid") {
            return NextResponse.json(
                { error: `Invalid status: Brief must be in 'paid' status to request manufacturing` },
                { status: 400 }
            );
        }

        // Update brief
        await updateDoc(briefRef, {
            manufacturingRequested: true,
            manufacturingNotes: notes || "",
            updatedAt: serverTimestamp(),
        });

        // Notify all admins
        const usersQuery = query(
            collection(db, "users"),
            where("role", "==", "admin")
        );
        const adminSnap = await getDocs(usersQuery);

        for (const adminDoc of adminSnap.docs) {
            await createNotification(
                adminDoc.id,
                "brief_completed", // Reusing type
                id,
                `Manufacturing requested for "${briefData.summary?.substring(0, 50) || 'a brief'}..."`
            );
        }

        return NextResponse.json({
            success: true,
            message: "Manufacturing request submitted. We'll contact you shortly with details.",
        });
    } catch (error: any) {
        console.error("[request-manufacturing] Error:", error);
        return NextResponse.json(
            { error: "Failed to request manufacturing", details: error.message },
            { status: 500 }
        );
    }
}
