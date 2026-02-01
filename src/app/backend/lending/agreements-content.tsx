
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, FileText, Repeat, Briefcase, Handshake, Users, Truck } from "lucide-react";
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
    const [selectedAgreementType, setSelectedAgreementType] = useState<string | null>(null);

    const clientsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'lendingClients')) : null, [firestore]);
    const { data: clients, isLoading: areClientsLoading } = useCollection(clientsQuery);
    
    // Placeholder for facilities - you would fetch this based on the selected client
    const [facilities, setFacilities] = useState<any[]>([]);

    // Sample data to use when no live data is available
    const sampleClients = [{ id: 'sample-client-1', name: 'Sample Transport Co.' }];
    const sampleFacilities = [{ id: 'sample-facility-1', name: 'Approved Facility (Sample)' }];
    
    const displayClients = (clients && clients.length > 0) ? clients : sampleClients;
    const displayFacilities = (facilities.length > 0) ? facilities : sampleFacilities;

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="client-select">Select a Client</Label>
                        <Select onValueChange={setSelectedClient} value={selectedClient || ''} disabled={areClientsLoading}>
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
                        <Label htmlFor="agreement-type-select">Select an Agreement Type</Label>
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
                                <Label htmlFor="pv-first-instalment">First instalment date</Label>
                                <Input id="pv-first-instalment" type="date" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pv-instalments"># Instalments</Label>
                                <Input id="pv-instalments" type="number" placeholder="e.g., 60" />
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
                 {selectedAgreementType === 'loan-fl' && (
                    <div className="pt-6 border-t">
                        <h3 className="text-lg font-semibold mb-4">
                            Configure Agreement for: <span className="text-primary">Loan fl</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2 lg:col-span-3">
                                <Label htmlFor="fl-description">Description</Label>
                                <Input id="fl-description" placeholder="Loan purpose or description" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="fl-total-advanced">Total advanced</Label>
                                <Input id="fl-total-advanced" type="number" placeholder="R 0.00" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fl-interest-rate">Interest rate p.a. (%)</Label>
                                <Input id="fl-interest-rate" type="number" placeholder="e.g., 12.5" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="fl-create-date">Create date</Label>
                                <Input id="fl-create-date" type="date" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="fl-charge-date">Charge Capitalised(Int.) from date</Label>
                                <Input id="fl-charge-date" type="date" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fl-first-instalment">First instalment date</Label>
                                <Input id="fl-first-instalment" type="date" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="fl-instalments"># Instalments</Label>
                                <Input id="fl-instalments" type="number" placeholder="e.g., 60" />
                            </div>
                           
                            <div className="space-y-2">
                                <Label htmlFor="fl-interval">Interval</Label>
                                <Select>
                                    <SelectTrigger id="fl-interval"><SelectValue placeholder="Select interval" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="bi-monthly">Bi-monthly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="fl-payment-method">Payment method</Label>
                                 <Select>
                                    <SelectTrigger id="fl-payment-method"><SelectValue placeholder="Select method" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="debit-order">Debit Order</SelectItem>
                                        <SelectItem value="eft">EFT</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fl-bank-account">Bank account</Label>
                                <Input id="fl-bank-account" placeholder="Enter bank account details or ID" />
                            </div>
                            
                            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="fl-arrear-interest" />
                                    <Label htmlFor="fl-arrear-interest" className="text-sm font-normal">Arrear interest?</Label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {selectedAgreementType === 'installment-sale' && (
                    <div className="pt-6 border-t">
                        <h3 className="text-lg font-semibold mb-4">
                            Configure Agreement for: <span className="text-primary">Instalment Sale</span>
                        </h3>
                         <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="is-supplier">Supplier</Label>
                                    <Input id="is-supplier" placeholder="Supplier name" />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="is-description">Description</Label>
                                    <Input id="is-description" placeholder="Asset description" />
                                </div>
                            </div>
                             <div className="flex justify-end">
                                <Button asChild variant="outline">
                                    <Link href="/backend?view=lending-assets">
                                        <Truck className="mr-2 h-4 w-4" /> Add Assets
                                    </Link>
                                </Button>
                            </div>

                            <Separator />
                            
                             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="is-cash-amount">Cash amount</Label>
                                    <Input id="is-cash-amount" type="number" placeholder="R 0.00" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="is-vat-amount">Vat amount</Label>
                                    <Input id="is-vat-amount" type="number" placeholder="R 0.00" />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="is-total-inclusive">Total inclusive</Label>
                                    <Input id="is-total-inclusive" type="number" placeholder="R 0.00" disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="is-deposit">Deposit</Label>
                                    <Input id="is-deposit" type="number" placeholder="R 0.00" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                               <div className="space-y-2">
                                    <Label htmlFor="is-discount-percent">Discount %</Label>
                                    <Input id="is-discount-percent" type="number" placeholder="e.g. 5" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="is-discount-amount">Discount amount</Label>
                                    <Input id="is-discount-amount" type="number" placeholder="R 0.00" disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="is-total-advanced">Total advanced</Label>
                                    <Input id="is-total-advanced" type="number" placeholder="R 0.00" disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="is-supplier-total">Supplier total payable</Label>
                                    <Input id="is-supplier-total" type="number" placeholder="R 0.00" disabled />
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="is-interest-rate">Interest rate</Label>
                                    <Input id="is-interest-rate" type="number" placeholder="e.g. 12.5" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="is-instalments"># Instalments</Label>
                                    <Input id="is-instalments" type="number" placeholder="e.g. 60" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="is-first-instalment">First instalment date</Label>
                                    <Input id="is-first-instalment" type="date" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="is-residual">Residual value</Label>
                                    <Input id="is-residual" type="number" placeholder="R 0.00" />
                                </div>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-2">
                                    <Label htmlFor="is-payment-method">Payment method</Label>
                                     <Select>
                                        <SelectTrigger id="is-payment-method"><SelectValue placeholder="Select method" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="debit-order">Debit Order</SelectItem>
                                            <SelectItem value="eft">EFT</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="is-bank-account">Bank account</Label>
                                    <Input id="is-bank-account" placeholder="Enter bank account ID" />
                                </div>
                            </div>

                            <Separator />
                            
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="is-supplier-deposit" />
                                    <Label htmlFor="is-supplier-deposit" className="text-sm font-normal">Supplier receives deposit?</Label>
                                </div>
                                 <div className="flex items-center space-x-2">
                                    <Checkbox id="is-last-instalment-residual" />
                                    <Label htmlFor="is-last-instalment-residual" className="text-sm font-normal">Last instalment includes residual?</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="is-linked" />
                                    <Label htmlFor="is-linked" className="text-sm font-normal">Linked?</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="is-arrear-interest" />
                                    <Label htmlFor="is-arrear-interest" className="text-sm font-normal">Arrear interest?</Label>
                                </div>
                                 <div className="flex items-center space-x-2">
                                    <Checkbox id="is-payments-in-advance" />
                                    <Label htmlFor="is-payments-in-advance" className="text-sm font-normal">Payments in advance?</Label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {selectedAgreementType === 'rental' && (
                    <div className="pt-6 border-t">
                        <h3 className="text-lg font-semibold mb-4">
                            Configure Agreement for: <span className="text-primary">Lease</span>
                        </h3>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="lease-supplier">Supplier</Label>
                                    <Input id="lease-supplier" placeholder="Supplier name" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lease-description">Description</Label>
                                    <Input id="lease-description" placeholder="Asset description" />
                                </div>
                            </div>
                             <div className="flex justify-end">
                                <Button asChild variant="outline">
                                    <Link href="/backend?view=lending-assets">
                                        <Truck className="mr-2 h-4 w-4" /> Add Assets
                                    </Link>
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="lease-total-cost">Total cost</Label>
                                    <Input id="lease-total-cost" type="number" placeholder="R 0.00" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lease-initial-payment">Initial Payment</Label>
                                    <Input id="lease-initial-payment" type="number" placeholder="R 0.00" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lease-residual">Residual value</Label>
                                    <Input id="lease-residual" type="number" placeholder="R 0.00" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lease-interest-rate">Interest rate p.a.</Label>
                                    <Input id="lease-interest-rate" type="number" placeholder="e.g., 12.5" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="lease-escalation-rate">Escalation rate</Label>
                                    <Input id="lease-escalation-rate" type="number" placeholder="e.g., 5" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lease-charge-interest-from">Charge interest from</Label>
                                    <Input id="lease-charge-interest-from" type="date" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lease-first-rental-date">First rental date</Label>
                                    <Input id="lease-first-rental-date" type="date" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lease-rentals"># Rentals</Label>
                                    <Input id="lease-rentals" type="number" placeholder="e.g., 60" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="lease-payment-method">Payment method</Label>
                                    <Select>
                                        <SelectTrigger id="lease-payment-method"><SelectValue placeholder="Select method" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="debit-order">Debit Order</SelectItem>
                                            <SelectItem value="eft">EFT</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lease-bank-account">Bank account</Label>
                                    <Input id="lease-bank-account" placeholder="Enter bank account ID" />
                                </div>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="lease-last-rental-residual" />
                                    <Label htmlFor="lease-last-rental-residual" className="text-sm font-normal">Last rental includes residual?</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="lease-arrear-interest" />
                                    <Label htmlFor="lease-arrear-interest" className="text-sm font-normal">Arrear interest?</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="lease-vat" />
                                    <Label htmlFor="lease-vat" className="text-sm font-normal">Vat?</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="lease-payments-in-advance" />
                                    <Label htmlFor="lease-payments-in-advance" className="text-sm font-normal">Payments in advance?</Label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {selectedAgreementType === 'discounting' && (
                    <div className="pt-6 border-t">
                        <h3 className="text-lg font-semibold mb-4">
                            Configure Agreement for: <span className="text-primary">Factoring</span>
                        </h3>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="factoring-debtor">Debtor</Label>
                                    <Input id="factoring-debtor" placeholder="Debtor name" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="factoring-description">Description</Label>
                                    <Input id="factoring-description" placeholder="Agreement description" />
                                </div>
                            </div>
                             <div className="flex justify-end">
                                <Button asChild variant="outline">
                                    <Link href="/backend?view=lending-assets">
                                        <Truck className="mr-2 h-4 w-4" /> Add Assets
                                    </Link>
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="factoring-face-value">Face value</Label>
                                    <Input id="factoring-face-value" type="number" placeholder="R 0.00" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="factoring-total-advanced">Total advanced</Label>
                                    <Input id="factoring-total-advanced" type="number" placeholder="R 0.00" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="factoring-interest-rate">Interest rate p.a. (%)</Label>
                                    <Input id="factoring-interest-rate" type="number" placeholder="e.g. 12.5" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="factoring-discount-rate">Discount % per month</Label>
                                    <Input id="factoring-discount-rate" type="number" placeholder="e.g. 2.5" />
                                </div>
                            </div>
                             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="factoring-charge-interest-from">Charge interest from</Label>
                                    <Input id="factoring-charge-interest-from" type="date" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="factoring-discount-start">Discount start date</Label>
                                    <Input id="factoring-discount-start" type="date" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="factoring-discount-due">Discount due date</Label>
                                    <Input id="factoring-discount-due" type="date" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="factoring-discount-periods">Discount periods</Label>
                                    <Input id="factoring-discount-periods" type="number" placeholder="e.g., 3" />
                                </div>
                            </div>
                            <Separator />
                             <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="factoring-linked" />
                                    <Label htmlFor="factoring-linked" className="text-sm font-normal">Linked?</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="factoring-arrear-interest" />
                                    <Label htmlFor="factoring-arrear-interest" className="text-sm font-normal">Arrear interest?</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="factoring-vat" />
                                    <Label htmlFor="factoring-vat" className="text-sm font-normal">Vat?</Label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
