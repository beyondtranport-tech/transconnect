
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { provinces } from '@/lib/geodata';
import { Landmark, Search, MapPin, ShieldCheck, Loader2, ArrowRight, Lock, Navigation, Sparkles, Info, CheckCircle2, Banknote, AlertCircle, Table as TableIcon } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useUser, getClientSideAuthToken } from '@/firebase';
import * as gtag from '@/lib/gtag';
import { cn } from '@/lib/utils';
import FleetContent from '@/app/account/fleet-content';
import NeedsContent from '@/app/account/needs-content';
import SupplierProductContent from '@/app/account/supplier-product-content';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const financeCategories = ["Asset Finance", "Working Capital", "Debt Funders", "Niche Lenders", "Bridging", "Insurance"];

export default function CapitalIntelligencePage() {
    const { user, isUserLoading } = useUser();
    
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedSuburb, setSelectedSuburb] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [skipProfile, setSkipProfile] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const isPaid = user?.companyData?.membershipId && user.companyData.membershipId !== 'free';
    const isTransporter = user?.declaredPosition === 'transporter' || user?.companyData?.shopType === 'transporter';
    const isSupplier = user?.declaredPosition === 'vendor' || user?.companyData?.shopType === 'vendor';

    const isProfileComplete = useMemo(() => {
        if (!user || !user.companyData) return false;
        if (isTransporter) {
            const fleet = user.companyData.fleet;
            return !!(fleet && fleet.poweredUnits?.length > 0 && fleet.trailers?.length > 0);
        } else if (isSupplier) {
            const productProfile = user.companyData.productProfile;
            return !!(productProfile && productProfile.categories?.length > 0 && productProfile.supportedBrands?.length > 0);
        } else {
            const needs = user.companyData.logisticsNeeds;
            return !!(needs && needs.cargoTypes?.length > 0 && needs.routes?.length > 0);
        }
    }, [user, isTransporter, isSupplier]);

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
                    type: 'finance',
                    province: selectedProvince,
                    city: selectedCity,
                    suburb: selectedSuburb,
                    category: selectedCategory
                }),
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Search failed.");
            }

            setResults(result.data || []);
            
            if (process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID) {
                gtag.event({
                    action: 'capital_intelligence_search',
                    category: 'Capital Intelligence',
                    label: `${selectedCity}_${selectedCategory}`,
                    value: result.data?.length || 0
                });
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isUserLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-20 text-left">
                <Card className="max-w-2xl mx-auto shadow-2xl overflow-hidden border-none bg-slate-900 text-white text-left">
                    <CardHeader className="p-8 pb-4 text-center">
                        <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto mb-6">
                            <Lock className="h-12 w-12 text-primary" />
                        </div>
                        <CardTitle className="text-4xl font-black font-headline">Member Access Only</CardTitle>
                        <CardDescription className="text-slate-400 text-lg mt-2">The forensic capital registry is exclusive to registered members.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-4 space-y-6">
                        <div className="space-y-4 text-left">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-primary mt-1 shrink-0" />
                                <p className="text-sm text-slate-300">Access verified funding partners and specialized lenders.</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-primary mt-1 shrink-0" />
                                <p className="text-sm text-slate-300">Connect directly with Heads of Credit and Asset Finance leaders.</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 pt-4">
                            <Button size="lg" className="h-14 text-lg font-black uppercase tracking-tight shadow-xl" asChild>
                                <Link href="/join">Join for Free</Link>
                            </Button>
                            <Button variant="ghost" className="text-slate-400 hover:text-white" asChild>
                                <Link href="/signin">Sign In</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!isProfileComplete && !skipProfile) {
        return (
            <div className="bg-slate-50 min-h-screen py-16 text-left">
                <div className="container mx-auto px-4 max-w-4xl">
                    <Card className="shadow-2xl border-none text-left">
                        <CardHeader className="bg-slate-900 text-white rounded-t-xl p-8">
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
                                    Our intelligence engine uses your specific fleet data or cargo needs to automatically filter the registry and deliver more accurate search data. This eliminates "empty searches" and connects you with the right capacity instantly. This data also helps us negotiate collective group discounts for your specific equipment.
                                </AlertDescription>
                            </Alert>

                            {isSupplier ? (
                                <SupplierProductContent />
                            ) : isTransporter ? (
                                <FleetContent />
                            ) : (
                                <NeedsContent />
                            )}
                            
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
        <div className="bg-slate-50 min-h-screen text-left">
            <section className="bg-slate-900 text-white py-16 text-center">
                <div className="container mx-auto px-4">
                    <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 py-1.5 px-4 text-[10px] font-black uppercase tracking-widest">Forensic Registry</Badge>
                    <h1 className="text-4xl md:text-6xl font-black font-headline text-white">Capital intelligence</h1>
                    <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">Map the South African funding landscape. Connect with specialized lenders and asset finance partners.</p>
                </div>
            </section>

            <section className="container mx-auto px-4 -mt-12 text-left">
                <Card className="max-w-5xl mx-auto shadow-2xl border-none text-left">
                    <CardHeader className="bg-white rounded-t-xl border-b text-left">
                        <CardTitle className="flex items-center gap-2 text-left">
                            <Navigation className="h-5 w-5 text-primary" />
                            Specify Search Variables
                        </CardTitle>
                        <CardDescription>Select a region and funding type to scan the registry.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end text-left">
                        <div className="space-y-2 text-left">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Province</Label>
                            <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                                <SelectTrigger><SelectValue placeholder="Select Province" /></SelectTrigger>
                                <SelectContent>
                                    {provinces.map(p => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 text-left">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">City / Town</Label>
                            <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedProvince}>
                                <SelectTrigger><SelectValue placeholder="Select City" /></SelectTrigger>
                                <SelectContent>
                                    {cities.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 text-left">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Industrial Suburb</Label>
                            <Select value={selectedSuburb} onValueChange={setSelectedSuburb} disabled={!selectedCity}>
                                <SelectTrigger><SelectValue placeholder="Select Hub" /></SelectTrigger>
                                <SelectContent>
                                    {suburbs.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 text-left">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Funding Type</Label>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                                <SelectContent>
                                    {financeCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t flex justify-center p-4">
                        <Button className="h-12 px-12 font-black uppercase text-xs tracking-widest gap-2" onClick={handleSearch} disabled={isLoading || !selectedCategory}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4" />}
                            Execute Search
                        </Button>
                    </CardFooter>
                </Card>
            </section>

            <section className="container mx-auto px-4 py-16">
                {error && (
                    <Card className="max-w-2xl mx-auto border-destructive bg-destructive/10 text-left">
                        <CardHeader className="flex flex-row items-center gap-3">
                            <AlertCircle className="h-6 w-6 text-destructive" />
                            <CardTitle className="text-destructive">Search Restricted</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-destructive-foreground font-bold">{error}</p>
                            <p className="text-xs text-muted-foreground mt-2">Upgrade to Intelligence Access to unlock unlimited daily searches across all forensic registries.</p>
                        </CardContent>
                        <CardFooter className="flex flex-wrap gap-2 pt-0">
                            <Button asChild size="sm">
                                <Link href="/checkout/intelligence">Unlock Paid Intelligence</Link>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                                <Link href="/pricing">View All Plans</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                {!hasSearched && !error ? (
                    <div className="text-center py-20 opacity-20">
                        <Banknote className="h-24 w-24 mx-auto mb-4" />
                        <p className="text-xl font-bold uppercase tracking-widest">Ready to Scan Capital Registry</p>
                    </div>
                ) : isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="font-bold text-muted-foreground uppercase tracking-widest">Mapping Capital intelligence...</p>
                    </div>
                ) : !error && (
                    <div className="max-w-6xl mx-auto space-y-8 text-left">
                        <div className="flex justify-between items-center px-4 border-l-4 border-primary text-left">
                            <div className="text-left">
                                <h2 className="text-2xl font-black flex items-center gap-2">
                                    <TableIcon className="h-6 w-6 text-primary" />
                                    Forensic Results ({results.length})
                                </h2>
                                <p className="text-xs text-muted-foreground">Vetted funding partners matching <strong>{selectedCategory}</strong>.</p>
                            </div>
                            {!isPaid && (
                                <Badge variant="secondary" className="gap-1.5 py-1.5 px-4 border border-amber-200 text-amber-700 bg-amber-50">
                                    <Lock className="h-3 w-3" /> intelligence Tier Restricted
                                </Badge>
                            )}
                        </div>

                        <Card className="border-none shadow-xl overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-900 hover:bg-slate-900">
                                    <TableRow className="hover:bg-slate-900 border-none">
                                        <TableHead className="text-white font-bold uppercase text-[10px] tracking-widest py-4">Funder Entity</TableHead>
                                        <TableHead className="text-white font-bold uppercase text-[10px] tracking-widest py-4">Location</TableHead>
                                        <TableHead className="text-white font-bold uppercase text-[10px] tracking-widest py-4">Head of Credit</TableHead>
                                        <TableHead className="text-white font-bold uppercase text-[10px] tracking-widest py-4">Forensic Contacts</TableHead>
                                        <TableHead className="text-white font-bold uppercase text-[10px] tracking-widest py-4 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {results.map((res) => (
                                        <TableRow key={res.id} className="group hover:bg-slate-50 transition-colors">
                                            <TableCell className="py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-sm text-slate-900">{res.companyName}</span>
                                                    <Badge variant="outline" className="w-fit text-[9px] h-4 mt-1 border-primary/30 text-primary uppercase">{res.entryType || 'Finance'}</Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3 shrink-0" />
                                                    <span className="truncate max-w-[150px]">{res.address || 'South Africa'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={cn("text-xs font-bold", !isPaid && "blur-sm select-none opacity-50")}>
                                                    {res.contactPerson || 'Credit Authority Verified'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className={cn("flex flex-col gap-1", !isPaid && "blur-sm select-none opacity-50")}>
                                                    <span className="text-[10px] font-mono text-primary font-bold">{res.email || 'locked@tc.co.za'}</span>
                                                    <span className="text-[10px] font-mono text-muted-foreground">{res.mobile || res.phone || '0XX XXX XXXX'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {isPaid ? (
                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button size="sm" variant="outline" className="h-8 text-[10px] font-black uppercase">Apply</Button>
                                                        <Button size="sm" variant="ghost" className="h-8 text-[10px] font-black uppercase">Profile</Button>
                                                    </div>
                                                ) : (
                                                    <Button asChild size="sm" variant="ghost" className="h-8 text-[10px] font-black uppercase text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-100">
                                                        <Link href="/pricing"><Lock className="h-3 w-3 mr-1" /> Unlock</Link>
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>

                        {!isPaid && results.length >= 10 && (
                            <Card className="bg-slate-900 text-white border-none shadow-2xl p-10 text-center max-w-2xl mx-auto">
                                <div className="bg-primary/20 p-4 rounded-full w-fit mx-auto mb-6">
                                    <Lock className="h-10 w-10 text-primary" />
                                </div>
                                <h3 className="text-3xl font-black font-headline mb-4">Complete Funder transparency</h3>
                                <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                                    You are viewing a restricted preview. To bypass data blurring and see direct contact details for over **85+ specialized lenders**, upgrade to Intelligence Access.
                                </p>
                                <Button asChild size="lg" className="h-14 px-12 text-lg font-black uppercase tracking-tight shadow-xl shadow-primary/20">
                                    <Link href="/pricing">Unlock Funder Registry <ArrowRight className="ml-2 h-5 w-5"/></Link>
                                </Button>
                            </Card>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}
