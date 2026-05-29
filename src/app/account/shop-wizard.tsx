
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, getClientSideAuthToken, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { 
    Loader2, Save, CheckCircle, PlusCircle, Edit, Trash2, Send, Truck, MapPin, 
    DollarSign, ArrowRight, ArrowLeft, Info, Sparkles, ImageIcon, Wand2, 
    Home, BookOpen, ShieldCheck, Map, UploadCloud, Download, Upload
} from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generateImage } from '@/ai/flows/image-generation-flow';
import { imageEdit } from '@/ai/flows/image-edit-flow';

// ====== SCHEMAS ======

const shopFormSchema = z.object({
  shopName: z.string().min(1, "Branding name is required."),
  category: z.string().min(1, "Please select a category."),
  websiteUrl: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
  contactEmail: z.string().email("Please enter a valid email.").optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  homeHeading: z.string().min(5, "Home heading must be at least 5 characters."),
  homeSubheading: z.string().optional(),
  aboutText: z.string().min(20, "About text must be a detailed summary."),
  logoUrl: z.string().optional(),
  heroBannerUrl: z.string().optional(),
  termsText: z.string().min(20, "Please provide terms and conditions."),
  privacyText: z.string().min(20, "Please provide a privacy policy."),
});

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().positive('Price must be a positive number'),
  sku: z.string().optional(),
  stock: z.coerce.number().min(0).optional(),
  imageUrl: z.string().optional(),
});

const routeSchema = z.object({
    name: z.string().min(1, 'Origin (From) is required'),
    destination: z.string().min(1, 'Destination (To) is required'),
    description: z.string().min(1, 'Service details are required'),
    price: z.coerce.number().positive('Rate must be a positive number'),
    rateType: z.enum(['per-km', 'flat-rate']).default('per-km'),
    vehicleType: z.string().min(1, 'Vehicle type is required'),
    imageUrl: z.string().optional(),
});

// ====== UTILS ======

const fileToDataUri = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
});

// ====== SHARED AI COMPONENTS ======

function AIToolModal({ 
    type, 
    initialPrompt, 
    onResult, 
    targetField 
}: { 
    type: 'generate' | 'edit', 
    initialPrompt: string, 
    onResult: (url: string) => void,
    targetField: string 
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [prompt, setPrompt] = useState(initialPrompt);
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useUser();
    const { toast } = useToast();

    const handleAction = async () => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed.");

            let result;
            if (type === 'generate') {
                result = await generateImage({ prompt });
            } else {
                throw new Error("Enhancer requires a source image.");
            }

            if (!result.imageDataUri) throw new Error("AI failed to return image.");

            const folder = `user-assets/${user.uid}/shop-ai`;
            const fileName = `ai_${targetField}_${Date.now()}.png`;
            
            const uploadRes = await fetch('/api/uploadImageAsset', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileDataUri: result.imageDataUri, folder, fileName })
            });
            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(uploadData.error);

            onResult(uploadData.url);
            setIsOpen(false);
            toast({ title: "AI Asset Ready!" });

        } catch (e: any) {
            toast({ variant: 'destructive', title: "AI Error", description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    {type === 'generate' ? <Sparkles className="h-4 w-4" /> : <Wand2 className="h-4 w-4" />}
                    {type === 'generate' ? `Generate with AI` : `Enhance with AI`}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>AI Content Creator</DialogTitle>
                    <DialogDescription>Describe exactly what you want the AI to create for your {targetField.replace('Url', '')}.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Textarea 
                        value={prompt} 
                        onChange={e => setPrompt(e.target.value)} 
                        placeholder="e.g. A minimalist logo for a transport company with green and grey tones..."
                        rows={4}
                    />
                    <div className="bg-muted aspect-video rounded-md flex items-center justify-center border-2 border-dashed">
                        {isLoading ? (
                            <div className="text-center space-y-2">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                <p className="text-xs text-muted-foreground font-medium">AI is thinking...</p>
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground italic">Your generated asset will appear here.</p>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleAction} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                        Generate Asset
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ====== STEP COMPONENTS ======

function StepCoreIdentity({ canEdit }: { canEdit: boolean }) {
  const { control } = useFormContext<z.infer<typeof shopFormSchema>>();
  return (
    <div className="space-y-6">
        <fieldset disabled={!canEdit} className="space-y-6">
            <FormField control={control} name="shopName" render={({ field }) => (
                <FormItem>
                    <FormLabel>Public Branding Name</FormLabel>
                    <FormControl><Input placeholder="e.g. Swift Hauliers" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField control={control} name="category" render={({ field }) => (
                <FormItem>
                    <FormLabel>Industry Focus</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="Long-Haul">Long-Haul</SelectItem>
                            <SelectItem value="Local-Distribution">Local Distribution</SelectItem>
                            <SelectItem value="Refrigerated">Refrigerated</SelectItem>
                            <SelectItem value="Parts">Parts & Equipment</SelectItem>
                            <SelectItem value="Services">Services</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )} />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={control} name="contactEmail" render={({ field }) => (
                    <FormItem><FormLabel>Public Contact Email</FormLabel><FormControl><Input placeholder="contact@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={control} name="contactPhone" render={({ field }) => (
                    <FormItem><FormLabel>Public Contact Phone</FormLabel><FormControl><Input placeholder="011 123 4567" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
        </fieldset>
    </div>
  );
}

function StepMedia({ canEdit }: { canEdit: boolean }) {
    const { setValue, watch } = useFormContext<z.infer<typeof shopFormSchema>>();
    const logo = watch('logoUrl');
    const banner = watch('heroBannerUrl');
    const shopName = watch('shopName');
    const { user } = useUser();
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState<string | null>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'heroBannerUrl') => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(field);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed.");

            const dataUri = await fileToDataUri(file);
            const folder = `user-assets/${user.uid}/shop-branding`;
            const fileName = `${field}_${Date.now()}_${file.name}`;

            const res = await fetch('/api/uploadImageAsset', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileDataUri: dataUri, folder, fileName, contentType: file.type })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setValue(field, data.url, { shouldValidate: true });
            toast({ title: "Image Uploaded" });
        } catch (err: any) {
            toast({ variant: 'destructive', title: "Upload Failed", description: err.message });
        } finally {
            setIsUploading(null);
        }
    };

    return (
        <div className="space-y-10">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2"><ImageIcon className="h-5 w-5"/> Brand Identity</h3>
                        <p className="text-xs text-muted-foreground">Upload or generate your company logo.</p>
                    </div>
                    <div className="flex gap-2">
                        <label className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), "cursor-pointer gap-2")}>
                            {isUploading === 'logoUrl' ? <Loader2 className="h-4 w-4 animate-spin"/> : <Upload className="h-4 w-4" />}
                            Upload
                            <input type="file" className="hidden" accept="image/*" onChange={e => handleUpload(e, 'logoUrl')} disabled={!!isUploading || !canEdit} />
                        </label>
                        <AIToolModal 
                            type="generate" 
                            targetField="logoUrl" 
                            initialPrompt={`A minimalist, modern vector logo for a company called "${shopName}". Professional logistics theme.`}
                            onResult={url => setValue('logoUrl', url)} 
                        />
                    </div>
                </div>
                <div className="relative aspect-square w-32 border rounded-lg bg-muted overflow-hidden">
                    {logo ? <Image src={logo} alt="Logo" fill className="object-contain" /> : <div className="flex items-center justify-center h-full"><ImageIcon className="opacity-20"/></div>}
                </div>
            </div>

            <Separator />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2"><Sparkles className="h-5 w-5"/> Profile Banner</h3>
                        <p className="text-xs text-muted-foreground">This is the first image customers see.</p>
                    </div>
                    <div className="flex gap-2">
                        <label className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), "cursor-pointer gap-2")}>
                            {isUploading === 'heroBannerUrl' ? <Loader2 className="h-4 w-4 animate-spin"/> : <Upload className="h-4 w-4" />}
                            Upload
                            <input type="file" className="hidden" accept="image/*" onChange={e => handleUpload(e, 'heroBannerUrl')} disabled={!!isUploading || !canEdit} />
                        </label>
                        <AIToolModal 
                            type="generate" 
                            targetField="heroBannerUrl" 
                            initialPrompt={`A high-resolution professional hero banner for a logistics company dashboard. Cinematic lighting, trucks, or supply chain theme.`}
                            onResult={url => setValue('heroBannerUrl', url)} 
                        />
                    </div>
                </div>
                <div className="relative aspect-video w-full border rounded-xl bg-muted overflow-hidden">
                    {banner ? <Image src={banner} alt="Banner" fill className="object-cover" /> : <div className="flex items-center justify-center h-full"><ImageIcon className="opacity-20 h-10 w-10"/></div>}
                </div>
            </div>
        </div>
    );
}

function StepContent({ canEdit }: { canEdit: boolean }) {
    const { control } = useFormContext<z.infer<typeof shopFormSchema>>();
    return (
        <div className="space-y-6">
            <fieldset disabled={!canEdit} className="space-y-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><Home className="h-5 w-5"/> Home Page Wording</h3>
                    <FormField control={control} name="homeHeading" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Welcome Headline</FormLabel>
                            <FormControl><Input placeholder="e.g. Reliable Freight Solutions Across SA" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={control} name="homeSubheading" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Subheading (Intro)</FormLabel>
                            <FormControl><Textarea placeholder="A brief catch-phrase or introduction..." {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <Separator />
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><BookOpen className="h-5 w-5"/> About Us Wording</h3>
                    <FormField control={control} name="aboutText" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Company Bio / Summary</FormLabel>
                            <FormControl><Textarea placeholder="Describe your history, expertise, and why customers should trust you..." className="min-h-[150px]" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
            </fieldset>
        </div>
    );
}

function StepLegal({ canEdit }: { canEdit: boolean }) {
    const { control } = useFormContext<z.infer<typeof shopFormSchema>>();
    return (
        <div className="space-y-6">
            <fieldset disabled={!canEdit} className="space-y-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><ShieldCheck className="h-5 w-5"/> Legal Documents</h3>
                    <FormField control={control} name="termsText" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Terms & Conditions</FormLabel>
                            <FormControl><Textarea placeholder="Your service level agreement or standard terms..." className="min-h-[150px]" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={control} name="privacyText" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Privacy Policy</FormLabel>
                            <FormControl><Textarea placeholder="How you handle customer data..." className="min-h-[150px]" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
            </fieldset>
        </div>
    );
}

function ProductDialog({ shop, item, onComplete, children, canEdit }: { shop: any, item?: any, onComplete: () => void, children: React.ReactNode, canEdit: boolean }) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const isTransporter = shop.shopType === 'transporter';
  const { user } = useUser();

  const form = useForm<any>({
    resolver: zodResolver(isTransporter ? routeSchema : productSchema),
    defaultValues: item || (isTransporter 
        ? { name: '', destination: '', description: '', price: 0, rateType: 'per-km', vehicleType: '', imageUrl: '' } 
        : { name: '', description: '', price: 0, sku: '', stock: 0, imageUrl: '' }),
  });
  
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Auth failed.");

        const dataUri = await fileToDataUri(file);
        const folder = `user-assets/${user.uid}/shop-products`;
        const fileName = `product_${Date.now()}_${file.name}`;

        const res = await fetch('/api/uploadImageAsset', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileDataUri: dataUri, folder, fileName, contentType: file.type })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        form.setValue('imageUrl', data.url, { shouldValidate: true });
        toast({ title: "Photo Uploaded" });
    } catch (err: any) {
        toast({ variant: 'destructive', title: "Upload Failed", description: err.message });
    } finally {
        setIsUploading(false);
    }
  };

  const onSubmit = async (values: any) => {
    setIsSaving(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Auth failed.");
        const path = item ? `companies/${shop.companyId}/shops/${shop.id}/products/${item.id}` : `companies/${shop.companyId}/shops/${shop.id}/products`;
        const response = await fetch(item ? '/api/updateUserDoc' : '/api/addUserDoc', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(item ? { path, data: { ...values, updatedAt: { _methodName: 'serverTimestamp' } } } : { collectionPath: path, data: values }),
        });
        if (!response.ok) throw new Error("Save failed");
        toast({ title: 'Saved!' });
        onComplete();
        setIsOpen(false);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Save Failed' });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit' : 'Add New'} {isTransporter ? 'Service Lane' : 'Product'}</DialogTitle>
          <DialogDescription>{isTransporter ? 'Define your routes and rates for shippers to find you.' : 'List a product for sale.'}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
             <div className="flex gap-6 items-start">
                <div className="relative h-32 w-32 border rounded-lg bg-muted shrink-0 overflow-hidden group">
                    {form.watch('imageUrl') ? <Image src={form.watch('imageUrl')} alt="Preview" fill className="object-cover" /> : <div className="flex items-center justify-center h-full"><ImageIcon className="opacity-20"/></div>}
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                        <label className="cursor-pointer bg-white/20 hover:bg-white/40 p-1.5 rounded-full backdrop-blur-md">
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin text-white"/> : <Upload className="h-4 w-4 text-white" />}
                            <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isUploading} />
                        </label>
                        <AIToolModal 
                            type="generate" 
                            targetField="productImage" 
                            initialPrompt={isTransporter ? `A professional logistics photo of a truck driving from ${form.watch('name')} to ${form.watch('destination')}.` : `A clean studio photo of ${form.watch('name')}.`}
                            onResult={url => form.setValue('imageUrl', url)} 
                        />
                    </div>
                </div>
                <div className="flex-1 space-y-4">
                    <div className={cn("grid gap-4", isTransporter ? "grid-cols-2" : "grid-cols-1")}>
                        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>{isTransporter ? 'Origin (From)' : 'Product Name'}</FormLabel><FormControl><Input placeholder={isTransporter ? "e.g. Johannesburg" : ""} {...field} /></FormControl><FormMessage /></FormItem> )} />
                        {isTransporter && (
                            <FormField control={form.control} name="destination" render={({ field }) => ( <FormItem><FormLabel>Destination (To)</FormLabel><FormControl><Input placeholder="e.g. Durban" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        )}
                    </div>
                    <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>{isTransporter ? 'Service Frequency/Details' : 'Description'}</FormLabel><FormControl><Textarea placeholder={isTransporter ? "e.g. Twice weekly departures..." : "Product specs..."} {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="price" render={({ field }) => ( <FormItem><FormLabel>{isTransporter ? 'Rate (R)' : 'Price (R)'}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                {isTransporter ? (
                    <FormField control={form.control} name="rateType" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Pricing Model</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a type..." /></SelectTrigger></FormControl>
                                <SelectContent><SelectItem value="per-km">Per Kilometer</SelectItem><SelectItem value="flat-rate">Flat Rate</SelectItem></SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                ) : (
                    <FormField control={form.control} name="stock" render={({ field }) => ( <FormItem><FormLabel>Units in Stock</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                )}
             </div>
             {isTransporter && (
                <FormField control={form.control} name="vehicleType" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Required Vehicle Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Tautliner">Tautliner</SelectItem>
                                <SelectItem value="Flatbed">Flatbed</SelectItem>
                                <SelectItem value="Reefer">Reefer (Cold)</SelectItem>
                                <SelectItem value="Superlink">Superlink</SelectItem>
                                <SelectItem value="Tipper">Tipper</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormItem>
                )} />
             )}
             <DialogFooter className="pt-4 border-t">
                 <Button type="submit" disabled={isSaving || isUploading}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save {isTransporter ? 'Service Lane' : 'Product'}
                 </Button>
             </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function StepCatalog({ shop, canEdit }: { shop: any, canEdit: boolean }) {
  const firestore = useFirestore();
  const isTransporter = shop.shopType === 'transporter';

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !shop?.companyId || !shop?.id) return null;
    return collection(firestore, `companies/${shop.companyId}/shops/${shop.id}/products`);
  }, [firestore, shop.companyId, shop.id]);

  const { data: items, isLoading, forceRefresh } = useCollection(productsQuery);
  
  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">{isTransporter ? 'Service Lanes (Routes & Rates)' : 'Product Catalog'}</h3>
             <ProductDialog shop={shop} onComplete={forceRefresh} canEdit={canEdit}>
                <Button disabled={!canEdit}><PlusCircle className="mr-2 h-4 w-4" /> Add {isTransporter ? 'Service Lane' : 'Product'}</Button>
            </ProductDialog>
        </div>

        {isLoading ? (
            <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : items && items.length > 0 ? (
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{isTransporter ? 'From' : 'Name'}</TableHead>
                            <TableHead>{isTransporter ? 'To' : 'Price'}</TableHead>
                            <TableHead>{isTransporter ? 'Rate' : 'Stock'}</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>{isTransporter ? item.destination : `R ${item.price}`}</TableCell>
                                <TableCell>
                                    {isTransporter ? (
                                        <div className="flex flex-col">
                                            <span className="font-bold">R {item.price}</span>
                                            <span className="text-[10px] uppercase text-muted-foreground">{item.rateType?.replace('-', ' ')}</span>
                                        </div>
                                    ) : (
                                        item.stock
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <ProductDialog shop={shop} item={item} onComplete={forceRefresh} canEdit={canEdit}>
                                            <Button variant="ghost" size="icon" disabled={!canEdit}><Edit className="h-4 w-4" /></Button>
                                        </ProductDialog>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        ) : (
            <Alert><MapPin className="h-4 w-4" /><AlertTitle>Catalogue is empty!</AlertTitle><AlertDescription>List your first {isTransporter ? 'service lane' : 'product'} to enable customers to find you.</AlertDescription></Alert>
        )}
    </div>
  );
}

function StepFleetGallery({ shop, canEdit }: { shop: any, canEdit: boolean }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [selectedFleetIds, setSelectedFleetIds] = useState<string[]>(shop.showcaseFleetIds || []);

    const contributionsQuery = useMemoFirebase(() => {
        if (!firestore || !shop.companyId) return null;
        return query(collection(firestore, 'contributions'), orderBy('createdAt', 'desc'));
    }, [firestore, shop.companyId]);
    
    const { data: allContributions, isLoading } = useCollection(contributionsQuery);
    const myFleet = useMemo(() => allContributions?.filter(c => c.companyId === shop.companyId) || [], [allContributions, shop.companyId]);

    const handleToggleFleet = (id: string) => {
        setSelectedFleetIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    }

    const handleSaveShowcase = async () => {
        setIsSaving(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            await fetch('/api/updateUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: `companies/${shop.companyId}/shops/${shop.id}`,
                    data: { showcaseFleetIds: selectedFleetIds, updatedAt: { _methodName: 'serverTimestamp' } }
                })
            });
            toast({ title: "Showcase Updated", description: `${selectedFleetIds.length} items linked to your profile.` });
        } catch (e) {
            toast({ variant: 'destructive', title: "Error linking fleet" });
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold">Verified Fleet Gallery</h3>
                <p className="text-sm text-muted-foreground mt-1">Select from your contributed fleet data to showcase verified capacity on your profile.</p>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
            ) : myFleet.length > 0 ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myFleet.map(item => (
                            <Card key={item.id} className={cn("border shadow-none transition-all cursor-pointer", selectedFleetIds.includes(item.id) ? "border-primary bg-primary/5 ring-1 ring-primary" : "")} onClick={() => handleToggleFleet(item.id)}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-muted p-2 rounded-md"><Truck className="h-6 w-6 text-primary" /></div>
                                        <div>
                                            <p className="font-bold">{item.data?.year} {item.data?.make}</p>
                                            <p className="text-xs text-muted-foreground uppercase">{item.type} • {item.data?.model}</p>
                                        </div>
                                    </div>
                                    <Checkbox checked={selectedFleetIds.includes(item.id)} onCheckedChange={() => handleToggleFleet(item.id)} />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    <Button onClick={handleSaveShowcase} disabled={isSaving || !canEdit}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                        Save Showcase Selections
                    </Button>
                </div>
            ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Truck className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
                    <p className="mt-4 font-semibold">No verified fleet found.</p>
                    <p className="text-sm text-muted-foreground">To showcase your fleet, you must first contribute your RC1 details.</p>
                    <Button asChild className="mt-4" variant="default"><Link href="/contribute"><PlusCircle className="mr-2 h-4 w-4" /> Contribute Fleet Data</Link></Button>
                </div>
            )}
        </div>
    );
}

function StepCommercials({ shop, canEdit }: { shop: any, canEdit: boolean }) {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [rate, setRate] = useState<number>(shop.platformCommission || 2.5);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            await fetch('/api/updateUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: `companies/${shop.companyId}/shops/${shop.id}`,
                    data: { platformCommission: rate, updatedAt: { _methodName: 'serverTimestamp' } }
                })
            });
            toast({ title: "Agreement Saved", description: "Commercial rate successfully registered." });
        } catch (e) {
            toast({ variant: 'destructive', title: "Error saving commercials" });
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-5 w-5" />Platform Commission Rate</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Input type="number" step="0.1" value={rate} onChange={e => setRate(parseFloat(e.target.value))} className="w-24 text-lg font-bold" />
                        <span className="text-lg font-bold">%</span>
                    </div>
                    <Alert><Info className="h-4 w-4" /><AlertTitle>Revenue Sharing</AlertTitle><AlertDescription className="text-xs">This rate is applied to bookings/sales made through your profile.</AlertDescription></Alert>
                </CardContent>
                <CardFooter><Button onClick={handleSave} disabled={isSaving || !canEdit}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4" />} Accept & Register Commercials</Button></CardFooter>
            </Card>
        </div>
    );
}

// ====== MAIN WIZARD ======

export function ShopWizard({ shop, onUpdate }: { shop: any, onUpdate: () => void }) {
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const isTransporter = shop.shopType === 'transporter';

    const methods = useForm<z.infer<typeof shopFormSchema>>({
        resolver: zodResolver(shopFormSchema),
        mode: 'onChange',
        defaultValues: {
            shopName: shop.shopName || '',
            category: shop.category || '',
            websiteUrl: shop.websiteUrl || '',
            contactEmail: shop.contactEmail || '',
            contactPhone: shop.contactPhone || '',
            homeHeading: shop.homeHeading || '',
            homeSubheading: shop.homeSubheading || '',
            aboutText: shop.aboutText || '',
            logoUrl: shop.logoUrl || '',
            heroBannerUrl: shop.heroBannerUrl || '',
            termsText: shop.termsText || '',
            privacyText: shop.privacyText || '',
        }
    });

    const onSubmit = async (values: z.infer<typeof shopFormSchema>) => {
        setIsSaving(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            const response = await fetch('/api/updateUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: `companies/${shop.companyId}/shops/${shop.id}`,
                    data: { ...values, updatedAt: { _methodName: 'serverTimestamp' } }
                }),
            });
            if (!response.ok) throw new Error("Update failed");
            toast({ title: 'Profile Updated!' });
            onUpdate();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const wizardSteps = useMemo(() => {
        const base = [
            { id: 'details', name: 'Identity', component: <StepCoreIdentity canEdit={true} />, fields: ['shopName', 'category', 'contactEmail', 'contactPhone'] },
            { id: 'media', name: 'Branding & AI', component: <StepMedia canEdit={true} />, fields: [] },
            { id: 'content', name: 'Home & About', component: <StepContent canEdit={true} />, fields: ['homeHeading', 'aboutText'] },
            { id: 'catalog', name: isTransporter ? 'Routes & Rates' : 'Product Catalog', component: <StepCatalog shop={shop} canEdit={true} />, fields: [] },
        ];
        if (isTransporter) {
            base.push({ id: 'fleet', name: 'Fleet Gallery', component: <StepFleetGallery shop={shop} canEdit={true} />, fields: [] });
        }
        base.push(
            { id: 'legal', name: 'Legal Docs', component: <StepLegal canEdit={true} />, fields: ['termsText', 'privacyText'] },
            { id: 'commercials', name: 'Commercials', component: <StepCommercials shop={shop} canEdit={true} />, fields: [] },
            { id: 'publish', name: 'Publish', component: <StepPublish shop={shop} onSave={onUpdate} />, fields: [] }
        );
        return base;
    }, [shop, isTransporter, onUpdate]);

    const handleNext = async () => {
        const step = wizardSteps[currentStep];
        const isValid = step.fields.length > 0 ? await methods.trigger(step.fields as any) : true;
        if (isValid && currentStep < wizardSteps.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    }
    
    return (
        <div className="space-y-6">
            <Progress value={((currentStep + 1) / wizardSteps.length) * 100} />
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="md:col-span-1">
                        <nav className="flex flex-col gap-2">
                            {wizardSteps.map((step, index) => (
                                <Button
                                    key={step.id}
                                    type="button"
                                    variant={currentStep === index ? 'secondary' : 'ghost'}
                                    className="justify-start gap-2 h-auto py-3 px-4"
                                    onClick={() => setCurrentStep(index)}
                                >
                                    <div className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0", currentStep >= index ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{index + 1}</div>
                                    <span className="truncate">{step.name}</span>
                                </Button>
                            ))}
                        </nav>
                    </div>
                    <div className="md:col-span-3 space-y-6">
                        {wizardSteps[currentStep].component}
                        <Separator />
                        <div className="flex justify-between">
                            <Button type="button" variant="outline" onClick={() => setCurrentStep(prev => prev - 1)} disabled={currentStep === 0}>Back</Button>
                            {currentStep < wizardSteps.length - 1 ? (
                                <Button type="button" onClick={handleNext}>Next Step</Button>
                            ) : (
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                                    Final Save & Update
                                </Button>
                            )}
                        </div>
                    </div>
                </form>
            </FormProvider>
        </div>
    );
}

function StepPublish({ shop, onSave }: { shop: any, onSave: () => void }) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmitForReview = async () => {
        setIsSubmitting(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed.");
            await fetch('/api/updateUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: `companies/${shop.companyId}/shops/${shop.id}`,
                    data: { status: 'pending_review', updatedAt: { _methodName: 'serverTimestamp' } }
                }),
            });
            toast({ title: "Submitted!", description: "An admin will verify your profile shortly." });
            onSave();
        } catch (e:any) {
            toast({ variant: "destructive", title: "Submission Failed" });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="text-center space-y-6 py-10">
            <h3 className="text-2xl font-bold font-headline">Review & Publish</h3>
            <p className="text-muted-foreground max-w-md mx-auto">Submit your professional profile for admin verification. Once approved, it will be visible to the entire community Mall.</p>
            <div className="pt-4">
                 <Button onClick={handleSubmitForReview} disabled={isSubmitting || shop.status === 'pending_review'} size="lg">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    {shop.status === 'approved' ? 'Request Re-verification' : 'Submit for Verification'}
                </Button>
            </div>
            {shop.status === 'pending_review' && (
                <p className="text-xs text-amber-600 font-semibold italic">Your profile is currently under review by the platform team.</p>
            )}
        </div>
    );
}
