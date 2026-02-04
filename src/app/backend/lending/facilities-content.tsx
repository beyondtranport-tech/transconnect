
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Landmark, Briefcase, FileText, Repeat, Loader2, PlusCircle, DollarSign, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);

// Dummy data to illustrate structure
const dummyFacilities = [
    { id: 'fac-001', clientName: 'Sample Transport Co.', partnerName: 'Global LendCo', agreementId: 'AG-101', limit: 500000, status: 'active'},
    { id: 'fac-002', clientName: 'Another Client Ltd', partnerName: 'Global LendCo', agreementId: 'AG-205', limit: 250000, status: 'active'},
];

export default function FacilitiesContent() {
    const firestore = useFirestore();
    const [selectedClient, setSelectedClient] = useState<any | null>(null);
    const [selectedPartner, setSelectedPartner] = useState<any | null>(null);
    const [selectedAgreement, setSelectedAgreement] = useState<string | null>(null);
    const [newFacilityLimit, setNewFacilityLimit] = useState(0);

    const clientsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'lendingClients')) : null, [firestore]);
    const { data: clients, isLoading: areClientsLoading } = useCollection(clientsQuery);

    const agreementsQuery = useMemoFirebase(() => {
        if (!firestore || !selectedClient) return null;
        return query(collection(firestore, `lendingClients/${selectedClient.id}/agreements`));
    }, [firestore, selectedClient]);
    const { data: agreements, isLoading: areAgreementsLoading } = useCollection(agreementsQuery);

    const partnersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'lendingPartners')) : null, [firestore]);
    const { data: partners, isLoading: arePartnersLoading } = useCollection(partnersQuery);

    const handleClientChange = (clientId: string) => {
        const client = clients?.find(c => c.id === clientId);
        setSelectedClient(client || null);
        setSelectedAgreement(null); // Reset agreement when client changes
    };
    
    const handlePartnerChange = (partnerId: string) => {
        const partner = partners?.find(p => p.id === partnerId);
        setSelectedPartner(partner || null);
    };

    // Placeholder logic for usage calculation
    const clientUsage = dummyFacilities.filter(f => f.clientName === selectedClient?.name).reduce((sum, f) => sum + f.limit, 0);
    const partnerUsage = dummyFacilities.filter(f => f.partnerName === selectedPartner?.name).reduce((sum, f) => sum + f.limit, 0);

    const isClientOverLimit = selectedClient && (clientUsage + newFacilityLimit > (selectedClient.globalFacilityLimit || 0));
    const isPartnerOverLimit = selectedPartner && (partnerUsage + newFacilityLimit > (selectedPartner.globalFacilityLimit || 0));

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Landmark /> Create New Facility</CardTitle>
                    <CardDescription>Link a Client and a Lending Partner to create a new credit facility for a specific agreement.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="client-select">1. Select a Client</Label>
                            <Select onValueChange={handleClientChange} disabled={areClientsLoading}>
                                <SelectTrigger id="client-select"><SelectValue placeholder="Select a client..." /></SelectTrigger>
                                <SelectContent>{(clients || []).map(client => (<SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="agreement-select">2. Select an Agreement</Label>
                            <Select onValueChange={setSelectedAgreement} value={selectedAgreement || ''} disabled={!selectedClient || areAgreementsLoading}>
                                <SelectTrigger id="agreement-select"><SelectValue placeholder={areAgreementsLoading ? "Loading..." : "Select an agreement..."} /></SelectTrigger>
                                <SelectContent>
                                    {(agreements || []).map(agreement => (<SelectItem key={agreement.id} value={agreement.id}>{agreement.id}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="partner-select">3. Select a Lending Partner</Label>
                            <Select onValueChange={handlePartnerChange} disabled={arePartnersLoading}>
                                <SelectTrigger id="partner-select"><SelectValue placeholder="Select a partner..." /></SelectTrigger>
                                <SelectContent>{(partners || []).map(partner => (<SelectItem key={partner.id} value={partner.id}>{partner.name || 'Unnamed Partner'}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="facility-limit">4. Facility Limit</Label>
                            <Input id="facility-limit" type="number" placeholder="R 0.00" value={newFacilityLimit} onChange={e => setNewFacilityLimit(Number(e.target.value))} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                        <Card className={cn(isClientOverLimit && 'border-destructive')}>
                             <CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Users /> Client Exposure</CardTitle></CardHeader>
                             <CardContent className="space-y-1 text-sm">
                                 <div className="flex justify-between"><span>Global Limit:</span><span className="font-semibold">{formatCurrency(selectedClient?.globalFacilityLimit || 0)}</span></div>
                                 <div className="flex justify-between"><span>Current Usage:</span><span>{formatCurrency(clientUsage)}</span></div>
                                 <div className="flex justify-between font-bold border-t pt-2 mt-2"><span>Available:</span><span>{formatCurrency((selectedClient?.globalFacilityLimit || 0) - clientUsage)}</span></div>
                             </CardContent>
                        </Card>
                         <Card className={cn(isPartnerOverLimit && 'border-destructive')}>
                             <CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Briefcase /> Partner Exposure</CardTitle></CardHeader>
                             <CardContent className="space-y-1 text-sm">
                                <div className="flex justify-between"><span>Global Limit:</span><span className="font-semibold">{formatCurrency(selectedPartner?.globalFacilityLimit || 0)}</span></div>
                                <div className="flex justify-between"><span>Current Usage:</span><span>{formatCurrency(partnerUsage)}</span></div>
                                <div className="flex justify-between font-bold border-t pt-2 mt-2"><span>Available:</span><span>{formatCurrency((selectedPartner?.globalFacilityLimit || 0) - partnerUsage)}</span></div>
                             </CardContent>
                        </Card>
                    </div>

                </CardContent>
                 <CardFooter>
                    <Button disabled={!selectedClient || !selectedPartner || !selectedAgreement || newFacilityLimit <= 0 || isClientOverLimit || isPartnerOverLimit}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Create Facility
                    </Button>
                 </CardFooter>
            </Card>

             <Card>
                <CardHeader><CardTitle>Existing Facilities</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Client</TableHead><TableHead>Partner</TableHead><TableHead>Agreement ID</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Limit</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {dummyFacilities.map(fac => (
                                <TableRow key={fac.id}>
                                    <TableCell>{fac.clientName}</TableCell>
                                    <TableCell>{fac.partnerName}</TableCell>
                                    <TableCell className="font-mono text-xs">{fac.agreementId}</TableCell>
                                    <TableCell className="capitalize">{fac.status}</TableCell>
                                    <TableCell className="text-right font-semibold">{formatCurrency(fac.limit)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    );
}

    