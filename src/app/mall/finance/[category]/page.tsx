
import { placeholderImages } from "@/lib/placeholder-images.json";
import { University, Landmark, HandCoins, Building, Users, Sparkles, Building2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import * as React from "react";

const categoryDetails = {
    banks: { 
        name: "Banks", 
        description: "Explore financing options from major financial institutions for established businesses.",
        icon: University,
        partners: [
            { name: "Standard Bank", description: "Offering vehicle and asset finance solutions for commercial clients.", logo: "https://placehold.co/100x40?text=Standard+Bank" },
            { name: "FNB", description: "Comprehensive business banking including asset finance and working capital loans.", logo: "https://placehold.co/100x40?text=FNB" },
            { name: "Absa", description: "Specialized transport and logistics financing division.", logo: "https://placehold.co/100x40?text=Absa" },
        ]
    },
    "niche-lenders": { 
        name: "Niche Lenders", 
        description: "Connect with specialized lenders who deeply understand the transport industry.",
        icon: Landmark,
        partners: [
            { name: "TransConnect Funding", description: "Our own division, offering flexible solutions where traditional banks can't.", logo: "https://placehold.co/100x40?text=TransConnect" },
            { name: "Fleet-Finance SA", description: "Experts in financing for large fleets and owner-operators.", logo: "https://placehold.co/100x40?text=Fleet-Finance" },
        ]
    },
    "debt-funders": { 
        name: "Debt Funders", 
        description: "Find alternative debt financing for growth, expansion, or large-scale asset acquisition.",
        icon: Building,
        partners: []
    },
    "ngos-and-grants": { 
        name: "NGOs & Grants", 
        description: "Access funding from non-governmental organizations and grant programs.",
        icon: HandCoins,
        partners: []
    },
    "individuals": {
        name: "Individuals (P2P & Crowdfunding)",
        description: "Source capital directly from individual investors and peer-to-peer platforms.",
        icon: Users,
        partners: []
    }
};

const financeMallImage = placeholderImages.find(p => p.id === 'funding-division');

export default function FinancierCategoryPage({ params }: { params: { category: string } }) {
    
    const category = categoryDetails[params.category as keyof typeof categoryDetails];

    if (!category) {
        notFound();
    }
    
    const Icon = category.icon;

    return (
        <div>
             <section className="relative w-full h-80 bg-card">
                {financeMallImage && (
                    <Image
                        src={financeMallImage.imageUrl}
                        alt={category.name}
                        fill
                        className="object-cover"
                        priority
                        data-ai-hint={financeMallImage.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative h-full flex flex-col items-center justify-center text-center text-primary-foreground z-10 p-4">
                    <div className="bg-background/20 backdrop-blur-sm p-4 rounded-full mb-4 border border-white/20">
                        <Icon className="h-12 w-12 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">{category.name}</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-3xl">{category.description}</p>
                </div>
            </section>
            <section className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">Partners in this Category</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Connect with financiers specializing in the transport sector.
                        </p>
                    </div>

                    {category.partners.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            {category.partners.map(partner => (
                                <Card key={partner.name}>
                                    <CardHeader>
                                        <div className="flex justify-start mb-4">
                                             <Image src={partner.logo} alt={`${partner.name} logo`} width={100} height={40} className="object-contain" />
                                        </div>
                                        <CardTitle>{partner.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground">{partner.description}</p>
                                        <Button className="w-full mt-6">Contact {partner.name}</Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center max-w-2xl mx-auto bg-card p-10 rounded-lg border">
                             <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-xl font-semibold">Partners Coming Soon</h3>
                            <p className="text-muted-foreground mt-2">
                                We are actively expanding our network in this category. Are you a financier who fits this description?
                            </p>
                            <Button asChild className="mt-6">
                                <Link href="/contact">Join Our Network</Link>
                            </Button>
                        </div>
                    )}

                    <div className="text-center mt-16">
                        <Button size="lg" variant="outline">
                            <Sparkles className="mr-2 h-5 w-5" />
                           Are you a financier? Join Our Network
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    )
}
