'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, Briefcase, FileText, Repeat } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Replicating the product data structure from the funding products page.
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
    { id: 'loans', label: 'Loans' },
    { id: 'installment-sale', label: 'Instalment Sale' },
    { id: 'rental', label: 'Leases' },
    { id: 'discounting', label: 'Factoring' },
];


export default function FacilitiesContent() {
    const [agreementType, setAgreementType] = useState<string | null>(null);
    const [productType, setProductType] = useState<string | null>(null);

    const productOptions = useMemo(() => {
        if (!agreementType) return [];
        return productsData[agreementType as keyof typeof productsData]?.items || [];
    }, [agreementType]);

    const handleAgreementChange = (value: string) => {
        setAgreementType(value);
        setProductType(null); // Reset product type when agreement changes
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Landmark /> Facilities Management
                </CardTitle>
                <CardDescription>
                    Create and manage credit facilities for clients. Start by selecting an agreement and product type.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="agreement-type">Agreement Type</Label>
                        <Select onValueChange={handleAgreementChange} value={agreementType || ''}>
                            <SelectTrigger id="agreement-type">
                                <SelectValue placeholder="Select an agreement type..." />
                            </SelectTrigger>
                            <SelectContent>
                                {agreementTypes.map(type => (
                                    <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="product-type">Product Type</Label>
                        <Select onValueChange={setProductType} value={productType || ''} disabled={!agreementType}>
                            <SelectTrigger id="product-type">
                                <SelectValue placeholder={agreementType ? "Select a product type..." : "Select agreement first"} />
                            </SelectTrigger>
                            <SelectContent>
                                {productOptions.map(product => (
                                    <SelectItem key={product.id} value={product.id}>{product.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {productType && (
                    <div className="pt-6 border-t">
                        <h3 className="text-lg font-semibold">
                            Configure Facility for: <span className="text-primary">{productOptions.find(p => p.id === productType)?.title}</span>
                        </h3>
                        <div className="mt-4 p-8 border-2 border-dashed rounded-lg text-center">
                            <p className="text-muted-foreground">Fields for this product type will appear here. Please provide your instructions.</p>
                        </div>
                    </div>
                )}

            </CardContent>
        </Card>
    );
}
