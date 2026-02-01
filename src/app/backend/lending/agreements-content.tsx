
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Landmark, Repeat, Briefcase } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';


const productsData = {
    loans: {
        title: "Loan Products",
        icon: Landmark,
        items: [
            { id: "loan-pv-term", title: "Loan (PV) – term" },
            { id: "loan-pv-interest-only", title: "Loan (PV) - interest only" },
            { id: "loan-pv-single-payment", title: "Loan (PV) - single payment" },
            { id: "loan-fl-term-daily", title: "Loan (FL) – term daily" },
            { id: "loan-fl-term-weekly", title: "Loan (FL) term weekly" },
            { id: "loan-fl-term-bi-monthly", title: "Loan (FL) term bi-monthly" },
            { id: "loan-fl-term-monthly", title: "Loan (FL) term monthly" },
            { id: "loan-revolving-credit", title: "Loan Revolving credit" },
        ]
    },
    'installment-sale': {
        title: "Installment Sale Products",
        icon: FileText,
        items: [
            { id: "installment-sale-term", title: "Term Agreement" },
            { id: "installment-sale-balloon", title: "Balloon Payment" }
        ]
    },
    rental: {
        title: "Lease Products", // Renamed as per user request
        icon: Repeat,
        items: [
             { id: "rental-term", title: "Term Agreement" },
             { id: "rental-balloon", title: "Balloon (Residual) Agreement" }
        ]
    },
    discounting: {
        title: "Factoring Products", // Renamed as per user request
        icon: Briefcase,
        items: [
            { id: "disclosed-confirmed-factoring", title: "Disclosed confirmed factoring 75% advance" },
            { id: "disclosed-unconfirmed-factoring", title: "Disclosed un-confirmed factoring 0% advance" },
            { id: "invoice-discounting", title: "Invoice discounting 100% advance" },
            { id: "rights-discounting", title: "Rights discounting" }
        ]
    }
};

const agreementTypes = [
    { id: 'loan-pv', label: 'Loan pv' },
    { id: 'loan-fl', label: 'Loan fl' },
    { id: 'installment-sale', label: 'Instalment Sale' },
    { id: 'rental', label: 'Leases' },
    { id: 'discounting', label: 'Factoring' },
];


export default function AgreementsContent() {
    const [selectedAgreementType, setSelectedAgreementType] = useState<string | null>(null);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText /> Agreements Management
                </CardTitle>
                <CardDescription>
                    Create a new lending agreement by selecting an agreement type.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                {selectedAgreementType && (
                    <div className="pt-6 border-t">
                        <h3 className="text-lg font-semibold">
                            Configure Agreement for: <span className="text-primary">{agreementTypes.find(t => t.id === selectedAgreementType)?.label}</span>
                        </h3>
                        <div className="mt-4 p-8 border-2 border-dashed rounded-lg text-center">
                            <p className="text-muted-foreground">Fields for this agreement will be displayed here. Please provide your instructions.</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
