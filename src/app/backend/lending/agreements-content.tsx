'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Landmark, Repeat, Briefcase } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';


const agreementTypes = [
    { id: 'loans', label: 'Loans' },
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
                            Create Agreement for: <span className="text-primary">{agreementTypes.find(t => t.id === selectedAgreementType)?.label}</span>
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
