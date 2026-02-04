
'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { PlusCircle, FileSignature, Upload, Edit, Trash2, MoreVertical, View, CheckCircle, XCircle, Loader2 } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const dummySecurityDocs = [
    { id: 'sec-001', name: 'Cession of Book Debts', client: 'Sample Transport Co.', agreement: 'AG-101', docStatus: 'Generated', recordStatus: 'Unconfirmed', lastUpdated: '2024-07-29' },
    { id: 'sec-002', name: 'Suretyship by Directors', client: 'Another Client Ltd', agreement: 'AG-205', docStatus: 'Signed In', recordStatus: 'Confirmed', lastUpdated: '2024-07-25' },
    { id: 'sec-003', name: 'General Notarial Bond', client: 'Fast Freight Inc.', agreement: 'AG-301', docStatus: 'Sent', recordStatus: 'Unconfirmed', lastUpdated: '2024-07-30' },
    { id: 'sec-004', name: 'Pledge and Cession', client: 'Bulk Movers', agreement: 'AG-404', docStatus: 'Received', recordStatus: 'Confirmed', lastUpdated: '2024-07-28' },
];

const docStatusOptions = ["Generated", "Sent", "Received", "Checked", "Signed In"];

const recordStatusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  Confirmed: 'default',
  Unconfirmed: 'secondary',
};

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

function EditSecurityDialog({ doc, isOpen, onOpenChange }: { doc: any | null; isOpen: boolean; onOpenChange: (open: boolean) => void; }) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        {doc ? (
            <>
                <DialogHeader>
                <DialogTitle>Manage Document: {doc.name}</DialogTitle>
                <DialogDescription>
                    This is where you will generate, upload, and manage the PDF documents for this security agreement. This functionality is under construction.
                </DialogDescription>
                </DialogHeader>
                <div className="py-8 text-center text-muted-foreground">
                    <p>Document generation and upload interface will be here.</p>
                </div>
                <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </>
        ) : (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


export default function SecurityContent() {
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    
    // A single state object to control all dialogs and their data.
    const [dialogState, setDialogState] = useState<{
        type: 'edit' | 'confirm' | null;
        doc: any | null;
        confirmAction?: 'confirm' | 'unconfirm' | 'delete';
    }>({ type: null, doc: null });

    // Single entry point to open any dialog.
    const handleOpenDialog = (type: 'edit' | 'confirm', doc: any, confirmAction?: 'confirm' | 'unconfirm' | 'delete') => {
        setDialogState({ type, doc, confirmAction });
    };

    // Single function to close all dialogs and reset state.
    const handleCloseDialogs = useCallback(() => {
        setDialogState({ type: null, doc: null, confirmAction: undefined });
    }, []);

    // Single confirmation handler.
    const handleConfirmAction = () => {
        if (!dialogState.confirmAction || !dialogState.doc) return;
        
        setIsProcessing(true);
        // Simulate API call
        setTimeout(() => {
            console.log(`Performing action: ${dialogState.confirmAction} on doc: ${dialogState.doc.id}`);
            toast({ title: "Action Confirmed (Demo)", description: `The '${dialogState.confirmAction}' action was completed.` });
            setIsProcessing(false);
            handleCloseDialogs(); // Close and reset state
            // In a real app, you would refetch data here.
        }, 1000);
    };

    // Helper to get text for the confirmation dialog.
    const getAlertStrings = () => {
        if (!dialogState.doc) return { title: 'Are you sure?', description: '' };
        switch (dialogState.confirmAction) {
            case 'confirm': return { title: `Confirm Document?`, description: `Mark "${dialogState.doc.name}" as confirmed? This may lock the record.` };
            case 'unconfirm': return { title: `Unconfirm Document?`, description: `Revert "${dialogState.doc.name}" to an unconfirmed state, making it editable.` };
            case 'delete': return { title: `Delete Document?`, description: `This will permanently delete the log for "${dialogState.doc.name}".` };
            default: return { title: "Are you sure?", description: "" };
        }
    };

    return (
        <>
            <EditSecurityDialog
                doc={dialogState.doc}
                isOpen={dialogState.type === 'edit'}
                onOpenChange={(open) => !open && handleCloseDialogs()}
            />

            <AlertDialog open={dialogState.type === 'confirm'} onOpenChange={(open) => !open && handleCloseDialogs()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{getAlertStrings().title}</AlertDialogTitle>
                        <AlertDialogDescription>{getAlertStrings().description}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCloseDialogs} disabled={isProcessing}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmAction} variant={dialogState.confirmAction === 'delete' ? 'destructive' : 'default'} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : "Yes, Proceed"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Card>
                <CardHeader className="flex flex-row justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <FileSignature /> Security Agreements Register
                        </CardTitle>
                        <CardDescription>
                            Track non-tangible security agreements like deeds of surety and cessions of book debt.
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
                                <TableHead>Record Status</TableHead>
                                <TableHead>Doc Status</TableHead>
                                <TableHead>Last Updated</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dummySecurityDocs.map(doc => {
                                const isLocked = doc.recordStatus === 'Confirmed';
                                return (
                                <TableRow key={doc.id}>
                                    <TableCell className="font-medium">{doc.name}</TableCell>
                                    <TableCell>{doc.client}</TableCell>
                                    <TableCell className="font-mono text-xs">{doc.agreement}</TableCell>
                                    <TableCell>
                                        <Badge variant={recordStatusColors[doc.recordStatus] || 'secondary'} className="capitalize">
                                            {doc.recordStatus}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Select defaultValue={doc.docStatus} disabled={isLocked}>
                                            <SelectTrigger className="w-[150px] h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {docStatusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>{doc.lastUpdated}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4"/>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleOpenDialog('edit', doc); }}>
                                                    <Edit className="mr-2"/>Edit / Manage Docs
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onSelect={() => handleOpenDialog('confirm', doc, 'confirm')} disabled={isLocked}>
                                                    <CheckCircle className="mr-2"/>Confirm
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleOpenDialog('confirm', doc, 'unconfirm')} disabled={!isLocked}>
                                                    <XCircle className="mr-2"/>Unconfirm
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onSelect={() => handleOpenDialog('confirm', doc, 'delete')} className="text-destructive">
                                                    <Trash2 className="mr-2"/>Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
