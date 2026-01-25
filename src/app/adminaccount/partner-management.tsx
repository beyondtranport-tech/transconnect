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
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { useCollection, useFirestore, getClientSideAuthToken, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Loader2, PlusCircle, Handshake, Edit, Trash2, MoreVertical, Send, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Helper function to make API calls
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

// Partner Dialog for Adding/Editing
function PartnerDialog({ open, onOpenChange, partner, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; partner?: any; onSave: () => void; }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerSchema),
  });

  useEffect(() => {
    if (open) {
      if (partner) {
        form.reset(partner);
      } else {
        form.reset({
          firstName: '',
          lastName: '',
          email: '',
          companyName: '',
          status: 'active',
        });
      }
    }
  }, [open, partner, form]);

  const onSubmit = async (values: PartnerFormValues) => {
    setIsLoading(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");
        
        await performAdminAction(token, 'savePartner', { partner: { id: partner?.id, ...values } });

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

// Action Menu for each row
function PartnerActionMenu({ onInvite, onEdit, onDelete }: { onInvite: () => void, onEdit: () => void, onDelete: () => void }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={onInvite}><Send className="mr-2 h-4 w-4" /> Invite Partner</DropdownMenuItem>
                <DropdownMenuItem onSelect={onEdit}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onDelete} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// Main Component
export default function PartnerManagement() {
  const firestore = useFirestore();
  const partnersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'partners')) : null, [firestore]);
  const { data: partners, isLoading, forceRefresh } = useCollection(partnersQuery);
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleInviteClick = (partner: any) => {
    setSelectedPartner(partner);
    setIsInviteOpen(true);
  };
  
  const handleEditClick = (partner: any) => {
    setSelectedPartner(partner);
    setIsEditOpen(true);
  };

  const handleDeleteClick = (partner: any) => {
    setSelectedPartner(partner);
    setIsDeleteOpen(true);
  };
  
  const handleDeletePartner = async () => {
    if (!selectedPartner) return;
    setIsProcessing(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");
        await performAdminAction(token, 'deletePartner', { partnerId: selectedPartner.id });
        toast({ title: 'Partner Deleted' });
        forceRefresh();
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
    } finally {
        setIsProcessing(false);
        setIsDeleteOpen(false);
        setSelectedPartner(null);
    }
  };

  const inviteLink = selectedPartner ? (typeof window !== 'undefined' ? `${window.location.origin}/join?email=${encodeURIComponent(selectedPartner.email)}` : '') : '';

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({ title: 'Invite Link Copied!' });
  };
  
  return (
    <>
      {/* DIALOGS ARE NOW HOISTED HERE, OUTSIDE THE RENDER LOOP */}
      <PartnerDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen} 
        onSave={forceRefresh} 
      />
      {selectedPartner && (
        <PartnerDialog 
            open={isEditOpen} 
            onOpenChange={setIsEditOpen} 
            partner={selectedPartner}
            onSave={() => {
                forceRefresh();
                setIsEditOpen(false);
            }}
        />
      )}
       <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite {selectedPartner?.firstName}</DialogTitle>
            <DialogDescription>Send this unique sign-up link to the partner. They must use this email to register.</DialogDescription>
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
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete partner "{selectedPartner?.firstName} {selectedPartner?.lastName}".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePartner} variant="destructive" disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Handshake /> Partner Management</CardTitle>
            <CardDescription>
              Manage your strategic ISA Partners.
            </CardDescription>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4"/>Add Partner
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(partners && partners.length > 0) ? partners.map(partner => (
                    <TableRow key={partner.id}>
                      <TableCell><div>{partner.firstName} {partner.lastName}</div></TableCell>
                      <TableCell><div>{partner.email}</div></TableCell>
                      <TableCell><div>{partner.companyName}</div></TableCell>
                      <TableCell><Badge className="capitalize">{partner.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <PartnerActionMenu
                            partner={partner}
                            onInvite={() => handleInviteClick(partner)}
                            onEdit={() => handleEditClick(partner)}
                            onDelete={() => handleDeleteClick(partner)}
                        />
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">No partners found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}