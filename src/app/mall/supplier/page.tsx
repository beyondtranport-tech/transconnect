'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import data from "@/lib/placeholder-images.json";
import { Search, ArrowRight, Lock, ShieldCheck, MapPin, Loader2, Info } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as gtag from '@/lib/gtag';
import React, { useState, useMemo } from 'react';
import { useUser, getClientSideAuthToken } from "@/firebase";
import { useConfig } from "@/hooks/use-config";
import { supplierCategories } from "@/app/adminaccount/marketing/discovery-engine";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const { placeholderImages } = data;
const supplierMallImage = placeholderImages.find(p => p.id === 'mall-division');

export default function SupplierMallPage() {
    const { user } = useUser();
    const [searchTerm, setSearchInput] = useState('');
    const [category, setCategory] = useState('all');
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    
    const isPaid = user?.companyData?.membershipId && user.companyData.membershipId !== 'free';

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
                    type: 'supplier',
                    query: searchTerm,
                    category: category === 'all' ? '' : category
                }),
            });
            const result = await response.json();
            setSuppliers(result.data || []);
            
            if (process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID) {
                gtag.event({
                    action: 'supplier_search',
                    category: 'Mall Search',
                    label: category,
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
        <div>
            <section className="relative w-full h-64 bg-slate-900">
                {supplierMallImage && (
                    <Image
                        src={supplierMallImage.imageUrl}
                        alt="Supplier Mall"
                        fill
                        className="object-cover opacity-40"
                        priority
                        data-ai-hint="warehouse"
                    />
                )}
                <div className="relative h-full flex flex-col items-center justify-center text-center text-white z-10 p-4">
                    <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tight">Supplier Intelligence</h1>
                    <p className="mt-2 text-lg text-slate-300">Access verified spares and service suppliers.</p>
                </div>
            </section>
            
            <section className="py-12 bg-background sticky top-16 z-20 shadow-sm border-b">
                <div className="container mx-auto px-4">
                     <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Company or Keyword</Label>
                            <Input 
                                placeholder="e.g. Engine parts, Brake pads, Scania spares..." 
                                value={searchTerm}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="h-12 text-lg"
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <div className="w-full md:w-64 space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Industrial Category</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="h-12"><SelectValue placeholder="All Categories" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {supplierCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button className="h-12 px-10 font-bold gap-2 w-full md:w-auto" onClick={handleSearch} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                            Search Registry
                        </Button>
                    </div>
                </div>
            </section>

             <section className="py-16 md:py-24 bg-slate-50 min-h-[500px]">
                <div className="container mx-auto px-4">
                    {!hasSearched ? (
                         <div className="text-center py-20">
                            <Search className="mx-auto h-16 w-16 text-muted-foreground/20" />
                            <h2 className="mt-6 text-2xl font-black text-muted-foreground">Ready to search our database?</h2>
                            <p className="text-muted-foreground max-w-sm mx-auto">Enter a keyword or select a category above to find verified suppliers across South Africa.</p>
                        </div>
                    ) : isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p className="text-lg font-bold text-muted-foreground">Scanning the Industry Registry...</p>
                        </div>
                    ) : (
                        <div className="max-w-6xl mx-auto">
                            <div className="flex justify-between items-center mb-8 px-2">
                                <h2 className="text-xl font-black">Registry Results ({suppliers.length})</h2>
                                {!isPaid && (
                                    <div className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-100 px-3 py-1.5 rounded-full border border-amber-200">
                                        <Info className="h-3 w-3" />
                                        Limited Search Active (1/10)
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {suppliers.map(supplier => (
                                    <Card key={supplier.id} className="bg-white border-none shadow-lg hover:shadow-2xl transition-all group overflow-hidden">
                                        <CardHeader className="pb-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant="outline" className="text-[10px] font-black uppercase border-primary text-primary">{supplier.entryType || 'Supplier'}</Badge>
                                                {supplier.researchStatus === 'completed' && <ShieldCheck className="h-4 w-4 text-green-500" />}
                                            </div>
                                            <CardTitle className="text-lg font-black group-hover:text-primary transition-colors">{supplier.companyName}</CardTitle>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                                <MapPin className="h-3 w-3" />
                                                <span className="truncate">{supplier.address || 'Location Verified'}</span>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className={cn("p-4 rounded-xl border-2 border-dashed space-y-3", !isPaid ? "bg-slate-50 border-slate-200" : "bg-green-50/30 border-primary/20")}>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground uppercase font-black tracking-widest">Leadership</span>
                                                    {isPaid ? (
                                                        <span className="font-bold text-foreground">{supplier.contactPerson || 'Direct Line Available'}</span>
                                                    ) : (
                                                        <span className="blur-sm bg-slate-300 rounded px-4 text-transparent">HIDDEN NAME</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground uppercase font-black tracking-widest">Direct E-mail</span>
                                                    {isPaid ? (
                                                        <span className="font-bold text-primary truncate ml-4">{supplier.email || 'Email Not Found'}</span>
                                                    ) : (
                                                        <span className="blur-sm bg-slate-300 rounded px-4 text-transparent">HIDDEN EMAIL</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground uppercase font-black tracking-widest">Mobile/Work</span>
                                                    {isPaid ? (
                                                        <span className="font-bold text-foreground">{supplier.phone || 'Phone Not Found'}</span>
                                                    ) : (
                                                        <span className="blur-sm bg-slate-300 rounded px-4 text-transparent">HIDDEN NUMBER</span>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                        {!isPaid && (
                                            <CardFooter className="pt-0">
                                                <Button asChild className="w-full h-11 font-black uppercase text-xs tracking-widest" variant="secondary">
                                                    <Link href="/pricing"><Lock className="h-3 w-3 mr-2" /> Unlock Contact Details</Link>
                                                </Button>
                                            </CardFooter>
                                        )}
                                        {isPaid && (
                                            <CardFooter className="pt-0 flex gap-2">
                                                <Button className="flex-1" size="sm">Request Quote</Button>
                                                <Button variant="outline" size="sm">Visit Website</Button>
                                            </CardFooter>
                                        )}
                                    </Card>
                                ))}
                            </div>
                            
                            {!isPaid && suppliers.length >= 10 && (
                                <div className="mt-16 text-center p-12 bg-white rounded-3xl shadow-xl border-2 border-primary/20 max-w-2xl mx-auto">
                                    <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto mb-6"><Lock className="h-8 w-8 text-primary" /></div>
                                    <h3 className="text-3xl font-black font-headline">End of Results</h3>
                                    <p className="mt-4 text-lg text-muted-foreground">You are viewing a limited number of records. Upgrade to the Intelligence Membership to unlock every record and direct human contacts.</p>
                                    <Button asChild size="lg" className="mt-8 h-14 px-12 text-lg font-black uppercase tracking-tight">
                                        <Link href="/pricing">Get Unlimited Access <ArrowRight className="ml-2 h-5 w-5"/></Link>
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