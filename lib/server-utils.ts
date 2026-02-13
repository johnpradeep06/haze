import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from 'firebase-admin/firestore';
import { NotificationType } from "@/app/types/notification";

/**
 * Create a notification for a user (SERVER-SIDE ONLY)
 * This function uses Firebase Admin SDK and can only be called from API routes
 */
export async function createNotification(
    userId: string,
    type: NotificationType,
    briefId: string,
    message: string
): Promise<void> {
    try {
        await adminDb.collection("notifications").add({
            userId,
            type,
            briefId,
            message,
            read: false,
            createdAt: FieldValue.serverTimestamp(),
        });
    } catch (error) {
        console.error("Error creating notification:", error);
        throw error;
    }
}
