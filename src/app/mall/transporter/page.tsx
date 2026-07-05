'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import data from "@/lib/placeholder-images.json";
import { Truck, Search, ArrowRight, Lock, ShieldCheck, MapPin, Loader2, Info, Navigation } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as gtag from '@/lib/gtag';
import React, { useState } from 'react';
import { useUser, getClientSideAuthToken } from "@/firebase";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";

const { placeholderImages } = data;
const transporterMallImage = placeholderImages.find(p => p.id === 'hero-home');

export default function TransporterMallPage() {
    const { user } = useUser();
    const { can } = usePermissions();
    const [searchTerm, setSearchInput] = useState('');
    const [transporters, setTransporters] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    
    // Revenue Guard: Check for direct contact access
    const canSeeContacts = can('view', 'direct-contacts');

    const handleSearch = async () => {
        setIsLoading(true);
        setHasSearched(true);
        try {
            const token = await getClientSideAuthToken();
            const response = await fetch('/api/searchLeads', {
                method: 'POST',
                headers: { 
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ 
                    type: 'transporter',
                    query: searchTerm,
                }),
            });
            const result = await response.json();
            setTransporters(result.data || []);
            
            if (process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID) {
                gtag.event({
                    action: 'transporter_search',
                    category: 'Mall Search',
                    label: searchTerm,
                    value: result.data?.length || 0
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="text-left text-foreground">
            <section className="relative w-full h-64 bg-slate-900">
                {transporterMallImage && (
                    <Image
                        src={transporterMallImage.imageUrl}
                        alt="Transporter Mall"
                        fill
                        className="object-cover opacity-40"
                        priority
                        data-ai-hint="truck highway"
                    />
                )}
                <div className="relative h-full flex flex-col items-center justify-center text-center text-white z-10 p-4">
                    <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tight text-white text-center">Transporter Intelligence</h1>
                    <p className="mt-2 text-lg text-slate-300 text-center">Unlock capacity from verified South African hauliers.</p>
                </div>
            </section>
            
            <section className="py-12 bg-background sticky top-16 z-20 shadow-sm border-b text-left">
                <div className="container mx-auto px-4 text-left">
                     <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 items-end text-left text-foreground">
                        <div className="flex-1 w-full space-y-2 text-left">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Search Capacity & Routes</label>
                            <div className="relative text-left">
                                <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                                <Input 
                                    placeholder="e.g. Cape Town to JHB, Superlink, Flatbed..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    className="h-12 pl-10 text-lg bg-white"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                        </div>
                        <Button className="h-12 px-10 font-bold gap-2 w-full md:w-auto" onClick={handleSearch} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Navigation className="h-5 w-5" />}
                            Find Capacity
                        </Button>
                    </div>
                </div>
            </section>

             <section className="py-16 md:py-24 bg-slate-50 min-h-[500px] text-left">
                <div className="container mx-auto px-4 text-left">
                    {!hasSearched ? (
                         <div className="text-center py-20 opacity-30 text-foreground">
                            <Truck className="mx-auto h-16 w-16 text-muted-foreground" />
                            <h2 className="mt-6 text-2xl font-black text-center uppercase tracking-tight">Registry Standby</h2>
                        </div>
                    ) : isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p className="text-lg font-bold text-muted-foreground uppercase tracking-widest">Matching Capacity...</p>
                        </div>
                    ) : (
                        <div className="max-w-6xl mx-auto text-left">
                            <div className="flex justify-between items-center mb-8 px-2 text-left">
                                <h2 className="text-xl font-black text-foreground">Capacity Matches ({transporters.length})</h2>
                                {!canSeeContacts && (
                                    <div className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-100 px-3 py-1.5 rounded-full border border-amber-200">
                                        <Info className="h-3 w-3" />
                                        Loads Intelligence Node Required
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left text-foreground">
                                {transporters.map(transporter => (
                                    <Card key={transporter.id} className="bg-white border-none shadow-lg hover:shadow-2xl transition-all group overflow-hidden text-left">
                                        <CardHeader className="pb-4 text-left">
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant="outline" className="text-[10px] font-black uppercase border-primary text-primary">{transporter.entryType || 'Haulier'}</Badge>
                                                {transporter.researchStatus === 'completed' && <ShieldCheck className="h-4 w-4 text-green-500" />}
                                            </div>
                                            <CardTitle className="text-lg font-black group-hover:text-primary transition-colors text-left text-foreground">{transporter.companyName}</CardTitle>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 text-left">
                                                <MapPin className="h-3 w-3" />
                                                <span className="truncate">{transporter.address || 'Operational Hub Verified'}</span>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4 text-left text-foreground">
                                            <div className={cn("p-4 rounded-xl border-2 border-dashed space-y-3", !canSeeContacts ? "bg-slate-50 border-slate-200" : "bg-primary/5 border-primary/20")}>
                                                <div className="flex items-center justify-between text-xs text-left">
                                                    <span className="text-muted-foreground uppercase font-black tracking-widest text-[10px]">Registry MD</span>
                                                    {canSeeContacts ? (
                                                        <span className="font-bold text-foreground text-left">{transporter.contactPerson}</span>
                                                    ) : (
                                                        <span className="blur-sm bg-slate-300 rounded px-4 text-transparent">HIDDEN NAME</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground uppercase font-black tracking-widest text-[10px]">Operations Email</span>
                                                    {canSeeContacts ? (
                                                        <span className="font-bold text-primary truncate ml-4">{transporter.email}</span>
                                                    ) : (
                                                        <span className="blur-sm bg-slate-300 rounded px-4 text-transparent">HIDDEN EMAIL</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground uppercase font-black tracking-widest text-[10px]">Dispatch Number</span>
                                                    {canSeeContacts ? (
                                                        <span className="font-bold text-foreground">{transporter.phone}</span>
                                                    ) : (
                                                        <span className="blur-sm bg-slate-300 rounded px-4 text-transparent">HIDDEN NUMBER</span>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                        {!canSeeContacts && (
                                            <CardFooter className="pt-0">
                                                <Button asChild className="w-full h-11 font-black uppercase text-xs tracking-widest" variant="secondary">
                                                    <Link href="/checkout/loads_intelligence"><Lock className="h-3 w-3 mr-2" /> Unlock Haulier Contacts</Link>
                                                </Button>
                                            </CardFooter>
                                        )}
                                        {canSeeContacts && (
                                            <CardFooter className="pt-0 flex gap-2">
                                                <Button className="flex-1 font-bold" size="sm" asChild>
                                                    <Link href="/account?view=load-board">Direct Booking</Link>
                                                </Button>
                                            </CardFooter>
                                        )}
                                    </Card>
                                ))}
                            </div>
                            
                            {!canSeeContacts && transporters.length >= 10 && (
                                <div className="mt-16 text-center p-12 bg-white rounded-3xl shadow-xl border-2 border-primary/20 max-w-2xl mx-auto">
                                    <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto mb-6"><Lock className="h-8 w-8 text-primary" /></div>
                                    <h3 className="text-3xl font-black font-headline text-center">Unlock Full Intelligence</h3>
                                    <p className="mt-4 text-lg text-muted-foreground text-center">You are viewing a limited foundation. To see direct emails and mobile numbers for **{transporters.length}+ hauliers**, activate the Loads Intelligence node.</p>
                                    <Button asChild size="lg" className="mt-8 h-14 px-12 text-lg font-black uppercase tracking-tight shadow-xl shadow-primary/20">
                                        <Link href="/checkout/loads_intelligence">Get Transactional Access <ArrowRight className="ml-2 h-5 w-5"/></Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
