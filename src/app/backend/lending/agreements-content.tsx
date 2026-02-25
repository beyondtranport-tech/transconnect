'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

// Renamed to avoid name collision
const AgreementsComponent = dynamic(() => import('@/app/lending/agreements-content'), { 
    loading: () => <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>,
    ssr: false 
});

export default function AgreementsContent() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <AgreementsComponent />
        </Suspense>
    );
}
