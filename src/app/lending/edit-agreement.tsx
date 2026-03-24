
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
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { getClientSideAuthToken } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// API Helper
async function performAdminAction(token: string, action: string, payload: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for action: ${action}`);
    }
    return result;
}

const agreementSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.string().min(1, 'Agreement type is required'),
  status: z.enum(['pending', 'credit', 'payout', 'active', 'completed', 'defaulted']).default('pending'),
  totalAdvanced: z.coerce.number().positive('Amount must be positive'),
  interestRate: z.coerce.number().min(0, "Rate can't be negative"),
  numberOfInstallments: z.coerce.number().int().positive('Term must be a positive integer'),
  createDate: z.string().optional(),
  firstInstallmentDate: z.string().optional(),
});
type AgreementFormValues = z.infer<typeof agreementSchema>;

interface EditAgreementDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  agreement?: any;
  clients: any[];
  onSave: () => void;
}

export function EditAgreementDialog({ isOpen, onOpenChange, agreement, clients, onSave }: EditAgreementDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<AgreementFormValues>({
        resolver: zodResolver(agreementSchema),
    });

    useEffect(() => {
        if (isOpen) {
            const defaultDate = new Date().toISOString().split('T')[0];
            form.reset({
                clientId: agreement?.clientId || '',
                description: agreement?.description || '',
                type: agreement?.type || '',
                status: agreement?.status || 'pending',
                totalAdvanced: agreement?.totalAdvanced || 0,
                interestRate: agreement?.interestRate || 0,
                numberOfInstallments: agreement?.numberOfInstallments || 0,
                createDate: agreement?.createDate ? new Date(agreement.createDate).toISOString().split('T')[0] : defaultDate,
                firstInstallmentDate: agreement?.firstInstallmentDate ? new Date(agreement.firstInstallmentDate).toISOString().split('T')[0] : defaultDate,
            });
        }
    }, [isOpen, agreement, form]);

    const onSubmit = async (values: AgreementFormValues) => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            await performAdminAction(token, 'saveLendingAgreement', { agreement: { id: agreement?.id, ...values } });
            toast({ title: agreement ? 'Agreement Updated' : 'Agreement Created' });
            onSave();
            onOpenChange(false);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Save Failed', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{agreement ? 'Edit Agreement' : 'Create New Agreement'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                        <FormField control={form.control} name="clientId" render={({ field }) => (<FormItem><FormLabel>Client</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!agreement}><FormControl><SelectTrigger><SelectValue placeholder="Select a client..." /></SelectTrigger></FormControl><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="e.g., Asset finance for Scania R500" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Agreement Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="loan">Loan</SelectItem><SelectItem value="installment-sale">Installment Sale</SelectItem><SelectItem value="lease">Lease</SelectItem><SelectItem value="factoring">Factoring</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="credit">Credit Check</SelectItem><SelectItem value="payout">Awaiting Payout</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="defaulted">Defaulted</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <FormField control={form.control} name="totalAdvanced" render={({ field }) => (<FormItem><FormLabel>Amount (R)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="interestRate" render={({ field }) => (<FormItem><FormLabel>Rate (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="numberOfInstallments" render={({ field }) => (<FormItem><FormLabel>Term (Months)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="createDate" render={({ field }) => (<FormItem><FormLabel>Creation Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="firstInstallmentDate" render={({ field }) => (<FormItem><FormLabel>First Payment Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                         </div>
                        <DialogFooter className="pt-4">
                            <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>} Save Agreement</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
