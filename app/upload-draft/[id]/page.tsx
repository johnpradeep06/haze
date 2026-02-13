"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, FileText } from "lucide-react";

export default function UploadDraftPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { user } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [draftNumber, setDraftNumber] = useState<"1" | "2">("1");
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== "application/pdf") {
                setError("Please select a PDF file");
                return;
            }
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError("File size must be less than 10MB");
                return;
            }
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file || !user) {
            setError("Please select a file");
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("draftNumber", draftNumber);
            formData.append("designerId", user.uid);

            const response = await fetch(`/api/briefs/${id}/upload-draft`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to upload draft");
            }

            // Redirect back to brief detail page
            router.push(`/pool/${id}`);
        } catch (err: any) {
            setError(err.message || "Failed to upload draft");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                        <CardTitle className="text-2xl">Upload Draft</CardTitle>
                        <CardDescription className="text-indigo-100">
                            Upload your design draft as a PDF file
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleUpload} className="space-y-6">
                            {/* Draft Number Selection */}
                            <div className="space-y-2">
                                <Label>Draft Number</Label>
                                <div className="flex gap-4">
                                    <Button
                                        type="button"
                                        variant={draftNumber === "1" ? "default" : "outline"}
                                        onClick={() => setDraftNumber("1")}
                                        className="flex-1"
                                    >
                                        Draft 1
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={draftNumber === "2" ? "default" : "outline"}
                                        onClick={() => setDraftNumber("2")}
                                        className="flex-1"
                                    >
                                        Draft 2
                                    </Button>
                                </div>
                            </div>

                            {/* File Upload */}
                            <div className="space-y-2">
                                <Label htmlFor="file">PDF File</Label>
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors">
                                    <Input
                                        id="file"
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="file"
                                        className="cursor-pointer flex flex-col items-center gap-2"
                                    >
                                        {file ? (
                                            <>
                                                <FileText className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {file.name}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-12 h-12 text-gray-400" />
                                                <p className="font-medium text-gray-700 dark:text-gray-300">
                                                    Click to upload PDF
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Maximum file size: 10MB
                                                </p>
                                            </>
                                        )}
                                    </label>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push(`/pool/${id}`)}
                                    disabled={uploading}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!file || uploading}
                                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4 mr-2" />
                                            Upload Draft {draftNumber}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
