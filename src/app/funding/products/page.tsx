
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Landmark, ArrowRight, Truck, Briefcase, FileText, Repeat } from "lucide-react";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import * as React from 'react';

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
            { id: "working-capital", title: "Invoice Discounting", description: "Unlock cash tied up in your unpaid invoices. Get immediate access to a percentage of the invoice value." },
            { id: "working-capital", title: "Contract Discounting", description: "Finance your growth by leveraging your long-term customer contracts to secure upfront capital." }
        ]
    }
};

function ProductTypesContent() {
    const searchParams = useSearchParams();
    const agreement = searchParams.get('agreement') as keyof typeof productsData;

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
                        <Card key={product.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle>{product.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <CardDescription>{product.description}</CardDescription>
                            </CardContent>
                            <CardFooter>
                                <Button asChild className="w-full">
                                    <Link href={`/funding/apply?type=${product.id}`}>
                                        Apply Now <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
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
