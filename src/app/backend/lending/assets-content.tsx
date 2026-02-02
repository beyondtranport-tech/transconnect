'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, FileText, FileQuestion, Tractor, Construction } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const assetTypes = [
    { id: 'motorised', label: 'Motorised Vehicles', icon: Truck },
    { id: 'drawn', label: 'Drawn Vehicles', icon: Tractor },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'rights', label: 'Rights', icon: FileQuestion },
    { id: 'equipment', label: 'Equipment', icon: Construction },
];


export default function AssetsContent() {
    const [selectedAssetType, setSelectedAssetType] = useState<string | null>(null);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Truck /> Asset Management
                </CardTitle>
                <CardDescription>
                    Add and manage assets that are being financed. Start by selecting the type of asset.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="max-w-sm space-y-2">
                    <Label htmlFor="asset-type-select">Asset Type</Label>
                    <Select onValueChange={setSelectedAssetType} value={selectedAssetType || ''}>
                        <SelectTrigger id="asset-type-select">
                            <SelectValue placeholder="Select an asset type..." />
                        </SelectTrigger>
                        <SelectContent>
                            {assetTypes.map(type => (
                                <SelectItem key={type.id} value={type.id}>
                                    <div className="flex items-center gap-2">
                                        <type.icon className="h-4 w-4" />
                                        <span>{type.label}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* The forms for each asset type will be rendered here based on selection */}
                {selectedAssetType && (
                    <div className="pt-6 border-t">
                        <h3 className="text-lg font-semibold mb-4">
                            Details for: <span className="text-primary">{assetTypes.find(t => t.id === selectedAssetType)?.label}</span>
                        </h3>
                        {/* Placeholder for the form fields */}
                         <div className="p-8 border-2 border-dashed rounded-lg text-center">
                            <p className="text-muted-foreground">Please specify the fields for this asset type.</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
