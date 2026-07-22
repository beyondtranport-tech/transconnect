'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { provinces } from '@/lib/geodata';
import { Truck, Search, MapPin, ShieldCheck, Loader2, ArrowRight, Lock, Navigation, Sparkles, Info, CheckCircle2, AlertCircle, Database, Table as TableIcon, ThumbsUp, ShieldAlert, Zap } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useUser, getClientSideAuthToken } from '@/firebase';
import * as gtag from '@/lib/gtag';
import { cn, formatCurrency } from '@/lib/utils';
import FleetContent from '@/app/account/fleet-content';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

const servicesMap = [
    { id: 'all', label: 'All Services' },
    { id: 'container', label: 'Container Transport' },
    { id: 'reefer-container', label: 'Refrigerated Containers' },
    { id: 'general-freight', label: 'General Freight' },
    { id: 'bulk-aggregates', label: 'Bulk / Aggregates' },
    { id: 'abnormal-loads', label: 'Abnormal Loads' },
];

export default function TransporterIntelligencePage() {
    const { user, isUserLoading, forceRefresh } = useUser();
    const { toast } = useToast();
    
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedSuburb, setSelectedSuburb] = useState('');
    const [selectedService, setSelectedService] = useState('all');
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isVouching, setIsVouching] = useState<string | null>(null);
    const [isClaiming, setIsClaiming] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [skipProfile, setSkipProfile] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const isPaid = user?.companyData?.membershipId && user.companyData.membershipId !== 'free';
    const isTransporter = user?.declaredPosition === 'transporter' || user?.companyData?.shopType === 'transporter';

    const isProfileComplete = useMemo(() => {
        if (!user || !user.companyData) return false;
        if (isTransporter) {
            const fleet = user.companyData.fleet;
            return !!(fleet && fleet.poweredUnits?.length > 0 && fleet.trailers?.length > 0);
        }
        return true;
    }, [user, isTransporter]);

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
        setError(null);
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
                    service: selectedService === 'all' ? '' : selectedService
                }),
            });
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || "Search failed.");
            }

            setResults(result.data || []);
            
            if (process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID) {
                gtag.event({
                    action: 'intelligence_search',
                    category: 'Transporter Intelligence',
                    label: `${selectedCity}_${selectedService}`,
                    value: result.data?.length || 0
                });
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVouch = async (targetId: string) => {
        setIsVouching(targetId);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Please sign in to vouch.");

            const res = await fetch('/api/vouch', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetId, collection: 'partners' })
            });
            const result = await response.json();
            if (result.success) {
                toast({ title: "Verification Recorded", description: "Your vouch for this data has been logged." });
                handleSearch(); 
            } else {
                toast({ variant: 'destructive', title: "Action Failed", description: result.error });
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Error", description: e.message });
        } finally {
            setIsVouching(null);
        }
    };

    const handleClaim = async (targetId: string) => {
        setIsClaiming(targetId);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication required.");

            const res = await fetch('/api/claimNode', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetId, collection: 'partners' })
            });
            const result = await res.json();
            if (result.success) {
                toast({ title: "Node Claimed!", description: "Identity bound successfully. Transaction isolated." });
                forceRefresh();
                handleSearch();
            } else {
                toast({ variant: 'destructive', title: "Claim Failed", description: result.error });
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Error", description: e.message });
        } finally {
            setIsClaiming(null);
        }
    };

    if (isUserLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    if (!isProfileComplete && !skipProfile) {
        return (
            <div className="bg-slate-50 min-h-screen py-16 text-left text-foreground">
                <div className="container mx-auto px-4 max-w-4xl text-left">
                    <Card className="shadow-2xl border-none text-left">
                        <CardHeader className="bg-slate-900 text-white rounded-t-xl p-8 text-left text-white">
                            <div className="flex items-center gap-4 text-left">
                                <div className="bg-primary/20 p-3 rounded-lg"><Sparkles className="h-6 w-6 text-primary" /></div>
                                <div className="text-left">
                                    <CardTitle className="text-2xl font-black font-headline text-left">Complete Your Strategic Profile</CardTitle>
                                    <CardDescription className="text-slate-400 mt-1 text-left">To ensure high-fidelity matches, we need to understand your requirements.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8 bg-white text-left">
                            <Alert className="bg-primary/5 border-primary/20 text-left">
                                <Info className="h-5 w-5 text-primary" />
                                <AlertTitle className="font-bold text-left">Why do we ask for this?</AlertTitle>
                                <AlertDescription className="text-sm text-muted-foreground leading-relaxed mt-1 text-left">
                                    Our intelligence engine uses your specific fleet data to automatically filter the registry and deliver more accurate search data.
                                </AlertDescription>
                            </Alert>

                            <FleetContent />
                            
                            <div className="flex flex-col items-center pt-8 border-t">
                                <Button variant="ghost" className="text-muted-foreground hover:text-primary font-bold uppercase tracking-widest text-[10px]" onClick={() => setSkipProfile(true)}>
                                    Proceed without profile <ArrowRight className="ml-1 h-3 w-3" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen text-left text-foreground">
            <section className="bg-slate-900 text-white py-16 text-center">
                <div className="container mx-auto px-4">
                    <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 py-1.5 px-4 text-[10px] font-black uppercase tracking-widest text-center">Forensic Registry</Badge>
                    <h1 className="text-4xl md:text-6xl font-black font-headline text-white text-center">Transporter intelligence</h1>
                    <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto text-center">Map the South African transport landscape. Find verified hauliers based on precise fleet capabilities.</p>
                </div>
            </section>

            <section className="container mx-auto px-4 -mt-12 text-left">
                <Card className="max-w-5xl mx-auto shadow-2xl border-none text-left text-foreground">
                    <CardHeader className="bg-white rounded-t-xl border-b text-left">
                        <CardTitle className="flex items-center gap-2 text-left">
                            <Navigation className="h-5 w-5 text-primary" />
                            Specify Requirements
                        </CardTitle>
                        <CardDescription className="text-left">Select your location and the specific service type to match with verified capacity.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end text-left text-foreground">
                        <div className="space-y-2 text-left">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Province</Label>
                            <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                                <SelectTrigger className="h-11 border-2 bg-white text-left"><SelectValue placeholder="Select Province" /></SelectTrigger>
                                <SelectContent>
                                    {provinces.map(p => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 text-left">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">City</Label>
                            <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedProvince}>
                                <SelectTrigger className="h-11 border-2 bg-white text-left"><SelectValue placeholder="Select City" /></SelectTrigger>
                                <SelectContent>
                                    {cities.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 text-left">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Hub / Suburb</Label>
                            <Select value={selectedSuburb} onValueChange={setSelectedSuburb} disabled={!selectedCity}>
                                <SelectTrigger className="h-11 border-2 bg-white text-left"><SelectValue placeholder="Select Suburb" /></SelectTrigger>
                                <SelectContent>
                                    {suburbs.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 text-left">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Required Service</Label>
                            <Select value={selectedService} onValueChange={setSelectedService}>
                                <SelectTrigger className="h-11 border-2 bg-white text-left"><SelectValue placeholder="Select Service" /></SelectTrigger>
                                <SelectContent>
                                    {servicesMap.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t flex justify-center p-4">
                        <Button className="h-12 px-12 font-black uppercase text-xs tracking-widest gap-2" onClick={handleSearch} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4" />}
                            Execute Search
                        </Button>
                    </CardFooter>
                </Card>
            </section>

            <section className="container mx-auto px-4 py-16 text-left text-foreground">
                {error && (
                    <Card className="max-w-2xl mx-auto border-destructive bg-destructive/10 text-left">
                        <CardHeader className="flex flex-row items-center gap-3">
                            <AlertCircle className="h-6 w-6 text-destructive" />
                            <CardTitle className="text-destructive">Search Restricted</CardTitle>
                        </CardHeader>
                        <CardContent className="text-left text-foreground">
                            <p className="text-sm text-destructive-foreground font-bold">{error}</p>
                            <p className="text-xs text-muted-foreground mt-2">Upgrade to Intelligence Access to unlock unlimited daily searches.</p>
                        </CardContent>
                        <CardFooter className="flex flex-wrap gap-2 pt-0 text-left">
                            <Button asChild size="sm">
                                <Link href="/checkout/intelligence">Unlock Paid Intelligence</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                {!hasSearched && !error ? (
                    <div className="text-center py-20 opacity-20 text-foreground">
                        <Database className="h-24 w-24 mx-auto mb-4" />
                        <p className="text-xl font-bold uppercase tracking-widest text-center">Ready to Match Capacity</p>
                    </div>
                ) : isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center text-foreground">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="font-bold text-muted-foreground uppercase tracking-widest text-center">Mapping intelligence Data...</p>
                    </div>
                ) : !error && (
                    <div className="max-w-6xl mx-auto space-y-8 text-left text-foreground">
                        <div className="flex justify-between items-center px-4 border-l-4 border-primary text-left text-foreground">
                            <div className="text-left text-foreground">
                                <h2 className="text-2xl font-black text-left flex items-center gap-2">
                                    <TableIcon className="h-6 w-6 text-primary" />
                                    Forensic Results ({results.length})
                                </h2>
                                <p className="text-xs text-muted-foreground">Vetted haulier matches for <strong>{selectedService}</strong> capacity.</p>
                            </div>
                            {!isPaid && (
                                <Badge variant="secondary" className="gap-1.5 py-1.5 px-4 border border-amber-200 text-amber-700 bg-amber-50">
                                    <Lock className="h-3 w-3" /> intelligence Tier Restricted
                                </Badge>
                            )}
                        </div>

                        <Card className="border-none shadow-xl overflow-hidden text-left bg-white text-foreground">
                            <Table>
                                <TableHeader className="bg-slate-900 hover:bg-slate-900 text-left text-white">
                                    <TableRow className="hover:bg-slate-900 border-none">
                                        <TableHead className="text-white font-bold uppercase text-[10px] tracking-widest py-4 text-left">Company Entity</TableHead>
                                        <TableHead className="text-white font-bold uppercase text-[10px] tracking-widest py-4 text-left">Trust Signals</TableHead>
                                        <TableHead className="text-white font-bold uppercase text-[10px] tracking-widest py-4 text-left">Fleet Head</TableHead>
                                        <TableHead className="text-white font-bold uppercase text-[10px] tracking-widest py-4 text-left">Direct Contacts</TableHead>
                                        <TableHead className="text-white font-bold uppercase text-[10px] tracking-widest py-4 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="text-left text-foreground">
                                    {results.length > 0 ? results.map((res) => (
                                        <TableRow key={res.id} className="group hover:bg-slate-50 transition-colors text-left text-foreground">
                                            <TableCell className="py-4 text-left">
                                                <div className="flex flex-col text-left">
                                                    <span className="font-black text-sm text-slate-900">{res.companyName}</span>
                                                    <Badge variant="outline" className="w-fit text-[9px] h-4 mt-1 border-primary/30 text-primary uppercase">{res.entryType || 'Haulier'}</Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-left text-foreground">
                                                <div className="flex flex-wrap gap-2 text-left">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className={cn("h-7 px-2 text-[10px] font-black uppercase gap-1", res.vouchCount > 0 ? "text-green-600 bg-green-50" : "text-muted-foreground")}
                                                        onClick={() => handleVouch(res.id)}
                                                        disabled={!!isVouching}
                                                    >
                                                        {isVouching === res.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <ThumbsUp className="h-3 w-3" />}
                                                        Vouched ({res.vouchCount || 0})
                                                    </Button>
                                                    {res.isClaimed ? (
                                                        <Badge className="bg-primary text-white h-7 gap-1 border-none"><ShieldCheck className="h-3 w-3" /> Claimed Node</Badge>
                                                    ) : (
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="h-7 px-2 text-[10px] font-black uppercase gap-1 border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 text-left"
                                                            onClick={() => handleClaim(res.id)}
                                                            disabled={!!isClaiming}
                                                        >
                                                            {isClaiming === res.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <ShieldAlert className="h-3 w-3" />}
                                                            Claim (R10)
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-left text-foreground">
                                                <span className={cn("text-xs font-bold text-left", !isPaid && "blur-sm select-none opacity-50")}>
                                                    {res.contactPerson || 'Forensic ID Verified'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-left text-foreground">
                                                <div className={cn("flex flex-col gap-1 text-left", !isPaid && "blur-sm select-none opacity-50")}>
                                                    <span className="text-[10px] font-mono text-primary font-bold">{res.email || 'locked@tc.co.za'}</span>
                                                    <span className="text-[10px] font-mono text-muted-foreground">{res.mobile || res.phone || '0XX XXX XXXX'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right text-foreground">
                                                {isPaid ? (
                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button size="sm" variant="outline" className="h-8 text-[10px] font-black uppercase">Book</Button>
                                                        <Button size="sm" variant="ghost" className="h-8 text-[10px] font-black uppercase">RC1</Button>
                                                    </div>
                                                ) : (
                                                    <Button asChild size="sm" variant="ghost" className="h-8 text-[10px] font-black uppercase text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-100">
                                                        <Link href="/pricing"><Lock className="h-3 w-3 mr-1" /> Unlock</Link>
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                                                <Info className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                                <p>No matching transporters found in this region.</p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </div>
                )}
            </section>
        </div>
    );
}
