'use client';

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { 
    Loader2, Zap, Gavel, Building, Truck, MapPin, 
    ShieldCheck, Info, CheckCircle2, ChevronRight, X, Ban, PlusCircle, Globe
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchFromAdminAPI, formatCurrency } from '@/lib/utils';
import { provinces } from '@/lib/geodata';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface InitializeSubFacilityModalProps {
    parent: any;
    clients: any[];
    onComplete: () => void;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

const standardMakes = [
    "Scania", "Volvo", "Mercedes-Benz", "MAN", "DAF", "Iveco", "UD Trucks", 
    "Isuzu", "Hino", "Freightliner", "International", "FAW", "Fuso", 
    "Powerstar", "Henred Fruehauf", "Afrit", "Top Trailer", "Kearneys"
];

const conditionOptions = [
    { id: 'new', label: 'Brand New (0km)' },
    { id: 'used', label: 'Used / Refurbished' },
    { id: 'all', label: 'Any Condition' }
];

const productTypes = [
    { id: 'Trucks', label: 'Heavy Trucks (Horses)' },
    { id: 'Trailers', label: 'Interlinks / Trailers' },
    { id: 'Bakkies', label: 'Light Commercial (Bakkies)' },
    { id: 'Factoring', label: 'Factoring / Discounting' },
    { id: 'Working Capital', label: 'Working Capital' }
];

export function InitializeSubFacilityModal({ parent, clients, onComplete, isOpen, onOpenChange }: InitializeSubFacilityModalProps) {
    const { user } = useUser();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    // Core State
    const [type, setType] = useState('Trucks');
    const [limit, setLimit] = useState<string>('');
    const [associatedClientId, setAssociatedClientId] = useState<string>('');

    // Asset Vetting State
    const [assetSelectionMode, setAssetSelectionMode] = useState<'allow_only' | 'exclude_selected'>('allow_only');
    const [makeList, setMakeList] = useState<string[]>([]);
    const [maxYear, setMaxYear] = useState('');
    const [condition, setCondition] = useState('used');

    // Geographic Vetting State
    const [geoSelectionMode, setGeoSelectionMode] = useState<'allow_only' | 'exclude_selected'>('allow_only');
    const [geoList, setGeoList] = useState<string[]>([]);
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedCity, setSelectedCity] = useState('');

    const isDebtorMode = parent?.ownerType === 'debtor';
    const isSupplierMode = parent?.ownerType === 'supplier';

    const cities = useMemo(() => {
        const prov = provinces.find(p => p.name === selectedProvince);
        return prov ? prov.cities : [];
    }, [selectedProvince]);

    // --- ASSET LIST BUILDER ---
    const handleAddMake = (val: string) => {
        if (!val || makeList.includes(val)) return;
        setMakeList(prev => [...prev, val]);
    };

    const handleRemoveMake = (val: string) => {
        setMakeList(prev => prev.filter(m => m !== val));
    };

    // --- GEO LIST BUILDER ---
    const handleAddGeoHub = () => {
        if (!selectedProvince) return;
        const hubLabel = selectedCity ? `${selectedProvince} - ${selectedCity}` : `${selectedProvince} - All Cities`;
        if (geoList.includes(hubLabel)) {
            toast({ variant: 'default', title: "Hub already added" });
            return;
        }
        setGeoList(prev => [...prev, hubLabel]);
    };

    const handleRemoveGeoHub = (label: string) => {
        setGeoList(prev => prev.filter(g => g !== label));
    };

    const handleSave = async () => {
        if (!limit || Number(limit) <= 0) {
            toast({ variant: 'destructive', title: "Limit Required", description: "Enter a valid authorized amount." });
            return;
        }

        setIsSaving(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication session expired.");

            const payload = {
                parentId: parent.id,
                ownerType: parent.ownerType || 'client',
                facilityClass: 'sub',
                clientId: isDebtorMode ? associatedClientId : (parent.clientId || null),
                debtorId: parent.debtorId || null,
                sourceDealerId: parent.sourceDealerId || null,
                type: isDebtorMode ? 'Client Allocation' : (isSupplierMode ? `Sub-Limit: ${type}` : type),
                associatedClientId: isDebtorMode ? associatedClientId : null,
                limit: Number(limit),
                status: 'active',
                createdByName: user?.displayName || 'Admin',
                vettingParams: isSupplierMode ? {
                    assetVetting: {
                        selectionMode: assetSelectionMode,
                        makeList,
                        maxAge: maxYear ? Number(maxYear) : null,
                        condition,
                    },
                    geoVetting: {
                        selectionMode: geoSelectionMode,
                        hubList: geoList
                    }
                } : null,
                createdAt: { _methodName: 'serverTimestamp' }
            };

            await fetchFromAdminAPI(token, 'saveLendingFacility', { facility: payload });
            
            toast({ title: isDebtorMode ? "Client Handshake Secured" : "Agreement Protocol Committed" });
            onComplete();
            onOpenChange(false);
            resetForm();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Commit Failed", description: e.message });
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setLimit('');
        setAssociatedClientId('');
        setMakeList([]);
        setGeoList([]);
        setMaxYear('');
        setCondition('used');
        setSelectedProvince('');
        setSelectedCity('');
        setAssetSelectionMode('allow_only');
        setGeoSelectionMode('allow_only');
    };

    if (!parent) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(o) => { if(!isSaving) onOpenChange(o); }}>
            <DialogContent className="max-w-4xl text-left text-foreground overflow-hidden flex flex-col h-[90vh] p-0">
                <DialogHeader className="p-6 border-b bg-muted/30 shrink-0 text-left">
                    <DialogTitle className="flex items-center gap-2 font-black text-xl text-left">
                        <Gavel className="h-6 w-6 text-primary" />
                        Initialize Sub-Facility Authorization
                    </DialogTitle>
                    <DialogDescription className="text-left text-foreground">
                        Partitioning a specific sub-limit for <strong>{parent.ownerName || parent.name || 'Master Node'}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6 space-y-8 text-left text-foreground">
                    <div className="space-y-10 text-left">
                        {/* Parent Context Banner */}
                        <div className="p-5 bg-slate-900 text-white rounded-3xl flex justify-between items-center text-left">
                            <div className="text-left">
                                <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Global Ceiling Node</Label>
                                <p className="text-2xl font-black text-primary">{formatCurrency(parent.limit)}</p>
                            </div>
                            <div className="text-right">
                                <Badge variant="outline" className="border-white/20 text-white uppercase text-[8px] font-black tracking-widest px-3 h-5">{parent.ownerType} Master</Badge>
                                <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase">ID: {parent.id.slice(-6)}</p>
                            </div>
                        </div>

                        {isDebtorMode ? (
                            <div className="space-y-3 text-left">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Member Client Allocation</Label>
                                <Select value={associatedClientId} onValueChange={setAssociatedClientId}>
                                    <SelectTrigger className="h-12 border-2 bg-white font-bold text-left text-foreground">
                                        <SelectValue placeholder="Choose borrower to bind to this debtor..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="space-y-12 text-left text-foreground">
                                <div className="space-y-3 text-left">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Product Category Authority</Label>
                                    <Select value={type} onValueChange={setType}>
                                        <SelectTrigger className="h-12 border-2 bg-white font-bold text-left text-foreground"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {productTypes.map(pt => <SelectItem key={pt.id} value={pt.id}>{pt.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {isSupplierMode && (['Trucks', 'Trailers', 'Bakkies'].includes(type)) && (
                                    <div className="space-y-10 text-left">
                                        {/* 1. ASSET VETTING PROTOCOL */}
                                        <div className="p-8 border-2 rounded-[2.5rem] bg-slate-50 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500 text-left">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-primary/10 p-2 rounded-lg"><Truck className="h-5 w-5 text-primary" /></div>
                                                    <h4 className="text-sm font-black uppercase tracking-widest">Asset Inclusion/Exclusion Protocol</h4>
                                                </div>
                                                <div className="flex items-center gap-3 bg-white p-1 rounded-full border shadow-sm px-4 h-10">
                                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Inclusion Only</Label>
                                                    <Switch 
                                                        checked={assetSelectionMode === 'exclude_selected'} 
                                                        onCheckedChange={(checked) => setAssetSelectionMode(checked ? 'exclude_selected' : 'allow_only')} 
                                                    />
                                                    <Label className="text-[10px] font-black uppercase text-destructive">Exclusion mode</Label>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-4 text-left">
                                                <Label className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-2",
                                                    assetSelectionMode === 'allow_only' ? "text-primary" : "text-destructive"
                                                )}>
                                                    {assetSelectionMode === 'allow_only' ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                                                    {assetSelectionMode === 'allow_only' ? 'Authorized Makes' : 'Specifically Rejected Makes'}
                                                </Label>
                                                
                                                <div className="flex gap-2 text-left">
                                                    <Select onValueChange={handleAddMake}>
                                                        <SelectTrigger className="h-11 border-2 bg-white flex-1 text-left text-foreground"><SelectValue placeholder="Add Make to List..." /></SelectTrigger>
                                                        <SelectContent>
                                                            {standardMakes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="flex flex-wrap gap-2 p-4 min-h-[60px] bg-white border-2 border-dashed rounded-2xl shadow-inner text-left">
                                                    {makeList.map(m => (
                                                        <Badge key={m} className={cn(
                                                            "h-8 gap-2 pl-3 pr-1 text-xs font-bold border-none transition-all",
                                                            assetSelectionMode === 'allow_only' ? "bg-primary text-white" : "bg-destructive text-white"
                                                        )}>
                                                            {m}
                                                            <button onClick={() => handleRemoveMake(m)} className="hover:bg-black/10 rounded-full p-0.5">
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </Badge>
                                                    ))}
                                                    {makeList.length === 0 && <p className="text-[10px] text-muted-foreground italic my-auto px-2">No makes selected.</p>}
                                                </div>
                                            </div>

                                            <Separator />

                                            <div className="grid grid-cols-2 gap-8 text-left">
                                                <div className="space-y-2 text-left">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Asset Replacement Cycle (Max Age)</Label>
                                                    <Select value={maxYear} onValueChange={setMaxYear}>
                                                        <SelectTrigger className="h-11 border-2 bg-white font-bold"><SelectValue placeholder="e.g. Max 7 Years" /></SelectTrigger>
                                                        <SelectContent>
                                                            {[3, 5, 7, 10, 15, 20].map(yr => <SelectItem key={yr} value={String(yr)}>Max {yr} Years</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2 text-left">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Standard Condition</Label>
                                                    <Select value={condition} onValueChange={setCondition}>
                                                        <SelectTrigger className="h-11 border-2 bg-white font-bold text-left text-foreground"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {conditionOptions.map(opt => <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. GEOGRAPHIC AUTHORITY NODE */}
                                        <div className="p-8 border-2 rounded-[2.5rem] bg-slate-50 space-y-8 text-left text-foreground">
                                            <div className="flex items-center justify-between text-left">
                                                <div className="flex items-center gap-3 text-left">
                                                    <div className="bg-primary/10 p-2 rounded-lg"><MapPin className="h-5 w-5 text-primary" /></div>
                                                    <h4 className="text-sm font-black uppercase tracking-widest">Geographic Authority Nodes</h4>
                                                </div>
                                                <div className="flex items-center gap-3 bg-white p-1 rounded-full border shadow-sm px-4 h-10">
                                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Inclusion Only</Label>
                                                    <Switch 
                                                        checked={geoSelectionMode === 'exclude_selected'} 
                                                        onCheckedChange={(checked) => setGeoSelectionMode(checked ? 'exclude_selected' : 'allow_only')} 
                                                    />
                                                    <Label className="text-[10px] font-black uppercase text-destructive">Exclusion mode</Label>
                                                </div>
                                            </div>

                                            <div className="space-y-4 text-left">
                                                <Label className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-2",
                                                    geoSelectionMode === 'allow_only' ? "text-primary" : "text-destructive"
                                                )}>
                                                    {geoSelectionMode === 'allow_only' ? <Globe className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                                                    {geoSelectionMode === 'allow_only' ? 'Authorized Geographic Hubs' : 'Specifically Rejected Hubs'}
                                                </Label>
                                                
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end text-left">
                                                    <div className="space-y-1.5 text-left text-foreground">
                                                        <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">1. Select Province</Label>
                                                        <Select value={selectedProvince} onValueChange={(v) => { setSelectedProvince(v); setSelectedCity(''); }}>
                                                            <SelectTrigger className="h-10 border-2 bg-white text-left text-foreground"><SelectValue placeholder="Province..." /></SelectTrigger>
                                                            <SelectContent>
                                                                {provinces.map(p => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1.5 text-left text-foreground">
                                                        <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">2. Select Hub</Label>
                                                        <div className="flex gap-2 text-left">
                                                            <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedProvince}>
                                                                <SelectTrigger className="h-10 border-2 bg-white flex-1 text-left text-foreground"><SelectValue placeholder="All Cities" /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="All Cities">All Cities</SelectItem>
                                                                    {cities.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                            <Button type="button" size="icon" className="h-10 w-10 shrink-0" onClick={handleAddGeoHub} disabled={!selectedProvince}>
                                                                <PlusCircle className="h-5 w-5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 p-4 min-h-[60px] bg-white border-2 border-dashed rounded-2xl shadow-inner text-left text-foreground">
                                                    {geoList.map(hub => (
                                                        <Badge key={hub} className={cn(
                                                            "h-8 gap-2 pl-3 pr-1 text-xs font-bold border-none transition-all",
                                                            geoSelectionMode === 'allow_only' ? "bg-primary text-white" : "bg-destructive text-white"
                                                        )}>
                                                            {hub}
                                                            <button onClick={() => handleRemoveGeoHub(hub)} className="hover:bg-black/10 rounded-full p-0.5">
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </Badge>
                                                    ))}
                                                    {geoList.length === 0 && <p className="text-[10px] text-muted-foreground italic my-auto px-2">No geographic hubs defined. {geoSelectionMode === 'allow_only' ? 'Authorized everywhere.' : 'Zero exclusions.'}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-3 p-8 bg-primary/5 border-2 border-primary/20 rounded-[2.5rem] text-left text-foreground">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1 text-left">Authorized Yield Ceiling (ZAR)</Label>
                            <Input 
                                type="number" 
                                value={limit} 
                                onChange={e => setLimit(e.target.value)} 
                                placeholder="0.00"
                                className="h-16 border-none bg-transparent text-5xl font-black focus-visible:ring-0 p-0"
                            />
                            <p className="text-[11px] text-muted-foreground font-medium italic mt-2 text-left">This partition will be deducted from the parent global ceiling.</p>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="bg-slate-50 p-6 border-t shrink-0 text-left">
                    <Button onClick={handleSave} disabled={isSaving} className="w-full h-14 font-black uppercase tracking-widest shadow-xl text-lg text-white">
                        {isSaving ? <Loader2 className="animate-spin h-6 w-6 mr-2" /> : <Zap className="h-6 w-6 mr-2 fill-current" />}
                        {isDebtorMode ? 'Bind Client to Debtor' : 'Commit Authorization Node'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
