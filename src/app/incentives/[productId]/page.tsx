
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Boxes, FileText, Heart, Shield, LifeBuoy, Gift } from "lucide-react";
import * as React from "react";
import { placeholderImages } from "@/lib/placeholder-images.json";
import Image from 'next/image';

const incentivesHeroImage = placeholderImages.find(p => p.id === 'incentives-hero');

const productDetails = {
    "ecosystem-membership": {
        id: "ecosystem-membership",
        icon: <Boxes className="h-8 w-8 text-primary" />,
        title: "Ecosystem Membership",
        description: "Sell the core TransConnect membership. Give businesses access to our powerful ecosystem of malls, marketplaces, and technology.",
    },
    "raf-assist": {
        id: "raf-assist",
        icon: <FileText className="h-8 w-8 text-primary" />,
        title: "RAF Assist",
        description: "Offer a valuable service that helps members navigate the complexities of the Road Accident Fund claims process, ensuring they get the support they deserve.",
    },
    "open-loyalty-funeral": {
        id: "open-loyalty-funeral",
        icon: <Heart className="h-8 w-8 text-primary" />,
        title: "Open Loyalty Funeral",
        description: "Provide peace of mind with a funeral benefit plan tailored for the transport community, offered through our Open Loyalty program.",
    },
    "open-loyalty-roadside-assist": {
        id: "open-loyalty-roadside-assist",
        icon: <LifeBuoy className="h-8 w-8 text-primary" />,
        title: "Open Loyalty Roadside Assist",
        description: "Sell an essential roadside assistance package that gets drivers and their vehicles back on the road faster after a breakdown.",
    },
    "open-loyalty-liability": {
        id: "open-loyalty-liability",
        icon: <Shield className="h-8 w-8 text-primary" />,
        title: "Open Loyalty Liability",
        description: "Offer specialized liability coverage designed to protect transport businesses from unforeseen events and financial loss.",
    },
    "mahala-hub": {
        id: "mahala-hub",
        icon: <Gift className="h-8 w-8 text-primary" />,
        title: "Mahala Hub",
        description: "Promote a hub of exclusive deals, freebies, and discounts. A powerful tool to attract and retain members in the ecosystem.",
    }
};

export default function ProductLandingPage({ params }: { params: { productId: string } }) {
    const product = productDetails[params.productId as keyof typeof productDetails];

    if (!product) {
        notFound();
    }

    return (
        <div>
             <section className="relative w-full h-64 bg-card">
                {incentivesHeroImage && (
                    <Image
                        src={incentivesHeroImage.imageUrl}
                        alt={product.title}
                        fill
                        className="object-cover"
                        priority
                        data-ai-hint={incentivesHeroImage.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative h-full flex flex-col items-center justify-center text-center text-primary-foreground z-10 p-4">
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">{product.title}</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-3xl">{product.description}</p>
                </div>
            </section>
            <section className="py-16 md:py-24">
                 <div className="container mx-auto px-4 max-w-4xl">
                     <Card>
                        <CardHeader>
                            <CardTitle>Product Details</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center py-20">
                            <p className="text-muted-foreground text-lg">Detailed product information coming soon.</p>
                            <Button asChild variant="outline" className="mt-8">
                                <Link href="/incentives">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to All Products
                                </Link>
                            </Button>
                        </CardContent>
                     </Card>
                 </div>
            </section>
        </div>
    );
}
