export type PaymentStatus = "pending" | "customer_paid" | "designer_paid";

export type Payment = {
    id?: string;
    briefId: string;
    customerId: string;
    designerId: string;
    customerPaid: number; // Total amount customer paid
    designerEarning: number; // 80% of customerPaid
    platformFee: number; // 20% of customerPaid
    status: PaymentStatus;
    customerPaidAt?: any; // Firestore Timestamp
    designerPaidAt?: any;
    transactionId?: string;
    createdAt?: any;
};
