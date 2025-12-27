
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, Save } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  draft: 'secondary',
  pending_review: 'outline',
  approved: 'default',
  rejected: 'destructive',
};

const shopStep1Schema = z.object({
  shopName: z.string().min(1, "Shop name is required."),
  shopDescription: z.string().min(1, "Please provide a brief description for your shop."),
  category: z.string().min(1, "Please select a category."),
});

type Step1FormValues = z.infer<typeof shopStep1Schema>;

function Step1CoreIdentity({ shopData, memberId, onSave }: { shopData: any, memberId: string, onSave: (newData: any) => void }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<Step1FormValues>({
    resolver: zodResolver(shopStep1Schema),
    defaultValues: {
      shopName: shopData.shopName || '',
      shopDescription: shopData.shopDescription || '',
      category: shopData.category || '',
    }
  });

  const onSubmit = async (values: Step1FormValues) => {
    setIsSaving(true);
    const memberDocRef = doc(firestore, 'members', memberId);
    
    const dataToUpdate = {
        shop: {
          ...shopData,
          ...values,
          updatedAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
    };

    try {
        await updateDoc(memberDocRef, dataToUpdate);
        toast({ title: 'Step 1 Saved!', description: 'Your core shop details have been updated.' });
        onSave(dataToUpdate.shop); // Pass the updated shop data back to the parent wizard
    } catch (serverError: any) {
        const permissionError = new FirestorePermissionError({
            path: memberDocRef.path, operation: 'update', requestResourceData: dataToUpdate,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: 'destructive', title: 'Update Failed', description: serverError.message });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="shopName" render={({ field }) => (
          <FormItem>
            <FormLabel>Shop Name</FormLabel>
            <FormControl><Input placeholder="My Awesome Shop" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="shopDescription" render={({ field }) => (
          <FormItem>
            <FormLabel>Shop Description</FormLabel>
            <FormControl><Textarea placeholder="Describe what your shop sells..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="category" render={({ field }) => (
          <FormItem>
            <FormLabel>Primary Category</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="Parts">Parts</SelectItem>
                <SelectItem value="Services">Services</SelectItem>
                <SelectItem value="Tires">Tires</SelectItem>
                <SelectItem value="Equipment">Equipment</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save & Continue
        </Button>
      </form>
    </Form>
  );
}

const STEPS = [
    { id: 'identity', title: 'Core Identity' },
    { id: 'location', title: 'Location & Contact' },
    { id: 'branding', title: 'Branding' },
    { id: 'seo', title: 'SEO' },
    { id: 'products', title: 'Products' },
    { id: 'preview', title: 'Preview' },
];

export default function ShopWizard({ shop, memberId }: { shop: any, memberId: string }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [shopData, setShopData] = useState(shop);

  const handleSaveAndNext = (newData: any) => {
    setShopData(newData);
    if(currentStepIndex < STEPS.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
    }
  }

  const renderStepContent = () => {
    const stepId = STEPS[currentStepIndex].id;
    switch (stepId) {
      case 'identity':
        return <Step1CoreIdentity shopData={shopData} memberId={memberId} onSave={handleSaveAndNext} />;
      case 'location':
        return <div className="text-center p-8">Step 2: Location & Contact Form will go here.</div>;
      case 'branding':
        return <div className="text-center p-8">Step 3: Branding & Appearance (Templates/Themes) will go here.</div>;
      case 'seo':
        return <div className="text-center p-8">Step 4: SEO & Metadata Form will go here.</div>;
      case 'products':
        return <div className="text-center p-8">Step 5: Product & Catalogue Management (with Image Upload) will go here.</div>;
      case 'preview':
        return <div className="text-center p-8">Step 6: Final Preview & Submit for Review will go here.</div>;
      default:
        return <div>Step not found</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Shop Setup Progress</h3>
        <Badge variant={statusColors[shop.status] || 'secondary'} className="capitalize">
            Status: {shop.status.replace(/_/g, ' ')}
        </Badge>
      </div>

      <Progress value={((currentStepIndex + 1) / STEPS.length) * 100} className="h-2" />

      <Card>
        <CardHeader>
          <CardTitle>Step {currentStepIndex + 1}: {STEPS[currentStepIndex].title}</CardTitle>
          <CardDescription>Fill out the details for this step.</CardDescription>
        </CardHeader>
        <CardContent>
            {renderStepContent()}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button onClick={() => setCurrentStepIndex(s => Math.max(0, s - 1))} disabled={currentStepIndex === 0}>
          Previous
        </Button>
        <Button onClick={() => setCurrentStepIndex(s => Math.min(STEPS.length - 1, s + 1))} disabled={currentStepIndex === STEPS.length - 1}>
          Next
        </Button>
      </div>

       {shop.status === 'approved' && (
           <div className="text-center p-4 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded-lg">
                <p className="font-semibold text-green-800 dark:text-green-200">Your shop is live! Any changes you save will be visible to the public immediately.</p>
           </div>
       )}
    </div>
  );
}
