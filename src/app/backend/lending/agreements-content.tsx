
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';


const agreementTypes = [
    { id: 'loan-pv', label: 'Loan pv' },
    { id: 'loan-fl', label: 'Loan fl' },
    { id: 'installment-sale', label: 'Instalment Sale' },
    { id: 'rental', label: 'Leases' },
    { id: 'discounting', label: 'Factoring' },
];

export default function AgreementsContent() {
    const firestore = useFirestore();
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [selectedAgreementType, setSelectedAgreementType] = useState<string | null>(null);

    const clientsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'lendingClients')) : null, [firestore]);
    const { data: clients } = useCollection(clientsQuery);

    const facilitiesQuery = useMemoFirebase(() => {
        if (!firestore || !selectedClientId) return null;
        return query(collection(firestore, `lendingClients/${selectedClientId}/facilities`));
    }, [firestore, selectedClientId]);
    const { data: facilities } = useCollection(facilitiesQuery);

    const displayClients = clients?.length ? clients : [{ id: 'sample-client', name: 'Sample Client (No real clients found)' }];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText /> Agreement Management
                </CardTitle>
                <CardDescription>
                    Create a new lending agreement by selecting a client and an approved facility.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="client-select">Select a Client</Label>
                        <Select onValueChange={setSelectedClientId} value={selectedClientId || ''}>
                            <SelectTrigger id="client-select">
                                <SelectValue placeholder="Select a client..." />
                            </SelectTrigger>
                            <SelectContent>
                                {displayClients.map(client => (
                                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="agreement-type-select">Select Agreement Type</Label>
                        <Select onValueChange={setSelectedAgreementType} value={selectedAgreementType || ''}>
                            <SelectTrigger id="agreement-type-select">
                                <SelectValue placeholder="Select an agreement type..." />
                            </SelectTrigger>
                            <SelectContent>
                                {agreementTypes.map(type => (
                                    <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {selectedAgreementType === 'loan-pv' && (
                    <div className="pt-6 border-t">
                        <h3 className="text-lg font-semibold mb-4">
                            Configure Agreement for: <span className="text-primary">Loan pv</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2 lg:col-span-3">
                                <Label htmlFor="pv-description">Description</Label>
                                <Input id="pv-description" placeholder="Loan purpose or description" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pv-total-advanced">Total advanced</Label>
                                <Input id="pv-total-advanced" type="number" placeholder="R 0.00" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pv-interest-rate">Interest rate p.a. (%)</Label>
                                <Input id="pv-interest-rate" type="number" placeholder="e.g., 12.5" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pv-instalments"># Instalments</Label>
                                <Input id="pv-instalments" type="number" placeholder="e.g., 60" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pv-first-instalment">First instalment date</Label>
                                <Input id="pv-first-instalment" type="date" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pv-residual">Residual value</Label>
                                <Input id="pv-residual" type="number" placeholder="R 0.00" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="pv-payment-method">Payment method</Label>
                                 <Select>
                                    <SelectTrigger id="pv-payment-method"><SelectValue placeholder="Select method" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="debit-order">Debit Order</SelectItem>
                                        <SelectItem value="eft">EFT</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pv-bank-account">Bank account</Label>
                                <Input id="pv-bank-account" placeholder="Enter bank account details or ID" />
                            </div>
                            
                             <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="pv-linked" />
                                    <Label htmlFor="pv-linked" className="text-sm font-normal">Linked?</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="pv-arrear-interest" />
                                    <Label htmlFor="pv-arrear-interest" className="text-sm font-normal">Arrear interest?</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="pv-payments-in-advance" />
                                    <Label htmlFor="pv-payments-in-advance" className="text-sm font-normal">Payments in advance?</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="pv-last-rental-residual" />
                                    <Label htmlFor="pv-last-rental-residual" className="text-sm font-normal">Last rental includes residual?</Label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {selectedAgreementType && selectedAgreementType !== 'loan-pv' && (
                     <div className="pt-6 border-t">
                         <h3 className="text-lg font-semibold">
                             Configure Agreement for: <span className="text-primary">{agreementTypes.find(t => t.id === selectedAgreementType)?.label}</span>
                         </h3>
                         <div className="mt-4 p-8 border-2 border-dashed rounded-lg text-center">
                             <p className="text-muted-foreground">Please provide the fields for this agreement type.</p>
                         </div>
                     </div>
                )}
            </CardContent>
        </Card>
    );
}
