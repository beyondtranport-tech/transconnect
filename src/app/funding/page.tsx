
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { placeholderImages } from "@/lib/placeholder-images.json";

const fundingHeroImage = placeholderImages.find(p => p.id === 'funding-division');

const methodology = [
    {
        title: "Partnership Agreement",
        description: "We invest directly in your business, becoming a partner in your growth. This model is for established businesses looking for strategic capital.",
    },
    {
        title: "Asset Finance",
        description: "Secure financing for new trucks, trailers, or equipment. We offer competitive rates and flexible terms tailored to the transport industry.",
    },
    {
        title: "Working Capital Loans",
        description: "Access short-term loans to manage cash flow, cover operational expenses, or seize immediate opportunities without disrupting your capital.",
    }
]

export default function FundingPage() {
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
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">TransConnect Funding</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-3xl">Fueling your growth with flexible financial solutions where traditional banks can't.</p>
                </div>
            </section>

            <section id="methodology" className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">Our Funding Methodology</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            We offer a range of products and solutions because we understand that every transport business has unique financial needs.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {methodology.map((item) => (
                            <Card key={item.title}>
                                <CardHeader>
                                    <CardTitle>{item.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">{item.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>
            
            <section id="start-journey" className="py-16 md:py-24 bg-card">
                <div className="container mx-auto px-4 text-center">
                     <div className="text-center max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">Start Your Journey</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Select the statement that best describes your current need to begin the application process.
                        </p>
                    </div>
                    
                    <div className="mt-10 max-w-2xl mx-auto space-y-4">
                       <p className="text-muted-foreground">Need-based statement options will be presented here.</p>
                        {/* Placeholder for the need-focused statements */}
                    </div>
                </div>
            </section>
        </div>
    )
}
