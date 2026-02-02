
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSignature, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AcquisitionsContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileSignature /> Asset Acquisition Records
                </CardTitle>
                <CardDescription>
                    Capture the details of the invoice or purchase agreement from the entity selling the asset. This record documents the transfer of ownership.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4 max-w-3xl">
                     <div className="space-y-2">
                        <Label htmlFor="seller-name">Seller/Issuer Name</Label>
                        <Input id="seller-name" placeholder="e.g., John's Trucks (Pty) Ltd" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="seller-address">Seller/Issuer Address</Label>
                        <Textarea id="seller-address" placeholder="Enter the full address of the seller" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="invoice-number">Invoice #</Label>
                            <Input id="invoice-number" placeholder="Invoice Number" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="order-number">Order # (Optional)</Label>
                            <Input id="order-number" placeholder="Purchase Order Number" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="reference-number">Reference #</Label>
                            <Input id="reference-number" placeholder="Payment Reference" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="payment-terms">Payment Terms</Label>
                            <Input id="payment-terms" placeholder="e.g., Due on Receipt" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="due-date">Due Date</Label>
                            <Input id="due-date" type="date" />
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t">
                    <h3 className="text-lg font-semibold">Linked Assets (Line Items)</h3>
                    <div className="mt-4 p-6 border-2 border-dashed rounded-lg text-center">
                        <p className="text-muted-foreground">Assets linked to this purchase will appear here.</p>
                        <Button variant="outline" className="mt-4">
                            <PlusCircle className="mr-2 h-4 w-4" /> Link Asset
                        </Button>
                    </div>
                </div>
                 <div className="flex justify-end mt-6">
                    <Button>Save Acquisition Record</Button>
                </div>
            </CardContent>
        </Card>
    );
}
