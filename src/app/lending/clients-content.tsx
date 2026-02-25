
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from "lucide-react";

const ClientListComponent = dynamic(() => import('@/app/backend/lending/clients-content'), { 
    loading: () => <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>,
    ssr: false 
});

export default function ClientsContent() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <ClientListComponent />
        </Suspense>
    );
}
