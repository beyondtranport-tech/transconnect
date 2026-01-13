
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Handshake, MoreVertical, Edit, Trash2, CheckCircle, XCircle, PlusCircle, Loader2, MessageSquare } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';


const leadSchema = z.object({
    companyName: z.string().min(1, 'Company name is required.'),
    email: z.string().email('Please enter a valid email.').optional().or(z.literal('')),
    mobile: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

const statusColors: { [key: string]: 'default' | 'secondary' | 'outline' } = {
  Active: 'default',
  Invited: 'secondary',
  Prospect: 'outline',
};

// A small action menu component for the table rows
function NetworkActionMenu({ member, onInvite }: { member: any; onInvite: (member: any) => void; }) {
  const handleEdit = () => console.log('Edit:', member.id);
  const handleConfirm = () => console.log('Confirm:', member.id);
  const handleUnconfirm = () => console.log('Unconfirm:', member.id);
  const handleDelete = () => console.log('Delete:', member.id);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" /> View / Edit
        </DropdownMenuItem>
         <DropdownMenuItem onClick={() => onInvite(member)} disabled={member.status !== 'Prospect'}>
          <MessageSquare className="mr-2 h-4 w-4" /> Invite via WhatsApp
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleConfirm}>
          <CheckCircle className="mr-2 h-4 w-4" /> Confirm Link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleUnconfirm}>
          <XCircle className="mr-2 h-4 w-4" /> Un-confirm
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AddLeadDialog({ onAddLead }: { onAddLead: (lead: LeadFormValues) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
    const form = useForm<LeadFormValues>({
        resolver: zodResolver(leadSchema),
        defaultValues: { companyName: '', email: '', mobile: '' },
    });

    const onSubmit = (values: LeadFormValues) => {
        // This is a placeholder for now until we have a 'leads' collection
        console.log("Adding lead (client-side only for now):", values);
        toast({ title: 'Lead Added (Demo)', description: `${values.companyName} has been added as a prospect locally.` });
        form.reset();
        setIsOpen(false);
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Lead
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Lead</DialogTitle>
                    <DialogDescription>Enter the details of your new prospect. This feature is for demonstration; data is not saved yet.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                         <FormField control={form.control} name="companyName" render={({ field }) => (<FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} placeholder="e.g., SA Freight Solutions" /></FormControl><FormMessage /></FormItem>)} />
                         <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} placeholder="contact@safreight.co.za" /></FormControl><FormMessage /></FormItem>)} />
                         <FormField control={form.control} name="mobile" render={({ field }) => (<FormItem><FormLabel>Mobile (Optional)</FormLabel><FormControl><Input {...field} placeholder="083 123 4567" /></FormControl><FormMessage /></FormItem>)} />
                         <DialogFooter>
                            <Button type="submit">Add Lead (Demo)</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export default function NetworkContent() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    // Fetch companies that have this user as a referrer
    const networkQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'companies'), where('referrerId', '==', user.uid));
    }, [firestore, user]);

    const { data: networkData, isLoading, error } = useCollection(networkQuery);

    const handleAddLead = (lead: LeadFormValues) => {
        // Placeholder for future implementation of saving leads to a collection
        console.log("Adding lead:", lead);
    };
    
    const handleInvite = (member: any) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'You must be logged in to invite someone.' });
            return;
        }
        const referralLink = `${window.location.origin}/join?ref=${user.uid}`;
        const message = encodeURIComponent(
            `Hi, I'd like to invite you to join TransConnect, a network for transporters that helps you save money and find more work. Use my personal link to sign up: ${referralLink}`
        );
        const whatsappUrl = `https://wa.me/?text=${message}`;
        window.open(whatsappUrl, '_blank');
        toast({
            title: "Invite Sent!",
            description: `You've opened WhatsApp to invite ${member.companyName}.`
        });
    };
    
    const columns: ColumnDef<any>[] = useMemo(() => [
        {
          accessorKey: 'companyName',
          header: 'Company Name',
          cell: ({ row }) => <div className="font-medium">{row.original.companyName}</div>,
        },
        {
          accessorKey: 'ownerId',
          header: 'Owner ID',
          cell: ({ row }) => <div className="font-mono text-xs">{row.original.ownerId}</div>,
        },
        {
          accessorKey: 'membershipId',
          header: 'Membership',
          cell: ({ row }) => <Badge variant="outline" className="capitalize">{row.original.membershipId || 'Free'}</Badge>,
        },
        {
          accessorKey: 'createdAt',
          header: 'Date Joined',
          cell: ({ row }) => {
            if (!row.original.createdAt) return 'N/A';
            const date = new Date(row.original.createdAt);
            return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
          },
        },
    ], []);
    
    const pageIsLoading = isLoading || isUserLoading;

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <Handshake />
                            My Network
                        </CardTitle>
                        <CardDescription>
                            Manage your leads, send invites, and track the growth of your referral network.
                        </CardDescription>
                    </div>
                    <AddLeadDialog onAddLead={handleAddLead} />
                </CardHeader>
                <CardContent>
                    {pageIsLoading ? (
                        <div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : error ? (
                        <div className="text-center py-10 text-destructive">{error.message}</div>
                    ) : (
                        <DataTable columns={columns} data={networkData || []} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
