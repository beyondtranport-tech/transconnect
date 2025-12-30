
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Landmark, ArrowRight, Truck, Briefcase, FileText, Repeat, Calculator, Save, Mail } from "lucide-react";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useUser, getClientSideAuthToken } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const productsData = {
    loans: {
        title: "Loan Products",
        icon: Landmark,
        items: [
            { id: "loan-pv-term", title: "Loan (PV) – term", description: "A present value loan repaid over a fixed term with regular installments." },
            { id: "loan-pv-interest-only", title: "Loan (PV) - interest only", description: "Pay only the interest for a set period before principal payments begin." },
            { id: "loan-pv-single-payment", title: "Loan (PV) - single payment", description: "A lump-sum loan that is repaid in a single future payment." },
            { id: "loan-fl-term-daily", title: "Loan (FL) – term daily", description: "Future-value loan with daily repayments, suitable for businesses with consistent daily income." },
            { id: "loan-fl-term-weekly", title: "Loan (FL) term weekly", description: "Future-value loan structured with weekly repayments to match business cash flow cycles." },
            { id: "loan-fl-term-bi-monthly", title: "Loan (FL) term bi-monthly", description: "Future-value loan with repayments made twice a month." },
            { id: "loan-fl-term-monthly", title: "Loan (FL) term monthly", description: "A standard future-value loan with monthly repayments over a set term." },
            { id: "loan-revolving-credit", title: "Loan Revolving credit", description: "A flexible credit line that you can draw from, repay, and draw from again." },
        ]
    },
    'installment-sale': {
        title: "Installment Sale Products",
        icon: FileText,
        items: [
            { id: "installment-sale-term", title: "Term Agreement", description: "Finance an asset over a fixed period with regular, equal installments. Ownership transfers after the final payment." },
            { id: "installment-sale-balloon", title: "Balloon Payment", description: "Lower your monthly installments by deferring a larger, lump-sum payment to the end of the agreement term." }
        ]
    },
    rental: {
        title: "Rental / Lease Products",
        icon: Repeat,
        items: [
             { id: "rental-term", title: "Term Agreement", description: "Rent an asset for a fixed period with predictable payments. Provides access to assets without the commitment of ownership." },
             { id: "rental-balloon", title: "Balloon (Residual) Agreement", description: "Structure a lease with lower monthly payments and a final residual value payment, offering flexibility at the end of the term." }
        ]
    },
    discounting: {
        title: "Discounting Products",
        icon: Briefcase,
        items: [
            { id: "disclosed-confirmed-factoring", title: "Disclosed confirmed factoring 75% advance", description: "Factoring with notification to the debtor, who confirms payment directly to the factor." },
            { id: "disclosed-unconfirmed-factoring", title: "Disclosed un-confirmed factoring 0% advance", description: "Factoring where the debtor is notified, but doesn't confirm payment directly to the factor." },
            { id: "invoice-discounting", title: "Invoice discounting 100% advance", description: "A confidential facility where you maintain control of your sales ledger and collections." },
            { id: "rights-discounting", title: "Rights discounting", description: "Unlock the value of your contractual rights to future income streams." }
        ]
    }
};

const formatPrice = (price: number) => {
    const formattedPrice = new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
    return formattedPrice.replace(/\s/g, ' ');
};

function QuoteCalculator({ product, onQuoteSaved }: { product: { id: string; title: string }, onQuoteSaved: () => void }) {
    const { user } = useUser();
    const router = useRouter();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [amount, setAmount] = useState(500000);
    const [rate, setRate] = useState(15);
    const [term, setTerm] = useState(60);
    const [monthlyPayment, setMonthlyPayment] = useState(0);
    const [totalRepayment, setTotalRepayment] = useState(0);

    useEffect(() => {
        const monthlyRate = rate / 100 / 12;
        if (monthlyRate > 0) {
            const payment = amount * (monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
            setMonthlyPayment(payment);
            setTotalRepayment(payment * term);
        } else {
            setMonthlyPayment(amount / term);
            setTotalRepayment(amount);
        }
    }, [amount, rate, term]);

    const handleSaveQuote = async () => {
        if (!user) {
            router.push(`/signin?redirect=/funding/products?agreement=${product.id.split('-')[0]}`);
            return;
        }
        setIsSaving(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication token not found.");

            const quoteData = {
                applicantId: user.uid,
                status: 'quote',
                fundingType: product.id,
                amountRequested: amount,
                businessDetails: {
                    purpose: `Quote generated for ${product.title}`,
                    quoteDetails: {
                        amount,
                        rate,
                        term,
                        monthlyPayment,
                        totalRepayment,
                    }
                },
                financials: {},
                documents: [],
                createdAt: { _methodName: 'serverTimestamp' },
                updatedAt: { _methodName: 'serverTimestamp' },
            };

            const response = await fetch('/api/addUserDoc', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    collectionPath: `members/${user.uid}/financeApplications`,
                    data: quoteData,
                }),
            });
            
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to save quote.');

            toast({
                title: 'Quote Saved!',
                description: 'Your quote has been saved to your profile and our team has been notified.',
            });
            onQuoteSaved();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Quote Calculator: {product.title}</DialogTitle>
                <DialogDescription>
                    Adjust the sliders to estimate your payments. This is an estimate and not a formal offer.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="amount-slider">Loan Amount</Label>
                        <span className="font-bold">{formatPrice(amount)}</span>
                    </div>
                    <Slider id="amount-slider" min={10000} max={5000000} step={10000} value={[amount]} onValueChange={(v) => setAmount(v[0])} />
                </div>
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="rate-slider">Interest Rate (p.a.)</Label>
                        <span className="font-bold">{rate.toFixed(1)}%</span>
                    </div>
                    <Slider id="rate-slider" min={5} max={30} step={0.5} value={[rate]} onValueChange={(v) => setRate(v[0])} />
                </div>
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="term-slider">Loan Term (Months)</Label>
                        <span className="font-bold">{term}</span>
                    </div>
                    <Slider id="term-slider" min={12} max={120} step={6} value={[term]} onValueChange={(v) => setTerm(v[0])} />
                </div>

                <div className="border-t border-dashed pt-4 space-y-2">
                    <div className="flex justify-between items-center">
                        <p className="font-semibold">Estimated Monthly Payment:</p>
                        <p className="text-xl font-bold text-primary">{formatPrice(monthlyPayment)}</p>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <p className="text-muted-foreground">Total Repayment:</p>
                        <p className="font-mono text-muted-foreground">{formatPrice(totalRepayment)}</p>
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleSaveQuote} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Quote
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}

function ProductTypesContent() {
    const searchParams = useSearchParams();
    const agreement = searchParams.get('agreement') as keyof typeof productsData;
    const [openDialogs, setOpenDialogs] = useState<Record<string, boolean>>({});

    const handleQuoteSaved = (productId: string) => {
        setOpenDialogs(prev => ({ ...prev, [productId]: false }));
    };

    const data = productsData[agreement] || { title: "Products", icon: Landmark, items: [] };
    const Icon = data.icon;

    return (
        <div className="container mx-auto px-4 py-16">
            <div className="text-center max-w-3xl mx-auto mb-12">
                 <Icon className="h-12 w-12 text-primary mx-auto mb-4" />
                <h1 className="text-4xl md:text-5xl font-bold font-headline">{data.title}</h1>
                <p className="mt-4 text-lg md:text-xl text-muted-foreground">
                    Select a specific product to start your application.
                </p>
            </div>
            
            {data.items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {data.items.map(product => (
                        <Dialog key={product.id} open={openDialogs[product.id] || false} onOpenChange={(isOpen) => setOpenDialogs(prev => ({...prev, [product.id]: isOpen}))}>
                            <Card className="flex flex-col">
                                <CardHeader>
                                    <CardTitle>{product.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <CardDescription>{product.description}</CardDescription>
                                </CardContent>
                                <CardFooter className="flex flex-col sm:flex-row gap-2">
                                     <DialogTrigger asChild>
                                        <Button variant="outline" className="w-full">
                                            <Calculator className="mr-2 h-4 w-4" />
                                            Get Quote
                                        </Button>
                                    </DialogTrigger>
                                    <Button asChild className="w-full">
                                        <Link href={`/funding/apply?type=${product.id}`}>
                                            Start Enquiry <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                            <QuoteCalculator product={product} onQuoteSaved={() => handleQuoteSaved(product.id)} />
                        </Dialog>
                    ))}
                </div>
            ) : (
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle>Products Coming Soon</CardTitle>
                        <CardDescription>
                            The products for this agreement type are being finalized. Please check back soon or contact us for more information.
                        </CardDescription>
                    </CardHeader>
                     <CardFooter>
                        <Button asChild variant="outline">
                            <Link href="/contact">Contact Us</Link>
                        </Button>
                    </CardFooter>
                </Card>
            )}

             <div className="text-center mt-16">
                <Button asChild variant="secondary">
                    <Link href="/funding">Back to Funding Structures</Link>
                </Button>
            </div>

        </div>
    )
}

export default function ProductTypesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ProductTypesContent />
        </Suspense>
    );
}

    