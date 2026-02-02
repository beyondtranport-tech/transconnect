'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, FileText, FileQuestion, Tractor, Construction } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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

                {selectedAssetType === 'motorised' && (
                    <div className="pt-6 border-t">
                        <h3 className="text-lg font-semibold mb-4">
                            Details for: <span className="text-primary">Motorised Vehicle</span>
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="vehicle-register-no">Vehicle register #</Label>
                                    <Input id="vehicle-register-no" placeholder="Vehicle Register #" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="make">Make</Label>
                                    <Input id="make" placeholder="e.g., Scania" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="model">Model</Label>
                                    <Input id="model" placeholder="e.g., R 560" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="year">Year</Label>
                                    <Input id="year" placeholder="e.g., 2022" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="vin">Vin #</Label>
                                    <Input id="vin" placeholder="Vehicle Identification Number" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="engine-no">Engine #</Label>
                                    <Input id="engine-no" placeholder="Engine Number" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="colour">Colour</Label>
                                    <Input id="colour" placeholder="e.g., White" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="quantity">Quantity</Label>
                                    <Input id="quantity" type="number" defaultValue="1" />
                                </div>
                            </div>
                            <div className="flex justify-end mt-4">
                                <Button>Save Asset</Button>
                            </div>
                        </div>
                    </div>
                )}

                {selectedAssetType === 'drawn' && (
                    <div className="pt-6 border-t">
                        <h3 className="text-lg font-semibold mb-4">
                            Details for: <span className="text-primary">Drawn Vehicle</span>
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="drawn-register-no">Vehicle register #</Label>
                                    <Input id="drawn-register-no" placeholder="Vehicle Register #" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="drawn-make">Make</Label>
                                    <Input id="drawn-make" placeholder="e.g., Henred Fruehauf" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="drawn-model">Model</Label>
                                    <Input id="drawn-model" placeholder="e.g., Tautliner" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="drawn-year">Year</Label>
                                    <Input id="drawn-year" placeholder="e.g., 2020" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="drawn-vin">Vin #</Label>
                                    <Input id="drawn-vin" placeholder="Vehicle Identification Number" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="drawn-colour">Colour</Label>
                                    <Input id="drawn-colour" placeholder="e.g., Blue" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="drawn-quantity">Quantity</Label>
                                    <Input id="drawn-quantity" type="number" defaultValue="1" />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="drawn-cost">Cost (ex. VAT)</Label>
                                    <Input id="drawn-cost" type="number" placeholder="R 0.00" />
                                </div>
                            </div>
                             <div className="flex justify-end mt-4">
                                <Button>Save Asset</Button>
                            </div>
                        </div>
                    </div>
                )}
                
                {selectedAssetType && !['motorised', 'drawn'].includes(selectedAssetType) && (
                    <div className="pt-6 border-t">
                        <h3 className="text-lg font-semibold mb-4">
                            Details for: <span className="text-primary">{assetTypes.find(t => t.id === selectedAssetType)?.label}</span>
                        </h3>
                        <div className="p-8 border-2 border-dashed rounded-lg text-center">
                            <p className="text-muted-foreground">Please specify the fields for this asset type.</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
