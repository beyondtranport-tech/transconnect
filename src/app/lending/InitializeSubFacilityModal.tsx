'use client';

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { Loader2, Zap, Save, Gavel, UserPlus, Building, Truck, MapPin, ShieldCheck, Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchFromAdminAPI, formatCurrency } from '@/lib/utils';
import { provinces } from '@/lib/geodata';
import { Separator } from '@/components/ui/separator';

interface InitializeSubFacilityModalProps {
    parent: any;
    clients: any[];
    onComplete: () => void;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * SHARED SUB-FACILITY TERMINAL (V18.1)
 * Partitions a Global Ceiling into specific Agreement Nodes or Member Allocations.
 * Optimized for Supplier Vetting: Make, Model, Year, Condition, and Location focus.
 */
export function InitializeSubFacilityModal({ parent, clients, onComplete, isOpen, onOpenChange }: InitializeSubFacilityModalProps) {
    const { user } = useUser();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    // Core Fields
    const [type, setType] = useState('Trucks');
    const [limit, setLimit] = useState<string>('');
    const [associatedClientId, setAssociatedClientId] = useState<string>('');

    // Supplier Vetting Variables
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [maxYear, setMaxYear] = useState('');
    const [condition, setCondition] = useState('used');
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedCity, setSelectedCity] = useState('');

    const isDebtorMode = parent?.ownerType === 'debtor';
    const isSupplierMode = parent?.ownerType === 'supplier';

    const cities = useMemo(() => {
        const prov = provinces.find(p => p.name === selectedProvince);
        return prov ? prov.cities : [];
    }, [selectedProvince]);

    const handleSave = async () => {
        if (!limit || Number(limit) <= 0) {
            toast({ variant: 'destructive', title: "Limit Required", description: "Enter a valid authorized amount." });
            return;
        }
        if (isDebtorMode && !associatedClientId) {
            toast({ variant: 'destructive', title: "Client Required", description: "Select the member client being allocated to this debtor pool." });
            return;
        }

        setIsSaving(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication node not found.");

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
                // Vetting Metadata (Supplier Hub)
                vettingParams: isSupplierMode ? {
                    make,
                    model,
                    maxYear: maxYear ? Number(maxYear) : null,
                    condition,
                    province: selectedProvince,
                    city: selectedCity
                } : null
            };

            await fetchFromAdminAPI(token, 'saveLendingFacility', { facility: payload });
            
            toast({ title: isDebtorMode ? "Client Allocation Secured" : "Agreement Facility Created" });
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
        setMake('');
        setModel('');
        setMaxYear('');
        setSelectedProvince('');
        setSelectedCity('');
    };

    if (!parent) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl text-left text-foreground overflow-hidden flex flex-col h-[90vh] p-0">
                <DialogHeader className="p-6 border-b bg-muted/30 shrink-0 text-left">
                    <DialogTitle className="flex items-center gap-2 font-black text-xl text-left">
                        {isDebtorMode ? <UserPlus className="h-6 w-6 text-primary" /> : <Gavel className="h-6 w-6 text-primary" />}
                        {isDebtorMode ? 'Partition for Member Client' : 'Initialize Agreement Facility'}
                    </DialogTitle>
                    <DialogDescription className="text-left text-foreground">
                        Partitioning a sub-limit from the global ceiling of <strong>{parent.ownerName || parent.name || 'Master Node'}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6 space-y-8 text-left text-foreground">
                    <div className="space-y-6 text-left">
                        <div className="p-4 bg-slate-900 text-white rounded-2xl flex justify-between items-center text-left">
                            <div className="text-left">
                                <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Master Ceiling Node</Label>
                                <p className="text-xl font-black text-primary">{formatCurrency(parent.limit)}</p>
                            </div>
                            <Badge variant="outline" className="border-white/20 text-white uppercase text-[9px] font-black">{parent.ownerType} Branch</Badge>
                        </div>

                        {isDebtorMode ? (
                            <div className="space-y-2 text-left">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Allocate Member Client</Label>
                                <Select value={associatedClientId} onValueChange={setAssociatedClientId}>
                                    <SelectTrigger className="h-12 border-2 bg-white font-bold text-left"><SelectValue placeholder="Choose borrower..." /></SelectTrigger>
                                    <SelectContent>
                                        {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="space-y-6 text-left text-foreground">
                                <div className="space-y-2 text-left">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1 text-left">Authorized Product Category</Label>
                                    <Select value={type} onValueChange={setType}>
                                        <SelectTrigger className="h-12 border-2 bg-white font-bold text-left text-foreground"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Trucks">Trucks</SelectItem>
                                            <SelectItem value="Trailers">Trailers</SelectItem>
                                            <SelectItem value="Bakkies">Light Commercials</SelectItem>
                                            <SelectItem value="Factoring">Factoring / Discounting</SelectItem>
                                            <SelectItem value="Working Capital">Working Capital</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {isSupplierMode && (['Trucks', 'Trailers', 'Bakkies'].includes(type)) && (
                                    <div className="p-6 border-2 border-dashed rounded-3xl bg-primary/5 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500 text-left text-foreground">
                                        <div className="flex items-center gap-2 text-left">
                                            <ShieldCheck className="h-5 w-5 text-primary" />
                                            <h4 className="text-xs font-black uppercase tracking-widest">Asset Vetting Node</h4>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4 text-left">
                                            <div className="space-y-1.5 text-left">
                                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Make Focus</Label>
                                                <Input value={make} onChange={e => setMake(e.target.value)} placeholder="e.g. Scania" className="bg-white" />
                                            </div>
                                            <div className="space-y-1.5 text-left">
                                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Model Focus</Label>
                                                <Input value={model} onChange={e => setModel(e.target.value)} placeholder="e.g. R500" className="bg-white" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-left">
                                            <div className="space-y-1.5 text-left">
                                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Max Age (Year)</Label>
                                                <Input type="number" value={maxYear} onChange={e => setMaxYear(e.target.value)} placeholder="e.g. 2018" className="bg-white" />
                                            </div>
                                            <div className="space-y-1.5 text-left">
                                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Condition Node</Label>
                                                <Select value={condition} onValueChange={setCondition}>
                                                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="new">Brand New Only</SelectItem>
                                                        <SelectItem value="used">Used / Refurbished</SelectItem>
                                                        <SelectItem value="all">Any Condition</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-2 text-left">
                                            <Label className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2 text-left"><MapPin className="h-3 w-3" /> Regional Authority Hub</Label>
                                            <div className="grid grid-cols-2 gap-4 text-left">
                                                <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                                                    <SelectTrigger className="bg-white"><SelectValue placeholder="Province" /></SelectTrigger>
                                                    <SelectContent>
                                                        {provinces.map(p => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedProvince}>
                                                    <SelectTrigger className="bg-white"><SelectValue placeholder="City / Hub" /></SelectTrigger>
                                                    <SelectContent>
                                                        {cities.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-2 text-left text-foreground">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1 text-left text-foreground">Authorized Sub-Limit (ZAR)</Label>
                            <Input 
                                type="number" 
                                value={limit} 
                                onChange={e => setLimit(e.target.value)} 
                                placeholder="e.g. 250000"
                                className="h-14 border-2 text-2xl font-black bg-white focus-visible:ring-primary"
                            />
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

// Simple ScrollArea wrapper for prototype stability
function ScrollArea({ children, className }: { children: React.ReactNode, className?: string }) {
    return <div className={cn("overflow-y-auto", className)}>{children}</div>;
}
