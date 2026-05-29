
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowRight, ShoppingBasket, Building2, Truck, Landmark, PackageSearch, Store, Network, Warehouse, Recycle, Wrench, Scale, Handshake } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import data from "@/lib/placeholder-images.json";
import { marketplaceItems } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import * as React from "react";
import { useState } from 'react';
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
    if (typeof price !== 'number' || isNaN(price)) return 'R 0';
    const parts = price.toFixed(0).toString().split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `R ${integerPart}`;
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
        description: "Explore verified service lanes and book reliable transport capacity.",
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
        href: "/mall/loads",
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
        description: "Live auctions for vehicles, equipment, and salvaged assets from SA Auction Group.",
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
        description: "Give a second life to decommissioned assets, parts, and components.",
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null);
    const [incentiveStep, setIncentiveStep] = useState<IncentiveStep | null>(null);
    const [showIncentiveStep, setShowIncentiveStep] = useState(false);

    const showIncentive = (href: string) => {
        setIncentiveStep({
            title: "Join the Marketplace Network",
            description: "By creating your professional service profile, you gain access to a targeted market of shippers. Help us grow the community by contributing your fleet data during onboarding.",
            cta: "Begin Profile Creation",
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
                    title: "Finance Mall Goal",
                    description: "Are you seeking capital for your business, or are you a financier providing it?",
                    primary: { label: "I want to Borrow", description: "Apply for a loan or asset finance.", action: buyerAction },
                    secondary: { label: "I want to Lend", description: "Join our financier network.", action: () => router.push('/for-financiers') }
                };
                break;
            case 'transporter':
                 config = {
                    title: "Transporter Mall Intent",
                    description: "Are you looking to book a transporter, or are you a transporter listing your services?",
                    primary: { label: "I need a Transporter", description: "Find capacity for your loads.", action: buyerAction },
                    secondary: { label: "I am a Transporter", description: "Create your service profile.", action: sellerAction }
                };
                break;
            case 'loads':
                config = {
                    title: "Loads Mall Intent",
                    description: "Are you searching for freight to carry, or posting a load to the network?",
                    primary: { label: "I am looking for a load", description: "Find freight matches.", action: buyerAction },
                    secondary: { label: "I have a load to post", description: "List your available freight.", action: sellerAction }
                };
                break;
            default:
                config = {
                    title: "What is your goal today?",
                    description: "Let us know if you're here to source products/services or to list your own capabilities.",
                    primary: { label: "I want to Source", description: "Find parts, services, or capacity.", action: buyerAction },
                    secondary: { label: "I want to List", description: "Create your professional profile.", action: sellerAction }
                };
        }

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
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">The Mall Ecosystem</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-3xl">Breaking industry constraints through collective buying power and specialized service networks.</p>
                </div>
            </section>
             <section id="malls-grid" className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                        {malls.map((mall, index) => {
                            const Icon = mall.icon;
                            return (
                                <div key={mall.name} className="grid md:grid-cols-2 gap-8 items-center border p-6 rounded-xl hover:shadow-lg transition-shadow bg-card">
                                    <div className="relative aspect-video rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                                        {mall.image ? (
                                            <Image
                                                src={mall.image.imageUrl}
                                                alt={mall.name}
                                                fill
                                                className="object-cover"
                                                data-ai-hint={mall.image.imageHint}
                                            />
                                        ) : Icon ? (
                                            <Icon className="h-24 w-24 text-muted-foreground/30" />
                                        ) : null}
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            {Icon && <Icon className="h-8 w-8 text-primary" />}
                                            <h3 className="text-2xl font-bold font-headline">{mall.name}</h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {mall.description}
                                        </p>
                                        <Button onClick={() => handleExploreClick(mall.id, mall.href)} className="w-full">
                                            Explore Mall <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>
        </div>
    )
}
