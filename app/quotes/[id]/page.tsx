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
import { Loader2, CheckCircle2, XCircle, Calendar, DollarSign } from "lucide-react";
import { calculatePlatformFee } from "@/lib/brief-utils";

export default function QuoteConfirmationPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { user } = useAuth();
    const [brief, setBrief] = useState<(Brief & { id: string }) | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
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

    const handleConfirm = async (confirmed: boolean) => {
        if (!user) {
            setError("You must be logged in");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const response = await fetch(`/api/briefs/${id}/confirm-quote`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    confirmed,
                    customerId: user.uid,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to process confirmation");
            }

            if (confirmed) {
                // Redirect to brief detail page
                router.push(`/brief/${id}`);
            } else {
                // Redirect back to home
                router.push("/");
            }
        } catch (err: any) {
            setError(err.message || "Failed to process confirmation");
        } finally {
            setSubmitting(false);
        }
    };

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
                        <Button onClick={() => router.push("/")} className="w-full">
                            Go Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const customerPrice = brief.customerPrice || 0;
    const designerQuote = brief.designerQuote || 0;
    const platformFee = calculatePlatformFee(customerPrice);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950 py-12 px-4">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Designer Quote Ready
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Review the quote and decide whether to proceed
                    </p>
                </div>

                {/* Quote Card */}
                <Card className="border-2">
                    <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                        <CardTitle className="text-2xl">Quote Details</CardTitle>
                        <CardDescription className="text-indigo-100">
                            From {brief.designerName || brief.designerEmail}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        {/* Brief Summary */}
                        <div>
                            <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                                Your Brief
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                {brief.summary}
                            </p>
                        </div>

                        {/* Pricing Breakdown */}
                        <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
                            <h3 className="font-semibold text-lg flex items-center gap-2 text-gray-900 dark:text-white">
                                <DollarSign className="w-5 h-5" />
                                Pricing Breakdown
                            </h3>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400">Design Fee</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        ₹{designerQuote.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400">Platform Fee (20%)</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        ₹{platformFee.toLocaleString()}
                                    </span>
                                </div>
                                <div className="border-t pt-3 flex justify-between items-center">
                                    <span className="font-semibold text-lg text-gray-900 dark:text-white">Total Amount</span>
                                    <span className="font-bold text-2xl text-indigo-600 dark:text-indigo-400">
                                        ₹{customerPrice.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <div>
                                <p className="font-medium text-blue-900 dark:text-blue-100">
                                    Estimated Completion
                                </p>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    {brief.estimatedDays} {brief.estimatedDays === 1 ? 'day' : 'days'}
                                </p>
                            </div>
                        </div>

                        {/* What Happens Next */}
                        <div className="space-y-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">What happens next?</h3>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span>Designer will create Draft 1 for your review</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span>You can provide feedback on Draft 1</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span>Designer will create Draft 2 based on your feedback</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span>You approve or decline the final design</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span>Payment is made after final approval</span>
                                </li>
                            </ul>
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => handleConfirm(false)}
                                disabled={submitting}
                                className="flex-1"
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Decline Quote
                            </Button>
                            <Button
                                onClick={() => handleConfirm(true)}
                                disabled={submitting}
                                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                            >
                                {submitting ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                )}
                                Confirm & Proceed
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
