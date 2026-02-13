import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit as firestoreLimit } from "firebase/firestore";

export const runtime = "nodejs";

/**
 * GET /api/notifications?userId=xxx&limit=20
 * Get notifications for a user
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const limitParam = searchParams.get("limit");
        const limit = limitParam ? parseInt(limitParam) : 20;

        // Validation
        if (!userId) {
            return NextResponse.json(
                { error: "Missing required parameter: userId" },
                { status: 400 }
            );
        }

        // Query notifications
        const notificationsQuery = query(
            collection(db, "notifications"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc"),
            firestoreLimit(limit)
        );

        const notificationsSnap = await getDocs(notificationsQuery);
        const notifications = notificationsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        // Count unread
        const unreadCount = notifications.filter((n: any) => !n.read).length;

        return NextResponse.json({
            success: true,
            notifications,
            unreadCount,
        });
    } catch (error: any) {
        console.error("[notifications] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch notifications", details: error.message },
            { status: 500 }
        );
    }
}
