
'use client';

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import data from "@/lib/placeholder-images.json";
import { Warehouse, Star, ArrowRight, Search, MapPin, ShieldCheck, Loader2, Info, Lock, Calculator, Banknote, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as gtag from '@/lib/gtag';
import { useUser, getClientSideAuthToken, useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from 'firebase/firestore';
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const { placeholderImages } = data;
const warehouseMallImage = placeholderImages.find(p => p.id === 'mall-division');

function BookingWizard({ facility }: { facility: any }) {
    const { user } = useUser();
    const [pallets, setPallets] = useState(10);
    const [duration, setDuration] = useState(1);
    const [vas, setVas] = useState({ packing: false, barcoding: false });
    const [isProcessing, setIsProcessing] = useState(false);

    const costs = useMemo(() => {
        const handling = pallets * (facility.upliftFee || 25 + facility.placementFee || 25);
        const storage = pallets * (facility.monthlyStorageFee || 150) * duration;
        const packingFee = vas.packing ? pallets * 45 : 0;
        const barcodeFee = vas.barcoding ? pallets * 15 : 0;
        
        return { handling, storage, vas: packingFee + barcodeFee, totalInitial: handling + storage + packingFee + barcodeFee };
    }, [pallets, duration, vas, facility]);

    const handleInquire = async () => {
        setIsProcessing(true);
        // In a real app, this would create a 'WarehouseBooking' doc
        await new Promise(r => setTimeout(r, 1500));
        setIsProcessing(false);
    };

    return (
        <DialogContent className="max-w-2xl text-left text-foreground">
            <DialogHeader>
                <DialogTitle className="text-2xl font-black font-headline flex items-center gap-2">
                    <Warehouse className="h-6 w-6 text-primary" />
                    Storage Inquiry: {facility.facilityName}
                </DialogTitle>
                <CardDescription>Calculate handling, storage, and value-added service fees.</CardDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 text-left text-foreground">
                <div className="space-y-6 text-left">
                    <div className="space-y-2 text-left">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Pallet Positions Required</Label>
                        <Input type="number" value={pallets} onChange={e => setPallets(Number(e.target.value))} className="h-12 text-lg font-bold" />
                    </div>
                    <div className="space-y-2 text-left">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Duration (Months)</Label>
                        <Input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} className="h-12 text-lg font-bold" />
                    </div>
                    <div className="space-y-3 text-left">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Value-Added Services</Label>
                        <div className="grid gap-2 text-left">
                            <div className="flex items-center space-x-3 p-3 border rounded-lg bg-slate-50 cursor-pointer" onClick={() => setVas({...vas, packing: !vas.packing})}>
                                <div className={cn("h-4 w-4 rounded-sm border-2", vas.packing ? "bg-primary border-primary" : "border-slate-300")} />
                                <span className="text-sm font-bold">Repacking & Shrink (R45/plt)</span>
                            </div>
                            <div className="flex items-center space-x-3 p-3 border rounded-lg bg-slate-50 cursor-pointer" onClick={() => setVas({...vas, barcoding: !vas.barcoding})}>
                                <div className={cn("h-4 w-4 rounded-sm border-2", vas.barcoding ? "bg-primary border-primary" : "border-slate-300")} />
                                <span className="text-sm font-bold">Labeling & Barcoding (R15/plt)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-6 shadow-xl text-left">
                    <div className="space-y-4 text-left">
                        <div className="flex justify-between text-xs border-b border-white/10 pb-2">
                            <span className="text-slate-400 font-bold uppercase tracking-widest">Inbound Handling</span>
                            <span className="font-mono">{formatCurrency(costs.handling)}</span>
                        </div>
                        <div className="flex justify-between text-xs border-b border-white/10 pb-2">
                            <span className="text-slate-400 font-bold uppercase tracking-widest">Monthly Storage</span>
                            <span className="font-mono">{formatCurrency(costs.storage / duration)}/mo</span>
                        </div>
                        <div className="flex justify-between text-xs border-b border-white/10 pb-2">
                            <span className="text-slate-400 font-bold uppercase tracking-widest">VAS Charges</span>
                            <span className="font-mono">{formatCurrency(costs.vas)}</span>
                        </div>
                    </div>
                    <div className="pt-4 text-left">
                        <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em] mb-1">Total Initial Commitment</p>
                        <p className="text-4xl font-black text-white">{formatCurrency(costs.totalInitial)}</p>
                    </div>
                </div>
            </div>
            <DialogFooter className="bg-slate-50 p-6 border-t rounded-b-lg">
                <Button className="w-full h-14 font-black uppercase tracking-tight shadow-xl" onClick={handleInquire} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="animate-spin h-5 w-5" /> : "Initiate Storage Handshake"}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}

export default function WarehouseMallPage() {
    const { user } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [facilities, setFacilities] = useState<any[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    
    const isPaid = user?.companyData?.membershipId && user.companyData.membershipId !== 'free';

    const handleSearch = async () => {
        setIsLoading(true);
        setHasSearched(true);
        try {
            const token = await getClientSideAuthToken();
            const response = await fetch('/api/searchLeads', {
                method: 'POST',
                headers: { 'Authorization': token ? `Bearer ${token}` : '', 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'warehouse', query: searchTerm }),
            });
            const result = await response.json();
            setFacilities(result.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen text-left text-foreground">
            <section className="relative w-full h-80 bg-slate-900 flex items-center justify-center">
                {warehouseMallImage && (
                    <Image
                        src={warehouseMallImage.imageUrl}
                        alt="Warehouse Mall"
                        fill
                        className="object-cover opacity-40"
                        priority
                        data-ai-hint="warehouse logistics"
                    />
                )}
                <div className="relative z-10 container mx-auto px-4 text-center text-white">
                    <Badge className="bg-primary/20 text-primary border-primary/30 mb-6 py-1.5 px-6 font-black uppercase tracking-widest text-[10px]">Ecosystem Storage</Badge>
                    <h1 className="text-4xl md:text-6xl font-black font-headline text-white text-center">Warehouse Mall</h1>
                    <p className="mt-4 text-lg text-slate-300 max-w-3xl mx-auto text-center">Breaking the storage constraint. Connect with verified facilities and excess business capacity.</p>
                </div>
            </section>
            
            <section className="container mx-auto px-4 -mt-10 mb-12 text-left">
                <Card className="max-w-4xl mx-auto shadow-2xl border-none text-left">
                    <CardContent className="p-6 flex flex-col md:flex-row gap-4 items-end text-left text-foreground">
                        <div className="flex-1 space-y-2 w-full text-left">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Region or Facility Type</Label>
                            <Input 
                                placeholder="e.g. City Deep, Cold Storage, 3PL Service..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="h-12 bg-white"
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <Button className="h-12 px-10 font-bold gap-2 w-full md:w-auto" onClick={handleSearch} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4" />}
                            Execute Search
                        </Button>
                    </CardContent>
                </Card>
            </section>

             <section className="container mx-auto px-4 py-8 text-left text-foreground">
                {!hasSearched ? (
                    <div className="text-center py-24 opacity-20 text-foreground">
                        <Warehouse className="h-24 w-24 mx-auto mb-4" />
                        <p className="text-xl font-bold uppercase tracking-widest text-center">Specify region to map capacity</p>
                    </div>
                ) : isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="font-bold text-muted-foreground uppercase tracking-widest text-center">Analyzing Storage Nodes...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto text-left text-foreground">
                        {facilities.map(facility => (
                            <Card key={facility.id} className="overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all group bg-white text-left text-foreground">
                                <CardHeader className="bg-slate-50 border-b pb-4">
                                    <div className="flex justify-between items-start mb-2 text-left text-foreground">
                                        <Badge variant="outline" className="text-[9px] h-4 uppercase font-black border-primary/20 text-primary">
                                            {facility.providerType === 'primary_operator' ? 'Primary Facility' : 'Excess Capacity'}
                                        </Badge>
                                        <Badge className="bg-green-600 text-white text-[9px] h-4 font-black uppercase">Verified</Badge>
                                    </div>
                                    <CardTitle className="text-xl font-black group-hover:text-primary transition-colors text-left text-foreground">{facility.facilityName}</CardTitle>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground mt-1">
                                        <MapPin className="h-3 w-3" /> {facility.address || 'National Network'}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6 text-left text-foreground">
                                    <div className="grid grid-cols-2 gap-4 text-left text-foreground">
                                        <div className="text-left">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Available Space</p>
                                            <p className="text-xl font-black text-foreground">{facility.availablePallets?.toLocaleString() || 0} Plts</p>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Storage Rate</p>
                                            <p className="text-xl font-black text-primary">{formatCurrency(facility.monthlyStorageFee || 150)}/mo</p>
                                        </div>
                                    </div>
                                    <div className={cn("p-4 rounded-xl border-2 border-dashed space-y-3", !isPaid ? "bg-slate-50 border-slate-200" : "bg-primary/5 border-primary/20")}>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground font-bold uppercase tracking-widest">Handling (Uplift)</span>
                                            {isPaid ? <span className="font-bold">{formatCurrency(facility.upliftFee || 25)}</span> : <span className="blur-sm bg-slate-300 rounded px-2">XXX</span>}
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground font-bold uppercase tracking-widest">Handling (Place)</span>
                                            {isPaid ? <span className="font-bold">{formatCurrency(facility.placementFee || 25)}</span> : <span className="blur-sm bg-slate-300 rounded px-2">XXX</span>}
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-slate-50 border-t p-6 text-left text-foreground">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button className="w-full h-12 font-black uppercase text-xs tracking-widest gap-2 shadow-lg" variant={isPaid ? "default" : "secondary"}>
                                                {isPaid ? <><Calculator className="h-4 w-4" /> Calculate & Inquire</> : <><Lock className="h-4 w-4" /> Unlock Intelligence</>}
                                            </Button>
                                        </DialogTrigger>
                                        {isPaid ? <BookingWizard facility={facility} /> : (
                                            <DialogContent className="max-w-md text-left text-foreground">
                                                <DialogHeader>
                                                    <DialogTitle>Intelligence Membership Required</DialogTitle>
                                                    <DialogDescription>Access to handling fees and inquiry terminals is restricted to Intelligence Access members.</DialogDescription>
                                                </DialogHeader>
                                                <Button asChild className="h-14 font-black uppercase text-xs tracking-widest"><Link href="/pricing">View Upgrade Options <ArrowRight className="ml-2 h-4 w-4"/></Link></Button>
                                            </DialogContent>
                                        )}
                                    </Dialog>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
