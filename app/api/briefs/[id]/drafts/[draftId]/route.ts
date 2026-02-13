import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export const runtime = "nodejs";

/**
 * GET /api/briefs/[id]/drafts/[draftId]
 * Download a draft PDF from Firestore
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string; draftId: string }> }
) {
    try {
        const { id, draftId } = await params;

        // Get the draft document from Firestore
        const draftRef = doc(db, "briefs", id, "drafts", draftId);
        const draftSnap = await getDoc(draftRef);

        if (!draftSnap.exists()) {
            return NextResponse.json(
                { error: "Draft not found" },
                { status: 404 }
            );
        }

        const draftData = draftSnap.data();

        // Convert base64 back to binary
        const buffer = Buffer.from(draftData.base64Data, 'base64');

        // Return the PDF file
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${draftData.fileName || 'draft.pdf'}"`,
                'Content-Length': buffer.length.toString(),
            },
        });
    } catch (error: any) {
        console.error("[download-draft] Error:", error);
        return NextResponse.json(
            { error: "Failed to download draft", details: error.message },
            { status: 500 }
        );
    }
}
