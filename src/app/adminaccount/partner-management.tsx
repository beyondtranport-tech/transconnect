'use client';

import { useState, useMemo } from 'react';
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
import { useCollection, useFirestore, getClientSideAuthToken } from '@/firebase';
import { collection, query, collectionGroup } from 'firebase/firestore';
import { Loader2, PlusCircle, UserPlus, Handshake } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import StaffActionMenu from '../backend/staff-action-menu';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMemoFirebase } from '@/hooks/use-config';

const partnerFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  title: z.string().min(1, 'Title is required'),
  function: z.string().min(1, 'Function is required'),
  jobDescription: z.string().optional(),
  companyId: z.string().min(1, 'You must select a company.'),
});

type PartnerFormValues = z.infer<typeof partnerFormSchema>;

function AddPartnerDialog({ onPartnerAdded }: { onPartnerAdded: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteStep, setInviteStep] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const { toast } = useToast();
  const firestore = useFirestore();

  const companiesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'companies')) : null, [firestore]);
  const { data: companies, isLoading: areCompaniesLoading } = useCollection(companiesQuery);

  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerFormSchema),
    defaultValues: {
      companyId: '',
      firstName: '',
      lastName: '',
      email: '',
      title: 'Partner',
      function: '',
      jobDescription: '',
    },
  });

  const onSubmit = async (values: PartnerFormValues) => {
    setIsSubmitting(true);
    
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Authentication token not found.");
      
      const partnerData = {
        ...values,
        role: 'partner', // Hardcode the role to 'partner'
        status: 'unconfirmed',
        createdAt: { _methodName: 'serverTimestamp' },
      };

      const response = await fetch('/api/addUserDoc', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            collectionPath: `companies/${values.companyId}/staff`, 
            data: partnerData
        }),
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add partner.');
      }

      toast({
        title: 'Partner Profile Created',
        description: `A profile for ${values.firstName} has been created.`,
      });
      
      setNewUserEmail(values.email);
      setInviteStep(true);
      onPartnerAdded();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setInviteStep(false);
      setNewUserEmail('');
    }
    setIsOpen(open);
  }

  const copyInviteLink = () => {
    const signupUrl = `${window.location.origin}/join?email=${encodeURIComponent(newUserEmail)}`;
    navigator.clipboard.writeText(signupUrl);
    toast({
        title: 'Sign-up Link Copied!',
        description: 'You can now send the link to the new partner.'
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Partner
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
         {inviteStep ? (
            <>
                <DialogHeader>
                    <DialogTitle>Step 2: Invite Your Partner</DialogTitle>
                    <DialogDescription>
                        The partner profile has been created. Now, instruct the user to sign up for their own account.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm">Please copy the sign-up link and send it to <span className="font-semibold text-primary">{newUserEmail}</span>. They must create their account using this specific email address to be correctly linked to the company.</p>
                     <Button onClick={copyInviteLink} className="w-full">Copy Sign-up Link</Button>
                </div>
                 <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Done</Button>
                </DialogFooter>
            </>
         ) : (
            <>
                <DialogHeader>
                <DialogTitle>Add New Strategic Partner</DialogTitle>
                <DialogDescription>
                    Enter the details of the new partner and select the company they belong to.
                </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                      control={form.control}
                      name="companyId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company</FormLabel>
                           <Select onValueChange={field.onChange} defaultValue={field.value} disabled={areCompaniesLoading}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={areCompaniesLoading ? "Loading companies..." : "Select a company"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {companies?.map(company => (
                                <SelectItem key={company.id} value={company.id}>
                                    {company.companyName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="firstName" render={({ field }) => (
                            <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="lastName" render={({ field }) => (
                            <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="john.doe@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="function" render={({ field }) => (
                            <FormItem><FormLabel>Function</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    <FormField control={form.control} name="jobDescription" render={({ field }) => (
                        <FormItem><FormLabel>Job Description (Optional)</FormLabel><FormControl><Textarea placeholder="Describe responsibilities..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                        Create Partner Profile
                    </Button>
                    </DialogFooter>
                </form>
                </Form>
            </>
         )}
      </DialogContent>
    </Dialog>
  );
}

interface StaffMember {
    id: string;
    docId: string;
    firstName: string;
    lastName: string;
    email: string;
    companyId: string;
    companyName?: string;
    title: string;
    role: string;
    status: 'confirmed' | 'unconfirmed';
}

interface Company {
    id: string;
    companyName: string;
}

export default function PartnerManagement() {
    const firestore = useFirestore();

    const staffQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'staff')) : null, [firestore]);
    const { data: staff, isLoading: isStaffLoading, forceRefresh } = useCollection<StaffMember>(staffQuery);

    const companiesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'companies')) : null, [firestore]);
    const { data: companies, isLoading: areCompaniesLoading } = useCollection<Company>(companiesQuery);
    
    const isLoading = isStaffLoading || areCompaniesLoading;

    const enrichedStaff = useMemo(() => {
        if (!staff || !companies) return [];
        const companyMap = new Map(companies.map(c => [c.id, c.companyName]));
        
        return staff
            .filter(s => s.role === 'partner')
            .map(s => ({
                ...s,
                docId: s.id,
                id: `${s.companyId}-${s.id}`,
                companyName: companyMap.get(s.companyId) || 'Unknown Company',
        }));
    }, [staff, companies]);

    const columns: ColumnDef<StaffMember>[] = useMemo(() => [
        {
            accessorKey: 'firstName',
            header: 'First Name',
            cell: ({ row }) => <div>{row.original.firstName}</div>,
        },
        {
            accessorKey: 'lastName',
            header: 'Last Name',
            cell: ({ row }) => <div>{row.original.lastName}</div>,
        },
        {
            accessorKey: 'companyName',
            header: 'Company',
            cell: ({ row }) => <div>{row.original.companyName}</div>,
        },
        {
            accessorKey: 'email',
            header: 'Email',
            cell: ({ row }) => <div>{row.original.email}</div>,
        },
        {
            accessorKey: 'title',
            header: 'Title',
            cell: ({ row }) => <div>{row.original.title}</div>,
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant={row.original.status === 'confirmed' ? 'default' : 'secondary'} className="capitalize">
                    {row.original.status || 'unconfirmed'}
                </Badge>
            ),
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="text-right">
                    <StaffActionMenu staffMember={row.original} onUpdate={forceRefresh} />
                </div>
            ),
        }
    ], [forceRefresh]);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Handshake /> Partner Management
                    </CardTitle>
                    <CardDescription>
                        A dedicated view for managing your strategic ISA Partners across all member companies.
                    </CardDescription>
                </div>
                <AddPartnerDialog onPartnerAdded={forceRefresh} />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <DataTable columns={columns} data={enrichedStaff} />
                )}
            </CardContent>
        </Card>
    );
}
