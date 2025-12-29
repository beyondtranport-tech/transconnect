
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
            { id: "asset-finance", title: "Asset Finance", description: "Secure financing to purchase new or used vehicles and equipment. We fund trucks, trailers, and yellow metal." },
            { id: "working-capital", title: "Working Capital", description: "Get a cash injection to cover operational expenses like fuel, salaries, and maintenance, ensuring your business runs smoothly." }
        ]
    },
    'installment-sale': {
        title: "Installment Sale Products",
        icon: FileText,
        items: [
            { id: "asset-finance", title: "Vehicle Installment Sale", description: "Purchase a vehicle over a fixed period with predictable monthly payments. Ownership is transferred upon completion." }
        ]
    },
    rental: {
        title: "Rental Products",
        icon: Repeat,
        items: [
             { id: "asset-finance", title: "Fleet Rental Solutions", description: "Rent trucks and trailers for short or long-term contracts. A flexible way to scale your fleet without the capital outlay." }
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
