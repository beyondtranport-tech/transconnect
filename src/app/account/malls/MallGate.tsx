'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePermissions, type Resource } from '@/hooks/use-permissions';
import { PremiumFeaturePrompt } from '@/components/PremiumFeaturePrompt';
import { 
    PackageSearch, Warehouse, Truck, Network, Building2, Landmark, 
    ShoppingCart, Scale, Search, PlusCircle, ArrowRight, Info, ShieldCheck, Zap
} from 'lucide-react';
import { useUser } from '@/firebase';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface MallConfig {
    id: string;
    title: string;
    description: string;
    icon: any;
    resource: Resource;
    permission: 'transact' | 'manage' | 'view';
    upgradePlan: string;
    buyLabel: string;
    buyDesc: string;
    sellLabel: string;
    sellDesc: string;
    sellView: string;
}

const mallConfigs: Record<string, MallConfig> = {
    loads: {
        id: 'loads',
        title: 'Loads Mall',
        description: 'The national clearing house for all local and long-haul freight instructions. Find loads or post freight.',
        icon: PackageSearch,
        resource: 'loads',
        permission: 'transact',
        upgradePlan: 'loads_intelligence',
        buyLabel: 'Search for Loads',
        buyDesc: 'Find available freight and match your capacity.',
        sellLabel: 'Post a Load',
        sellDesc: 'List your available freight for the community.',
        sellView: 'load-board'
    },
    warehouse: {
        id: 'warehouse',
        title: 'Warehouse Mall',
        description: 'Map community storage capacity. Calculate handling, storage, and uplift fees across the hub network.',
        icon: Warehouse,
        resource: 'warehouseMall',
        permission: 'transact',
        upgradePlan: 'warehouse_intelligence',
        buyLabel: 'Source Storage',
        buyDesc: 'Find warehousing hubs and calculate storage costs.',
        sellLabel: 'List Capacity',
        sellDesc: 'List your excess storage space and services.',
        sellView: 'shop'
    },
    transporter: {
        id: 'transporter',
        title: 'Transport Mall',
        description: 'Long-haul arterial fleet registry. Connect with verified capacity for national corridors.',
        icon: Truck,
        resource: 'transporterMall',
        permission: 'view',
        upgradePlan: 'loads_intelligence',
        buyLabel: 'Source Capacity',
        buyDesc: 'Scan the forensic haulier registry.',
        sellLabel: 'List My Fleet',
        sellDesc: 'Complete your fleet profile to receive matches.',
        sellView: 'fleet'
    },
    distribution: {
        id: 'distribution',
        title: 'Distribution Mall',
        description: 'Urban spoke networks. Vetted fleet registry for inner-city collection and final-mile delivery.',
        icon: Network,
        resource: 'distributionMall',
        permission: 'view',
        upgradePlan: 'loads_intelligence',
        buyLabel: 'Source Spokes',
        buyDesc: 'Find inner-city distribution partners.',
        sellLabel: 'List My Node',
        sellDesc: 'Complete your hub profile for local distribution.',
        sellView: 'fleet'
    },
    supplier: {
        id: 'supplier',
        title: 'Supplier Mall',
        description: 'Registry of verified spares, service, and consumable providers.',
        icon: Building2,
        resource: 'supplierMall',
        permission: 'view',
        upgradePlan: 'intelligence',
        buyLabel: 'Search Suppliers',
        buyDesc: 'Find parts and services by category.',
        sellLabel: 'Publish Shop',
        sellDesc: 'Set up your digital vendor storefront.',
        sellView: 'shop'
    },
    finance: {
        id: 'finance',
        title: 'Finance Mall',
        description: 'Direct in-house funding and specialized market lenders understanding industrial risk.',
        icon: Landmark,
        resource: 'financeMall',
        permission: 'view',
        upgradePlan: 'intelligence',
        buyLabel: 'Source Capital',
        buyDesc: 'Search lenders and start applications.',
        sellLabel: 'I am a Funder',
        sellDesc: 'Join our lending network as a co-funder.',
        sellView: 'lending-focus'
    },
    'buy-sell': {
        id: 'buy-sell',
        title: 'Buy & Sell Mall',
        description: 'Marketplace for vehicle trading and secure commercial handshakes with document automation.',
        icon: ShoppingCart,
        resource: 'buySellMall',
        permission: 'transact',
        upgradePlan: 'buy_sell_intelligence',
        buyLabel: 'Browse Inventory',
        buyDesc: 'Search vehicles and equipment listed for sale.',
        sellLabel: 'List Asset',
        sellDesc: 'Sell your commercial vehicles to the network.',
        sellView: 'vehicle-listings'
    },
};

export function MallGate({ mallId }: { mallId: string }) {
    const { can } = usePermissions();
    const config = mallConfigs[mallId];
    const [intent, setIntent] = useState<'select' | 'buy' | 'sell' | null>('select');

    if (!config) return <div className="p-12 text-center italic">Mall ID "{mallId}" not found in registry.</div>;

    const hasAccess = can(config.permission as any, config.resource);

    // 1. ACCESS CHECK (The Activation Mechanism)
    if (!hasAccess) {
        return (
            <div className="max-w-4xl mx-auto py-12 animate-in fade-in zoom-in duration-500">
                <PremiumFeaturePrompt 
                    icon={config.icon}
                    title={config.title}
                    description={config.description}
                    planId={config.upgradePlan}
                />
            </div>
        );
    }

    // 2. INTENT SELECTION (Post-Activation)
    if (intent === 'select') {
        return (
            <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500 text-left">
                <div className="text-left space-y-2">
                    <h1 className="text-3xl font-black font-headline flex items-center gap-3">
                        <config.icon className="h-8 w-8 text-primary" />
                        Welcome to {config.title}
                    </h1>
                    <p className="text-muted-foreground">{config.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    <Card className="hover:border-primary border-2 transition-all cursor-pointer group shadow-xl bg-white" onClick={() => setIntent('buy')}>
                        <CardHeader className="p-8 pb-4">
                            <div className="bg-muted p-4 rounded-2xl w-fit group-hover:bg-primary transition-colors">
                                <Search className="h-8 w-8 text-foreground group-hover:text-white" />
                            </div>
                            <CardTitle className="text-2xl font-black mt-6">{config.buyLabel}</CardTitle>
                            <CardDescription className="text-base mt-2 leading-relaxed">{config.buyDesc}</CardDescription>
                        </CardHeader>
                        <CardFooter className="p-8 pt-0 flex justify-end">
                            <ArrowRight className="h-6 w-6 text-primary" />
                        </CardFooter>
                    </Card>

                    <Card className="hover:border-primary border-2 transition-all cursor-pointer group shadow-xl bg-white" onClick={() => setIntent('sell')}>
                        <CardHeader className="p-8 pb-4">
                            <div className="bg-muted p-4 rounded-2xl w-fit group-hover:bg-primary transition-colors">
                                <PlusCircle className="h-8 w-8 text-foreground group-hover:text-white" />
                            </div>
                            <CardTitle className="text-2xl font-black mt-6">{config.sellLabel}</CardTitle>
                            <CardDescription className="text-base mt-2 leading-relaxed">{config.sellDesc}</CardDescription>
                        </CardHeader>
                        <CardFooter className="p-8 pt-0 flex justify-end">
                            <ArrowRight className="h-6 w-6 text-primary" />
                        </CardFooter>
                    </Card>
                </div>

                <Alert className="bg-primary/5 border-primary/20 p-6 text-left">
                    <Info className="h-6 w-6 text-primary" />
                    <div className="ml-2 text-left">
                        <AlertTitle className="font-bold text-lg">Earning Integrity</AlertTitle>
                        <AlertDescription className="text-sm text-muted-foreground leading-relaxed mt-1">
                            Your interactions in this mall are protected by secure handshakes. When you find a match or list an asset, the system manages the documentation flow automatically.
                        </AlertDescription>
                    </div>
                </Alert>
            </div>
        );
    }

    // 3. ACTION VIEWS
    if (intent === 'buy') {
        // Parent view logic in page.tsx handles this.
        return <div className="text-center italic py-20">Accessing Buyer Terminal...</div>;
    }

    if (intent === 'sell') {
        const subview = config.sellView === 'shop' ? '&subview=wizard' : '';
        return (
            <div className="max-w-4xl mx-auto py-20 text-center space-y-6">
                <config.icon className="h-16 w-16 text-primary mx-auto opacity-20" />
                <h3 className="text-2xl font-bold">Node Initialized</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                    To list your capabilities in the {config.title}, you need to complete your professional node.
                </p>
                <Button size="lg" asChild className="h-12 px-10 font-bold uppercase tracking-widest shadow-lg">
                    <Link href={`/account?view=${config.sellView}${subview}`}>
                        Manage {config.sellLabel} <ArrowRight className="ml-2 h-4 w-4"/>
                    </Link>
                </Button>
            </div>
        );
    }

    return null;
}
