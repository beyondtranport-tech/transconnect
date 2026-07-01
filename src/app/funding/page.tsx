'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowRight, CheckCircle, Landmark, Book, FileText, Repeat, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import data from "@/lib/placeholder-images.json";
import { useUser } from "@/firebase";
import * as React from "react";
import * as gtag from '@/lib/gtag';

const { placeholderImages } = data;

const fundingHeroImage = placeholderImages.find(p => p.id === 'funding-division');

const agreementTypes = [
    {
        id: "loans",
        title: "Loans",
        icon: Landmark,
        description: "Traditional loan structures for asset acquisition or working capital, with defined terms and repayment schedules.",
    },
    {
        id: "installment-sale",
        title: "Installment Sale",
        icon: Book,
        description: "Finance the purchase of an asset over time. Ownership transfers to you after the final payment is made.",
    },
    {
        id: "rental",
        title: "Rental",
        icon: Repeat,
        description: "Rent assets for a specified period, providing flexibility without the long-term commitment of ownership.",
    },
    {
        id: "discounting",
        title: "Discounting",
        icon: FileText,
        description: "Unlock the value of your existing contracts and invoices to improve cash flow and fund operations.",
    },
]

export default function FundingPage() {
    const { user, isUserLoading } = useUser();

    const handleApplyClick = () => {
        if (!process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID) return;
        gtag.event({
            action: 'start_application',
            category: 'Funding',
            label: 'Direct In-House Path',
            value: 1
        });
    }
    
    const handleCategoryClick = (categoryId: string) => {
        if (!process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID) return;
        gtag.event({
            action: 'select_funding_category',
            category: 'Funding',
            label: categoryId,
            value: 0
        });
    }

    // Direct path for applications starting here
    const ctaLink = user ? '/funding/apply?origination=direct' : '/join?redirect=/funding/apply?origination=direct';

    return (
        <div className="text-left">
            <section className="relative w-full h-80 bg-card">
                {fundingHeroImage && (
                    <Image
                        src={fundingHeroImage.imageUrl}
                        alt={fundingHeroImage.description}
                        fill
                        className="object-cover"
                        priority
                        data-ai-hint={fundingHeroImage.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative h-full flex flex-col items-center justify-center text-center text-primary-foreground z-10 p-4">
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">In-House Business Funding</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-3xl">Our specialized finance division has been financing transporters for 25 years. We can finance you where others have failed</p>
                </div>
            </section>

             <section className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4">
                     <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">The Direct Funding Advantage</h2>
                         <div className="mt-8 text-left space-y-4 text-muted-foreground bg-card p-8 rounded-lg shadow-sm">
                            <p className="text-lg">Applying directly to the Logistics Flow funding division ensures you are evaluated based on your industrial standing, not just a generic credit score. We utilize the forensic data from your platform activity to structure viable funding opportunities that traditional banks often miss.</p>
                            <p className="text-lg">Whether you are scaling your fleet or bridging a cash flow gap, our in-house team understands the nuances of the transport sector.</p>
                        </div>
                        <div className="mt-12">
                             <Button asChild size="lg" onClick={handleApplyClick} disabled={isUserLoading}>
                                <Link href={ctaLink}>
                                    {isUserLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            Apply for In-House Funding <ArrowRight className="ml-2 h-5 w-5" />
                                        </>
                                    )}
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
            
             <section id="start-journey" className="py-16 md:py-24 bg-card">
                <div className="container mx-auto px-4">
                     <div className="text-center max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">Available Structures</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Explore our three core funding structures to find the best fit for your current business requirement.
                        </p>
                    </div>
                    
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                       {agreementTypes.map((item) => {
                            const Icon = item.icon;
                            return (
                               <Link href={`/funding/products?agreement=${item.id}&origination=direct`} key={item.title} className="block group" onClick={() => handleCategoryClick(item.id)}>
                                   <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-primary/20 transition-all h-full group-hover:border-primary">
                                        <CardHeader>
                                            <div className="flex items-center gap-4">
                                                <Icon className="h-8 w-8 text-primary" />
                                                <CardTitle>{item.title}</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex-grow">
                                            <p className="text-muted-foreground">{item.description}</p>
                                        </CardContent>
                                        <CardFooter>
                                            <p className="text-sm font-semibold text-primary flex items-center gap-2">
                                                Select Structure <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </p>
                                        </CardFooter>
                                   </Card>
                               </Link>
                           )
                        })}
                    </div>
                </div>
            </section>
        </div>
    )
}
