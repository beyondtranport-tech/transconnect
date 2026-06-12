'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { provinces } from '@/lib/geodata';
import { Truck, Search, MapPin, ShieldCheck, Loader2, ArrowRight, Lock, Navigation } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useUser, getClientSideAuthToken } from '@/firebase';
import * as gtag from '@/lib/gtag';
import { cn } from '@/lib/utils';

const servicesMap = [
    { id: 'container', label: 'Container Transport', requiredFleet: ['Skeletal'] },
    { id: 'reefer-container', label: 'Refrigerated Containers', requiredFleet: ['Skeletal', 'Skeletal + Genset'] },
    { id: 'general-freight', label: 'General Freight', requiredFleet: ['Tautliner', 'Flatbed'] },
    { id: 'bulk-aggregates', label: 'Bulk / Aggregates', requiredFleet: ['Tipper'] },
    { id: 'abnormal-loads', label: 'Abnormal Loads', requiredFleet: ['Lowbed'] },
];

export default function TransporterIntelligencePage() {
    const { user } = useUser();
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedSuburb, setSelectedSuburb] = useState('');
    const [selectedService, setSelectedService] = useState('');
    
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    
    const isPaid = user?.companyData?.membershipId && user.companyData.membershipId !== 'free';

    const cities = useMemo(() => {
        const prov = provinces.find(p => p.name === selectedProvince);
        return prov ? prov.cities : [];
    }, [selectedProvince]);

    const suburbs = useMemo(() => {
        const city = cities.find(c => c.name === selectedCity);
        return city ? city.suburbs : [];
    }, [selectedCity, cities]);

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
                    province: selectedProvince,
                    city: selectedCity,
                    suburb: selectedSuburb,
                    service: selectedService
                }),
            });
            const result = await response.json();
            setResults(result.data || []);
            
            if (process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID) {
                gtag.event({
                    action: 'intelligence_search',
                    category: 'Transporter Intelligence',
                    label: `${selectedCity}_${selectedService}`,
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
        <div className="bg-slate-50 min-h-screen text-left">
            <section className="bg-slate-900 text-white py-16">
                <div className="container mx-auto px-4 text-center">
                    <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 py-1 px-4 text-[10px] font-black uppercase tracking-widest">Forensic Registry</Badge>
                    <h1 className="text-4xl md:text-6xl font-black font-headline">Transporter Intelligence</h1>
                    <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">Map the South African transport landscape. Find verified hauliers based on precise fleet capabilities and regional presence.</p>
                </div>
            </section>

            <section className="container mx-auto px-4 -mt-12">
                <Card className="max-w-5xl mx-auto shadow-2xl border-none">
                    <CardHeader className="bg-white rounded-t-xl border-b text-left">
                        <CardTitle className="flex items-center gap-2">
                            <Navigation className="h-5 w-5 text-primary" />
                            Specify Requirements
                        </CardTitle>
                        <CardDescription>Select your location and the specific service type to match with verified capacity.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end text-left">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Province</Label>
                            <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                                <SelectTrigger><SelectValue placeholder="Select Province" /></SelectTrigger>
                                <SelectContent>
                                    {provinces.map(p => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">City</Label>
                            <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedProvince}>
                                <SelectTrigger><SelectValue placeholder="Select City" /></SelectTrigger>
                                <SelectContent>
                                    {cities.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Hub / Suburb</Label>
                            <Select value={selectedSuburb} onValueChange={setSelectedSuburb} disabled={!selectedCity}>
                                <SelectTrigger><SelectValue placeholder="Select Suburb" /></SelectTrigger>
                                <SelectContent>
                                    {suburbs.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Required Service</Label>
                            <Select value={selectedService} onValueChange={setSelectedService}>
                                <SelectTrigger><SelectValue placeholder="Select Service" /></SelectTrigger>
                                <SelectContent>
                                    {servicesMap.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t flex justify-center p-4">
                        <Button className="h-12 px-12 font-black uppercase text-xs tracking-widest gap-2" onClick={handleSearch} disabled={isLoading || !selectedService}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4" />}
                            Execute Search
                        </Button>
                    </CardFooter>
                </Card>
            </section>

            <section className="container mx-auto px-4 py-16">
                {!hasSearched ? (
                    <div className="text-center py-20 opacity-20">
                        <Truck className="h-24 w-24 mx-auto mb-4" />
                        <p className="text-xl font-bold uppercase tracking-widest">Ready to Scan Registry</p>
                    </div>
                ) : isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="font-bold text-muted-foreground uppercase tracking-widest">Matching Intelligence Data...</p>
                    </div>
                ) : (
                    <div className="max-w-6xl mx-auto space-y-8">
                        <div className="flex justify-between items-center px-4 border-l-4 border-primary text-left">
                            <div>
                                <h2 className="text-2xl font-black">Search Results ({results.length})</h2>
                                <p className="text-xs text-muted-foreground">Showing verified hauliers matching <strong>{selectedService}</strong> capacity.</p>
                            </div>
                            {!isPaid && (
                                <Badge variant="secondary" className="gap-1.5 py-1.5 px-4 border border-amber-200 text-amber-700 bg-amber-50">
                                    <Lock className="h-3 w-3" /> Intelligence Tier Restricted
                                </Badge>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {results.map(res => (
                                <Card key={res.id} className="bg-white border-none shadow-lg hover:shadow-xl transition-all overflow-hidden group">
                                    <CardHeader className="pb-4 text-left">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant="outline" className="text-[10px] font-black uppercase border-primary text-primary">{res.entryType || 'Haulier'}</Badge>
                                            <ShieldCheck className="h-4 w-4 text-green-500" />
                                        </div>
                                        <CardTitle className="text-lg font-black group-hover:text-primary transition-colors">{res.companyName}</CardTitle>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 font-medium">
                                            <MapPin className="h-3 w-3" />
                                            <span className="truncate">{res.address || 'South Africa'}</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4 text-left">
                                        <div className={cn("p-4 rounded-xl border-2 border-dashed space-y-3", !isPaid ? "bg-slate-50 border-slate-200" : "bg-primary/5 border-primary/20")}>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fleet Head</span>
                                                {isPaid ? <span className="font-bold">{res.contactPerson || 'Verified'}</span> : <span className="blur-sm bg-slate-300 rounded px-4 text-transparent">HIDDEN NAME</span>}
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Direct E-mail</span>
                                                {isPaid ? <span className="font-bold text-primary truncate ml-4">{res.email || 'N/A'}</span> : <span className="blur-sm bg-slate-300 rounded px-4 text-transparent">HIDDEN EMAIL</span>}
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mobile/Phone</span>
                                                {isPaid ? <span className="font-bold">{res.mobile || res.phone || 'N/A'}</span> : <span className="blur-sm bg-slate-300 rounded px-4 text-transparent">HIDDEN PHONE</span>}
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-0 border-t bg-slate-50/50 flex flex-col gap-2 p-4">
                                        {!isPaid ? (
                                            <Button asChild className="w-full h-11 font-black uppercase text-xs tracking-widest" variant="secondary">
                                                <Link href="/pricing"><Lock className="h-3 w-3 mr-2" /> Unlock Funder Intelligence</Link>
                                            </Button>
                                        ) : (
                                            <div className="w-full flex gap-2 pt-2">
                                                <Button className="flex-1 font-bold text-xs" size="sm">Book Load</Button>
                                                <Button variant="outline" className="flex-1 font-bold text-xs" size="sm">View RC1</Button>
                                            </div>
                                        )}
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                        
                        {results.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed">
                                <p className="text-muted-foreground italic">No verified transporters found for this specific regional service match. Try a broader search.</p>
                            </div>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}
