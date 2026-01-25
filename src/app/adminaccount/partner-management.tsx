
'use client';

import { useState, useMemo, useEffect } from 'react';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, getClientSideAuthToken } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Loader2, PlusCircle, Handshake, Edit, Trash2, MoreVertical, Send, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMemoFirebase } from '@/hooks/use-config';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


async function performAdminAction(token: string, action: string, payload: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
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
  email: z.string().email('Invalid email address'),
  companyName: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

type PartnerFormValues = z.infer<typeof partnerSchema>;

function PartnerDialog({ partner, onSave, children }: { partner?: any; onSave: () => void; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerSchema),
    defaultValues: partner || {
        firstName: '',
        lastName: '',
        email: '',
        companyName: '',
        status: 'active',
    },
  });

   useEffect(() => {
    if (isOpen && partner) {
      form.reset(partner);
    } else if (isOpen && !partner) {
      form.reset({
        firstName: '',
        lastName: '',
        email: '',
        companyName: '',
        status: 'active',
      });
    }
  }, [isOpen, partner, form]);

  const onSubmit = async (values: PartnerFormValues) => {
    setIsLoading(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");
        
        const response = await fetch('/api/admin', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'savePartner',
                payload: { partner: { id: partner?.id, ...values } }
            }),
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to save partner.');

        toast({ title: partner ? 'Partner Updated' : 'Partner Added' });
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
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>{partner ? 'Edit Partner' : 'Add New Partner'}</DialogTitle>
                <DialogDescription>
                    Enter the details for the strategic partner or ISA.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="firstName" render={({ field }) => ( <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="lastName" render={({ field }) => ( <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                    <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email"/></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="companyName" render={({ field }) => ( <FormItem><FormLabel>Company Name (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="status" render={({ field }) => ( <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                     <DialogFooter className="pt-4">
                        <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Save Partner</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}

function PartnerActions({ partner, onUpdate }: { partner: any, onUpdate: () => void }) {
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [actionToConfirm, setActionToConfirm] = useState<'delete' | null>(null);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

    const inviteLink = (typeof window !== 'undefined') ? `${window.location.origin}/join?email=${encodeURIComponent(partner.email)}` : '';

    const copyInviteLink = () => {
        navigator.clipboard.writeText(inviteLink);
        toast({ title: 'Invite Link Copied!' });
    };

    const handleDelete = async () => {
        if (actionToConfirm !== 'delete') return;

        setIsProcessing(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            await performAdminAction(token, 'deletePartner', { partnerId: partner.id });
            toast({ title: 'Partner Deleted' });
            onUpdate();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
        } finally {
            setIsProcessing(false);
            setIsAlertOpen(false);
        }
    };

    return (
        <div className="text-right">
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Invite {partner.firstName}</DialogTitle>
                        <DialogDescription>
                            Send this unique sign-up link to the partner. They must use this email to register.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Input value={inviteLink} readOnly />
                        <Button onClick={copyInviteLink} className="w-full">
                            <Copy className="mr-2 h-4 w-4" /> Copy Link
                        </Button>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsInviteOpen(false)}>Done</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setIsInviteOpen(true)}>
                            <Send className="mr-2 h-4 w-4" /> Invite Partner
                        </DropdownMenuItem>
                        <PartnerDialog partner={partner} onSave={onUpdate}>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                        </PartnerDialog>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onSelect={() => { setActionToConfirm('delete'); setIsAlertOpen(true); }}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete this partner.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} variant="destructive">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

export default function PartnerManagement() {
    const firestore = useFirestore();
    const partnersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'partners')) : null, [firestore]);
    const { data: partners, isLoading, forceRefresh } = useCollection(partnersQuery);

    const columns: ColumnDef<any>[] = useMemo(() => [
        {
          accessorKey: 'name',
          header: 'Name',
          cell: ({ row }) => <div>{row.original.firstName} {row.original.lastName}</div>
        },
        {
          accessorKey: 'email',
          header: 'Email',
          cell: ({ row }) => <div>{row.original.email}</div>
        },
        {
          accessorKey: 'companyName',
          header: 'Company',
          cell: ({ row }) => <div>{row.original.companyName}</div>
        },
        {
          accessorKey: 'status',
          header: 'Status',
          cell: ({ row }) => <Badge className="capitalize">{row.original.status}</Badge>
        },
        {
          id: 'actions',
          header: () => <div className="text-right">Actions</div>,
          cell: ({ row }) => <PartnerActions partner={row.original} onUpdate={forceRefresh} />
        },
    ], [forceRefresh]);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Handshake /> Partner Management
                    </CardTitle>
                    <CardDescription>
                        Manage your strategic ISA Partners and their status within the platform.
                    </CardDescription>
                </div>
                <PartnerDialog onSave={forceRefresh}>
                    <Button><PlusCircle className="mr-2 h-4 w-4"/>Add Partner</Button>
                </PartnerDialog>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : (
                    <DataTable columns={columns} data={partners || []} />
                )}
            </CardContent>
        </Card>
    );
}
