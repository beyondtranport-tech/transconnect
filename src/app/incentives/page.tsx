
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { placeholderImages } from "@/lib/placeholder-images.json";
import { ArrowRight, Boxes, FileText, Heart, Shield, LifeBuoy, Gift } from "lucide-react";
import * as React from "react";

const incentivesHeroImage = placeholderImages.find(p => p.id === 'incentives-hero');

const products = [
    {
        id: "ecosystem-membership",
        icon: <Boxes className="h-8 w-8 text-primary" />,
        title: "Ecosystem Membership",
        description: "Sell the core TransConnect membership. Give businesses access to our powerful ecosystem of malls, marketplaces, and technology.",
    },
    {
        id: "raf-assist",
        icon: <FileText className="h-8 w-8 text-primary" />,
        title: "RAF Assist",
        description: "Offer a valuable service that helps members navigate the complexities of the Road Accident Fund claims process, ensuring they get the support they deserve.",
    },
    {
        id: "open-loyalty-funeral",
        icon: <Heart className="h-8 w-8 text-primary" />,
        title: "Open Loyalty Funeral",
        description: "Provide peace of mind with a funeral benefit plan tailored for the transport community, offered through our Open Loyalty program.",
    },
    {
        id: "open-loyalty-roadside-assist",
        icon: <LifeBuoy className="h-8 w-8 text-primary" />,
        title: "Open Loyalty Roadside Assist",
        description: "Sell an essential roadside assistance package that gets drivers and their vehicles back on the road faster after a breakdown.",
    },
    {
        id: "open-loyalty-liability",
        icon: <Shield className="h-8 w-8 text-primary" />,
        title: "Open Loyalty Liability",
        description: "Offer specialized liability coverage designed to protect transport businesses from unforeseen events and financial loss.",
    },
    {
        id: "mahala-hub",
        icon: <Gift className="h-8 w-8 text-primary" />,
        title: "Mahala Hub",
        description: "Promote a hub of exclusive deals, freebies, and discounts. A powerful tool to attract and retain members in the ecosystem.",
    }
];

export default function IncentivesPage() {
    return (
        <div>
            <section className="relative w-full h-80 bg-card">
                {incentivesHeroImage && (
                    <Image
                        src={incentivesHeroImage.imageUrl}
                        alt={incentivesHeroImage.description}
                        fill
                        className="object-cover"
                        priority
                        data-ai-hint={incentivesHeroImage.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative h-full flex flex-col items-center justify-center text-center text-primary-foreground z-10 p-4">
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">Join the TransConnect Sales Network</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-3xl">Turn your industry connections into revenue. Earn commission by selling powerful products that every transport professional needs.</p>
                </div>
            </section>

            <section id="opportunity" className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4 text-center">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">The Opportunity</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            You have the network. We have the products. As an Independent Sales Agent (ISA) or a Driver in our sales network, you have the opportunity to build a new revenue stream. You'll be armed with a portfolio of high-demand products and the full backing of the TransConnect ecosystem. There are no limits to what you can earn.
                        </p>
                    </div>
                </div>
            </section>

            <section id="products" className="py-16 md:py-24 bg-card">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">Your Product Portfolio</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            We've packaged the most valuable services in the transport industry into six powerful products that are easy to sell.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {products.map((product) => (
                            <Card key={product.title} className="flex flex-col">
                                <CardHeader className="items-center text-center">
                                    <div className="bg-primary/10 p-4 rounded-full mb-4">
                                        {product.icon}
                                    </div>
                                    <CardTitle>{product.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="text-center flex-grow">
                                    <p className="text-muted-foreground">{product.description}</p>
                                </CardContent>
                                <CardFooter>
                                    <Button asChild className="w-full" variant="outline">
                                        <Link href={`/incentives/${product.id}`}>
                                            Find Out More <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold font-headline">Ready to Start Earning?</h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                        Join our network of Independent Sales Agents today. It's free to sign up and you'll get immediate access to the tools and support you need to succeed.
                    </p>
                    <Button asChild size="lg" className="mt-8">
                        <Link href="/join?role=isa-agent">
                            Become an ISA Agent <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}
