
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Landmark, Briefcase, FileText, Repeat, Loader2, PlusCircle, DollarSign, Users, ArrowRight, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);

const dummyFacilities = [
    { id: 'fac-001', clientName: 'Sample Transport Co.', partnerName: 'Global LendCo', agreementId: 'AG-101', limit: 500000, status: 'active'},
    { id: 'fac-002', clientName: 'Another Client Ltd', partnerName: 'Global LendCo', agreementId: 'AG-205', limit: 250000, status: 'active'},
];

const FacilityWizard = ({ onBack, onSaveSuccess }: { onBack: () => void, onSaveSuccess: () => void }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const firestore = useFirestore();
    const [selectedClient, setSelectedClient] = useState<any | null>(null);
    const [selectedPartner, setSelectedPartner] = useState<any | null>(null);
    const [selectedAgreement, setSelectedAgreement] = useState<string | null>(null);
    const [newFacilityLimit, setNewFacilityLimit] = useState(0);
    const { toast } = useToast();

    const clientsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'lendingClients')) : null, [firestore]);
    const { data: clients, isLoading: areClientsLoading } = useCollection(clientsQuery);

    const agreementsQuery = useMemoFirebase(() => {
        if (!firestore || !selectedClient) return null;
        return query(collection(firestore, `lendingClients/${selectedClient.id}/agreements`));
    }, [firestore, selectedClient]);
    const { data: agreements, isLoading: areAgreementsLoading } = useCollection(agreementsQuery);

    const partnersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'lendingPartners')) : null, [firestore]);
    const { data: partners, isLoading: arePartnersLoading } = useCollection(partnersQuery);
    
    const clientUsage = dummyFacilities.filter(f => f.clientName === selectedClient?.name).reduce((sum, f) => sum + f.limit, 0);
    const partnerUsage = dummyFacilities.filter(f => f.partnerName === selectedPartner?.name).reduce((sum, f) => sum + f.limit, 0);

    const isClientOverLimit = selectedClient && (clientUsage + newFacilityLimit > (selectedClient.globalFacilityLimit || 0));
    const isPartnerOverLimit = selectedPartner && (partnerUsage + newFacilityLimit > (selectedPartner.globalFacilityLimit || 0));
    
    const handleNext = () => {
        if(currentStep === 0 && !selectedClient) {
            toast({variant: 'destructive', title: 'Please select a client.'});
            return;
        }
        if(currentStep === 1 && !selectedAgreement) {
            toast({variant: 'destructive', title: 'Please select an agreement.'});
            return;
        }
        if(currentStep === 2 && !selectedPartner) {
            toast({variant: 'destructive', title: 'Please select a partner.'});
            return;
        }
        setCurrentStep(s => s + 1);
    }
    
    const steps = [
        { name: 'Select Client' },
        { name: 'Select Agreement' },
        { name: 'Select Partner' },
        { name: 'Set Limit & Review' },
    ];
    
    return (
         <div className="space-y-6">
            <h3 className="text-lg font-semibold">Create New Facility</h3>
            <div className="flex items-center gap-4">
                {steps.map((step, index) => (
                    <React.Fragment key={step.name}>
                        <div className="flex flex-col items-center">
                            <div className={cn("h-8 w-8 rounded-full flex items-center justify-center font-bold", currentStep >= index ? "bg-primary text-primary-foreground" : "bg-muted")}>{index+1}</div>
                            <p className={cn("text-xs mt-1", currentStep >= index ? "font-semibold" : "text-muted-foreground")}>{step.name}</p>
                        </div>
                        {index < steps.length - 1 && <div className={cn("flex-1 h-0.5", currentStep > index ? "bg-primary" : "bg-muted")} />}
                    </React.Fragment>
                ))}
            </div>

            <div className="pt-6">
                {currentStep === 0 && (
                    <div className="space-y-2 max-w-sm"><Label>Client</Label><Select onValueChange={(val) => setSelectedClient(clients?.find(c => c.id === val))} disabled={areClientsLoading}><SelectTrigger><SelectValue placeholder="Select a client..."/></SelectTrigger><SelectContent>{(clients || []).map((c:any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                )}
                {currentStep === 1 && (
                     <div className="space-y-2 max-w-sm"><Label>Agreement</Label><Select onValueChange={setSelectedAgreement} value={selectedAgreement || ''} disabled={!selectedClient || areAgreementsLoading}><SelectTrigger><SelectValue placeholder={areAgreementsLoading ? "Loading..." : "Select agreement..."} /></SelectTrigger><SelectContent>{(agreements || []).map((a:any) => <SelectItem key={a.id} value={a.id}>{a.id}</SelectItem>)}</SelectContent></Select></div>
                )}
                {currentStep === 2 && (
                    <div className="space-y-2 max-w-sm"><Label>Lending Partner</Label><Select onValueChange={(val) => setSelectedPartner(partners?.find(p => p.id === val))} disabled={arePartnersLoading}><SelectTrigger><SelectValue placeholder="Select partner..." /></SelectTrigger><SelectContent>{(partners || []).map((p:any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
                )}
                {currentStep === 3 && (
                    <div className="space-y-6">
                        <div className="space-y-2 max-w-sm"><Label>Facility Limit</Label><Input type="number" placeholder="R 0.00" value={newFacilityLimit} onChange={e => setNewFacilityLimit(Number(e.target.value))} /></div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                            <Card className={cn(isClientOverLimit && 'border-destructive')}><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Client Exposure</CardTitle></CardHeader><CardContent className="space-y-1 text-sm"><div className="flex justify-between"><span>Global Limit:</span><span className="font-semibold">{formatCurrency(selectedClient?.globalFacilityLimit || 0)}</span></div><div className="flex justify-between"><span>Current Usage:</span><span>{formatCurrency(clientUsage)}</span></div><div className="flex justify-between font-bold border-t pt-2 mt-2"><span>Available:</span><span>{formatCurrency((selectedClient?.globalFacilityLimit || 0) - clientUsage)}</span></div></CardContent></Card>
                            <Card className={cn(isPartnerOverLimit && 'border-destructive')}><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Partner Exposure</CardTitle></CardHeader><CardContent className="space-y-1 text-sm"><div className="flex justify-between"><span>Global Limit:</span><span className="font-semibold">{formatCurrency(selectedPartner?.globalFacilityLimit || 0)}</span></div><div className="flex justify-between"><span>Current Usage:</span><span>{formatCurrency(partnerUsage)}</span></div><div className="flex justify-between font-bold border-t pt-2 mt-2"><span>Available:</span><span>{formatCurrency((selectedPartner?.globalFacilityLimit || 0) - partnerUsage)}</span></div></CardContent></Card>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center mt-8 pt-4 border-t">
                <Button variant="outline" onClick={currentStep === 0 ? onBack : () => setCurrentStep(s => s - 1)}><ArrowLeft className="mr-2 h-4 w-4"/> Back</Button>
                {currentStep < steps.length - 1 ? (
                    <Button onClick={handleNext}>Next <ArrowRight className="mr-2 h-4 w-4"/></Button>
                ) : (
                     <Button disabled={!selectedClient || !selectedPartner || !selectedAgreement || newFacilityLimit <= 0 || isClientOverLimit || isPartnerOverLimit}>Create Facility</Button>
                )}
            </div>
        </div>
    )
}

export default function FacilitiesContent() {
    const [view, setView] = useState<'list' | 'create'>('list');
    
    const handleSaveSuccess = () => {
        setView('list');
    }
    
    if(view === 'create') {
        return <FacilityWizard onBack={() => setView('list')} onSaveSuccess={handleSaveSuccess} />;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2"><Landmark /> Facility Management</CardTitle>
                    <CardDescription>View all active facilities or create a new one.</CardDescription>
                </div>
                <Button onClick={() => setView('create')}><PlusCircle className="mr-2 h-4 w-4"/> Add Facility</Button>
            </CardHeader>
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
    );
}
