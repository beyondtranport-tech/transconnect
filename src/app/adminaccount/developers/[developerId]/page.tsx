
'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { Loader2, Code, Presentation } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from 'react';
import DeveloperElevatorPitch from '@/app/adminaccount/developer-elevator-pitch';
import DeveloperOffer from '@/app/adminaccount/developer-offer';
import DeveloperEmailSequence from '@/app/adminaccount/developer-email-sequence';

function DeveloperPitchPage() {
    const params = useParams();
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const developerId = params.developerId as string;
    const [developer, setDeveloper] = useState<any | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isUserLoading) return;
        
        if (!user) {
            router.replace('/signin');
            return;
        }

        const fetchDeveloper = async () => {
            if (!developerId) {
                setIsLoadingData(false);
                setError("No developer ID provided.");
                return;
            }
            setIsLoadingData(true);
            setError(null);
            try {
                const token = await getClientSideAuthToken();
                if (!token) throw new Error("Authentication token not available.");

                const response = await fetch('/api/admin', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'getPartnerById', payload: { partnerId: developerId } }),
                });

                const result = await response.json();
                if (!result.success) throw new Error(result.error);
                
                if (result.data) {
                    setDeveloper(result.data);
                } else {
                    setError(`Developer with ID "${developerId}" not found.`);
                }

            } catch (e: any) {
                setError(e.message);
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchDeveloper();
    }, [developerId, user, isUserLoading, router]);
    
    if (isUserLoading || isLoadingData) {
        return <div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin" /></div>;
    }
    
    if (error) {
        return <div className="text-center py-20 text-destructive">Error loading developer: {error}</div>;
    }

    if (!developer) {
        return <div className="text-center py-20 text-muted-foreground">Developer with ID "{developerId}" not found.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Code className="h-8 w-8 text-primary"/>
                <div>
                    <h1 className="text-3xl font-bold">Developer Pitch: {developer.firstName} {developer.lastName}</h1>
                    <p className="text-muted-foreground">{developer.companyName || 'Individual Developer'}</p>
                </div>
            </div>

            <Tabs defaultValue="pitch" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="pitch">Elevator Pitch</TabsTrigger>
                    <TabsTrigger value="offer">The Offer</TabsTrigger>
                    <TabsTrigger value="emails">Email Sequence</TabsTrigger>
                </TabsList>
                <TabsContent value="pitch" className="mt-6"><DeveloperElevatorPitch /></TabsContent>
                <TabsContent value="offer" className="mt-6"><DeveloperOffer /></TabsContent>
                <TabsContent value="emails" className="mt-6"><DeveloperEmailSequence /></TabsContent>
            </Tabs>
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-16 w-16 animate-spin" /></div>}>
            <DeveloperPitchPage />
        </Suspense>
    )
}
    