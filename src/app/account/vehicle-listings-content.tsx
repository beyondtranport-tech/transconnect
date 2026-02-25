
'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Truck } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const vehicleListingSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  price: z.coerce.number().positive('Price must be a positive number'),
});

type VehicleListingFormValues = z.infer<typeof vehicleListingSchema>;

function AddVehicleDialog({ companyId, onSave }: { companyId: string, onSave: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<VehicleListingFormValues>({
    resolver: zodResolver(vehicleListingSchema),
    defaultValues: { make: '', model: '', price: 0 },
  });

  const onSubmit = (values: VehicleListingFormValues) => {
    console.log("Form values to be saved:", values);
    toast({
      title: 'Vehicle Added (Simulation)',
      description: `The vehicle ${values.make} ${values.model} would be saved here.`,
    });
    setIsOpen(false);
    onSave();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Vehicle</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Vehicle for Sale</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField name="make" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Make</FormLabel><FormControl><Input placeholder="e.g., Scania" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField name="model" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Model</FormLabel><FormControl><Input placeholder="e.g., R 560" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField name="price" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Price (R)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <Button type="submit">Save Vehicle</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function VehicleListingsContent() {
  const { user } = useUser();
  const firestore = useFirestore();

  const listingsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.companyId) return null;
    return query(collection(firestore, `companies/${user.companyId}/vehicleListings`));
  }, [firestore, user?.companyId]);

  const { data: listings, isLoading, forceRefresh } = useCollection(listingsQuery);

  const columns: ColumnDef<any>[] = useMemo(() => [
    { accessorKey: 'make', header: 'Make' },
    { accessorKey: 'model', header: 'Model' },
    { accessorKey: 'price', header: 'Price', cell: ({ row }) => `R ${row.original.price?.toLocaleString() || '0'}` },
  ], []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Truck /> My Vehicle Listings
          </CardTitle>
          <CardDescription>
            Manage the vehicles you have listed for sale in the Buy & Sell Mall.
          </CardDescription>
        </div>
        {user?.companyId && <AddVehicleDialog companyId={user.companyId} onSave={forceRefresh} />}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <DataTable columns={columns} data={listings || []} />
        )}
      </CardContent>
    </Card>
  );
}
