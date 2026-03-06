import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from 'firebase-admin/firestore';
import { createNotification } from "@/lib/server-utils";

export const runtime = "nodejs";

/**
 * POST /api/briefs/[id]/upload-draft
 * Designer uploads a draft (PDF file)
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const draftNumber = formData.get("draftNumber") as string;
        const designerId = formData.get("designerId") as string;

        // Validation
        if (!draftNumber || !file || !designerId) {
            return NextResponse.json(
                { error: "Missing required fields: draftNumber, file, designerId" },
                { status: 400 }
            );
        }

        if (draftNumber !== "1" && draftNumber !== "2") {
            return NextResponse.json(
                { error: "Invalid draftNumber: must be 1 or 2" },
                { status: 400 }
            );
        }

        // Validate file type
        if (file.type !== "application/pdf") {
            return NextResponse.json(
                { error: "Invalid file type: only PDF files are allowed" },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB initially, but Firestore has stricter limits)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: "File too large: maximum size is 5MB for PDF uploads" },
                { status: 400 }
            );
        }

        // Get the brief using Admin SDK
        const briefRef = adminDb.collection("briefs").doc(id);
        const briefSnap = await briefRef.get();

        if (!briefSnap.exists) {
            return NextResponse.json(
                { error: "Brief not found" },
                { status: 404 }
            );
        }

        const briefData = briefSnap.data();

        // Verify the designer is assigned to this brief
        if (briefData?.designerId !== designerId) {
            return NextResponse.json(
                { error: "Unauthorized: You are not assigned to this brief" },
                { status: 403 }
            );
        }

        // Verify brief status
        const expectedStatus = draftNumber === "1" ? "quote_confirmed" : "draft_1_reviewed";
        if (briefData?.status !== expectedStatus) {
            return NextResponse.json(
                { error: `Invalid status: Brief must be in '${expectedStatus}' status to upload draft ${draftNumber}` },
                { status: 400 }
            );
        }

        // Convert File to buffer for Cloudinary upload
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Cloudinary
        const cloudinary = require('cloudinary').v2;

        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        // Upload buffer to Cloudinar
        const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `briefs/${id}`,
                    resource_type: 'raw',
                    public_id: `draft${draftNumber}`,
                    type: 'upload',
                },
                (error: any, result: any) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(buffer);
        });

        const fileUrl = (uploadResult as any).secure_url;

        // Update brief in Firestore using Admin SDK
        const updateData: any = {
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (draftNumber === "1") {
            updateData.draft1Url = fileUrl;
            updateData.draft1FileName = file.name;
            updateData.draft1UploadedAt = FieldValue.serverTimestamp();
            updateData.status = "draft_1_uploaded";
        } else {
            updateData.draft2Url = fileUrl;
            updateData.draft2FileName = file.name;
            updateData.draft2UploadedAt = FieldValue.serverTimestamp();
            updateData.status = "draft_2_uploaded";
        }

        await briefRef.update(updateData);

        // Create notification for customer
        if (briefData.customerId) {
            await createNotification(
                briefData.customerId,
                "draft_uploaded",
                id,
                `Draft ${draftNumber} is ready for review: "${briefData.summary?.substring(0, 50) || 'your brief'}..."`
            );
        }

        return NextResponse.json({
            success: true,
            message: `Draft ${draftNumber} uploaded successfully`,
            fileUrl: fileUrl,
        });
    } catch (error: any) {
        console.error("[upload-draft] Error:", error);
        return NextResponse.json(
            { error: "Failed to upload draft", details: error.message },
            { status: 500 }
        );
    }
}
