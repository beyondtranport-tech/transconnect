'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, PlusCircle, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { getClientSideAuthToken, useDoc, useUser } from '@/firebase/provider';
import StaffActionMenu from '../backend/staff-action-menu';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMemoFirebase } from '@/hooks/use-config';
import { doc } from 'firebase/firestore';

interface StaffMember {
    id: string;
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

const staffFormSchema = z.object({
  companyId: z.string().min(1, 'Company is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  title: z.string().min(1, 'Title is required'),
  role: z.string().min(1, 'Role is required'),
  function: z.string().min(1, 'Function is required'),
  jobDescription: z.string().optional(),
});

type StaffFormValues = z.infer<typeof staffFormSchema>;

// Helper function to fetch admin data
async function fetchAdminData(token: string, action: string) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for action: ${action}`);
    }
    return result.data;
}

function AddStaffDialog({ companies, onStaffAdded }: { companies: Company[], onStaffAdded: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      companyId: '',
      firstName: '',
      lastName: '',
      email: '',
      title: '',
      role: '',
      function: '',
      jobDescription: '',
    },
  });

  const onSubmit = async (values: StaffFormValues) => {
    setIsLoading(true);
    
    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Authentication token not found.");
      
      const staffData = {
        ...values,
        status: 'unconfirmed',
        createdAt: { _methodName: 'serverTimestamp' },
      };
      
      // Admin API for adding staff to ANY company
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'addStaffMember',
            payload: {
                companyId: values.companyId,
                data: staffData
            }
        }),
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add staff member.');
      }

      toast({
        title: 'Staff Added',
        description: `${values.firstName} ${values.lastName} has been added.`,
      });

      form.reset();
      setIsOpen(false);
      onStaffAdded();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Staff
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Add New Staff Member</DialogTitle>
          <DialogDescription>
            Enter the details for the new staff member and assign them to a company.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="companyId" render={({ field }) => (
                <FormItem><FormLabel>Company</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a company" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                <FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="john.doe@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a title" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Executive Director">Executive Director</SelectItem><SelectItem value="Non-Executive Director">Non-Executive Director</SelectItem><SelectItem value="Manager">Manager</SelectItem><SelectItem value="Admin">Admin</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
               <FormField control={form.control} name="role" render={({ field }) => (<FormItem><FormLabel>Role</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl><SelectContent><SelectItem value="operations">Operations</SelectItem><SelectItem value="marketing">Marketing</SelectItem><SelectItem value="IT">IT</SelectItem><SelectItem value="logistics">Logistics</SelectItem><SelectItem value="store">Store</SelectItem><SelectItem value="sales">Sales</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
               <FormField control={form.control} name="function" render={({ field }) => (<FormItem><FormLabel>Function</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a function" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Set Policy">Set Policy</SelectItem><SelectItem value="Manage Staff">Manage Staff</SelectItem><SelectItem value="Set Budgets">Set Budgets</SelectItem><SelectItem value="Ensure Implementation">Ensure Implementation</SelectItem><SelectItem value="Monitor Deliverables">Monitor Deliverables</SelectItem><SelectItem value="Ensure Compliance">Ensure Compliance</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
            </div>
            <FormField control={form.control} name="jobDescription" render={({ field }) => (<FormItem><FormLabel>Job Description (Optional)</FormLabel><FormControl><Textarea placeholder="Describe responsibilities..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}><UserPlus className="mr-2 h-4 w-4" />Add Staff Member</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function StaffContent() {
    const { user, isUserLoading } = useUser();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoadingData(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            
            const [staffData, companiesData] = await Promise.all([
                fetchAdminData(token, 'getStaff'),
                fetchAdminData(token, 'getMembers')
            ]);
            setStaff(staffData || []);
            setCompanies(companiesData || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoadingData(false);
        }
    }, []);

    useEffect(() => {
        if (!isUserLoading && user) {
            fetchData();
        }
    }, [isUserLoading, user, fetchData]);

    const enrichedStaff = useMemo(() => {
        const companyMap = new Map(companies.map(c => [c.id, c.companyName]));
        return staff.map(s => ({
            ...s,
            companyName: companyMap.get(s.companyId) || 'Unknown Company'
        }));
    }, [staff, companies]);

    const columns: ColumnDef<StaffMember>[] = useMemo(() => [
        { accessorKey: 'firstName', header: 'First Name' },
        { accessorKey: 'lastName', header: 'Last Name' },
        { accessorKey: 'companyName', header: 'Company' },
        { accessorKey: 'email', header: 'Email' },
        { accessorKey: 'title', header: 'Title' },
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
                    <StaffActionMenu staffMember={row.original} onUpdate={fetchData} />
                </div>
            ),
        }
    ], [fetchData]);

    const isLoading = isUserLoading || isLoadingData;

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <Users /> All Staff Members
                    </CardTitle>
                    <CardDescription>A consolidated view of all staff across all member companies.</CardDescription>
                </div>
                {!isLoading && companies.length > 0 && <AddStaffDialog companies={companies} onStaffAdded={fetchData} />}
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : error ? (
                    <div className="text-destructive-foreground bg-destructive/90 p-4 rounded-md">
                        <h4 className="font-semibold">Error loading staff</h4>
                        <p className="text-sm">{error}</p>
                    </div>
                ) : (
                    <DataTable columns={columns} data={enrichedStaff} />
                )}
            </CardContent>
        </Card>
    );
}
