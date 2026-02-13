"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Brief } from "@/app/types/chat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Clock } from "lucide-react";

export default function BriefDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { user } = useAuth();
    const [brief, setBrief] = useState<(Brief & { id: string }) | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBrief = async () => {
            try {
                const briefRef = doc(db, "briefs", id);
                const briefSnap = await getDoc(briefRef);

                if (briefSnap.exists()) {
                    setBrief({ id: briefSnap.id, ...briefSnap.data() } as Brief & { id: string });
                } else {
                    setError("Brief not found");
                }
            } catch (err: any) {
                setError(err.message || "Failed to load brief");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchBrief();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error || !brief) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <CardTitle className="text-red-600">Error</CardTitle>
                        <CardDescription>{error || "Brief not found"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.push("/my-briefs")} className="w-full">
                            Back to My Briefs
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950 py-12 px-4">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/my-briefs")}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Brief Details
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            {brief.status === "open" ? "Waiting for designer" : `Status: ${brief.status}`}
                        </p>
                    </div>
                    {brief.status === "open" && (
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            <Clock className="w-3 h-3 mr-1" />
                            Open
                        </Badge>
                    )}
                </div>

                {/* Brief Content */}
                <Card>
                    <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                        <CardTitle className="text-2xl">Your Merchandise Brief</CardTitle>
                        <CardDescription className="text-indigo-100">
                            {brief.status === "open"
                                ? "Your brief is in the pool. Designers will review and submit quotes soon."
                                : "A designer has been assigned to your brief"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        {/* Summary */}
                        <div>
                            <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                                Summary
                            </h3>
                            <p className="text-gray-700 dark:text-gray-300">
                                {brief.summary}
                            </p>
                        </div>

                        {/* Core Design Direction */}
                        {brief.core_design_direction && brief.core_design_direction.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                                    Core Design Direction
                                </h3>
                                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                                    {brief.core_design_direction.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Visual Language */}
                        {brief.visual_language && brief.visual_language.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                                    Visual Language
                                </h3>
                                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                                    {brief.visual_language.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Color & Typography */}
                        {brief.color_and_typography && brief.color_and_typography.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                                    Color & Typography
                                </h3>
                                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                                    {brief.color_and_typography.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Do's and Don'ts */}
                        <div className="grid md:grid-cols-2 gap-4">
                            {brief.dos && brief.dos.length > 0 && (
                                <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
                                    <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                                        Do's
                                    </h3>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-green-700 dark:text-green-300">
                                        {brief.dos.map((item, i) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {brief.donts && brief.donts.length > 0 && (
                                <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-4 border border-red-200 dark:border-red-800">
                                    <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                                        Don'ts
                                    </h3>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
                                        {brief.donts.map((item, i) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Status Message */}
                        {brief.status === "open" && (
                            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                    What's Next?
                                </h3>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    Your brief is now visible to all designers. When a designer accepts your brief,
                                    they will submit a quote with their pricing and estimated timeline. You'll receive
                                    a notification when a quote is ready for review.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
