
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

const AssetListComponent = dynamic(() => import('@/app/backend/lending/assets-content'), { 
    loading: () => <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>,
    ssr: false 
});

export default function AssetsContent() {
    return (
         <Suspense fallback={<div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <AssetListComponent />
        </Suspense>
    );
}
