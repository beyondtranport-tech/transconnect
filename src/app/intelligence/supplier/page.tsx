'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { provinces } from '@/lib/geodata';
import { Building2, Search, MapPin, ShieldCheck, Loader2, ArrowRight, Lock, Navigation, ShieldAlert, Sparkles, Database, Info, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useUser, getClientSideAuthToken } from '@/firebase';
import * as gtag from '@/lib/gtag';
import { cn } from '@/lib/utils';
import FleetContent from '@/app/account/fleet-content';
import NeedsContent from '@/app/account/needs-content';
import SupplierProductContent from '@/app/account/supplier-product-content';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supplierCategories } from '@/app/adminaccount/marketing/discovery-engine';

export default function SupplierIntelligencePage() {
    const { user, isUserLoading } = useUser();
    
    // Search State
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedSuburb, setSelectedSuburb] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    
    // Profile Optionality State
    const [skipProfile, setSkipProfile] = useState(false);
    
    const isPaid = user?.companyData?.membershipId && user.companyData.membershipId !== 'free';
    const isTransporter = user?.declaredPosition === 'transporter' || user?.companyData?.shopType === 'transporter';
    const isSupplier = user?.declaredPosition === 'vendor' || user?.companyData?.shopType === 'vendor';

    // Check if profile is complete
    const isProfileComplete = useMemo(() => {
        if (!user || !user.companyData) return false;
        if (isTransporter) {
            const fleet = user.companyData.fleet;
            return fleet && fleet.poweredUnits?.length > 0 && fleet.trailers?.length > 0;
        } else if (isSupplier) {
            const productProfile = user.companyData.productProfile;
            return productProfile && productProfile.categories?.length > 0 && productProfile.supportedBrands?.length > 0;
        } else {
            const needs = user.companyData.logisticsNeeds;
            return needs && needs.cargoTypes?.length > 0 && needs.routes?.length > 0;
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
                    province: selectedProvince,
                    city: selectedCity,
                    suburb: selectedSuburb,
                    category: selectedCategory
                }),
            });
            const result = await response.json();
            setResults(result.data || []);
            
            if (process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID) {
                gtag.event({
                    action: 'supplier_intelligence_search',
                    category: 'Supplier Intelligence',
                    label: `${selectedCity}_${selectedCategory}`,
                    value: result.data?.length || 0
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    if (isUserLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    // STEP 1: Not Logged In
    if (!user) {
        return (
            <div className="container mx-auto px-4 py-20 text-left">
                <Card className="max-w-2xl mx-auto shadow-2xl overflow-hidden border-none bg-slate-900 text-white">
                    <CardHeader className="p-8 pb-4 text-center">
                        <div className="bg-primary/10 p-4 rounded-full w-fit mx-auto mb-6">
                            <Lock className="h-12 w-12 text-primary" />
                        </div>
                        <CardTitle className="text-4xl font-black font-headline">Member Access Only</CardTitle>
                        <CardDescription className="text-slate-400 text-lg mt-2">The forensic supplier registry is exclusive to registered members of the ecosystem.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-4 space-y-6">
                        <div className="space-y-4 text-left">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-primary mt-1 shrink-0" />
                                <p className="text-sm text-slate-300">Access thousands of verified industrial suppliers nationwide.</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-primary mt-1 shrink-0" />
                                <p className="text-sm text-slate-300">Connect directly with owners and managing directors.</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-primary mt-1 shrink-0" />
                                <p className="text-sm text-slate-300">Filter by highly specific industrial categories and regions.</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 pt-4">
                            <Button size="lg" className="h-14 text-lg font-black uppercase tracking-tight" asChild>
                                <Link href="/join">Join for Free</Link>
                            </Button>
                            <Button variant="ghost" className="text-slate-400 hover:text-white" asChild>
                                <Link href="/signin">Already a member? Sign In</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // STEP 2: Logged in but Profile Incomplete
    if (!isProfileComplete && !skipProfile) {
        return (
            <div className="bg-slate-50 min-h-screen py-16 text-left">
                <div className="container mx-auto px-4 max-w-4xl">
                    <Card className="shadow-2xl border-none">
                        <CardHeader className="bg-slate-900 text-white rounded-t-xl p-8 text-left">
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/20 p-3 rounded-lg"><Sparkles className="h-6 w-6 text-primary" /></div>
                                <div className="text-left">
                                    <CardTitle className="text-2xl font-black font-headline text-left">Complete Your Strategic Profile</CardTitle>
                                    <CardDescription className="text-slate-400 mt-1 text-left">To ensure high-fidelity matches, we need to understand your requirements.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8 bg-white text-left">
                            <Alert className="bg-primary/5 border-primary/20">
                                <Info className="h-5 w-5 text-primary" />
                                <AlertDescription className="text-sm text-muted-foreground leading-relaxed mt-1 text-left">
                                    Our intelligence engine uses your specific fleet data or cargo needs to automatically filter the registry and deliver more accurate search data. This eliminates "empty searches" and connects you with the right capacity instantly. This data also helps us negotiate collective group discounts for your specific equipment.
                                </AlertDescription>
                            </Alert>

                            {isTransporter ? (
                                <FleetContent />
                            ) : isSupplier ? (
                                <SupplierProductContent />
                            ) : (
                                <NeedsContent />
                            )}
                            
                            <div className="flex flex-col items-center pt-8 border-t">
                                <p className="text-xs text-muted-foreground mb-4 italic">Providing this data improves your visibility and negotiation power.</p>
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

    // STEP 3: Authorized and Complete (or skipped)
    return (
        <div className="bg-slate-50 min-h-screen text-left">
            <section className="bg-slate-900 text-white py-16">
                <div className="container mx-auto px-4 text-center">
                    <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 py-1.5 px-4 text-[10px] font-black uppercase tracking-widest">Forensic Registry</Badge>
                    <h1 className="text-4xl md:text-6xl font-black font-headline">Supplier Intelligence</h1>
                    <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto text-center">Map the South African industrial landscape. Find verified suppliers based on precise categories and regional presence.</p>
                </div>
            </section>

            <section className="container mx-auto px-4 -mt-12 text-left">
                <Card className="max-w-5xl mx-auto shadow-2xl border-none">
                    <CardHeader className="bg-white rounded-t-xl border-b text-left">
                        <CardTitle className="flex items-center gap-2">
                            <Navigation className="h-5 w-5 text-primary" />
                            Specify Search Variables
                        </CardTitle>
                        <CardDescription>Select a region and industrial category to scan the master registry.</CardDescription>
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
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Industry Category</Label>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                                <SelectContent>
                                    {supplierCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
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
                {!hasSearched ? (
                    <div className="text-center py-20 opacity-20">
                        <Database className="h-24 w-24 mx-auto mb-4" />
                        <p className="text-xl font-bold uppercase tracking-widest">Ready to Scan Registry</p>
                    </div>
                ) : isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="font-bold text-muted-foreground uppercase tracking-widest">Mapping Supplier Intelligence...</p>
                    </div>
                ) : (
                    <div className="max-w-6xl mx-auto space-y-8">
                        <div className="flex justify-between items-center px-4 border-l-4 border-primary text-left">
                            <div className="text-left">
                                <h2 className="text-2xl font-black">Forensic Results ({results.length})</h2>
                                <p className="text-xs text-muted-foreground">Showing verified suppliers matching <strong>{selectedCategory}</strong> in {selectedCity || 'the selected region'}.</p>
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
                                            <Badge variant="outline" className="text-[10px] font-black uppercase border-primary text-primary">{res.entryType || 'Supplier'}</Badge>
                                            <ShieldCheck className="h-4 w-4 text-green-500" />
                                        </div>
                                        <CardTitle className="text-lg font-black group-hover:text-primary transition-colors text-left">{res.companyName}</CardTitle>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 font-medium text-left">
                                            <MapPin className="h-3 w-3" />
                                            <span className="truncate">{res.address || 'South Africa'}</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4 text-left">
                                        <div className={cn("p-4 rounded-xl border-2 border-dashed space-y-3", !isPaid ? "bg-slate-50 border-slate-200" : "bg-primary/5 border-primary/20")}>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Leadership</span>
                                                {isPaid ? <span className="font-bold">{res.contactPerson || 'Verified'}</span> : <span className="blur-sm bg-slate-300 rounded px-4 text-transparent">HIDDEN NAME</span>}
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Direct E-mail</span>
                                                {isPaid ? <span className="font-bold text-primary truncate ml-4">{res.email || 'N/A'}</span> : <span className="blur-sm bg-slate-300 rounded px-4 text-transparent">HIDDEN EMAIL</span>}
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mobile/Work</span>
                                                {isPaid ? <span className="font-bold">{res.mobile || res.phone || 'N/A'}</span> : <span className="blur-sm bg-slate-300 rounded px-4 text-transparent">HIDDEN PHONE</span>}
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-0 border-t bg-slate-50/50 flex flex-col gap-2 p-4">
                                        {!isPaid ? (
                                            <Button asChild className="w-full h-11 font-black uppercase text-xs tracking-widest" variant="secondary">
                                                <Link href="/pricing"><Lock className="h-3 w-3 mr-2" /> Unlock Contact Intelligence</Link>
                                            </Button>
                                        ) : (
                                            <div className="w-full flex gap-2 pt-2">
                                                <Button className="flex-1 font-bold text-xs" size="sm">Request Quote</Button>
                                                <Button variant="outline" className="flex-1 font-bold text-xs" size="sm">Visit Website</Button>
                                            </div>
                                        )}
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                        
                        {results.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed">
                                <p className="text-muted-foreground italic">No verified suppliers found for this specific industrial category and region match. Try a broader search.</p>
                            </div>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}

