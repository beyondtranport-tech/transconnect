
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
    { id: 'sec-001', name: 'Cession of Book Debts', client: 'Sample Transport Co.', agreement: 'AG-101', status: 'Generated', lastUpdated: '2024-07-29' },
    { id: 'sec-002', name: 'Suretyship by Directors', client: 'Another Client Ltd', agreement: 'AG-205', status: 'Signed In', lastUpdated: '2024-07-25' },
    { id: 'sec-003', name: 'General Notarial Bond', client: 'Fast Freight Inc.', agreement: 'AG-301', status: 'Sent', lastUpdated: '2024-07-30' },
    { id: 'sec-004', name: 'Pledge and Cession', client: 'Bulk Movers', agreement: 'AG-404', status: 'Received', lastUpdated: '2024-07-28' },
];

const statusOptions = ["Generated", "Sent", "Received", "Checked", "Signed In"];

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  Generated: 'secondary',
  Sent: 'outline',
  Received: 'default',
  Checked: 'default',
  'Signed In': 'default',
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

function EditSecurityDialog({ doc, isOpen, onOpenChange }: { doc: any; isOpen: boolean; onOpenChange: (open: boolean) => void; }) {
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
    const [dialogState, setDialogState] = useState<{ type: 'edit' | 'confirm' | 'unconfirm' | 'delete' | null, doc: any | null }>({ type: null, doc: null });

    const handleOpenDialog = (type: 'edit' | 'confirm' | 'unconfirm' | 'delete', doc: any) => {
        setDialogState({ type, doc });
    };

    const handleCloseDialogs = useCallback(() => {
        setDialogState({ type: null, doc: null });
    }, []);

    const handleConfirmAction = () => {
        // Placeholder for future API calls
        console.log(`Performing action: ${dialogState.type} on doc: ${dialogState.doc?.id}`);
        toast({ title: "Action Confirmed (Demo)", description: `The '${dialogState.type}' action was completed.` });
        handleCloseDialogs();
    };

    const getAlertStrings = () => {
        if (!dialogState.doc) return { title: 'Are you sure?', description: '' };
        switch (dialogState.type) {
            case 'confirm': return { title: `Confirm Document?`, description: `Mark "${dialogState.doc.name}" as confirmed?` };
            case 'unconfirm': return { title: `Unconfirm Document?`, description: `Revert "${dialogState.doc.name}" to a pending state?` };
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

            <AlertDialog open={['confirm', 'unconfirm', 'delete'].includes(dialogState.type || '')} onOpenChange={(open) => !open && handleCloseDialogs()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{getAlertStrings().title}</AlertDialogTitle>
                        <AlertDialogDescription>{getAlertStrings().description}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCloseDialogs}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmAction} variant={dialogState.type === 'delete' ? 'destructive' : 'default'}>
                            Yes, Proceed
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
                                        <Badge variant={statusColors[doc.status] || 'secondary'} className="capitalize">
                                            {doc.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{doc.lastUpdated}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={isProcessing}>
                                                    <MoreVertical className="h-4 w-4"/>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem disabled><View className="mr-2"/>View Details</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleOpenDialog('edit', doc)}>
                                                    <Edit className="mr-2"/>Edit / Manage Docs
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onSelect={() => handleOpenDialog('confirm', doc)}><CheckCircle className="mr-2"/>Confirm</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleOpenDialog('unconfirm', doc)}><XCircle className="mr-2"/>Unconfirm</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onSelect={() => handleOpenDialog('delete', doc)} className="text-destructive">
                                                    <Trash2 className="mr-2"/>Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
