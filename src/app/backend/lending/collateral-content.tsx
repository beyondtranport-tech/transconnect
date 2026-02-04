'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { PlusCircle, ShieldCheck, Upload, Edit, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

// New dummy data structure for collateral assets
const dummyCollateralAssets = [
    { 
        id: 'asset-001', 
        assetDescription: '2022 Scania R560 (FVH123GP)', 
        client: 'Sample Transport Co.', 
        agreement: 'AG-101', 
        securityDocStatus: 'Generated',
        titleDocStatus: 'Received',
    },
    { 
        id: 'asset-002', 
        name: 'Office Property at 123 Main St', 
        assetDescription: 'Erf 456, Sandton, GP', 
        client: 'Another Client Ltd', 
        agreement: 'AG-205', 
        securityDocStatus: 'Signed In',
        titleDocStatus: 'Checked',
    },
];

const statusOptions = ["Generated", "Sent", "Received", "Checked", "Signed In"];

function AddCollateralAssetDialog() {
    const { toast } = useToast();
    const handleSave = () => {
        toast({ title: "Asset Logged", description: "The new collateral asset has been added to the register."});
    }
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Pledged Asset</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Log New Pledged Asset</DialogTitle>
                    <DialogDescription>Select the client, agreement, and describe the asset being pledged as collateral.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Client</Label>
                        <Select><SelectTrigger><SelectValue placeholder="Select a client..." /></SelectTrigger><SelectContent><SelectItem value="client-1">Sample Transport Co.</SelectItem></SelectContent></Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Agreement</Label>
                         <Select><SelectTrigger><SelectValue placeholder="Select an agreement..." /></SelectTrigger><SelectContent><SelectItem value="ag-101">AG-101</SelectItem></SelectContent></Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="asset-description">Asset Description</Label>
                        <Input id="asset-description" placeholder="e.g., 2023 Volvo FH16 (XYZ 789 GP)" />
                    </div>
                </div>
                 <DialogFooter>
                    <Button onClick={handleSave}>Save & Log Asset</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function CollateralContent() {
    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-start">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck /> Collateral Asset Register
                    </CardTitle>
                    <CardDescription>
                        Manage tangible assets (e.g., vehicles, property) pledged as collateral. Track the status of both the security agreement (like a notarial bond) and the asset's title document (like an RC1).
                    </CardDescription>
                </div>
                <AddCollateralAssetDialog />
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Asset Description</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Agreement</TableHead>
                            <TableHead>Security Agreement Status</TableHead>
                            <TableHead>Title Document Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {dummyCollateralAssets.map(asset => (
                            <TableRow key={asset.id}>
                                <TableCell className="font-medium">{asset.assetDescription}</TableCell>
                                <TableCell>{asset.client}</TableCell>
                                <TableCell className="font-mono text-xs">{asset.agreement}</TableCell>
                                <TableCell>
                                    <Select defaultValue={asset.securityDocStatus}>
                                        <SelectTrigger className="w-[150px] h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                 <TableCell>
                                    <Select defaultValue={asset.titleDocStatus}>
                                        <SelectTrigger className="w-[150px] h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell className="text-right space-x-1">
                                    <Button variant="outline" size="sm"><Upload className="mr-2 h-4 w-4"/> Agreement</Button>
                                    <Button variant="outline" size="sm"><Upload className="mr-2 h-4 w-4"/> Title Doc</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </div>
            </CardContent>
        </Card>
    );
}
