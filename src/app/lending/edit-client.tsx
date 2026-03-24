
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { getClientSideAuthToken } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

const clientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  code: z.string().optional(),
  type: z.string().min(1, 'Client type is required'),
  category: z.string().optional(),
  status: z.enum(['draft', 'active', 'inactive', 'suspended']).default('draft'),
  contactPerson: z.string().optional(),
  cell: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
});
type ClientFormValues = z.infer<typeof clientSchema>;

interface EditClientProps {
  client?: any;
  onSave: () => void;
  onBack: () => void;
}

export function EditClientWizard({ client, onSave, onBack }: EditClientProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema),
    });

    useEffect(() => {
        form.reset(client || { name: '', code: '', type: '', category: '', status: 'draft', contactPerson: '', cell: '', email: '' });
    }, [client, form]);

    const onSubmit = async (values: ClientFormValues) => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            await performAdminAction(token, 'saveLendingClient', { client: { id: client?.id, ...values } });
            toast({ title: client ? 'Client Updated' : 'Client Created' });
            onSave();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Save Failed', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                 <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{client ? 'Edit Client' : 'Add New Client'}</CardTitle>
                        <CardDescription>Enter the details for the client.</CardDescription>
                    </div>
                    <Button variant="outline" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4"/>Back to List</Button>
                </div>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Client Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a type..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="company">Company</SelectItem><SelectItem value="individual">Individual</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        </div>
                         <FormField control={form.control} name="contactPerson" render={({ field }) => (<FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="cell" render={({ field }) => (<FormItem><FormLabel>Mobile Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>} Save Client</Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
