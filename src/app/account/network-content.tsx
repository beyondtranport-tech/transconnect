'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Handshake, Loader2, MessageSquare, PlusCircle, Edit, Trash2, Send, Copy } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUser, getClientSideAuthToken, useDoc, useCollection } from '@/firebase';
import Link from 'next/link';
import { useMemoFirebase } from '@/hooks/use-config';
import { collection, doc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { roles as potentialRoles } from '@/lib/roles';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// Schema for the lead form
const leadSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactPerson: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.string().min(1, 'Role is required'),
  status: z.enum(['new', 'contacted', 'qualified', 'unqualified']).default('new'),
  notes: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

// LeadDialog for adding/editing leads
function LeadDialog({ lead, companyId, onSave, children }: { lead?: any, companyId: string, onSave: () => void, children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(lead || { companyName: '', contactPerson: '', email: '', phone: '', role: '', status: 'new', notes: '' });
    }
  }, [isOpen, lead, form]);

  const onSubmit = async (values: LeadFormValues) => {
    setIsLoading(true);
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Authentication failed.");
      
      const apiAction = lead ? 'updateUserDoc' : 'addUserDoc';
      const path = lead ? `companies/${companyId}/leads/${lead.id}` : `companies/${companyId}/leads`;
      const data = lead ? { ...values, updatedAt: { _methodName: 'serverTimestamp' } } : { ...values, createdAt: { _methodName: 'serverTimestamp' } };

      const response = await fetch(lead ? '/api/updateUserDoc' : '/api/addUserDoc', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(lead ? { path, data } : { collectionPath: path, data }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to save lead.');

      toast({ title: lead ? 'Lead Updated' : 'Lead Added' });
      onSave();
      setIsOpen(false);
    } catch(e: any) {
      toast({ variant: 'destructive', title: 'Save Failed', description: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{lead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            {/* Form Fields */}
            <FormField control={form.control} name="companyName" render={({ field }) => ( <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="contactPerson" render={({ field }) => ( <FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="role" render={({ field }) => ( <FormItem><FormLabel>Potential Role</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl><SelectContent>{potentialRoles.map(r => <SelectItem key={r.id} value={r.title}>{r.title}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="status" render={({ field }) => ( <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="new">New</SelectItem><SelectItem value="contacted">Contacted</SelectItem><SelectItem value="qualified">Qualified</SelectItem><SelectItem value="unqualified">Unqualified</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="notes" render={({ field }) => ( <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Save Lead</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


// Main Component
export default function NetworkContent() {
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userData, isLoading: isUserDocLoading } = useDoc<{ companyId: string }>(userDocRef);
    const companyId = userData?.companyId;

    const leadsQuery = useMemoFirebase(() => {
        if (!firestore || !companyId) return null;
        return collection(firestore, `companies/${companyId}/leads`);
    }, [firestore, companyId]);

    const { data: leads, isLoading: areLeadsLoading, forceRefresh } = useCollection(leadsQuery);

    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<any | null>(null);

    const inviteLink = useMemo(() => {
        if (typeof window === 'undefined' || !companyId || !selectedLead?.email) return '';
        return `${window.location.origin}/join?ref=${companyId}&email=${encodeURIComponent(selectedLead.email)}`;
    }, [companyId, selectedLead]);

    const copyInviteLink = () => {
        navigator.clipboard.writeText(inviteLink);
        toast({ title: 'Invite Link Copied!' });
    };
    
    const handleDelete = async () => {
        if (!companyId || !selectedLead) return;
        
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            
            await fetch('/api/deleteUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: `companies/${companyId}/leads/${selectedLead.id}` }),
            });
            
            toast({ title: "Lead Deleted" });
            forceRefresh();
        } catch(e: any) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
        } finally {
            setDeleteAlertOpen(false);
            setSelectedLead(null);
        }
    };


    const columns: ColumnDef<any>[] = useMemo(() => [
        { accessorKey: 'companyName', header: 'Company Name' },
        { accessorKey: 'contactPerson', header: 'Contact' },
        { accessorKey: 'email', header: 'Email' },
        { accessorKey: 'phone', header: 'Phone' },
        { accessorKey: 'role', header: 'Role', cell: ({ row }) => <Badge variant="outline">{row.original.role}</Badge> },
        { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge className="capitalize">{row.original.status}</Badge> },
        { id: 'actions', header: () => <div className="text-right">Actions</div>, cell: ({ row }) => (
            <div className="flex items-center justify-end">
                <Button variant="ghost" size="icon" onClick={() => { setSelectedLead(row.original); setInviteDialogOpen(true); }}>
                    <Send className="h-4 w-4" />
                </Button>
                 <LeadDialog lead={row.original} companyId={companyId!} onSave={forceRefresh}>
                    <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                 </LeadDialog>
                 <Button variant="ghost" size="icon" onClick={() => { setSelectedLead(row.original); setDeleteAlertOpen(true); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </div>
        )},
    ], [companyId, forceRefresh]);
    
    const isLoading = isUserLoading || isUserDocLoading || areLeadsLoading;

    return (
      <div className="space-y-8">
        {/* Main Card */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2 text-2xl"><Handshake />My Network Leads</CardTitle>
                    <CardDescription>Add potential leads, track their status, and send them your unique referral link.</CardDescription>
                </div>
                {companyId && (
                    <LeadDialog companyId={companyId} onSave={forceRefresh}>
                        <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Lead</Button>
                    </LeadDialog>
                )}
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : !companyId ? (
                     <div className="text-center py-10 text-muted-foreground">Could not load your company profile.</div>
                ) : (
                    <DataTable columns={columns} data={leads || []} />
                )}
            </CardContent>
        </Card>

        {/* Invite Dialog */}
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite {selectedLead?.companyName}</DialogTitle>
                    <DialogDescription>
                        Copy this unique link and send it to your lead. When they sign up, they will be added to your network.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2 py-4">
                    <Input id="invite-link" value={inviteLink} readOnly />
                    <Button type="button" size="sm" onClick={copyInviteLink}><Copy className="mr-2 h-4 w-4" /> Copy</Button>
                </div>
            </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation */}
         <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>This action will permanently delete the lead for {selectedLead?.companyName}.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setSelectedLead(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} variant="destructive">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

      </div>
    );
}