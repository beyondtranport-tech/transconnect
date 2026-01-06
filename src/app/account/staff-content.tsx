'use client';

import { useState, useMemo, useCallback } from 'react';
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
import { useUser, useFirestore, useMemoFirebase, getClientSideAuthToken, useDoc } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc } from 'firebase/firestore';
import { Loader2, PlusCircle, UserPlus, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import StaffActionMenu from './staff-action-menu'; 
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EditStaffDialog } from './EditStaffDialog';

const staffFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  title: z.string().min(1, 'Title is required'),
  role: z.string().min(1, 'Role is required'),
  function: z.string().min(1, 'Function is required'),
  jobDescription: z.string().optional(),
});

type StaffFormValues = z.infer<typeof staffFormSchema>;

function AddStaffDialog({ companyId, onStaffAdded }: { companyId: string, onStaffAdded: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
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
        companyId: companyId, 
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
            collectionPath: `companies/${companyId}/staff`, 
            data: staffData
        }),
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add staff member.');
      }

      toast({
        title: 'Staff Added',
        description: `${values.firstName} ${values.lastName} has been added to your team.`,
      });

      form.reset();
      setIsOpen(false);
      onStaffAdded();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message || 'An unexpected error occurred.',
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
            Enter the details of the new staff member to add them to your profile.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a title" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Executive Director">Executive Director</SelectItem>
                          <SelectItem value="Non-Executive Director">Non-Executive Director</SelectItem>
                          <SelectItem value="Manager">Manager</SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="operations">Operations</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="IT">IT</SelectItem>
                          <SelectItem value="logistics">Logistics</SelectItem>
                          <SelectItem value="store">Store</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="function"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Function</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a function" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Set Policy">Set Policy</SelectItem>
                            <SelectItem value="Manage Staff">Manage Staff</SelectItem>
                            <SelectItem value="Set Budgets">Set Budgets</SelectItem>
                            <SelectItem value="Ensure Implementation">Ensure Implementation</SelectItem>
                            <SelectItem value="Monitor Deliverables">Monitor Deliverables</SelectItem>
                            <SelectItem value="Ensure Compliance">Ensure Compliance</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            <FormField
              control={form.control}
              name="jobDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the staff member's responsibilities, e.g., manage performance, set budgets, ensure compliance..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Add Staff Member
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


export default function StaffContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc<{ companyId: string }>(userDocRef);

  const staffCollectionRef = useMemoFirebase(() => {
    if (!firestore || !userData?.companyId) return null;
    return collection(firestore, `companies/${userData.companyId}/staff`);
  }, [firestore, userData?.companyId]);

  const { data: staff, isLoading: isStaffLoading, forceRefresh } = useCollection(staffCollectionRef);

  const isLoading = isUserLoading || isUserDataLoading || isStaffLoading;

  const handleEdit = (staffMember: any) => {
    setSelectedStaff(staffMember);
    setIsEditDialogOpen(true);
  };

  const columns: ColumnDef<any>[] = useMemo(() => [
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
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => <Badge variant="outline">{row.original.role}</Badge>,
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
                <StaffActionMenu staffMember={row.original} onUpdate={forceRefresh} onEdit={() => handleEdit(row.original)} />
            </div>
        ),
    },
  ], [forceRefresh]);

  return (
    <>
      {selectedStaff && (
        <EditStaffDialog
          isOpen={isEditDialogOpen}
          setIsOpen={setIsEditDialogOpen}
          staffMember={selectedStaff}
          onUpdate={() => {
            forceRefresh();
            setIsEditDialogOpen(false);
          }}
        />
      )}
      <Card>
          <CardHeader className="flex flex-row items-center justify-between">
              <div>
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                      <Users /> Staff Management
                  </CardTitle>
                  <CardDescription>Add and manage your company's staff members.</CardDescription>
              </div>
              {userData?.companyId && <AddStaffDialog companyId={userData.companyId} onStaffAdded={forceRefresh} />}
          </CardHeader>
          <CardContent>
              {isLoading ? (
                  <div className="flex justify-center items-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
              ) : (
                  <DataTable columns={columns} data={staff || []} />
              )}
          </CardContent>
      </Card>
    </>
  );
}
