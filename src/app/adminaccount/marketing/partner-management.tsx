'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { Loader2, PlusCircle, Handshake, Edit, Trash2, Send, Copy, MessageSquare, ClipboardList, MessageSquarePlus, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import Link from 'next/link';
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
import { Separator } from '@/components/ui/separator';

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
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
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

async function fetchPlatformStaff(token: string) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getPlatformStaff' }),
    });
    const result = await response.json();
    return result.success ? result.data : [];
}

function OnboardWizardDialog({ partner, open, onOpenChange, onComplete }: { partner: any, open: boolean, onOpenChange: (open: boolean) => void, onComplete: () => void }) {
    const { user } = useUser();
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [staff, setStaff] = useState<any[]>([]);

    const form = useForm<OnboardingFormValues>({
        resolver: zodResolver(onboardingSchema),
        defaultValues: { assigneeId: partner?.assigneeId || user?.uid, followUpType: 'Call' }
    });

    useEffect(() => {
        if (open) {
            setStep(1);
            setInviteLink('');
            getClientSideAuthToken().then(token => {
                if (token) fetchPlatformStaff(token).then(setStaff);
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
                            : "The outreach is logged. Send the link to the partner now."}
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
                                        <FormControl><SelectTrigger><SelectValue placeholder="Assign to team..." /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {staff.map(member => <SelectItem key={member.id} value={member.id}>{member.firstName} {member.lastName} ({member.department})</SelectItem>)}
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
                                <Handshake className="h-5 w-5 text-primary" />
                                <p className="text-sm font-medium">Outreach logged successfully.</p>
                            </div>
                        </Alert>
                        <div className="flex justify-between gap-4">
                            <Button variant="outline" className="flex-1" asChild>
                                <Link href="/adminaccount?view=marketing-partners">Go to Pitch Library</Link>
                            </Button>
                            <Button className="flex-1" onClick={() => onOpenChange(false)}>Done</Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function PartnerDialog({ open, onOpenChange, partner, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; partner?: any; onSave: () => void; }) {
  const [isLoading, setIsLoading] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const { toast } = useToast();

  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerSchema),
  });

  useEffect(() => {
    if (open) {
      getClientSideAuthToken().then(token => {
          if (token) fetchPlatformStaff(token).then(setStaff);
      });
      if (partner) {
        form.reset(partner);
      } else {
        form.reset({ firstName: '', lastName: '', email: '', phone: '', companyName: '', website: '', streetAddress: '', city: '', province: '', postalCode: '', status: 'active' });
      }
    }
  }, [open, partner, form]);

  const onSubmit = async (values: PartnerFormValues) => {
    setIsLoading(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");
        
        await performAdminAction(token, 'savePartner', { partner: { id: partner?.id, ...values, type: 'partner' } });

        toast({ title: partner ? 'Partner Updated' : 'Partner Added' });
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
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>{partner ? 'Edit Partner' : 'Add New Partner'}</DialogTitle>
                <DialogDescription>
                    Enter the details for the strategic partner.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-2">
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
                    
                    <Separator />
                    <h3 className="font-semibold text-sm text-primary flex items-center gap-2">Business Address</h3>
                    <FormField control={form.control} name="streetAddress" render={({ field }) => ( <FormItem><FormLabel>Street Address</FormLabel><FormControl><Input placeholder="123 Road Lane" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <div className="grid grid-cols-3 gap-4">
                        <FormField control={form.control} name="city" render={({ field }) => ( <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="Johannesburg" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="province" render={({ field }) => ( <FormItem><FormLabel>Province</FormLabel><FormControl><Input placeholder="Gauteng" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="postalCode" render={({ field }) => ( <FormItem><FormLabel>Postal Code</FormLabel><FormControl><Input placeholder="2000" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </div>

                    <Separator />
                    <FormField control={form.control} name="assigneeId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Assign To (Platform Team)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select team member..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {staff.map(member => <SelectItem key={member.id} value={member.id}>{member.firstName} {member.lastName} ({member.department})</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="status" render={({ field }) => ( <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></Select><FormMessage /></FormItem> )} />
                </form>
            </Form>
            <DialogFooter className="pt-4 border-t">
                <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Save Partner</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}

function PartnerActionMenu({ onInvite, onEdit, onDelete, partner, onUpdate }: { onInvite: () => void; onEdit: () => void; onDelete: () => void; partner: any; onUpdate: () => void; }) {
  return (
    <div className="flex justify-end items-center gap-1">
       <CommunicationLogDialog partnerId={partner.id} partnerName={partner.name || `${partner.firstName} ${partner.lastName}`} />
       <AddCommunicationLogDialog partnerId={partner.id} onLogAdded={onUpdate} />
       <PartnerTasksDialog partner={partner} />
      <Button variant="ghost" size="icon" onClick={onInvite} title="Invite & Onboard">
        <Send className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onEdit} title="Edit Partner">
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete} title="Delete Partner">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

export default function PartnerManagement() {
  const { toast } = useToast();
  const [partners, setPartners] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const forceRefresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");
        
        const [partnersRes, staffRes] = await Promise.all([
            performAdminAction(token, 'getPartnersByType', { type: 'partner' }),
            performAdminAction(token, 'getPlatformStaff', {})
        ]);

        setPartners(partnersRes.data || []);
        setStaff(staffRes.data || []);
    } catch (e: any) {
        setError(e.message);
        toast({ variant: 'destructive', title: 'Error loading partners', description: e.message });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    forceRefresh();
  }, [forceRefresh]);
  
  const sortedPartners = useMemo(() => {
    if (!partners) return [];
    return [...partners].sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return dateB - dateA;
    });
  }, [partners]);

  const [dialogState, setDialogState] = useState<{ type: 'add' | 'edit' | 'delete' | 'invite' | null, data?: any }>({ type: null, data: undefined });

  const handleOpenDialog = async (type: 'add' | 'edit' | 'delete' | 'invite', data?: any) => {
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
        toast({ title: 'Partner Deleted' });
        handleSave();
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
    }
  };
  
  const invitationStatusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
    pending: 'secondary',
    invited: 'outline',
    registered: 'default',
  };

  const staffMap = useMemo(() => new Map(staff.map(s => [s.id, `${s.firstName} ${s.lastName}`])), [staff]);
  
  const columns: ColumnDef<any>[] = useMemo(() => [
    { accessorKey: 'firstName', header: 'Name', cell: ({row}) => <div>{row.original.firstName} {row.original.lastName}</div> },
    { accessorKey: 'email', header: 'Email', cell: ({row}) => <div>{row.original.email}</div> },
    { accessorKey: 'phone', header: 'Phone', cell: ({row}) => <div>{row.original.phone}</div> },
    { accessorKey: 'companyName', header: 'Company', cell: ({row}) => <div>{row.original.companyName}</div> },
    { 
        accessorKey: 'assigneeId', 
        header: 'Owner', 
        cell: ({row}) => <span>{staffMap.get(row.original.assigneeId) || 'Unassigned'}</span> 
    },
    { accessorKey: 'status', header: 'Status', cell: ({row}) => <Badge className="capitalize">{row.original.status}</Badge>},
    { accessorKey: 'invitationStatus', header: 'Invite Status', cell: ({row}) => ( <Badge variant={invitationStatusColors[row.original.invitationStatus] || 'secondary'} className="capitalize"> {row.original.invitationStatus?.replace(/_/g, ' ') || 'Pending'} </Badge> ) },
    { id: 'actions', header: <div className="text-right">Actions</div>, cell: ({ row }) => ( <PartnerActionMenu partner={row.original} onUpdate={forceRefresh} onInvite={() => handleOpenDialog('invite', row.original)} onEdit={() => handleOpenDialog('edit', row.original)} onDelete={() => handleOpenDialog('delete', row.original)} /> ) },
  ], [staffMap, forceRefresh]);


  return (
    <>
      <PartnerDialog 
        open={dialogState.type === 'add' || dialogState.type === 'edit'}
        onOpenChange={(isOpen) => !isOpen && handleCloseDialogs()}
        partner={dialogState.type === 'edit' ? dialogState.data : undefined}
        onSave={handleSave}
      />
      <OnboardWizardDialog
        open={dialogState.type === 'invite'}
        onOpenChange={(isOpen) => !isOpen && handleCloseDialogs()}
        partner={dialogState.data}
        onComplete={forceRefresh}
      />
      <AlertDialog open={dialogState.type === 'delete'} onOpenChange={(isOpen) => !isOpen && handleCloseDialogs()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete partner "{dialogState.data?.firstName} {dialogState.data?.lastName}".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseDialogs}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>Yes, delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Handshake /> Strategic Partner Management</CardTitle>
            <CardDescription>Manage your strategic business partners and assign platform owners.</CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog('add')}><PlusCircle className="mr-2 h-4 w-4"/>Add Partner</Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <DataTable columns={columns} data={sortedPartners} />
          )}
        </CardContent>
      </Card>
    </>
  );
}