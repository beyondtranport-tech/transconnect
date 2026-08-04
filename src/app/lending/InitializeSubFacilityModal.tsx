'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { Loader2, Zap, Save, Gavel, UserPlus, Building } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchFromAdminAPI, formatCurrency } from '@/lib/utils';

interface InitializeSubFacilityModalProps {
    parent: any;
    clients: any[];
    onComplete: () => void;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * SHARED SUB-FACILITY TERMINAL
 * Partitions a Global Ceiling into specific Agreement Nodes or Member Allocations.
 */
export function InitializeSubFacilityModal({ parent, clients, onComplete, isOpen, onOpenChange }: InitializeSubFacilityModalProps) {
    const { user } = useUser();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [type, setType] = useState('factoring');
    const [associatedClientId, setAssociatedClientId] = useState<string>('');
    const [limit, setLimit] = useState<string>('');

    const isDebtorMode = parent?.ownerType === 'debtor';
    const isSupplierMode = parent?.ownerType === 'supplier';

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
                createdByName: user?.displayName || 'Admin'
            };

            await fetchFromAdminAPI(token, 'saveLendingFacility', { facility: payload });
            
            toast({ title: isDebtorMode ? "Client Allocation Secured" : "Agreement Facility Created" });
            onComplete();
            onOpenChange(false);
            setLimit('');
            setAssociatedClientId('');
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Commit Failed", description: e.message });
        } finally {
            setIsSaving(false);
        }
    };

    if (!parent) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md text-left text-foreground">
                <DialogHeader className="text-left">
                    <DialogTitle className="flex items-center gap-2 font-black">
                        {isDebtorMode ? <UserPlus className="h-5 w-5 text-primary" /> : <Gavel className="h-5 w-5 text-primary" />}
                        {isDebtorMode ? 'Partition for Member Client' : 'Initialize Agreement Facility'}
                    </DialogTitle>
                    <DialogDescription className="text-left text-foreground">
                        Partitioning a sub-limit from the global ceiling of <strong>{parent.ownerName || parent.name || 'Master Node'}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-6 text-left">
                    <div className="space-y-2 text-left">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Master Ceiling</Label>
                        <p className="px-4 py-3 bg-muted/30 rounded-xl border border-dashed font-bold text-sm">{formatCurrency(parent.limit)}</p>
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
                        <div className="space-y-2 text-left">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Authorized Asset / Product</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger className="h-12 border-2 bg-white font-bold text-left"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Trucks">Trucks</SelectItem>
                                    <SelectItem value="Trailers">Trailers</SelectItem>
                                    <SelectItem value="Bakkies">Light Commercials</SelectItem>
                                    <SelectItem value="Factoring">Factoring / Discounting</SelectItem>
                                    <SelectItem value="Working Capital">Working Capital</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2 text-left">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Authorized Sub-Limit (ZAR)</Label>
                        <Input 
                            type="number" 
                            value={limit} 
                            onChange={e => setLimit(e.target.value)} 
                            placeholder="e.g. 250000"
                            className="h-12 border-2 text-xl font-black bg-white"
                        />
                    </div>
                </div>

                <DialogFooter className="bg-slate-50 p-6 -mx-6 -mb-6 border-t rounded-b-lg">
                    <Button onClick={handleSave} disabled={isSaving} className="w-full h-12 font-black uppercase shadow-lg text-white">
                        {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        {isDebtorMode ? 'Bind Client to Debtor' : 'Commit Sub-Node'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
