
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowRight, CheckCircle, Landmark, Book, FileText, Repeat } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import data from "@/lib/placeholder-images.json";
import { useUser } from "@/firebase";
import * as React from "react";

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
    const { user } = useUser();

    return (
        <div>
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
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">Funding That Moves You Forward</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-3xl">Our single application process connects you to a network of ideal lenders who understand the transport industry.</p>
                </div>
            </section>

             <section className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4">
                     <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">Are You Facing These Funding Roadblocks?</h2>
                        <p className="mt-6 text-lg text-muted-foreground">If you're a transport operator, you know that traditional financing doesn't always fit. We understand the challenges you face.</p>
                        <ul className="mt-6 space-y-2 text-left inline-block">
                             <li className="flex items-start">
                                <CheckCircle className="h-6 w-6 text-primary mr-3 mt-1 flex-shrink-0" />
                                <span>Tired of being turned down by banks that don’t understand your unique business needs?</span>
                            </li>
                             <li className="flex items-start">
                                <CheckCircle className="h-6 w-6 text-primary mr-3 mt-1 flex-shrink-0" />
                                <span>Frustrated with rigid finance solutions that fall short of meeting your operational requirements?</span>
                            </li>
                             <li className="flex items-start">
                                <CheckCircle className="h-6 w-6 text-primary mr-3 mt-1 flex-shrink-0" />
                                <span>In need of funding that can be implemented fast to seize a new contract or opportunity?</span>
                            </li>
                        </ul>
                         <p className="mt-8 text-xl font-semibold">Then you have landed in the right place!</p>
                        <div className="mt-8 text-left space-y-4 text-muted-foreground bg-card p-8 rounded-lg shadow-sm">
                            <p className="text-lg">At TransConnect, our business is built on empowering yours through intelligent finance. We've redesigned the funding process to make it work for you, not against you. Our systems put you in control, providing access to a broad range of products and unique, industry-specific solutions designed to help you do what you do best—managing and growing your business.</p>
                            <p className="text-lg">We see the opportunities that others miss. Our expertise lies in our ability to take something that seems 'un-financeable', structure it correctly, and convert it into a viable funding opportunity. We don’t want to run your business; we want to fuel it.</p>
                        </div>
                    </div>
                </div>
            </section>
            
             <section id="start-journey" className="py-16 md:py-24 bg-card">
                <div className="container mx-auto px-4">
                     <div className="text-center max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">Our Funding Structures</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Our business is based on three core structures, allowing us to build the perfect solution for any scenario. Choose an agreement type to begin.
                        </p>
                    </div>
                    
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                       {agreementTypes.map((item) => {
                            const Icon = item.icon;
                            return (
                               <Card key={item.title} className="flex flex-col overflow-hidden shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
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
                                        <Button asChild className="w-full">
                                            <Link href={`/funding/products?agreement=${item.id}`}>
                                                View Products <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </CardFooter>
                               </Card>
                           )
                        })}
                    </div>
                </div>
            </section>
        </div>
    )
}
