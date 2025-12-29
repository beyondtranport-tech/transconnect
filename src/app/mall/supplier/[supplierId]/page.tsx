
'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Building2, CheckCircle, Star, Sparkles, Loader2, Mail, Phone, MapPin } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

function SupplierProfile({ params }: { params: { supplierId: string }}) {
    const firestore = useFirestore();

    const supplierRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'shops', params.supplierId);
    }, [firestore, params.supplierId]);

    const { data: supplier, isLoading } = useDoc(supplierRef);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    if (!supplier) {
        notFound();
    }
    
    return (
        <div className="py-16 md:py-24 bg-background">
             <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto border rounded-xl overflow-hidden shadow-2xl bg-background">
                    {/* Profile Header */}
                    <div className="relative h-48 md:h-64 bg-muted">
                        {supplier.heroBannerUrl && (
                            <Image
                                src={supplier.heroBannerUrl}
                                alt={supplier.shopName}
                                fill
                                className="object-cover"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-background p-3 rounded-lg shadow-md">
                                    <Building2 className="h-10 w-10 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-white font-headline">{supplier.shopName}</h1>
                                    <p className="text-white/90">{supplier.category}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Profile Body */}
                    <div className="p-6 md:p-8 grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-2">
                            <h2 className="text-xl font-semibold font-headline">About Us</h2>
                            <p className="mt-2 text-muted-foreground">
                                {supplier.shopDescription || "No description provided."}
                            </p>
                        </div>
                        <div className="bg-card p-6 rounded-lg border">
                            <h3 className="text-xl font-semibold font-headline">Contact Details</h3>
                            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                                {supplier.contactPhone && <li><strong><Phone className="inline h-4 w-4 mr-2"/></strong> {supplier.contactPhone}</li>}
                                {supplier.contactEmail && <li><strong><Mail className="inline h-4 w-4 mr-2"/></strong> {supplier.contactEmail}</li>}
                                {/* Add address fields if they exist */}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-16">
                    <Button size="lg" variant="outline">
                        <Sparkles className="mr-2 h-5 w-5" />
                        Want your shop featured? Join TransConnect!
                    </Button>
                </div>
             </div>
        </div>
    );
}

export default function SupplierProfilePage({ params }: { params: { supplierId: string } }) {
    return <SupplierProfile params={params} />;
}
