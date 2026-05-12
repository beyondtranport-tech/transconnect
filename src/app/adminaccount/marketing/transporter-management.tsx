
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { Loader2, PlusCircle, Truck, Edit, Trash2, Send, Copy, MessageSquare, ClipboardList, MessageSquarePlus, CheckCircle, Upload, Search, Wand2, Filter, Mail, Download, ShieldCheck, Clock, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CommunicationLogDialog } from './CommunicationLogDialog';
import { AddCommunicationLogDialog } from './AddCommunicationLogDialog';
import { PartnerTasksDialog } from './PartnerTasksDialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { BulkImportDialog } from './BulkImportDialog';
import { enrichPartner } from '@/ai/flows/enrich-partner-flow';
import { Switch } from '@/components/ui/switch';
import { formatDateSafe } from '@/lib/utils';

// API Helper
async function performAdminAction(token: string, action: string, payload: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for action: ${action}`);
    }
    return result;
}

const partnerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  website: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
  address: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});
type PartnerFormValues = z.infer<typeof partnerSchema>;

function TransporterDialog({ open, onOpenChange, partner, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; partner?: any; onSave: () => void; }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerSchema),
  });

  useEffect(() => {
    if (open) {
      if (partner) {
        form.reset(partner);
      } else {
        form.reset({ firstName: '', lastName: '', email: '', phone: '', companyName: '', website: '', address: '', status: 'active' });
      }
    }
  }, [open, partner, form]);

  const onSubmit = async (values: PartnerFormValues) => {
    setIsLoading(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");
        
        await performAdminAction(token, 'savePartner', { partner: { id: partner?.id, ...values, type: 'transporter' } });

        toast({ title: partner ? 'Transporter Updated' : 'Transporter Added' });
        onSave();
        onOpenChange(false);
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Save Failed', description: e.message });
    } finally {
        setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>{partner ? 'Edit' : 'Add New'} Transporter</DialogTitle>
                <DialogDescription>Enter the details for the transporter.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="firstName" render={({ field }) => ( <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="lastName" render={({ field }) => ( <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email"/></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Mobile Number (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                    <FormField control={form.control} name="companyName" render={({ field }) => ( <FormItem><FormLabel>Company Name (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="website" render={({ field }) => ( <FormItem><FormLabel>Website (Optional)</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Physical Address (Optional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="status" render={({ field }) => ( <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                     <DialogFooter className="pt-4">
                        <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Save Transporter</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}

function TransporterActionMenu({ onEdit, onDelete, partner, onUpdate }: { onEdit: () => void; onDelete: () => void; partner: any; onUpdate: () => void; }) {
  return (
    <div className="flex justify-end items-center gap-1">
      <CommunicationLogDialog partnerId={partner.id} partnerName={`${partner.firstName} ${partner.lastName}`} />
      <AddCommunicationLogDialog partnerId={partner.id} onLogAdded={onUpdate} />
      <PartnerTasksDialog partner={partner} />
      <Button variant="ghost" size="icon" onClick={onEdit} title="Edit Transporter">
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete} title="Delete Transporter">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

export default function TransporterManagement() {
    const { toast } = useToast();
    const [partners, setPartners] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEnriching, setIsEnriching] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [filterMissingEmail, setFilterMissingEmail] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dialogState, setDialogState] = useState<{ type: 'add' | 'edit' | 'delete' | null, data?: any }>({ type: null, data: undefined });

    const forceRefresh = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            
            const result = await performAdminAction(token, 'getPartnersByType', { type: 'transporter' });
            const sortedData = (result.data || []).sort((a:any, b:any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setPartners(sortedData);
        } catch (e: any) {
            setError(e.message);
            toast({ variant: 'destructive', title: 'Error loading transporters', description: e.message });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);
    
    useEffect(() => {
        forceRefresh();
    }, [forceRefresh]);
    
    const handleEnrichSelected = async () => {
        if (selectedIds.length === 0) return;
        setIsEnriching(true);
        let count = 0;

        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed.");

            for (const id of selectedIds) {
                const partner = partners.find(p => p.id === id);
                if (!partner || partner.email) continue; 

                toast({ title: `Enriching ${partner.companyName || partner.firstName}...` });
                
                const enriched = await enrichPartner({ 
                    companyName: partner.companyName || `${partner.firstName} ${partner.lastName}`,
                    contactPerson: `${partner.firstName} ${partner.lastName}`
                });

                if (enriched.email || enriched.website || enriched.phone) {
                    await performAdminAction(token, 'savePartner', {
                        partner: {
                            id: partner.id,
                            ...partner,
                            email: enriched.email || partner.email,
                            website: enriched.website || partner.website,
                            phone: enriched.phone || partner.phone,
                            updatedAt: { _methodName: 'serverTimestamp' }
                        }
                    });
                    count++;
                }
            }
            toast({ title: "Enrichment Complete", description: `Updated ${count} records with new contact info.` });
            forceRefresh();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Enrichment Failed", description: e.message });
        } finally {
            setIsEnriching(false);
        }
    };

    const handleExportCSV = () => {
        const selectedPartners = partners.filter(p => selectedIds.includes(p.id));
        if (selectedPartners.length === 0) {
            toast({ variant: 'destructive', title: 'Selection Required', description: 'Please select transporters to export.' });
            return;
        }

        const headers = ["First Name", "Last Name", "Email", "Company", "Phone", "Consent Status", "Opt-in Link", "Tracking Pixel"];
        const rows = selectedPartners.map(p => [
            p.firstName,
            p.lastName,
            p.email || '',
            p.companyName || '',
            p.phone || '',
            p.consentStatus || 'pending',
            `${window.location.origin}/opt-in/${p.id}`,
            `${window.location.origin}/api/trackEmailOpen/${p.id}`
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `transporter_campaign_${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({ title: "Export Complete", description: "CSV file is ready for your mail provider." });
    };

    const filteredPartners = useMemo(() => {
        let items = partners;
        if (filterMissingEmail) {
            items = items.filter(p => !p.email);
        }
        return items;
    }, [partners, filterMissingEmail]);
    
    const handleOpenDialog = async (type: 'add' | 'edit' | 'delete' | null, data?: any) => {
        setDialogState({ type, data });
    };
    
    const handleCloseDialogs = () => {
        setDialogState({ type: null, data: undefined });
    };
    const handleSave = () => {
        forceRefresh();
        handleCloseDialogs();
    };
    const handleDelete = async () => {
        if (dialogState.type !== 'delete' || !dialogState.data) return;
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            await performAdminAction(token, 'deletePartner', { partnerId: dialogState.data.id });
            toast({ title: 'Transporter Deleted' });
            handleSave();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
        }
    };
    
    const consentColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
        pending: 'outline',
        accepted: 'default',
        declined: 'destructive',
    };

    const columns: ColumnDef<any>[] = useMemo(() => [
        { accessorKey: 'firstName', header: 'Name', cell: ({row}) => <div>{row.original.firstName} {row.original.lastName}</div> },
        { accessorKey: 'email', header: 'Email', cell: ({row}) => row.original.email || <Badge variant="destructive">Missing</Badge> },
        { accessorKey: 'companyName', header: 'Company' },
        { 
            accessorKey: 'consentStatus', 
            header: 'Consent', 
            cell: ({row}) => (
                <Badge variant={consentColors[row.original.consentStatus] || 'outline'} className="capitalize">
                    {row.original.consentStatus || 'pending'}
                </Badge>
            ) 
        },
        {
            accessorKey: 'lastOpenedAt',
            header: 'Engagement',
            cell: ({row}) => row.original.lastOpenedAt ? (
                <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                    <Eye className="h-3 w-3" />
                    Read {formatDateSafe(row.original.lastOpenedAt, "dd MMM")}
                </div>
            ) : (
                <div className="text-xs text-muted-foreground italic flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> Not read yet
                </div>
            )
        },
        { id: 'actions', header: <div className="text-right">Actions</div>, cell: ({ row }) => (
            <div className="text-right">
                <TransporterActionMenu 
                    partner={row.original} 
                    onUpdate={forceRefresh}
                    onEdit={() => handleOpenDialog('edit', row.original)} 
                    onDelete={() => handleOpenDialog('delete', row.original)} 
                />
            </div>
        ) },
    ], [forceRefresh]);
    
    return (
        <>
            <TransporterDialog 
                open={dialogState.type === 'add' || dialogState.type === 'edit'}
                onOpenChange={(isOpen) => !isOpen && handleCloseDialogs()}
                partner={dialogState.type === 'edit' ? dialogState.data : undefined}
                onSave={handleSave}
            />
            <AlertDialog open={dialogState.type === 'delete'} onOpenChange={(isOpen) => !isOpen && handleCloseDialogs()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete transporter "{dialogState.data?.firstName} {dialogState.data?.lastName}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCloseDialogs}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>Yes, delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-2xl font-bold font-headline"><Truck /> Transporter Management</CardTitle>
                        <CardDescription>Manage leads, enrich data with AI, and prepare compliant email campaigns.</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                         <BulkImportDialog type="transporter" onComplete={forceRefresh}>
                            <Button variant="outline"><Upload className="mr-2 h-4 w-4"/>Import CSV</Button>
                        </BulkImportDialog>
                        <Button onClick={() => handleOpenDialog('add')}><PlusCircle className="mr-2 h-4 w-4"/>Add Lead</Button>
                    </div>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                                <Switch id="missing-email" checked={filterMissingEmail} onCheckedChange={setFilterMissingEmail} />
                                <Label htmlFor="missing-email" className="cursor-pointer">Missing Email Only</Label>
                            </div>
                        </div>
                        {selectedIds.length > 0 && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                                <span className="text-sm font-semibold text-primary">{selectedIds.length} Selected</span>
                                <Button size="sm" variant="secondary" onClick={handleEnrichSelected} disabled={isEnriching}>
                                    {isEnriching ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4" />}
                                    Enrich (AI)
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleExportCSV}>
                                    <Download className="mr-2 h-4 w-4" /> Export for Campaign
                                </Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                        ) : (
                            <DataTable 
                                columns={columns} 
                                data={filteredPartners} 
                                onSelectionChange={setSelectedIds}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
