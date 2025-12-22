
import Image from "next/image";
import { marketplaceItems } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { placeholderImages } from "@/lib/placeholder-images.json";
import { Eye, Sparkles, Handshake } from "lucide-react";
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
                     <div className="text-center mt-16">
                        <Button asChild size="lg">
                            <Link href="/join">Become a Partner Reseller</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}

