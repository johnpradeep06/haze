"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Brief, BriefStatus } from "@/app/types/chat";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Clock, CheckCircle2, Upload, DollarSign } from "lucide-react";

export default function DesignerBriefsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [briefs, setBriefs] = useState<(Brief & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
            return;
        }

        const fetchBriefs = async () => {
            if (!user) return;

            try {
                const briefsQuery = query(
                    collection(db, "briefs"),
                    where("designerId", "==", user.uid),
                    orderBy("createdAt", "desc")
                );

                const briefsSnap = await getDocs(briefsQuery);
                const briefsData = briefsSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Brief & { id: string }));

                setBriefs(briefsData);
            } catch (error) {
                console.error("Error fetching briefs:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchBriefs();
        }
    }, [user, authLoading, router]);

    const getStatusInfo = (status?: BriefStatus) => {
        switch (status) {
            case "quote_pending":
                return { label: "Quote Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", icon: Clock };
            case "quote_submitted":
                return { label: "Awaiting Customer", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: Clock };
            case "quote_confirmed":
                return { label: "Quote Accepted", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: CheckCircle2 };
            case "draft_1_uploaded":
                return { label: "Draft 1 Submitted", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200", icon: FileText };
            case "draft_1_reviewed":
                return { label: "Feedback Received", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", icon: FileText };
            case "draft_2_uploaded":
                return { label: "Draft 2 Submitted", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200", icon: FileText };
            case "approved":
                return { label: "Approved - Awaiting Payment", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", icon: DollarSign };
            case "paid":
                return { label: "Paid", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: CheckCircle2 };
            case "completed":
                return { label: "Completed", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: CheckCircle2 };
            case "declined":
                return { label: "Declined", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", icon: FileText };
            default:
                return { label: "Unknown", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200", icon: FileText };
        }
    };

    const getActionButton = (brief: Brief & { id: string }) => {
        switch (brief.status) {
            case "quote_confirmed":
            case "draft_1_reviewed":
                return (
                    <Button onClick={() => router.push(`/upload-draft/${brief.id}`)}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Draft
                    </Button>
                );
            case "paid":
                return (
                    <Button variant="outline" disabled>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Payment Received
                    </Button>
                );
            default:
                return (
                    <Button variant="outline" onClick={() => router.push(`/pool/${brief.id}`)}>
                        View Details
                    </Button>
                );
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
            {/* Header */}
            <div className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        My Accepted Briefs
                    </h1>
                    <Button onClick={() => router.push("/pool")} variant="outline">
                        Browse Pool
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {briefs.length === 0 ? (
                    <Card className="text-center py-12">
                        <CardContent>
                            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                No accepted briefs yet
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Browse the pool and accept briefs to get started
                            </p>
                            <Button onClick={() => router.push("/pool")}>
                                Browse Pool
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {briefs.map((brief) => {
                            const statusInfo = getStatusInfo(brief.status);
                            const StatusIcon = statusInfo.icon;

                            return (
                                <Card key={brief.id} className="hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between gap-2">
                                            <CardTitle className="text-lg line-clamp-2">
                                                {brief.summary || "Untitled Brief"}
                                            </CardTitle>
                                            <Badge className={statusInfo.color}>
                                                <StatusIcon className="w-3 h-3 mr-1" />
                                                {statusInfo.label}
                                            </Badge>
                                        </div>
                                        <CardDescription>
                                            Customer: {brief.customerEmail || "Unknown"}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Pricing Info */}
                                        {brief.designerQuote && (
                                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Your Quote
                                                </p>
                                                <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                    ₹{brief.designerQuote.toLocaleString()}
                                                </p>
                                                {brief.customerPrice && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        Customer pays: ₹{brief.customerPrice.toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Timeline */}
                                        {brief.estimatedDays && brief.status !== "paid" && brief.status !== "completed" && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Clock className="w-4 h-4" />
                                                <span>{brief.estimatedDays} days estimated</span>
                                            </div>
                                        )}

                                        {/* Feedback Display */}
                                        {brief.status === "draft_1_reviewed" && brief.draft1Feedback && (
                                            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                                                <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                                    Customer Feedback:
                                                </p>
                                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                                    {brief.draft1Feedback}
                                                </p>
                                            </div>
                                        )}

                                        {/* Action Button */}
                                        <div className="pt-2">
                                            {getActionButton(brief)}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
