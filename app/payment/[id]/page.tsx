"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { Brief } from "@/app/types/chat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, QrCode, CheckCircle2, Download } from "lucide-react";

export default function PaymentPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { user } = useAuth();
    const [brief, setBrief] = useState<(Brief & { id: string }) | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [transactionId, setTransactionId] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch brief
                const briefRef = doc(db, "briefs", id);
                const briefSnap = await getDoc(briefRef);

                if (briefSnap.exists()) {
                    setBrief({ id: briefSnap.id, ...briefSnap.data() } as Brief & { id: string });
                } else {
                    setError("Brief not found");
                    return;
                }

                // Fetch QR code from adminSettings
                const settingsQuery = query(
                    collection(db, "adminSettings"),
                    where("type", "==", "gpay_qr"),
                    limit(1)
                );
                const settingsSnap = await getDocs(settingsQuery);

                if (!settingsSnap.empty) {
                    const qrData = settingsSnap.docs[0].data();
                    setQrCodeUrl(qrData.qrCodeUrl);
                } else {
                    setError("Payment QR code not configured. Please contact admin.");
                }
            } catch (err: any) {
                setError(err.message || "Failed to load payment information");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    const handleConfirmPayment = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user || !transactionId.trim()) {
            setError("Please enter a transaction ID");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const response = await fetch(`/api/briefs/${id}/confirm-payment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    transactionId: transactionId.trim(),
                    customerId: user.uid,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to confirm payment");
            }

            // Show success and allow download
            alert("Payment confirmed! You can now download your design.");

            // Download the design
            if (data.downloadUrl) {
                window.open(data.downloadUrl, "_blank");
            }

            // Redirect to home or my briefs
            router.push("/");
        } catch (err: any) {
            setError(err.message || "Failed to confirm payment");
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

    if (error && !brief) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <CardTitle className="text-red-600">Error</CardTitle>
                        <CardDescription>{error}</CardDescription>
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

    const customerPrice = brief?.customerPrice || 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950 py-12 px-4">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Complete Payment
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Scan the QR code to pay via GPay
                    </p>
                </div>

                {/* Payment Card */}
                <Card className="border-2">
                    <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                        <CardTitle className="text-2xl">Payment Details</CardTitle>
                        <CardDescription className="text-indigo-100">
                            Total Amount: ₹{customerPrice.toLocaleString()}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        {/* QR Code Display */}
                        {qrCodeUrl ? (
                            <div className="flex flex-col items-center space-y-4">
                                <div className="bg-white p-6 rounded-lg shadow-lg">
                                    <img
                                        src={qrCodeUrl}
                                        alt="GPay QR Code"
                                        className="w-64 h-64 object-contain"
                                    />
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <QrCode className="w-4 h-4" />
                                    <span>Scan with any UPI app to pay</span>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                    QR code is not available. Please contact admin.
                                </p>
                            </div>
                        )}

                        {/* Payment Instructions */}
                        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                Payment Instructions
                            </h3>
                            <ol className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                                <li className="flex items-start gap-2">
                                    <span className="font-semibold">1.</span>
                                    <span>Open your UPI app (GPay, PhonePe, Paytm, etc.)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-semibold">2.</span>
                                    <span>Scan the QR code above</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-semibold">3.</span>
                                    <span>Enter the amount: ₹{customerPrice.toLocaleString()}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-semibold">4.</span>
                                    <span>Complete the payment</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-semibold">5.</span>
                                    <span>Copy the transaction ID and paste it below</span>
                                </li>
                            </ol>
                        </div>

                        {/* Transaction ID Form */}
                        <form onSubmit={handleConfirmPayment} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="transactionId">Transaction ID / UPI Reference Number</Label>
                                <Input
                                    id="transactionId"
                                    type="text"
                                    placeholder="e.g., 123456789012"
                                    value={transactionId}
                                    onChange={(e) => setTransactionId(e.target.value)}
                                    required
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    You'll find this in your payment confirmation message
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={!transactionId.trim() || submitting}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Confirming Payment...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Confirm Payment
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* What Happens Next */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                After Payment Confirmation
                            </h3>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <li className="flex items-start gap-2">
                                    <Download className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span>You'll be able to download your final design immediately</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span>Designer will receive their payment within 2-3 business days</span>
                                </li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
