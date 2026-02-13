"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Info } from "lucide-react";
import { calculateCustomerPrice } from "@/lib/brief-utils";

interface QuoteModalProps {
    open: boolean;
    onClose: () => void;
    briefId: string;
    designerId: string;
    designerName: string;
    designerEmail: string;
    onSuccess: () => void;
}

export function QuoteModal({
    open,
    onClose,
    briefId,
    designerId,
    designerName,
    designerEmail,
    onSuccess,
}: QuoteModalProps) {
    const [designerQuote, setDesignerQuote] = useState<string>("");
    const [estimatedDays, setEstimatedDays] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const quoteNumber = parseFloat(designerQuote) || 0;
    const customerPrice = quoteNumber > 0 ? calculateCustomerPrice(quoteNumber) : 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/briefs/${briefId}/quote`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    designerQuote: parseFloat(designerQuote),
                    estimatedDays: parseInt(estimatedDays),
                    designerId,
                    designerName,
                    designerEmail,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to submit quote");
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to submit quote");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Submit Your Quote</DialogTitle>
                    <DialogDescription>
                        Enter your quote and estimated completion time for this project.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="quote">Your Quote (₹)</Label>
                        <Input
                            id="quote"
                            type="number"
                            min="1"
                            step="1"
                            placeholder="e.g., 5000"
                            value={designerQuote}
                            onChange={(e) => setDesignerQuote(e.target.value)}
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Amount you will receive (80% of customer price)
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="days">Estimated Days</Label>
                        <Input
                            id="days"
                            type="number"
                            min="1"
                            step="1"
                            placeholder="e.g., 3"
                            value={estimatedDays}
                            onChange={(e) => setEstimatedDays(e.target.value)}
                            required
                        />
                    </div>

                    {quoteNumber > 0 && (
                        <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/30 p-4 border border-indigo-200 dark:border-indigo-800">
                            <div className="flex items-start gap-2">
                                <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                                <div className="text-sm space-y-1">
                                    <p className="font-medium text-indigo-900 dark:text-indigo-100">
                                        Customer will pay: ₹{customerPrice.toLocaleString()}
                                    </p>
                                    <p className="text-indigo-700 dark:text-indigo-300 text-xs">
                                        Includes 20% platform fee (₹{Math.round(customerPrice * 0.2).toLocaleString()})
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <p className="text-sm text-red-500">{error}</p>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Quote
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
