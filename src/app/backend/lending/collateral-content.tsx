
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { PlusCircle, ShieldCheck, Upload, Trash2, MoreVertical } from 'lucide-react';
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

// Dummy data structure for collateral assets
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

// Component for handling actions for a single row
function CollateralActionMenu({ asset }: { asset: any }) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isUploadSecurityOpen, setIsUploadSecurityOpen] = useState(false);
    const [isUploadTitleOpen, setIsUploadTitleOpen] = useState(false);
    const { toast } = useToast();

    const handleDelete = () => {
        // Placeholder for delete logic
        toast({ title: "Action: Delete", description: `Deleting asset ${asset.id}` });
        setIsDeleteDialogOpen(false);
    };

    return (
        <>
            <Dialog open={isUploadSecurityOpen} onOpenChange={setIsUploadSecurityOpen}>
                 <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload Security Agreement</DialogTitle>
                        <DialogDescription>Upload the security document for "{asset.assetDescription}". This feature is under construction.</DialogDescription>
                    </DialogHeader>
                     <div className="py-8 text-center text-muted-foreground">
                        <p>File upload component will be here.</p>
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={isUploadTitleOpen} onOpenChange={setIsUploadTitleOpen}>
                 <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload Title Document</DialogTitle>
                        <DialogDescription>Upload the title document (e.g., RC1) for "{asset.assetDescription}". This feature is under construction.</DialogDescription>
                    </DialogHeader>
                     <div className="py-8 text-center text-muted-foreground">
                        <p>File upload component will be here.</p>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the log for this collateral asset.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} variant="destructive">Yes, delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4"/></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setIsUploadSecurityOpen(true); }}>
                        <Upload className="mr-2 h-4 w-4"/> Upload Security Doc
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setIsUploadTitleOpen(true); }}>
                        <Upload className="mr-2 h-4 w-4"/> Upload Title Doc
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onSelect={(e) => { e.preventDefault(); setIsDeleteDialogOpen(true); }}>
                        <Trash2 className="mr-2 h-4 w-4"/> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}

// Dialog for adding a new asset
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

// Main component
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
                                <TableCell className="text-right">
                                    <CollateralActionMenu asset={asset} />
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
