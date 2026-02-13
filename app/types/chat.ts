export type ChatMsg = { role: "user" | "assistant"; text: string };
export type ApiMsg = { role: "system" | "user" | "assistant"; content: string };

// Brief status workflow states
export type BriefStatus =
    | "open"
    | "quote_pending"
    | "quote_submitted"
    | "quote_confirmed"
    | "draft_1_uploaded"
    | "draft_1_reviewed"
    | "draft_2_uploaded"
    | "approved"
    | "payment_pending"
    | "paid"
    | "completed"
    | "declined";

export type Brief = {
    // Original brief content
    summary: string;
    core_design_direction: string[];
    visual_language: string[];
    color_and_typography: string[];
    product_specific_notes: {
        tee: string[];
        team_jacket: string[];
        founder_wear: string[];
    };
    dos: string[];
    donts: string[];
    closing_to_customer: string;

    // Customer info
    customerEmail?: string;
    customerId?: string;

    // Workflow status
    status?: BriefStatus;

    // Designer info
    designerId?: string;
    designerName?: string;
    designerEmail?: string;
    assignedAt?: any; // Firestore Timestamp

    // Pricing
    designerQuote?: number; // Amount designer will receive (80%)
    customerPrice?: number; // Amount customer pays (designerQuote * 1.25)
    estimatedDays?: number;
    quoteSubmittedAt?: any;
    quoteConfirmedAt?: any;

    // Draft files
    draft1Url?: string;
    draft1FileName?: string;
    draft1UploadedAt?: any;
    draft1Feedback?: string;
    draft1ReviewedAt?: any;
    draft2Url?: string;
    draft2FileName?: string;
    draft2UploadedAt?: any;

    // Payment
    paymentConfirmedAt?: any;
    paymentTransactionId?: string;
    designerPaidAt?: any;

    // Manufacturing
    manufacturingRequested?: boolean;
    manufacturingNotes?: string;

    // Timestamps
    createdAt?: any;
    updatedAt?: any;
};

export type LlmNext =
    | { done: false; question: string }
    | { done: true; brief: Brief };
