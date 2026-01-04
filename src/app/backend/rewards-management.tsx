
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, Save, Edit, Trash2, Gift, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, getClientSideAuthToken } from '@/firebase';
import { collection, query, doc, writeBatch, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import Image from 'next/image';

const rewardSchema = z.object({
  id: z.string().min(1, 'ID is required (e.g., "fuel-voucher-500")').regex(/^[a-z0-9-]+$/, 'ID must be lowercase with dashes only.'),
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
  pointsCost: z.coerce.number().min(0, 'Points cost must be non-negative.'),
  type: z.enum(['voucher', 'discount', 'product']),
  isActive: z.boolean().default(true),
  imageUrl: z.string().url('Must be a valid URL.').optional().or(z.literal('')),
});

type RewardFormValues = z.infer<typeof rewardSchema>;

function RewardDialog({ reward, onSave }: { reward?: RewardFormValues; onSave: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<RewardFormValues>({
    resolver: zodResolver(rewardSchema),
    defaultValues: reward || {
      id: '',
      title: '',
      description: '',
      pointsCost: 0,
      type: 'voucher',
      isActive: true,
      imageUrl: '',
    },
  });

  useEffect(() => {
    if (reward) {
      form.reset(reward);
    }
  }, [reward, form]);

  const onSubmit = async (values: RewardFormValues) => {
    setIsLoading(true);
    if (!firestore) return;

    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Authentication failed.");

      const rewardRef = doc(firestore, 'rewards', values.id);
      
      const response = await fetch('/api/updateConfigDoc', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
              path: `rewards/${values.id}`,
              data: { ...values, updatedAt: { _methodName: 'serverTimestamp' } }
          }),
      });

      if (!response.ok) throw new Error((await response.json()).error || 'Failed to save reward.');
      
      toast({ title: 'Reward Saved!', description: `${values.title} has been saved.` });
      onSave();
      setIsOpen(false);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Save Failed', description: e.message });
    } finally {
      setIsLoading(false);
    }
  };
  
  const imageUrl = form.watch('imageUrl');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {reward ? (
          <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
        ) : (
          <Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Reward</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{reward ? 'Edit' : 'Add New'} Redeemable Reward</DialogTitle>
           <DialogDescription>Define the items members can purchase with their loyalty points.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="id" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Reward ID</FormLabel><FormControl><Input {...field} disabled={!!reward} placeholder="e.g., fuel-voucher-500" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="title" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} placeholder="e.g., R500 Fuel Voucher" /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
            <FormField name="description" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} placeholder="Valid at any Shell station nationwide." /></FormControl><FormMessage /></FormItem>
            )} />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="pointsCost" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Points Cost</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="type" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="voucher">Voucher</SelectItem>
                                <SelectItem value="discount">Discount</SelectItem>
                                <SelectItem value="product">Physical Product</SelectItem>
                            </SelectContent>
                        </Select>
                    <FormMessage /></FormItem>
                )} />
            </div>
             <FormField name="imageUrl" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Image URL (Optional)</FormLabel><FormControl><Input type="url" {...field} placeholder="https://example.com/image.png" /></FormControl><FormMessage /></FormItem>
            )} />
            {imageUrl && (
                <div className="flex items-center gap-4 p-4 border rounded-md">
                     <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    <div className="relative h-20 w-32 bg-muted rounded-md overflow-hidden">
                        <Image src={imageUrl} alt="Reward preview" layout="fill" objectFit="contain" />
                    </div>
                    <p className="text-xs text-muted-foreground">Image Preview</p>
                </div>
            )}
             <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <FormLabel>Active</FormLabel>
                            <FormDescription>
                                If active, this reward will be visible to members in the redemption store.
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Reward
              </Button>
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

  const rewardsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'rewards'));
  }, [firestore]);
  
  const { data: rewards, isLoading, forceRefresh } = useCollection<RewardFormValues>(rewardsQuery);

  const handleDelete = async (rewardId: string) => {
     if (!firestore) return;

    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Authentication failed.");

      const response = await fetch('/api/deleteConfigDoc', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: `rewards/${rewardId}` }),
      });
      
       if (!response.ok) throw new Error((await response.json()).error || 'Failed to delete reward.');

      toast({ title: 'Reward Deleted', description: 'The reward has been removed from the catalog.' });
      forceRefresh();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle className="flex items-center gap-2"><Gift /> Redeemable Rewards Catalog</CardTitle>
            <CardDescription>Manage the rewards members can purchase with their loyalty points.</CardDescription>
        </div>
        <RewardDialog onSave={forceRefresh} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Points Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rewards && rewards.map(reward => (
                  <TableRow key={reward.id}>
                    <TableCell className="font-semibold">{reward.title}</TableCell>
                    <TableCell className="capitalize">{reward.type}</TableCell>
                    <TableCell>{reward.pointsCost.toLocaleString()}</TableCell>
                    <TableCell>{reward.isActive ? "Active" : "Inactive"}</TableCell>
                    <TableCell className="text-right">
                        <RewardDialog reward={reward} onSave={forceRefresh} />
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(reward.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {(!rewards || rewards.length === 0) && <p className="p-8 text-center text-muted-foreground">No rewards created yet.</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
