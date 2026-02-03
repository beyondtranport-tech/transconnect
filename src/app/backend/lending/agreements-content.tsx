
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, FileText, Repeat, Briefcase, Handshake, Users, Truck, PlusCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const agreementTypes = [
    { id: 'loan-pv', label: 'Loan pv' },
    { id: 'loan-fl', label: 'Loan fl' },
    { id: 'installment-sale', label: 'Instalment Sale' },
    { id: 'rental', label: 'Leases' },
    { id: 'discounting', label: 'Factoring' },
];

export default function AgreementsContent() {
    const firestore = useFirestore();
    const [selectedClient, setSelectedClient] = useState<string | null>(null);
    const [selectedAgreement, setSelectedAgreement] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedAgreementType, setSelectedAgreementType] = useState<string | null>(null);

    const clientsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'lendingClients')) : null, [firestore]);
    const { data: clients, isLoading: areClientsLoading } = useCollection(clientsQuery);
    
    const agreementsQuery = useMemoFirebase(() => {
        if (!firestore || !selectedClient) return null;
        return query(collection(firestore, `lendingClients/${selectedClient}/agreements`));
    }, [firestore, selectedClient]);
    const { data: agreements, isLoading: areAgreementsLoading } = useCollection(agreementsQuery);

    const sampleClients = [{ id: 'sample-client-1', name: 'Sample Transport Co.' }];
    const sampleAgreements = [{ id: 'AG-101', type: 'loan-pv' }];
    
    const displayClients = (clients && clients.length > 0) ? clients : sampleClients;
    const displayAgreements = (agreements && agreements.length > 0) ? agreements : (selectedClient ? sampleAgreements : []);
    
    const handleSelectClient = (clientId: string) => {
        setSelectedClient(clientId);
        setSelectedAgreement(null);
        setIsCreating(false);
    }
    
    const handleCreateNew = () => {
        setIsCreating(true);
        setSelectedAgreement(null);
        setSelectedAgreementType(null);
    }
    
    const handleSelectAgreement = (agreementId: string) => {
        if (!agreementId) {
            setSelectedAgreement(null);
            return;
        }
        setSelectedAgreement(agreementId);
        setIsCreating(false);
        const agreement = displayAgreements.find((a: any) => a.id === agreementId);
        if (agreement) {
            setSelectedAgreementType(agreement.type);
        }
    }
    
    const selectedAgreementDetails = useMemo(() => {
        if (!selectedAgreement) return null;
        return displayAgreements.find((a: any) => a.id === selectedAgreement);
    }, [selectedAgreement, displayAgreements]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText /> Agreement Management
                </CardTitle>
                <CardDescription>
                    Create new lending agreements or manage existing ones for a client.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="client-select">1. Select a Client</Label>
                        <Select onValueChange={handleSelectClient} value={selectedClient || ''} disabled={areClientsLoading}>
                            <SelectTrigger id="client-select">
                                <SelectValue placeholder={areClientsLoading ? "Loading clients..." : "Select a client..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {displayClients.map(client => (
                                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="agreement-select">2. Manage Existing Agreement</Label>
                         <Select onValueChange={handleSelectAgreement} value={selectedAgreement || ''} disabled={!selectedClient || areAgreementsLoading}>
                            <SelectTrigger id="agreement-select">
                                <SelectValue placeholder={areAgreementsLoading ? "Loading..." : "Select an agreement..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {(displayAgreements).map((agreement: any) => (
                                    <SelectItem key={agreement.id} value={agreement.id}>{agreement.id} ({agreement.type || 'N/A'})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2 self-end">
                         <Button className="w-full" onClick={handleCreateNew} disabled={!selectedClient}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Create New Agreement
                        </Button>
                    </div>
                </div>
                
                <Separator />
                
                {selectedAgreementDetails && !isCreating && (
                     <div className="pt-6">
                        <h3 className="text-lg font-semibold mb-4">
                            Details for Agreement: <span className="font-mono text-primary">{selectedAgreementDetails.id}</span>
                        </h3>
                        <p className="text-muted-foreground">Viewing/editing form for this existing agreement will be displayed here.</p>
                        {/* The form for the selected agreement type would go here */}
                    </div>
                )}
                
                {isCreating && (
                    <div className="pt-6">
                        <h3 className="text-lg font-semibold mb-4">
                           Create New Agreement for: <span className="text-primary">{clients?.find(c => c.id === selectedClient)?.name}</span>
                        </h3>
                        <div className="max-w-sm space-y-2 mb-6">
                            <Label htmlFor="agreement-type-select">Select an Agreement Type</Label>
                            <Select onValueChange={setSelectedAgreementType} value={selectedAgreementType || ''}>
                                <SelectTrigger id="agreement-type-select"><SelectValue placeholder="Select an agreement type..." /></SelectTrigger>
                                <SelectContent>
                                    {agreementTypes.map(type => (
                                        <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedAgreementType === 'loan-pv' && (
                             <div className="pt-6 border-t">
                                <h3 className="font-semibold mb-4 text-muted-foreground">
                                    New Agreement Details: <span className="text-foreground">Loan pv</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* ... form fields from original component ... */}
                                    <div className="space-y-2 lg:col-span-3"><Label htmlFor="pv-description">Description</Label><Input id="pv-description" placeholder="Loan purpose or description" /></div>
                                    <div className="space-y-2"><Label htmlFor="pv-total-advanced">Total advanced</Label><Input id="pv-total-advanced" type="number" placeholder="R 0.00" /></div>
                                    <div className="space-y-2"><Label htmlFor="pv-interest-rate">Interest rate p.a. (%)</Label><Input id="pv-interest-rate" type="number" placeholder="e.g., 12.5" /></div>
                                    <div className="space-y-2"><Label htmlFor="pv-first-instalment">First instalment date</Label><Input id="pv-first-instalment" type="date" /></div>
                                    <div className="space-y-2"><Label htmlFor="pv-instalments"># Instalments</Label><Input id="pv-instalments" type="number" placeholder="e.g., 60" /></div>
                                    <div className="space-y-2"><Label htmlFor="pv-residual">Residual value</Label><Input id="pv-residual" type="number" placeholder="R 0.00" /></div>
                                    <div className="space-y-2"><Label htmlFor="pv-payment-method">Payment method</Label><Select><SelectTrigger id="pv-payment-method"><SelectValue placeholder="Select method" /></SelectTrigger><SelectContent><SelectItem value="debit-order">Debit Order</SelectItem><SelectItem value="eft">EFT</SelectItem></SelectContent></Select></div>
                                    <div className="space-y-2"><Label htmlFor="pv-bank-account">Bank account</Label><Input id="pv-bank-account" placeholder="Enter bank account details or ID" /></div>
                                    <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t"><div className="flex items-center space-x-2"><Checkbox id="pv-linked" /><Label htmlFor="pv-linked" className="text-sm font-normal">Linked?</Label></div><div className="flex items-center space-x-2"><Checkbox id="pv-arrear-interest" /><Label htmlFor="pv-arrear-interest" className="text-sm font-normal">Arrear interest?</Label></div><div className="flex items-center space-x-2"><Checkbox id="pv-payments-in-advance" /><Label htmlFor="pv-payments-in-advance" className="text-sm font-normal">Payments in advance?</Label></div><div className="flex items-center space-x-2"><Checkbox id="pv-last-rental-residual" /><Label htmlFor="pv-last-rental-residual" className="text-sm font-normal">Last rental includes residual?</Label></div></div>
                                </div>
                            </div>
                        )}
                        {selectedAgreementType === 'loan-fl' && (
                            <div className="pt-6 border-t">
                                <h3 className="font-semibold mb-4 text-muted-foreground">New Agreement Details: <span className="text-foreground">Loan fl</span></h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="space-y-2 lg:col-span-3"><Label htmlFor="fl-description">Description</Label><Input id="fl-description" placeholder="Loan purpose or description" /></div>
                                    <div className="space-y-2"><Label htmlFor="fl-total-advanced">Total advanced</Label><Input id="fl-total-advanced" type="number" placeholder="R 0.00" /></div>
                                    <div className="space-y-2"><Label htmlFor="fl-interest-rate">Interest rate p.a. (%)</Label><Input id="fl-interest-rate" type="number" placeholder="e.g., 12.5" /></div>
                                    <div className="space-y-2"><Label htmlFor="fl-create-date">Create date</Label><Input id="fl-create-date" type="date" /></div>
                                    <div className="space-y-2"><Label htmlFor="fl-charge-date">Charge Capitalised(Int.) from date</Label><Input id="fl-charge-date" type="date" /></div>
                                    <div className="space-y-2"><Label htmlFor="fl-first-instalment">First instalment date</Label><Input id="fl-first-instalment" type="date" /></div>
                                    <div className="space-y-2"><Label htmlFor="fl-instalments"># Instalments</Label><Input id="fl-instalments" type="number" placeholder="e.g., 60" /></div>
                                    <div className="space-y-2"><Label htmlFor="fl-interval">Interval</Label><Select><SelectTrigger id="fl-interval"><SelectValue placeholder="Select interval" /></SelectTrigger><SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="bi-monthly">Bi-monthly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent></Select></div>
                                    <div className="space-y-2"><Label htmlFor="fl-payment-method">Payment method</Label><Select><SelectTrigger id="fl-payment-method"><SelectValue placeholder="Select method" /></SelectTrigger><SelectContent><SelectItem value="debit-order">Debit Order</SelectItem><SelectItem value="eft">EFT</SelectItem></SelectContent></Select></div>
                                    <div className="space-y-2"><Label htmlFor="fl-bank-account">Bank account</Label><Input id="fl-bank-account" placeholder="Enter bank account details or ID" /></div>
                                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t"><div className="flex items-center space-x-2"><Checkbox id="fl-arrear-interest" /><Label htmlFor="fl-arrear-interest" className="text-sm font-normal">Arrear interest?</Label></div></div>
                                </div>
                            </div>
                        )}
                         {selectedAgreementType === 'installment-sale' && (
                            <div className="pt-6 border-t">
                                <h3 className="text-lg font-semibold mb-4">
                                    Configure Agreement for: <span className="text-primary">Instalment Sale</span>
                                </h3>
                                <div className="space-y-6">
                                    {/* Content removed to simplify, will be added back based on user instruction */}
                                </div>
                            </div>
                        )}
                        {selectedAgreementType === 'rental' && (
                            <div className="pt-6 border-t">
                                <h3 className="text-lg font-semibold mb-4">
                                    Configure Agreement for: <span className="text-primary">Lease</span>
                                </h3>
                                <div className="space-y-6">
                                {/* Content removed to simplify */}
                                </div>
                            </div>
                        )}
                        {selectedAgreementType === 'discounting' && (
                            <div className="pt-6 border-t">
                                <h3 className="text-lg font-semibold mb-4">
                                    Configure Agreement for: <span className="text-primary">Factoring</span>
                                </h3>
                                <div className="space-y-6">
                                    {/* Content removed to simplify */}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

    