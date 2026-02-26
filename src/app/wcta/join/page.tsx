'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowRight, CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import data from "@/lib/placeholder-images.json";

const { placeholderImages } = data;
const wctaHeroImage = placeholderImages.find(p => p.id === 'wcta-mall-hero');

const benefits = [
    "Advocacy and representation for transport operators in the Western Cape.",
    "Exclusive networking opportunities with industry leaders.",
    "Access to training, compliance resources, and industry updates.",
    "A unified voice to address challenges in the logistics sector.",
    "Special discounts on Logistics Flow premium memberships.",
];

export default function WCTAMembershipPage() {
    return (
        <div>
            <section className="relative w-full h-72 bg-card">
                {wctaHeroImage && (
                    <Image
                        src={wctaHeroImage.imageUrl}
                        alt="WCTA Membership"
                        fill
                        className="object-cover"
                        priority
                        data-ai-hint={wctaHeroImage.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative h-full flex flex-col items-center justify-center text-center text-primary-foreground z-10 p-4">
                    <div className="mb-4">
                         <Image src="/wcta/wcta-logo.png" alt="WCTA Logo" width={150} height={60} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">Join the WCTA</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-3xl">Become part of a leading association dedicated to supporting and empowering transport professionals in the Western Cape.</p>
                </div>
            </section>
            
            <section className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4 max-w-4xl">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold">WCTA Membership Benefits</CardTitle>
                            <CardDescription>By joining the WCTA, you gain more than just a membership card—you gain a partner in your success.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="list-none space-y-3">
                                {benefits.map((benefit, index) => (
                                     <li key={index} className="flex items-start">
                                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                                        <span className="text-muted-foreground">{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="pt-6 text-center">
                                <p className="text-2xl font-bold">Membership Fee: R 2500 / year</p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex-col gap-4">
                             <Button size="lg" className="w-full">
                                Purchase Membership via Direct Debit <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                            <p className="text-xs text-muted-foreground">Direct debit functionality is under development. Clicking this button will simulate the checkout process.</p>
                        </CardFooter>
                    </Card>
                </div>
            </section>
        </div>
    )
}
