

import Image from "next/image";
import { marketplaceItems } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { placeholderImages } from "@/lib/placeholder-images.json";
import { Eye, Sparkles, Handshake, ArrowRight, Tags, Search, Mail, Users } from "lucide-react";
import Link from 'next/link';

const marketplaceHeroImage = placeholderImages.find(p => p.id === 'marketplace-division');

const sections = [
    {
        icon: Eye,
        title: "Our Vision",
        content: "We want to collaborate with you to link you with the best of breed partner resellers."
    },
    {
        icon: Sparkles,
        title: "What Makes Us Unique",
        content: "We work together with you to drive customers to your platform by connecting with you as a partner reseller."
    },
    {
        icon: Handshake,
        title: "Partner Reseller Offer",
        content: "Our partner pledge is that we are dedicated to driving sales to you."
    }
];

const serviceExamples = [
    { icon: Tags, name: "Loyalty & Coupon Programs" },
    { icon: Search, name: "SEO & Pay-Per-Click" },
    { icon: Mail, name: "Data & Marketing Services" },
    { icon: Users, name: "Courier & Agent Networks" }
];

export default function MarketplacePage() {
    return (
        <div>
             <section className="relative w-full h-80 bg-card">
                {marketplaceHeroImage && (
                    <Image
                        src={marketplaceHeroImage.imageUrl}
                        alt={marketplaceHeroImage.description}
                        fill
                        className="object-cover"
                        priority
                        data-ai-hint={marketplaceHeroImage.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative h-full flex flex-col items-center justify-center text-center text-primary-foreground z-10 p-4">
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">Marketplace of Resellers</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-3xl">
                        We have searched for the best partners to make your life easier. We have negotiated bulk discounts upfront and will share up to 50% of this discount with you.
                    </p>
                </div>
            </section>
            
            <section className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {sections.map(section => {
                            const Icon = section.icon;
                            return (
                                <Card key={section.title} className="text-center">
                                    <CardHeader>
                                        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                                            <Icon className="h-8 w-8 text-primary" />
                                        </div>
                                        <CardTitle>{section.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground">{section.content}</p>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            </section>

             <section className="py-16 md:py-24 bg-card">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">A Marketplace of Services</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Our reseller network is comprised of service providers with established partner programs. We connect you with opportunities in:
                        </p>
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
                        {serviceExamples.map(service => {
                            const Icon = service.icon;
                            return (
                                <div key={service.name} className="flex items-center gap-4 p-4 bg-background rounded-lg">
                                    <Icon className="h-8 w-8 text-primary shrink-0" />
                                    <span className="font-semibold">{service.name}</span>
                                </div>
                            )
                        })}
                    </div>
                     <div className="text-center mt-16 flex flex-col sm:flex-row justify-center items-center gap-4">
                        <Button asChild size="lg" variant="secondary">
                            <Link href="/mall">
                                Explore Services <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button asChild size="lg">
                            <Link href="/join?role=partner">
                                Become a Partner Reseller <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
