'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PlusCircle, Edit, Trash2, Gift } from "lucide-react";
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// API Helper
async function performAdminAction(token: string, action: string, payload?: any) {
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


const rewardSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['voucher', 'discount', 'product']),
});
type RewardFormValues = z.infer<typeof rewardSchema>;

function RewardDialog({ reward, onSave }: { reward?: any, onSave: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<RewardFormValues>({
        resolver: zodResolver(rewardSchema),
    });
    
    useEffect(() => {
        if(isOpen) {
            form.reset({
                id: reward?.id,
                title: reward?.title || '',
                type: reward?.type || 'voucher',
            });
        }
    }, [isOpen, reward, form]);

    const onSubmit = async (values: RewardFormValues) => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if(!token) throw new Error("Authentication failed.");

            // Keep existing values when editing, only update what's in the form
            const dataToSave = { 
                ...reward, // Keep old data
                ...values, // Overwrite with new data from form
                isActive: reward?.isActive ?? true // Ensure isActive is set on create
            };
            const path = `rewards/${reward?.id || dataToSave.title.toLowerCase().replace(/\s+/g, '-')}`;
            delete dataToSave.id; // Don't save the ID inside the doc

            const response = await fetch('/api/updateConfigDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ path, data: { ...dataToSave, updatedAt: { _methodName: 'serverTimestamp' } } }),
            });

            if (!response.ok) throw new Error((await response.json()).error || 'Failed to save reward.');
            
            toast({ title: reward ? 'Reward Updated' : 'Reward Created' });
            onSave();
            setIsOpen(false);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Save Failed', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {reward ? (
                    <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                ) : (
                    <Button><PlusCircle className="mr-2 h-4 w-4"/>Add Reward</Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{reward ? 'Edit' : 'Create'} Reward</DialogTitle>
                    <DialogDescription>Define a reward that members can redeem with their points.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="title" render={({field}) => <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>} />
                        <FormField control={form.control} name="type" render={({field}) => (
                            <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a type..."/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="voucher">
                                            <div>
                                                <p>Voucher</p>
                                                <p className="text-xs text-muted-foreground">e.g., R100 Fuel Voucher</p>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="discount">
                                            <div>
                                                <p>Discount</p>
                                                <p className="text-xs text-muted-foreground">e.g., 10% off next purchase</p>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="product">
                                             <div>
                                                <p>Product</p>
                                                <p className="text-xs text-muted-foreground">e.g., Free branded cap</p>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage/>
                            </FormItem>
                        )} />
                        <DialogFooter>
                            <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Save</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function RewardsManagement() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [rewardToDelete, setRewardToDelete] = useState<any | null>(null);

    const rewardsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'rewards')) : null, [firestore]);
    const { data: rewards, isLoading, forceRefresh } = useCollection(rewardsQuery);

    const handleDelete = async () => {
        if (!rewardToDelete) return;
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            await fetch('/api/deleteConfigDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: `rewards/${rewardToDelete.id}` }),
            });
            toast({ title: "Reward Deleted" });
            forceRefresh();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Deletion Failed", description: e.message });
        } finally {
            setRewardToDelete(null);
        }
    };
    
    const columns: ColumnDef<RewardFormValues>[] = useMemo(() => [
        { accessorKey: 'title', header: 'Title' },
        { accessorKey: 'pointsCost', header: 'Points Cost' },
        { accessorKey: 'type', header: 'Type' },
        { accessorKey: 'isActive', header: 'Status', cell: ({row}) => <Badge variant={row.original.isActive ? 'default' : 'secondary'}>{row.original.isActive ? 'Active' : 'Inactive'}</Badge> },
        { id: 'actions', header: <div className="text-right">Actions</div>, cell: ({row}) => (
            <div className="flex justify-end items-center">
                <RewardDialog reward={row.original} onSave={forceRefresh} />
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setRewardToDelete(row.original)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently delete the reward "{row.original.title}".</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setRewardToDelete(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: 'destructive' })}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        )},
    ], [forceRefresh, handleDelete]);

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-start">
                <div>
                    <CardTitle className="flex items-center gap-2"><Gift className="h-6 w-6" />Rewards Plan Settings</CardTitle>
                    <CardDescription>Create and manage the redeemable rewards for the loyalty program.</CardDescription>
                </div>
                <RewardDialog onSave={forceRefresh} />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <DataTable columns={columns} data={rewards || []} />
                )}
            </CardContent>
        </Card>
    )
}
