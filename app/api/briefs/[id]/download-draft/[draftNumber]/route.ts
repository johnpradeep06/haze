import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

/**
 * GET /api/briefs/[id]/download-draft/[draftNumber]
 * Download a draft PDF by proxying through the server
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string; draftNumber: string }> }
) {
    try {
        const { id, draftNumber } = await params;


        console.log(`[download-draft] Request for briefId: ${id}, draftNumber: ${draftNumber}`);

        // Get the brief to retrieve the draft URL
        const briefRef = adminDb.collection("briefs").doc(id);
        const briefSnap = await briefRef.get();

        if (!briefSnap.exists) {
            console.error(`[download-draft] Brief not found: ${id}`);
            return NextResponse.json(
                { error: "Brief not found" },
                { status: 404 }
            );
        }

        const briefData = briefSnap.data();
        const draftUrl = draftNumber === "1" ? briefData?.draft1Url : briefData?.draft2Url;
        const fileName = draftNumber === "1" ? briefData?.draft1FileName : briefData?.draft2FileName;

        console.log(`[download-draft] Found URL: ${draftUrl}`);

        if (!draftUrl) {
            console.error(`[download-draft] Draft URL is missing for draft ${draftNumber}`);
            return NextResponse.json(
                { error: "Draft not found" },
                { status: 404 }
            );
        }

        // Fetch the PDF from Cloudinary
        const response = await fetch(draftUrl);

        console.log(`[download-draft] Cloudinary response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[download-draft] Cloudinary error: ${response.status} - ${errorText}`);
            return NextResponse.json(
                { error: "Failed to fetch PDF from Cloudinary", status: response.status, details: errorText },
                { status: 500 }
            );
        }

        const pdfBuffer = await response.arrayBuffer();

        // Return the PDF with download headers
        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${fileName || `draft${draftNumber}.pdf`}"`,
                'Content-Length': pdfBuffer.byteLength.toString(),
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
