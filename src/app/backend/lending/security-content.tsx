'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { PlusCircle, FileSignature, Upload, Edit, Trash2 } from 'lucide-react';
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

const dummySecurityDocs = [
    { id: 'sec-001', name: 'Cession of Book Debts', client: 'Sample Transport Co.', agreement: 'AG-101', status: 'Generated', lastUpdated: '2024-07-29' },
    { id: 'sec-002', name: 'Suretyship by Directors', client: 'Another Client Ltd', agreement: 'AG-205', status: 'Signed In', lastUpdated: '2024-07-25' },
];

const statusOptions = ["Generated", "Sent", "Received", "Checked", "Signed In"];

function AddSecurityDocDialog() {
    const { toast } = useToast();
    const handleSave = () => {
        toast({ title: "Document Logged", description: "The new security document has been added to the register."});
    }
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Security Agreement</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Log New Security Agreement</DialogTitle>
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
                        <Label htmlFor="doc-name">Agreement Type</Label>
                        <Input id="doc-name" placeholder="e.g., Cession of Book Debts" />
                    </div>
                </div>
                 <DialogFooter>
                    <Button onClick={handleSave}>Save & Log Document</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function SecurityContent() {
    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-start">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <FileSignature /> Security Agreements Register
                    </CardTitle>
                    <CardDescription>
                        Track non-tangible security agreements like deeds of surety and cessions of book debt. These provide legal rights but are not tied to a specific, titled asset.
                    </CardDescription>
                </div>
                <AddSecurityDocDialog />
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Agreement Type</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Main Agreement</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Updated</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {dummySecurityDocs.map(doc => (
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
