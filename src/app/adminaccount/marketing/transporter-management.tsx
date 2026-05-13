'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { Loader2, PlusCircle, Truck, Edit, Trash2, Send, Copy, MessageSquare, ClipboardList, MessageSquarePlus, CheckCircle, Upload, Search, Wand2, Filter, Mail, Download, ShieldCheck, Clock, Eye, ListPlus } from 'lucide-react';
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
  assigneeId: z.string().optional(),
});
type PartnerFormValues = z.infer<typeof partnerSchema>;

const onboardingSchema = z.object({
    followUpDate: z.string().min(1, "Follow-up date is required."),
    assigneeId: z.string().min(1, "Please assign the task."),
    followUpType: z.string().min(1, "Select follow-up method."),
    notes: z.string().optional(),
});
type OnboardingFormValues = z.infer<typeof onboardingSchema>;

async function fetchAdmins(token: string) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'listAllUsers' }),
    });
    const result = await response.json();
    return result.success ? result.data : [];
}

// Internal reusable dialog for adding/editing single partners
function TransporterFormDialog({ open, onOpenChange, partner, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; partner?: any; onSave: () => void; }) {
  const [isLoading, setIsLoading] = useState(false);
  const [admins, setAdmins] = useState<any[]>([]);
  const { toast } = useToast();

  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerSchema),
  });

  useEffect(() => {
    if (open) {
      getClientSideAuthToken().then(token => {
          if (token) fetchAdmins(token).then(setAdmins);
      });
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
                    <FormField control={form.control} name="assigneeId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Assign To (Staff Owner)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select staff member..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {admins.map(admin => <SelectItem key={admin.uid} value={admin.uid}>{admin.displayName || admin.email}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
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

// Onboarding Wizard for inviting partners
function OnboardWizardDialog({ partner, open, onOpenChange, onComplete }: { partner: any, open: boolean, onOpenChange: (open: boolean) => void, onComplete: () => void }) {
    const { user } = useUser();
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [admins, setAdmins] = useState<any[]>([]);

    const form = useForm<OnboardingFormValues>({
        resolver: zodResolver(onboardingSchema),
        defaultValues: { assigneeId: partner?.assigneeId || user?.uid, followUpType: 'Call' }
    });

    useEffect(() => {
        if (open) {
            setStep(1);
            setInviteLink('');
            getClientSideAuthToken().then(token => {
                if (token) fetchAdmins(token).then(setAdmins);
            });
        }
    }, [open, partner]);

    const handleOnboard = async (values: OnboardingFormValues) => {
        if (!partner) return;
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth token missing.");

            const payload = {
                partnerId: partner.id,
                followUpTask: {
                    dueDate: values.followUpDate,
                    assigneeId: values.assigneeId,
                    title: `${values.followUpType}: ${partner.companyName || partner.firstName}`,
                    description: values.notes || 'Scheduled during invitation wizard.'
                }
            };

            await performAdminAction(token, 'invitePartner', payload);

            const baseUrl = window.location.origin;
            setInviteLink(`${baseUrl}/join?email=${encodeURIComponent(partner.email)}&firstName=${encodeURIComponent(partner.firstName)}&lastName=${encodeURIComponent(partner.lastName)}`);
            
            toast({ title: "Invitation Processed", description: "Invite logged and follow-up task created." });
            setStep(2);
            onComplete();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Onboarding Failed", description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        toast({ title: "Link Copied" });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{step === 1 ? `Onboard ${partner?.firstName || ''}` : 'Invitation Ready'}</DialogTitle>
                    <DialogDescription>
                        {step === 1 
                            ? "Complete the invite process and schedule your next CRM action." 
                            : "The outreach is logged. Send the link to the transporter now."}
                    </DialogDescription>
                </DialogHeader>

                {step === 1 ? (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleOnboard)} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="followUpType" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Follow-up Method</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="Call">Call</SelectItem>
                                                <SelectItem value="Email">Email</SelectItem>
                                                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="followUpDate" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Follow-up Date</FormLabel>
                                        <FormControl><Input type="date" {...field} /></FormControl>
                                    </FormItem>
                                )} />
                            </div>
                            <FormField control={form.control} name="assigneeId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Assign Task To</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Assign to staff..." /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {admins.map(admin => <SelectItem key={admin.uid} value={admin.uid}>{admin.displayName || admin.email}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="notes" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Conversation Notes</FormLabel>
                                    <FormControl><Textarea placeholder="Details from the initial call..." {...field} /></FormControl>
                                </FormItem>
                            )} />
                            <DialogFooter className="pt-4">
                                <Button type="submit" disabled={isLoading} className="w-full">
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4" />}
                                    Finalize Outreach & Schedule Task
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                ) : (
                    <div className="space-y-6 py-6">
                        <div className="p-4 bg-muted rounded-md space-y-2">
                            <Label>Secure Invitation Link</Label>
                            <div className="flex gap-2">
                                <Input value={inviteLink} readOnly className="bg-background" />
                                <Button size="icon" onClick={copyLink}><Copy className="h-4 w-4"/></Button>
                            </div>
                        </div>
                        <Alert variant="default" className="border-primary/50 bg-primary/5">
                            <div className="flex items-center gap-2">
                                <Truck className="h-5 w-5 text-primary" />
                                <p className="text-sm font-medium">Outreach logged successfully.</p>
                            </div>
                        </Alert>
                        <div className="flex justify-between gap-4">
                            <Button variant="outline" className="flex-1" asChild>
                                <Link href="/adminaccount?view=marketing-transporters">Go to Pitch Library</Link>
                            </Button>
                            <Button className="flex-1" onClick={() => onOpenChange(false)}>Done</Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

// Bulk add from text list
function AddFromTextDialog({ open, onOpenChange, onComplete }: { open: boolean, onOpenChange: (open: boolean) => void, onComplete: () => void }) {
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleAdd = async () => {
        const names = text.split('\n').map(n => n.trim()).filter(n => n.length > 0);
        if (names.length === 0) return;

        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed.");

            const partners = names.map(name => ({
                companyName: name,
                firstName: 'Member',
                lastName: 'Candidate',
                email: '',
                status: 'active',
                invitationStatus: 'pending'
            }));

            await performAdminAction(token, 'bulkSavePartners', { partners, type: 'transporter' });
            
            toast({ title: "Companies Added", description: `${partners.length} transporters added. Ready for enrichment.` });
            onComplete();
            onOpenChange(false);
            setText('');
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Add Failed", description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add Transporters from List</DialogTitle>
                    <DialogDescription>Paste a list of company names below (one per line) to create placeholder records.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Textarea 
                        placeholder="Company Alpha&#10;Bravo Transport&#10;Charlie Logistics..." 
                        rows={10} 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleAdd} disabled={isLoading || !text.trim()}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ListPlus className="mr-2 h-4 w-4" />}
                        Add to Database
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// MAIN COMPONENT
export default function TransporterManagement() {
    const { toast } = useToast();
    const [partners, setPartners] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEnriching, setIsEnriching] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [filterMissingEmail, setFilterMissingEmail] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // CENTRALIZED DIALOG STATE
    const [activePartner, setActivePartner] = useState<any | null>(null);
    const [activeDialog, setActiveDialog] = useState<'add' | 'edit' | 'delete' | 'add-list' | 'invite' | 'tasks' | 'logs' | 'add-log' | null>(null);

    const forceRefresh = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            const result = await performAdminAction(token, 'getPartnersByType', { type: 'transporter' });
            const sortedData = (result.data || []).sort((a:any, b:any) => {
                const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
                const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
                return dateB - dateA;
            });
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
                if (!partner) continue; 

                const queryName = partner.companyName || `${partner.firstName} ${partner.lastName}`;
                toast({ title: `Enriching ${queryName}...` });
                
                const enriched = await enrichPartner({ 
                    companyName: queryName,
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
            toast({ title: "Enrichment Complete", description: `Updated ${count} records with new details.` });
            forceRefresh();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Enrichment Failed", description: e.message });
        } finally {
            setIsEnriching(false);
        }
    };

    const handleExportCSV = () => {
        const selectedPartners = partners.filter(p => selectedIds.includes(p.id));
        if (selectedPartners.length === 0) return;

        const headers = ["First Name", "Last Name", "Email", "Company", "Phone", "Consent Status", "Opt-in Link", "Tracking Pixel"];
        const rows = selectedPartners.map(p => [
            p.firstName, p.lastName, p.email || '', `"${p.companyName || ''}"`, p.phone || '',
            p.consentStatus || 'pending', `"${window.location.origin}/opt-in/${p.id}"`,
            `"${window.location.origin}/api/trackEmailOpen/${p.id}"`
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", `transporter_campaign_${Date.now()}.csv`);
        link.click();
    };

    const handleDeletePartner = async () => {
        if (!activePartner) return;
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed.");
            await performAdminAction(token, 'deletePartner', { partnerId: activePartner.id });
            toast({ title: 'Transporter Deleted' });
            setActiveDialog(null);
            forceRefresh();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
        }
    };

    const filteredPartners = useMemo(() => {
        return filterMissingEmail ? partners.filter(p => !p.email) : partners;
    }, [partners, filterMissingEmail]);
    
    const columns: ColumnDef<any>[] = useMemo(() => [
        { accessorKey: 'firstName', header: 'Name', cell: ({row}) => <div>{row.original.firstName} {row.original.lastName}</div> },
        { accessorKey: 'email', header: 'Email', cell: ({row}) => row.original.email || <Badge variant="destructive">Missing</Badge> },
        { accessorKey: 'companyName', header: 'Company' },
        { accessorKey: 'consentStatus', header: 'Consent', cell: ({row}) => <Badge variant={row.original.consentStatus === 'accepted' ? 'default' : 'outline'} className="capitalize">{row.original.consentStatus || 'pending'}</Badge> },
        { accessorKey: 'lastOpenedAt', header: 'Engagement', cell: ({row}) => row.original.lastOpenedAt ? <div className="text-xs text-green-600 font-medium flex items-center gap-1"><Eye className="h-3 w-3" />Read {formatDateSafe(row.original.lastOpenedAt, "dd MMM")}</div> : <div className="text-xs text-muted-foreground italic">Not read</div> },
        { accessorKey: 'updatedAt', header: 'Updated', cell: ({row}) => <span className="text-xs text-muted-foreground">{formatDateSafe(row.original.updatedAt, "dd MMM")}</span> },
        { id: 'actions', header: <div className="text-right">Actions</div>, cell: ({ row }) => (
            <div className="text-right flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => { setActivePartner(row.original); setActiveDialog('logs'); }} title="View Logs"><MessageSquare className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => { setActivePartner(row.original); setActiveDialog('add-log'); }} title="Add Log"><MessageSquarePlus className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => { setActivePartner(row.original); setActiveDialog('tasks'); }} title="Tasks"><ClipboardList className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => { setActivePartner(row.original); setActiveDialog('invite'); }} title="Invite & Onboard"><Send className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => { setActivePartner(row.original); setActiveDialog('edit'); }} title="Edit"><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => { setActivePartner(row.original); setActiveDialog('delete'); }} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
        ) },
    ], []);
    
    return (
        <div className="space-y-6">
            <TransporterFormDialog open={activeDialog === 'add' || activeDialog === 'edit'} onOpenChange={(o) => !o && setActiveDialog(null)} partner={activeDialog === 'edit' ? activePartner : undefined} onSave={forceRefresh} />
            <OnboardWizardDialog open={activeDialog === 'invite'} onOpenChange={(o) => !o && setActiveDialog(null)} partner={activePartner} onComplete={forceRefresh} />
            <AddFromTextDialog open={activeDialog === 'add-list'} onOpenChange={(o) => !o && setActiveDialog(null)} onComplete={forceRefresh} />
            {activePartner && (
                <>
                    {activeDialog === 'logs' && <CommunicationLogDialog partnerId={activePartner.id} partnerName={activePartner.companyName || activePartner.firstName} />}
                    {activeDialog === 'add-log' && <AddCommunicationLogDialog partnerId={activePartner.id} onLogAdded={() => { setActiveDialog(null); forceRefresh(); }} />}
                    {activeDialog === 'tasks' && <PartnerTasksDialog partner={activePartner} />}
                </>
            )}
            <AlertDialog open={activeDialog === 'delete'} onOpenChange={(o) => !o && setActiveDialog(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete transporter "{activePartner?.firstName} {activePartner?.lastName}".</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel onClick={() => setActiveDialog(null)}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeletePartner} className={buttonVariants({ variant: "destructive" })}>Yes, delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2 text-2xl font-bold font-headline"><Truck /> Transporter Management</CardTitle>
                    <CardDescription>Manage leads, allocate to staff, and prepare tracked campaigns.</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                    <BulkImportDialog type="transporter" onComplete={forceRefresh}><Button variant="outline"><Upload className="mr-2 h-4 w-4"/>Import CSV</Button></BulkImportDialog>
                    <Button variant="outline" onClick={() => setActiveDialog('add-list')}><ListPlus className="mr-2 h-4 w-4"/>Add from List</Button>
                    <Button onClick={() => setActiveDialog('add')}><PlusCircle className="mr-2 h-4 w-4"/>Add Lead</Button>
                </div>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
                    <div className="flex items-center space-x-2">
                        <Switch id="missing-email" checked={filterMissingEmail} onCheckedChange={setFilterMissingEmail} />
                        <Label htmlFor="missing-email">Missing Email Only</Label>
                    </div>
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-primary">{selectedIds.length} Selected</span>
                            <Button size="sm" variant="secondary" onClick={handleEnrichSelected} disabled={isEnriching}>{isEnriching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}Enrich (AI)</Button>
                            <Button size="sm" variant="outline" onClick={handleExportCSV}><Download className="mr-2 h-4 w-4" /> Export for Campaign</Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {isLoading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : <DataTable columns={columns} data={filteredPartners} onSelectionChange={setSelectedIds} />}
                </CardContent>
            </Card>
        </div>
    );
}