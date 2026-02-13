import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export const runtime = "nodejs";

/**
 * POST /api/notifications/[id]/mark-read
 * Mark a notification as read
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Update notification
        const notificationRef = doc(db, "notifications", id);
        await updateDoc(notificationRef, {
            read: true,
        });

        return NextResponse.json({
            success: true,
            message: "Notification marked as read",
        });
    } catch (error: any) {
        console.error("[mark-read] Error:", error);
        return NextResponse.json(
            { error: "Failed to mark notification as read", details: error.message },
            { status: 500 }
        );
    }
}
