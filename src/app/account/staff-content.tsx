
'use client';

import { useState, useEffect } from 'react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { addDoc, collection, serverTimestamp, doc } from 'firebase/firestore';
import { Loader2, PlusCircle, UserPlus, Users } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const staffFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  role: z.string().min(1, 'Role is required'),
});

type StaffFormValues = z.infer<typeof staffFormSchema>;

function AddStaffDialog({ memberId, onStaffAdded }: { memberId: string; onStaffAdded: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      role: '',
    },
  });

  const onSubmit = async (values: StaffFormValues) => {
    setIsLoading(true);
    if (!firestore || !memberId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Database not available or member not found.' });
      setIsLoading(false);
      return;
    }

    try {
      const staffCollectionRef = collection(firestore, `members/${memberId}/staff`);
      const staffData = {
        ...values,
        memberId: memberId,
        createdAt: serverTimestamp(),
      };
      
      await addDoc(staffCollectionRef, staffData)
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: staffCollectionRef.path,
                operation: 'create',
                requestResourceData: staffData,
            });
            errorEmitter.emit('permission-error', permissionError);
            throw serverError; // Rethrow to be caught by outer catch
        });

      toast({
        title: 'Staff Added',
        description: `${values.firstName} ${values.lastName} has been added to your team.`,
      });

      form.reset();
      setIsOpen(false);
      onStaffAdded(); // Call the refresh function
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Staff Member</DialogTitle>
          <DialogDescription>
            Enter the details of the new staff member to add them to your profile.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
             <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Driver, Admin" {...field} />
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

  const staffCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `members/${user.uid}/staff`);
  }, [firestore, user]);

  const { data: staff, isLoading: isStaffLoading, forceRefresh } = useCollection(staffCollectionRef);

  const isLoading = isUserLoading || isStaffLoading;

  return (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                 <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Users /> Staff Management
                </CardTitle>
                <CardDescription>Add and manage your company's staff members.</CardDescription>
            </div>
            {user && <AddStaffDialog memberId={user.uid} onStaffAdded={forceRefresh} />}
        </CardHeader>
        <CardContent>
            {isLoading && (
                 <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
            {!isLoading && staff && (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {staff.map((staffMember) => (
                            <TableRow key={staffMember.id}>
                                <TableCell className="font-medium">{staffMember.firstName} {staffMember.lastName}</TableCell>
                                <TableCell>{staffMember.email}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{staffMember.role}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">Edit</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
            {!isLoading && (!staff || staff.length === 0) && (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No staff members found</h3>
                    <p className="text-muted-foreground mt-1">Click the "Add Staff" button to add your first team member.</p>
                </div>
            )}
        </CardContent>
    </Card>
  )
}
