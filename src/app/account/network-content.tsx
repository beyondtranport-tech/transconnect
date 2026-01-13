'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Handshake, MoreVertical, Edit, Trash2, CheckCircle, XCircle, PlusCircle, Loader2 } from 'lucide-react';
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


// Mock data for referred network members
const initialNetworkData = [
  { id: 'net1', companyName: 'ABC Transport', email: 'contact@abctransport.co.za', mobile: '0821234567', status: 'Active' },
  { id: 'net2', companyName: 'Freight Movers Inc.', email: 'info@freightmovers.com', mobile: '0719876543', status: 'Invited' },
  { id: 'net3', companyName: 'Speedy Logistics', email: 'ops@speedylog.co.za', mobile: '0835558899', status: 'Prospect' },
  { id: 'net4', companyName: 'SA Haulers', email: 'info@sah.co.za', mobile: '0841112233', status: 'Prospect' },
  { id: 'net5', companyName: 'Coastal Carriers', email: 'fleet@coastal.com', mobile: '0723456789', status: 'Active' },
];

type NetworkMember = typeof initialNetworkData[0];

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
function NetworkActionMenu({ member }: { member: NetworkMember }) {
  // Placeholder actions
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
        onAddLead(values);
        toast({ title: 'Lead Added', description: `${values.companyName} has been added as a prospect.` });
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
                    <DialogDescription>Enter the details of your new prospect. They will be added to your network with a "Prospect" status.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                         <FormField
                            control={form.control}
                            name="companyName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Company Name</FormLabel>
                                    <FormControl><Input {...field} placeholder="e.g., SA Freight Solutions" /></FormControl>
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
                                    <FormControl><Input {...field} placeholder="contact@safreight.co.za" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="mobile"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mobile (Optional)</FormLabel>
                                    <FormControl><Input {...field} placeholder="083 123 4567" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <DialogFooter>
                            <Button type="submit">Add Lead</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export default function NetworkContent() {
    const [networkData, setNetworkData] = useState(initialNetworkData);
    
    const handleAddLead = (lead: LeadFormValues) => {
        const newMember = {
            id: `prospect-${Date.now()}`,
            ...lead,
            status: 'Prospect'
        };
        setNetworkData(prevData => [newMember, ...prevData]);
    };
    
    const columns: ColumnDef<NetworkMember>[] = useMemo(() => [
        {
          accessorKey: 'companyName',
          header: 'Company Name',
          cell: ({ row }) => <div className="font-medium">{row.original.companyName}</div>,
        },
        {
          accessorKey: 'email',
          header: 'Email',
          cell: ({ row }) => <div>{row.original.email}</div>,
        },
        {
          accessorKey: 'mobile',
          header: 'Mobile',
          cell: ({ row }) => <div>{row.original.mobile}</div>,
        },
        {
          accessorKey: 'status',
          header: 'Status',
          cell: ({ row }) => (
             <Badge variant={statusColors[row.original.status] || 'secondary'}>
                {row.original.status}
             </Badge>
          ),
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="text-right">
                    <NetworkActionMenu member={row.original} />
                </div>
            ),
        }
    ], []);

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
                    <DataTable columns={columns} data={networkData} />
                </CardContent>
            </Card>
        </div>
    );
}
