
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
import { Loader2, Save, CheckCircle, LayoutGrid, List, Image as ImageIcon } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';


const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  draft: 'secondary',
  pending_review: 'outline',
  approved: 'default',
  rejected: 'destructive',
};

// ====== STEP 1: Core Identity ======
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
        onSave(dataToUpdate.shop);
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


// ====== STEP 2: Location & Contact ======
const shopStep2Schema = z.object({
  contactEmail: z.string().email("Invalid email address.").or(z.literal('')),
  contactPhone: z.string().optional(),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
});

type Step2FormValues = z.infer<typeof shopStep2Schema>;

function Step2LocationContact({ shopData, memberId, onSave }: { shopData: any, memberId: string, onSave: (newData: any) => void }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<Step2FormValues>({
    resolver: zodResolver(shopStep2Schema),
    defaultValues: {
      contactEmail: shopData.contactEmail || '',
      contactPhone: shopData.contactPhone || '',
      streetAddress: shopData.streetAddress || '',
      city: shopData.city || '',
      province: shopData.province || '',
      postalCode: shopData.postalCode || '',
    }
  });

  const onSubmit = async (values: Step2FormValues) => {
    setIsSaving(true);
    const memberDocRef = doc(firestore, 'members', memberId);
    
    const dataToUpdate = {
        shop: { ...shopData, ...values, updatedAt: serverTimestamp() },
        updatedAt: serverTimestamp()
    };

    try {
        await updateDoc(memberDocRef, dataToUpdate);
        toast({ title: 'Step 2 Saved!', description: 'Your location and contact info has been updated.' });
        onSave(dataToUpdate.shop);
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
            <h3 className="text-lg font-medium">Contact Information</h3>
            <Separator className="my-2" />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <FormField control={form.control} name="contactEmail" render={({ field }) => (
                <FormItem>
                    <FormLabel>Public Contact Email</FormLabel>
                    <FormControl><Input placeholder="sales@myshop.co.za" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )} />
                <FormField control={form.control} name="contactPhone" render={({ field }) => (
                <FormItem>
                    <FormLabel>Public Contact Phone</FormLabel>
                    <FormControl><Input placeholder="011 123 4567" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )} />
            </div>
        </div>

        <div>
            <h3 className="text-lg font-medium">Shop Address</h3>
            <Separator className="my-2" />
            <div className="space-y-4 pt-2">
                <FormField control={form.control} name="streetAddress" render={({ field }) => (
                    <FormItem><FormLabel>Street Address</FormLabel><FormControl><Input placeholder="123 Transport Lane" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="city" render={({ field }) => (
                        <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="Johannesburg" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="province" render={({ field }) => (
                        <FormItem><FormLabel>Province</FormLabel><FormControl><Input placeholder="Gauteng" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="postalCode" render={({ field }) => (
                        <FormItem><FormLabel>Postal Code</FormLabel><FormControl><Input placeholder="2196" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
            </div>
        </div>
        
        <Button type="submit" disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save & Continue
        </Button>
      </form>
    </Form>
  );
}

// ====== STEP 3: Branding & Appearance ======
const templates = [
  { id: 'modern-grid', name: 'Modern Grid', icon: LayoutGrid },
  { id: 'classic-list', name: 'Classic List', icon: List },
  { id: 'image-focused', name: 'Image Focused', icon: ImageIcon },
];

const themes = [
  { id: 'forest-green', name: 'Forest Green', color: 'bg-green-700' },
  { id: 'midnight-blue', name: 'Midnight Blue', color: 'bg-blue-800' },
  { id: 'charcoal-gray', name: 'Charcoal Gray', color: 'bg-gray-700' },
];

const shopStep3Schema = z.object({
  template: z.string().min(1, "Please select a template."),
  theme: z.string().min(1, "Please select a color theme."),
});

type Step3FormValues = z.infer<typeof shopStep3Schema>;

function Step3Branding({ shopData, memberId, onSave }: { shopData: any, memberId: string, onSave: (newData: any) => void }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<Step3FormValues>({
    resolver: zodResolver(shopStep3Schema),
    defaultValues: {
      template: shopData.template || 'modern-grid',
      theme: shopData.theme || 'forest-green',
    }
  });

  const onSubmit = async (values: Step3FormValues) => {
    setIsSaving(true);
    const memberDocRef = doc(firestore, 'members', memberId);
    
    const dataToUpdate = {
        shop: { ...shopData, ...values, updatedAt: serverTimestamp() },
        updatedAt: serverTimestamp()
    };

    try {
        await updateDoc(memberDocRef, dataToUpdate);
        toast({ title: 'Step 3 Saved!', description: 'Your branding settings have been updated.' });
        onSave(dataToUpdate.shop);
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="template"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-base">Choose a layout template</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {templates.map((template) => {
                    const Icon = template.icon;
                    return (
                        <FormItem key={template.id}>
                          <FormControl>
                            <RadioGroupItem value={template.id} id={template.id} className="sr-only" />
                          </FormControl>
                          <Label
                            htmlFor={template.id}
                            className={cn(
                              "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                              field.value === template.id && "border-primary"
                            )}
                          >
                            <Icon className="h-10 w-10 mb-2" />
                            {template.name}
                          </Label>
                        </FormItem>
                    )
                  })}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="theme"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-base">Choose a color theme</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {themes.map((theme) => (
                    <FormItem key={theme.id}>
                       <FormControl>
                          <RadioGroupItem value={theme.id} id={theme.id} className="sr-only" />
                      </FormControl>
                      <Label
                        htmlFor={theme.id}
                        className={cn(
                          "flex items-center gap-4 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                          field.value === theme.id && "border-primary"
                        )}
                      >
                        <div className={cn("h-6 w-6 rounded-full", theme.color)} />
                        {theme.name}
                      </Label>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save & Continue
        </Button>
      </form>
    </Form>
  );
}


// ====== WIZARD CONTROLLER ======
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
        return <Step2LocationContact shopData={shopData} memberId={memberId} onSave={handleSaveAndNext} />;
      case 'branding':
        return <Step3Branding shopData={shopData} memberId={memberId} onSave={handleSaveAndNext} />;
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
