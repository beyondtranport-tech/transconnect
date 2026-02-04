
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { PlusCircle, ShieldCheck, Upload, Edit, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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

const dummyCollateralDocs = [
    { id: 'col-001', name: 'Vehicle RC1 Document', client: 'Sample Transport Co.', agreement: 'AG-101', status: 'Received', lastUpdated: '2024-07-28' },
    { id: 'col-002', name: 'Property Title Deed', client: 'Another Client Ltd', agreement: 'AG-205', status: 'Checked', lastUpdated: '2024-07-26' },
];

const statusOptions = ["Generated", "Sent", "Received", "Checked", "Signed In"];

function AddCollateralDocDialog() {
    const { toast } = useToast();
    const handleSave = () => {
        toast({ title: "Document Logged", description: "The new collateral document has been added to the register."});
    }
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Collateral Document</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Log New Collateral Document</DialogTitle>
                    <DialogDescription>Select the client and agreement this document is for.</DialogDescription>
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
                        <Label htmlFor="doc-name">Document Name</Label>
                        <Input id="doc-name" placeholder="e.g., Vehicle RC1" />
                    </div>
                </div>
                 <DialogFooter>
                    <Button onClick={handleSave}>Save & Log Document</Button>
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
                        <ShieldCheck /> Collateral Management
                    </CardTitle>
                    <CardDescription>
                        Track the status and manage documents for collateral agreements.
                    </CardDescription>
                </div>
                <AddCollateralDocDialog />
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Document Name</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Agreement</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Updated</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {dummyCollateralDocs.map(doc => (
                            <TableRow key={doc.id}>
                                <TableCell className="font-medium">{doc.name}</TableCell>
                                <TableCell>{doc.client}</TableCell>
                                <TableCell className="font-mono text-xs">{doc.agreement}</TableCell>
                                <TableCell>
                                    <Select defaultValue={doc.status}>
                                        <SelectTrigger className="w-[150px] h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>{doc.lastUpdated}</TableCell>
                                <TableCell className="text-right space-x-1">
                                    <Button variant="outline" size="sm"><Upload className="mr-2 h-4 w-4"/> Attach PDF</Button>
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
