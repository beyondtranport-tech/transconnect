'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import { Loader2, PlusCircle, Users, Edit, Trash2, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { roles } from '@/lib/roles';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const leadSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactPerson: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  role: z.string().min(1, 'Role is required'),
  status: z.enum(['new', 'contacted', 'qualified', 'unqualified']),
  notes: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

function LeadDialog({ lead, onSave, children }: { lead?: any, onSave: () => void, children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
  });
  
  useEffect(() => {
    if (isOpen) {
        if (lead) {
             form.reset({
                ...lead,
                status: lead.status || 'new',
            });
        } else {
            form.reset({
                companyName: '',
                contactPerson: '',
                email: '',
                phone: '',
                address: '',
                website: '',
                role: '',
                status: 'new',
                notes: '',
            });
        }
    }
  }, [isOpen, lead, form]);

  const onSubmit = async (values: LeadFormValues) => {
    setIsLoading(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication token not found.");
        
        const payload = {
            lead: {
                ...values,
                id: lead?.id, // Pass existing id for updates
            }
        };

        const response = await fetch('/api/admin', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'saveLead', payload }),
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
        <DialogContent className="sm:max-w-xl">
            <DialogHeader>
                <DialogTitle>{lead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
                <DialogDescription>
                    Enter the details for the potential member.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                    <FormField control={form.control} name="companyName" render={({ field }) => ( <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="contactPerson" render={({ field }) => ( <FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                    <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email"/></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Address</FormLabel><FormControl><Textarea placeholder="123 Main St, Johannesburg, 2000" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="website" render={({ field }) => ( <FormItem><FormLabel>Website</FormLabel><FormControl><Input placeholder="https://example.com" {...field} /></FormControl><FormMessage /></FormItem> )} />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="role" render={({ field }) => ( <FormItem><FormLabel>Potential Role</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl><SelectContent>{roles.map(r => <SelectItem key={r.id} value={r.title}>{r.title}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="status" render={({ field }) => ( <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="new">New</SelectItem><SelectItem value="contacted">Contacted</SelectItem><SelectItem value="qualified">Qualified</SelectItem><SelectItem value="unqualified">Unqualified</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                    </div>
                    <FormField control={form.control} name="notes" render={({ field }) => ( <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <DialogFooter className="pt-4">
                        <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Save Lead</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}

export default function LeadsContent() {
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [isFindingDuplicates, setIsFindingDuplicates] = useState(false);
  const [isDeletingDuplicates, setIsDeletingDuplicates] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<any[][]>([]);
  const [isCleanDialogOpen, setIsCleanDialogOpen] = useState(false);
  const [leadsToKeep, setLeadsToKeep] = useState<Record<string, string>>({});

  const loadLeads = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      try {
          const token = await getClientSideAuthToken();
          if (!token) throw new Error("Authentication failed.");

          const response = await fetch('/api/admin', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'getLeads' }),
          });

          const result = await response.json();
          if (!result.success) throw new Error(result.error || 'Failed to fetch leads.');
          
          setLeads(result.data || []);
      } catch (e: any) {
          setError(e.message);
      } finally {
          setIsLoading(false);
      }
  }, []);

  useEffect(() => {
      loadLeads();
  }, [loadLeads]);

  const handleDelete = async (leadId: string) => {
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Authentication failed.");
      
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteLead', payload: { leadId } }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to delete lead.');
      
      toast({ title: 'Lead Deleted' });
      loadLeads();
    } catch(e: any) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
    }
  };

  const handleFindDuplicates = async () => {
      setIsFindingDuplicates(true);
      try {
          const token = await getClientSideAuthToken();
          if (!token) throw new Error("Authentication failed.");
          const response = await fetch('/api/admin', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'findDuplicateLeads' }),
          });
          const result = await response.json();
          if (!result.success) throw new Error(result.error || 'Failed to find duplicates.');
          if (result.data.length === 0) {
              toast({ title: 'No Duplicates Found', description: 'Your leads database looks clean!' });
          } else {
              setDuplicateGroups(result.data);
              const initialToKeep: Record<string, string> = {};
              result.data.forEach((group: any[], index: number) => {
                  if (group.length > 0) {
                      initialToKeep[String(index)] = group[0].id;
                  }
              });
              setLeadsToKeep(initialToKeep);
              setIsCleanDialogOpen(true);
          }
      } catch(e: any) {
          toast({ variant: 'destructive', title: 'Error', description: e.message });
      } finally {
          setIsFindingDuplicates(false);
      }
  };

  const handleDeleteDuplicates = async () => {
      const allIds = duplicateGroups.flat().map(lead => lead.id);
      const idsToDelete = allIds.filter(id => !Object.values(leadsToKeep).includes(id));

      if (idsToDelete.length === 0) {
          toast({ title: "No changes to make." });
          setIsCleanDialogOpen(false);
          return;
      }
      
      setIsDeletingDuplicates(true);
      try {
          const token = await getClientSideAuthToken();
          if (!token) throw new Error("Authentication failed.");
          const response = await fetch('/api/admin', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'deleteLeads', payload: { leadIds: idsToDelete } }),
          });
          const result = await response.json();
          if (!result.success) throw new Error(result.error || 'Failed to delete duplicates.');
          
          toast({ title: 'Duplicates Cleaned', description: `${idsToDelete.length} duplicate leads have been removed.` });
          setIsCleanDialogOpen(false);
          setDuplicateGroups([]);
          loadLeads();
      } catch(e: any) {
          toast({ variant: 'destructive', title: 'Deletion Failed', description: e.message });
      } finally {
          setIsDeletingDuplicates(false);
      }
  };

  const columns: ColumnDef<any>[] = useMemo(() => [
    { 
      accessorKey: 'id', 
      header: 'Lead ID',
      cell: ({ row }) => <div className="font-mono text-xs max-w-[150px] truncate">{row.original.id}</div>
    },
    { 
      accessorKey: 'companyName', 
      header: 'Company',
      cell: ({ row }) => <div>{row.original.companyName}</div>
    },
    { 
      accessorKey: 'contactPerson', 
      header: 'Contact',
      cell: ({ row }) => <div>{row.original.contactPerson}</div>
    },
    { 
      accessorKey: 'email', 
      header: 'Email',
      cell: ({ row }) => <div>{row.original.email}</div>
    },
    { 
      accessorKey: 'address', 
      header: 'Address',
      cell: ({ row }) => <div className="max-w-[200px] truncate">{row.original.address}</div>
    },
     { 
      accessorKey: 'website', 
      header: 'Website',
      cell: ({ row }) => row.original.website ? <a href={row.original.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Link</a> : null
    },
    { 
      accessorKey: 'role', 
      header: 'Role',
      cell: ({row}) => <Badge variant="outline">{row.original.role}</Badge>
    },
    { 
      accessorKey: 'status', 
      header: 'Status',
      cell: ({row}) => <Badge className="capitalize">{row.original.status}</Badge>
    },
    { 
      id: 'actions', 
      header: () => <div className="text-right">Actions</div>, 
      cell: ({row}) => (
        <div className="text-right">
            <LeadDialog lead={row.original} onSave={loadLeads}><Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button></LeadDialog>
            <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this lead.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(row.original.id)} variant="destructive">Delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
    },
  ], [loadLeads]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2"><Users /> Potential Member Leads</CardTitle>
            <CardDescription>Add, edit, and manage your sales leads to build your member database.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleFindDuplicates} disabled={isFindingDuplicates} variant="outline">
                {isFindingDuplicates ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4"/>}
                Find & Clean Duplicates
            </Button>
            <LeadDialog onSave={loadLeads}>
                <Button><PlusCircle className="mr-2 h-4 w-4"/>Add Lead</Button>
            </LeadDialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : error ? (
            <div className="text-center py-10 text-destructive bg-destructive/10 rounded-md">
                <h3 className="font-semibold">Error loading leads</h3>
                <p>{error}</p>
                <Button onClick={loadLeads} variant="destructive" className="mt-4">Try Again</Button>
            </div>
          ) : (
            <DataTable columns={columns} data={leads} />
          )}
        </CardContent>
      </Card>
      <Dialog open={isCleanDialogOpen} onOpenChange={setIsCleanDialogOpen}>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
            <DialogTitle>Duplicate Leads Found</DialogTitle>
            <DialogDescription>
                The following groups of duplicate leads were found based on company name. For each group, please select the one record you want to keep. The rest will be deleted.
            </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] p-1">
            <div className="space-y-6 pr-4">
                {duplicateGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Group {groupIndex + 1}: "{group[0].companyName}"</h3>
                    <RadioGroup
                    value={leadsToKeep[String(groupIndex)]}
                    onValueChange={(leadId) => setLeadsToKeep(prev => ({...prev, [String(groupIndex)]: leadId}))}
                    >
                    <Table>
                        <TableHeader><TableRow><TableHead className="w-12">Keep</TableHead><TableHead>Contact</TableHead><TableHead>Email</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {group.map((lead: any) => (
                            <TableRow key={lead.id}>
                            <TableCell>
                                <RadioGroupItem value={lead.id} id={`keep-${lead.id}`} />
                            </TableCell>
                            <TableCell>{lead.contactPerson || 'N/A'}</TableCell>
                            <TableCell>{lead.email || 'N/A'}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{lead.notes || 'N/A'}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </RadioGroup>
                </div>
                ))}
            </div>
            </ScrollArea>
            <DialogFooter>
            <Button variant="outline" onClick={() => setIsCleanDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteDuplicates} disabled={isDeletingDuplicates} variant="destructive">
                {isDeletingDuplicates && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete Duplicates & Keep Selected
            </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
