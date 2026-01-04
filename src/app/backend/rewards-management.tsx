
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription as DialogDescriptionComponent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Loader2, PlusCircle, Edit, Trash2, Gift, Save } from 'lucide-react';
import Image from 'next/image';

const rewardSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  pointsCost: z.coerce.number().min(0, 'Points must be 0 or more'),
  type: z.enum(['voucher', 'discount', 'product']),
  isActive: z.boolean().default(true),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
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
    } else {
        form.reset({ title: '', description: '', pointsCost: 0, type: 'voucher', isActive: true, imageUrl: '' });
    }
  }, [reward, form, isOpen]);

  const onSubmit = async (values: RewardFormValues) => {
    setIsLoading(true);
    if (!firestore) return;

    try {
      const rewardRef = values.id
        ? doc(firestore, 'rewards', values.id)
        : doc(collection(firestore, 'rewards'));
        
      const dataToSave = { ...values, id: rewardRef.id, updatedAt: serverTimestamp() };
      if (!values.id) {
        // @ts-ignore
        dataToSave.createdAt = serverTimestamp();
      }

      await writeBatch(firestore).set(rewardRef, dataToSave, { merge: true }).commit();
      
      toast({ title: 'Reward Saved!', description: `${values.title} has been successfully saved.` });
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
          <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
        ) : (
          <Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Reward</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{reward ? 'Edit' : 'Add New'} Reward</DialogTitle>
          <DialogDescriptionComponent>Define a new item that members can redeem with their loyalty points.</DialogDescriptionComponent>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField name="title" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} placeholder="e.g., R100 Fuel Voucher" /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField name="description" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} placeholder="Valid at all Shell service stations." /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField name="imageUrl" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Image URL (Optional)</FormLabel><FormControl><Input {...field} placeholder="https://example.com/image.png" /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
               <FormField name="pointsCost" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Points Cost</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
               <FormField name="type" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Reward Type</FormLabel>
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
             <FormField name="isActive" control={form.control} render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>Inactive rewards won't be visible to members.</FormDescription>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
            )} />
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
      await writeBatch(firestore).delete(doc(firestore, 'rewards', rewardId)).commit();
      toast({ title: 'Reward Deleted', description: 'The reward has been removed.' });
      forceRefresh();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle className="flex items-center gap-2"><Gift className="h-6 w-6"/>Rewards Management</CardTitle>
            <CardDescription>Create, edit, and manage the rewards available for members to redeem.</CardDescription>
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
                  <TableHead className="w-[80px]">Status</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Points Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rewards && rewards.length > 0 ? rewards.map(reward => (
                  <TableRow key={reward.id}>
                    <TableCell>
                      <span className={`inline-block h-2 w-2 rounded-full ${reward.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-3">
                            {reward.imageUrl ? (
                                <Image src={reward.imageUrl} alt={reward.title} width={40} height={40} className="rounded-md object-cover" />
                            ) : (
                                <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center">
                                    <Gift className="h-5 w-5 text-muted-foreground" />
                                </div>
                            )}
                            <div>
                                <div className="font-semibold">{reward.title}</div>
                                <div className="text-xs text-muted-foreground">{reward.description}</div>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell className="capitalize">{reward.type}</TableCell>
                    <TableCell className="font-mono font-semibold">{reward.pointsCost.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                        <RewardDialog reward={reward} onSave={forceRefresh} />
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(reward.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No rewards have been created yet.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
