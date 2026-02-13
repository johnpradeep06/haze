export type NotificationType =
    | "quote_ready"
    | "quote_confirmed"
    | "draft_uploaded"
    | "feedback_received"
    | "payment_pending"
    | "payment_received"
    | "brief_completed";

export type Notification = {
    id?: string;
    userId: string;
    type: NotificationType;
    briefId: string;
    message: string;
    read: boolean;
    createdAt?: any; // Firestore Timestamp
};
