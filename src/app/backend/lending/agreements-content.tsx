'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2, AlertCircle, Landmark, Repeat, Briefcase } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// --- Data copied from facilities-content.tsx for development purposes ---
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
        title: "Lease Products",
        icon: Repeat,
        items: [
             { id: "rental-term", title: "Term Agreement" },
             { id: "rental-balloon", title: "Balloon (Residual) Agreement" }
        ]
    },
    discounting: {
        title: "Factoring Products",
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
// --- End of copied data ---

export default function AgreementsContent() {
    const [selectedAgreementType, setSelectedAgreementType] = useState<string | null>(null);
    const [selectedProductType, setSelectedProductType] = useState<string | null>(null);
    
    const productOptions = useMemo(() => {
        if (!selectedAgreementType) return [];
        return productsData[selectedAgreementType as keyof typeof productsData]?.items || [];
    }, [selectedAgreementType]);

    const handleAgreementChange = (agreementId: string) => {
        setSelectedAgreementType(agreementId);
        setSelectedProductType(null); // Reset product selection
    };
    
    const selectedProduct = useMemo(() => {
        if (!selectedProductType || !productOptions) return null;
        return productOptions.find(p => p.id === selectedProductType);
    }, [selectedProductType, productOptions]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText /> Agreements Management
                </CardTitle>
                <CardDescription>
                    Create a new lending agreement by selecting an agreement and product type.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="agreement-type-select">Select Agreement Type</Label>
                        <Select onValueChange={handleAgreementChange} value={selectedAgreementType || ''}>
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
                    <div className="space-y-2">
                        <Label htmlFor="product-select">Select a Product</Label>
                        <Select onValueChange={setSelectedProductType} value={selectedProductType || ''} disabled={!selectedAgreementType}>
                            <SelectTrigger id="product-select">
                                <SelectValue placeholder={!selectedAgreementType ? "Select an agreement first" : "Select a product..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {productOptions.length > 0 ? (
                                    productOptions.map(product => (
                                        <SelectItem key={product.id} value={product.id}>
                                            {product.title}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="none" disabled>No products for this type</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {selectedProduct && (
                    <div className="pt-6 border-t">
                        <h3 className="text-lg font-semibold">
                            Create Agreement for: <span className="text-primary">{selectedProduct.title}</span>
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
