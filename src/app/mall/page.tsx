

'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowRight, ShoppingBasket, Building2, Truck, Landmark, PackageSearch, Store, Network, Warehouse, Recycle, Wrench, Scale } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import data from "@/lib/placeholder-images.json";
import { marketplaceItems } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import * as React from "react";
import { useState, useEffect } from 'react';
import { IntentModal, type ModalConfig, type IncentiveStep } from "./intent-modal";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import * as gtag from '@/lib/gtag';

const { placeholderImages } = data;

const mallHeroImage = placeholderImages.find(p => p.id === 'mall-division');
const fundingImage = placeholderImages.find(p => p.id === 'funding-division')!;
const marketplaceImage = placeholderImages.find(p => p.id === 'marketplace-division')!;
const techImage = placeholderImages.find(p => p.id === 'tech-division')!;
const tiresImage = placeholderImages.find(p => p.id === 'product-tires')!;
const saAuctionMallImage = placeholderImages.find(p => p.id === 'sa-auction-mall')!;


const formatPrice = (price: number) => {
    const formattedPrice = new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
    // Normalize non-breaking spaces to regular spaces to prevent hydration errors.
    return formattedPrice.replace(/\s/g, ' ');
};


const malls = [
    {
        name: "Supplier Mall",
        description: "Connect with trusted suppliers for parts, consumables, and services.",
        icon: Building2,
        href: "/mall/supplier",
        id: "supplier",
        image: placeholderImages.find(p => p.id === 'mall-division')!,
    },
    {
        name: "Transporter Mall",
        description: "Find opportunities and collaborate with peers.",
        icon: Truck,
        href: "/mall/transporter",
        id: "transporter",
        image: placeholderImages.find(p => p.id === 'hero-home')!,
    },
    {
        name: "Finance Mall",
        description: "Access flexible funding and insurance products.",
        icon: Landmark,
        href: "/mall/finance",
        id: "finance",
        image: fundingImage!,
    },
    {
        name: "Loads Mall",
        description: "Discover and secure freight loads from shippers.",
        icon: PackageSearch,
        href: "/tech",
        id: "loads",
        image: techImage!,
    },
    {
        name: "Buy & Sell Mall",
        description: "Marketplace for new and used vehicles and equipment.",
        icon: Store,
        href: "/marketplace",
        id: "buy-sell",
        image: marketplaceImage!,
    },
    {
        name: "SA Auction Mall",
        description: "Live auctions for vehicles, equipment, and salvaged assets from SA Auction Online.",
        icon: Scale,
        href: "/mall/sa-auction",
        id: "sa-auction",
        image: saAuctionMallImage,
    },
    {
        name: "Distribution Mall",
        description: "Optimize your logistics and final-mile delivery networks.",
        icon: Network,
        href: "/mall/distribution",
        id: "distribution",
        image: placeholderImages.find(p => p.id === 'tech-home')!,
    },
    {
        name: "Warehouse Mall",
        description: "Find and offer short-term or long-term storage solutions.",
        icon: Warehouse,
        href: "/mall/warehouse",
        id: "warehouse",
        image: placeholderImages.find(p => p.id === 'mall-division')!,
    },
    {
        name: "Repurpose Mall",
        description: "Give a second life to decommissioned assets and parts.",
        icon: Recycle,
        href: "/mall/repurpose",
        id: "repurpose",
        image: tiresImage,
    },
    {
        name: "Aftermarket Mall",
        description: "Your source for aftermarket parts, accessories, and upgrades.",
        icon: Wrench,
        href: "/mall/aftermarket",
        id: "aftermarket",
        image: placeholderImages.find(p => p.id === 'product-engine-oil')!,
    },
]

export default function MallPage() {
    const { user } = useUser();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null);
    const [incentiveStep, setIncentiveStep] = useState<IncentiveStep | null>(null);
    const [showIncentiveStep, setShowIncentiveStep] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);
    
    const showIncentive = (href: string) => {
        setIncentiveStep({
            title: "Become a Valued Supplier",
            description: "By listing your products or services, you gain access to a targeted market and contribute to our community's data pool. This helps everyone get better deals. Proceed with our quick onboarding to get started.",
            cta: "Continue Onboarding",
            action: () => {
                setIsModalOpen(false);
                setShowIncentiveStep(false);
                router.push(href);
            }
        });
        setShowIncentiveStep(true);
    }

    const createModalConfig = (mallId: string, mallHref: string): ModalConfig => {
        const baseSellHref = user ? '/account?view=shop' : '/join?role=vendor';

        let config: Partial<ModalConfig> = {};

        const buyerAction = () => {
            setIsModalOpen(false);
            router.push(mallHref);
        }
        
        const sellerAction = () => {
            showIncentive(baseSellHref);
        }

        switch(mallId) {
            case 'finance':
                config = {
                    title: "What is your goal in the Finance Mall?",
                    description: "Are you here to find funding for your business, or are you a financier looking to provide capital?",
                    primary: { label: "I want to Borrow", description: "Apply for a loan or asset finance.", action: buyerAction },
                    secondary: { label: "I want to Lend", description: "Join our network of financiers.", action: () => router.push('/for-financiers') }
                };
                break;
            case 'loads':
                config = {
                    title: "What is your goal in the Loads Mall?",
                    description: "Are you looking to post a load for transport, or are you a transporter looking for a load to carry?",
                    primary: { label: "I am looking for a load", description: "Find available loads.", action: buyerAction },
                    secondary: { label: "I have a load to post", description: "List your available freight.", action: sellerAction }
                };
                break;
            case 'buy-sell':
                 config = {
                    title: "What brings you to the Buy & Sell Mall?",
                    description: "Are you here to sell a vehicle or looking to purchase one?",
                    primary: { label: "I am looking for a vehicle", description: "Browse vehicles for sale.", action: buyerAction },
                    secondary: { label: "I have a vehicle to sell", description: "List your vehicle for sale.", action: sellerAction }
                };
                break;
            case 'distribution':
                 config = {
                    title: "What is your role in the Distribution Mall?",
                    description: "Are you looking for distribution partners or offering your network's services?",
                    primary: { label: "I need distribution work", description: "Explore partnership opportunities.", action: buyerAction },
                    secondary: { label: "I want to provide distribution", description: "List your network's capabilities.", action: sellerAction }
                };
                break;
             case 'warehouse':
                config = {
                    title: "What are you looking for in the Warehouse Mall?",
                    description: "Do you need to find storage space, or do you have warehouse space to offer?",
                    primary: { label: "I am looking for storage", description: "Browse available storage.", action: buyerAction },
                    secondary: { label: "I have space to offer", description: "Offer your warehouse to the network.", action: sellerAction }
                };
                break;
            case 'repurpose':
                config = {
                    title: "What is your goal in the Repurpose Mall?",
                    description: "Are you looking to find parts and assets, or do you have decommissioned items to list?",
                    primary: { label: "I am looking for an available asset", description: "Find parts for refurbishment or salvage.", action: buyerAction },
                    secondary: { label: "I have an available asset", description: "List your decommissioned assets.", action: sellerAction }
                };
                break;
            case 'aftermarket':
                config = {
                    title: "What brings you to the Aftermarket Mall?",
                    description: "Are you here to find performance parts and accessories, or to sell them?",
                    primary: { label: "I am looking for a product", description: "Browse aftermarket products.", action: buyerAction },
                    secondary: { label: "I want to post a product", description: "List your products for sale.", action: sellerAction }
                };
                break;
            case 'transporter':
                 config = {
                    title: "What is your role?",
                    description: "Are you looking to subcontract work, or are you offering your transport services?",
                    primary: { label: "I need a Transporter", description: "Find a partner for a load.", action: buyerAction },
                    secondary: { label: "I am a Transporter", description: "List your services.", action: sellerAction }
                };
                break;
            default: // Default for Supplier Mall
                config = {
                    title: "What brings you here today?",
                    description: "Let us know if you're here to buy products/services or to sell your own. This helps us tailor your experience.",
                    primary: { label: "I want to Buy", description: "Find parts, services, or loads.", action: buyerAction },
                    secondary: { label: "I want to Sell", description: "List my products or services.", action: sellerAction }
                };
        }

        // Add analytics and wrap the actions
        const wrapAction = (originalAction: () => void, intent: string) => () => {
            if (!process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID) {
                originalAction();
                return;
            }
            gtag.event({
                action: 'intent_capture',
                category: 'Mall Navigation',
                label: `${mallId}_${intent}`,
                value: 1
            });
            originalAction();
        };
        
        config.primary!.action = wrapAction(config.primary!.action, 'primary');
        config.secondary!.action = wrapAction(config.secondary!.action, 'secondary');

        return config as ModalConfig;
    }


    const handleExploreClick = (mallId: string, href: string) => {
        const config = createModalConfig(mallId, href);
        setModalConfig(config);
        setIsModalOpen(true);
        setShowIncentiveStep(false);
    };

    return (
        <div>
            <IntentModal 
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
                config={modalConfig}
                incentiveStep={incentiveStep}
                showIncentiveStep={showIncentiveStep}
                setShowIncentiveStep={setShowIncentiveStep}
            />

            <section className="relative w-full h-80 bg-card">
                {mallHeroImage && (
                    <Image
                        src={mallHeroImage.imageUrl}
                        alt={mallHeroImage.description}
                        fill
                        className="object-cover"
                        priority
                        data-ai-hint={mallHeroImage.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative h-full flex flex-col items-center justify-center text-center text-primary-foreground z-10 p-4">
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">Where Collective Buying Creates Savings Flow</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-3xl">Stop overpaying for parts, services, and assets. Our Mall ecosystem unites the buying power of the entire community, breaking the constraint of high operational costs and creating a continuous flow of savings directly to your bottom line.</p>
                </div>
            </section>
             <section id="malls-grid" className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4">
                     <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">Explore Our Malls</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Specialized marketplaces designed to meet every need of your transport business.
                        </p>
                    </div>
                    <div className="space-y-16">
                        {malls.map((mall, index) => {
                            const Icon = mall.icon;
                            return (
                                <div key={mall.name} className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                                    <div className={`relative aspect-video rounded-lg overflow-hidden shadow-lg ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                                        {mall.image && (
                                            <Image
                                                src={mall.image.imageUrl}
                                                alt={mall.name}
                                                fill
                                                className="object-cover"
                                                data-ai-hint={mall.image.imageHint}
                                            />
                                        )}
                                    </div>
                                    <div className={index % 2 === 1 ? 'md:order-1' : ''}>
                                        <div className="flex items-center gap-4">
                                            {Icon && <Icon className="h-10 w-10 text-primary" />}
                                            <h3 className="text-3xl font-bold font-headline">{mall.name}</h3>
                                        </div>
                                        <p className="mt-4 text-lg text-muted-foreground">
                                            {mall.description}
                                        </p>
                                        <Button onClick={() => handleExploreClick(mall.id, mall.href)} className="mt-6">
                                            Explore Mall <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            <section id="featured-products" className="py-16 md:py-24 bg-card">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">Featured Products</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Hand-picked deals and essential items for your fleet, available at special prices for Logistics Flow members.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                         {marketplaceItems.slice(0, 4).map(item => (
                            <Card key={item.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
                                <CardHeader className="p-0">
                                    <div className="relative aspect-4/3">
                                        {item.image && (
                                            <Image 
                                                src={item.image.imageUrl}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                                data-ai-hint={item.image.imageHint}
                                            />
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 flex flex-col flex-grow">
                                    <div className="flex-grow">
                                        <Badge variant="secondary" className="mb-2">{item.category}</Badge>
                                        <h3 className="font-bold text-lg">{item.name}</h3>
                                        <p className="text-sm text-muted-foreground mt-1 h-10 truncate">{item.description}</p>
                                    </div>
                                    <div className="flex justify-between items-end mt-4">
                                        {isClient && <p className="text-xl font-bold text-primary">{formatPrice(item.price)}</p>}
                                        <Button size="sm">View Item</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                     <div className="text-center mt-12">
                        <Button size="lg" asChild>
                            <Link href="/marketplace">
                                Explore All Products <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    )
}
