"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { runTransaction, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { QuoteModal } from "./quote-modal";

type Brief = {
    id: string;
    summary: string;
    core_design_direction: string[];
    visual_language: string[];
    status: string;
};

export function BriefCard({ brief }: { brief: Brief }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const router = useRouter();
    const { user } = useAuth();

    const handleAccept = async () => {
        if (!user) {
            setError("You must be logged in to accept briefs");
            return;
        }

        // Show quote modal immediately without updating status yet
        // The status will be updated when the quote is submitted
        setShowQuoteModal(true);
    };

    const handleQuoteSuccess = () => {
        // After successful quote submission, navigate to brief detail
        router.push(`/pool/${brief.id}`);
    };

    return (
        <Card
            className="
        w-full
        h-full
        flex
        flex-col
        overflow-hidden
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-lg
        border-zinc-200/50
        dark:border-zinc-800
      "
        >
            {/* HEADER */}
            <CardHeader className="flex-shrink-0">
                <div className="flex justify-between items-center mb-2">
                    <Badge
                        variant={brief.status === "open" ? "outline" : "secondary"}
                        className="uppercase text-xs tracking-wider"
                    >
                        {brief.status}
                    </Badge>
                </div>

                <CardTitle className="text-xl line-clamp-1 text-foreground">
                    Project Brief
                </CardTitle>

                <CardDescription className="line-clamp-2 min-h-[40px] text-muted-foreground">
                    {brief.summary}
                </CardDescription>
            </CardHeader>

            {/* CONTENT */}
            <CardContent className="flex-grow overflow-y-auto pt-6">
                <div className="space-y-4">
                    <div>
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                            Core Direction
                        </h4>
                        <div className="flex flex-wrap gap-1">
                            {brief.core_design_direction?.slice(0, 2).map((tag, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                    {tag}
                                </Badge>
                            ))}
                            {brief.core_design_direction?.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                    +{brief.core_design_direction.length - 2}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>

            {/* FOOTER */}
            <CardFooter className="mt-auto flex flex-col gap-2">
                {error && (
                    <p className="text-xs text-red-500 font-medium w-full text-center">
                        {error}
                    </p>
                )}

                <div className="flex gap-2 w-full">
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/pool/${brief.id}`)}
                        className="flex-1"
                    >
                        View Details
                    </Button>

                    {brief.status === "open" ? (
                        <Button
                            onClick={handleAccept}
                            disabled={loading}
                            className="flex-1"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Accept
                        </Button>
                    ) : brief.status === "quote_confirmed" || brief.status === "draft_1_reviewed" ? (
                        <Button
                            onClick={() => router.push(`/upload-draft/${brief.id}`)}
                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600"
                        >
                            Upload Draft
                        </Button>
                    ) : brief.status === "quote_submitted" ? (
                        <Button
                            variant="secondary"
                            disabled
                            className="flex-1"
                        >
                            Awaiting Customer
                        </Button>
                    ) : brief.status === "draft_1_uploaded" || brief.status === "draft_2_uploaded" ? (
                        <Button
                            variant="secondary"
                            disabled
                            className="flex-1"
                        >
                            Draft Submitted
                        </Button>
                    ) : brief.status === "paid" ? (
                        <Button
                            variant="default"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            disabled
                        >
                            Payment Received
                        </Button>
                    ) : (
                        <Button
                            variant="secondary"
                            disabled
                            className="flex-1"
                        >
                            {brief.status || "Assigned"}
                        </Button>
                    )}
                </div>
            </CardFooter>

            {/* Quote Modal */}
            {
                user && (
                    <QuoteModal
                        open={showQuoteModal}
                        onClose={() => setShowQuoteModal(false)}
                        briefId={brief.id}
                        designerId={user.uid}
                        designerName={user.displayName || user.email || "Designer"}
                        designerEmail={user.email || ""}
                        onSuccess={handleQuoteSuccess}
                    />
                )
            }
        </Card >
    );
}
