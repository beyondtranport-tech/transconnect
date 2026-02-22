
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Handshake, Building2, Store, Briefcase, Users, ArrowRight, ArrowLeft } from "lucide-react";
import PartnerDetails from './partner-details';
import { Button } from '@/components/ui/button';
import { useSearchParams, useRouter } from 'next/navigation';

const partnerTypes = [
    { type: "Suppliers", description: "Manage your list of goods and service suppliers.", icon: Building2 },
    { type: "Vendors", description: "Manage vendors from whom you purchase assets.", icon: Store },
    { type: "Associates", description: "Manage business associates and their networks.", icon: Briefcase },
    { type: "Debtors", description: "Manage your book of debtors and their payment performance.", icon: Users },
];

export default function PartnersContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const typeFromQuery = searchParams.get('type') as 'Suppliers' | 'Vendors' | 'Associates' | 'Debtors' | null;
    const actionFromQuery = searchParams.get('action');
    
    const [selectedType, setSelectedType] = useState<'Suppliers' | 'Vendors' | 'Associates' | 'Debtors' | null>(null);

    // Effect to handle URL-driven state
    useEffect(() => {
        if (typeFromQuery) {
            setSelectedType(typeFromQuery);
        } else {
            setSelectedType(null); // Reset if query param is removed
        }
    }, [typeFromQuery]);

    const handleBack = () => {
        setSelectedType(null);
        router.push('/lending?view=partners'); // Navigate to clean URL
    };
    
    if (selectedType) {
        return (
            <div>
                 <Button onClick={handleBack} variant="outline" className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Partner Types
                </Button>
                <PartnerDetails partnerType={selectedType} initialAction={actionFromQuery} />
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Handshake /> Partners Management
                </CardTitle>
                <CardDescription>
                    Select a partner category to manage. This section includes suppliers, vendors, associates, and debtors.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {partnerTypes.map(pt => {
                    const Icon = pt.icon;
                    return (
                        <button key={pt.type} onClick={() => setSelectedType(pt.type as any)} className="w-full text-left">
                            <Card className="hover:border-primary hover:shadow-lg transition-all h-full">
                                <CardHeader className="flex-row items-center gap-4">
                                    <Icon className="h-10 w-10 text-primary" />
                                    <div>
                                        <CardTitle>{pt.type}</CardTitle>
                                        <CardDescription>{pt.description}</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardFooter>
                                    <p className="text-sm font-semibold text-primary flex items-center gap-2">
                                        Manage {pt.type} <ArrowRight className="h-4 w-4" />
                                    </p>
                                </CardFooter>
                            </Card>
                        </button>
                    )
                })}
            </CardContent>
        </Card>
    );
}

    