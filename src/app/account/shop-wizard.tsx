
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
import { useFirestore, useFirebaseApp, useUser } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Loader2, Save, CheckCircle, LayoutGrid, List, Image as ImageIcon, Sparkles, PlusCircle, Edit, Trash2 } from 'lucide-react';
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
import { generateShopSeo } from '@/ai/flows/seo-flow';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';

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

function Step1CoreIdentity({ member, onSave }: { member: any, onSave: (newData: any) => void }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = useState(false);
  const shopData = member.shop || {};

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
    const memberDocRef = doc(firestore, 'members', member.id);
    
    const dataToUpdate = {
        'shop.shopName': values.shopName,
        'shop.shopDescription': values.shopDescription,
        'shop.category': values.category,
        'shop.updatedAt': serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    try {
        await updateDoc(memberDocRef, dataToUpdate);
        toast({ title: 'Step 1 Saved!', description: 'Your core shop details have been updated.' });
        onSave(values);
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

function Step2LocationContact({ member, onSave }: { member: any, onSave: (newData: any) => void }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = useState(false);
  const shopData = member.shop || {};

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
    const memberDocRef = doc(firestore, 'members', member.id);
    
    const dataToUpdate = {
        'shop.contactEmail': values.contactEmail,
        'shop.contactPhone': values.contactPhone,
        'shop.streetAddress': values.streetAddress,
        'shop.city': values.city,
        'shop.province': values.province,
        'shop.postalCode': values.postalCode,
        'shop.updatedAt': serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    try {
        await updateDoc(memberDocRef, dataToUpdate);
        toast({ title: 'Step 2 Saved!', description: 'Your location and contact info has been updated.' });
        onSave(values);
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

function Step3Branding({ member, onSave }: { member: any, onSave: (newData: any) => void }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = useState(false);
  const shopData = member.shop || {};

  const form = useForm<Step3FormValues>({
    resolver: zodResolver(shopStep3Schema),
    defaultValues: {
      template: shopData.template || 'modern-grid',
      theme: shopData.theme || 'forest-green',
    }
  });

  const onSubmit = async (values: Step3FormValues) => {
    setIsSaving(true);
    const memberDocRef = doc(firestore, 'members', member.id);
    
    const dataToUpdate = { 
        'shop.template': values.template,
        'shop.theme': values.theme,
        'shop.updatedAt': serverTimestamp(),
        updatedAt: serverTimestamp() 
    };

    try {
        await updateDoc(memberDocRef, dataToUpdate);
        toast({ title: 'Step 3 Saved!', description: 'Your branding settings have been updated.' });
        onSave(values);
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


// ====== STEP 4: SEO & Metadata ======
const shopStep4Schema = z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

type Step4FormValues = z.infer<typeof shopStep4Schema>;

function Step4Seo({ member, onSave }: { member: any, onSave: (newData: any) => void }) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const shopData = member.shop || {};

    const form = useForm<Step4FormValues>({
        resolver: zodResolver(shopStep4Schema),
        defaultValues: {
            metaTitle: shopData.metaTitle || '',
            metaDescription: shopData.metaDescription || '',
            tags: shopData.tags || [],
        }
    });

    const handleGenerateSeo = async () => {
        setIsGenerating(true);
        try {
            if (!shopData.shopName || !shopData.shopDescription) {
                toast({ variant: 'destructive', title: 'Missing Info', description: 'Please complete Step 1 with a shop name and description first.' });
                setIsGenerating(false);
                return;
            }
            const result = await generateShopSeo({
                shopName: shopData.shopName,
                shopDescription: shopData.shopDescription,
            });
            form.setValue('metaTitle', result.metaTitle);
            form.setValue('metaDescription', result.metaDescription);
            form.setValue('tags', result.tags);
            toast({ title: 'AI Complete!', description: 'SEO metadata has been generated.' });
        } catch (error) {
            console.error("AI SEO Generation Error:", error);
            toast({ variant: 'destructive', title: 'AI Error', description: 'Could not generate SEO content.' });
        } finally {
            setIsGenerating(false);
        }
    };

    const onSubmit = async (values: Step4FormValues) => {
        setIsSaving(true);
        const memberDocRef = doc(firestore, 'members', member.id);

        const dataToUpdate = {
            'shop.metaTitle': values.metaTitle,
            'shop.metaDescription': values.metaDescription,
            'shop.tags': values.tags,
            'shop.updatedAt': serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        try {
            await updateDoc(memberDocRef, dataToUpdate);
            toast({ title: 'Step 4 Saved!', description: 'Your SEO settings have been updated.' });
            onSave(values);
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
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles /> AI-Powered SEO Assistant
                        </CardTitle>
                        <CardDescription>
                            Let our AI generate optimized SEO content based on your shop's name and description from Step 1.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button type="button" onClick={handleGenerateSeo} disabled={isGenerating}>
                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Generate with AI
                        </Button>
                    </CardContent>
                </Card>

                <FormField control={form.control} name="metaTitle" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Meta Title</FormLabel>
                        <FormControl><Input placeholder="e.g., Quality Truck Parts in Johannesburg" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="metaDescription" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Meta Description</FormLabel>
                        <FormControl><Textarea placeholder="A short, catchy description for search engines." {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="tags" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tags / Keywords</FormLabel>
                        <FormControl><Input placeholder="e.g., truck parts, scania, heavy-duty" value={field.value?.join(', ') || ''} onChange={e => field.onChange(e.target.value.split(',').map(tag => tag.trim()))} /></FormControl>
                        <FormMessage />
                        <p className="text-sm text-muted-foreground">Separate tags with commas.</p>
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

// ====== STEP 5: Products ======
const productSchema = z.object({
  name: z.string().min(1, "Product name is required."),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be a positive number."),
  sku: z.string().optional(),
  imageUrl: z.string().url("Please upload an image.").optional().or(z.literal('')),
});
type ProductFormValues = z.infer<typeof productSchema>;

// The product type stored in the array
type Product = ProductFormValues & { id: string };

function ProductDialog({ onAddProduct, memberId }: { onAddProduct: (product: Product) => void, memberId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const { toast } = useToast();
    const firebaseApp = useFirebaseApp();

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: { name: '', description: '', price: 0, sku: '', imageUrl: '' }
    });

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const resetForm = () => {
        form.reset();
        setImageFile(null);
        setImagePreview(null);
        setUploadProgress(null);
        setIsSaving(false);
    }

    const onSubmit = async (values: ProductFormValues) => {
        setIsSaving(true);
        const newProductId = `prod_${Date.now()}`;

        if (imageFile) {
            const storage = getStorage(firebaseApp);
            const imagePath = `products/${memberId}/${newProductId}/${imageFile.name}`;
            const fileRef = storageRef(storage, imagePath);
            const uploadTask = uploadBytesResumable(fileRef, imageFile);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                },
                (error) => {
                    console.error("Upload failed:", error);
                    toast({ variant: 'destructive', title: 'Image Upload Failed', description: error.message });
                    setIsSaving(false);
                },
                () => {
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                        const newProduct: Product = { ...values, id: newProductId, imageUrl: downloadURL };
                        onAddProduct(newProduct);
                        toast({ title: 'Product Staged', description: `${values.name} is ready to be saved.` });
                        setIsOpen(false);
                        resetForm();
                    });
                }
            );
        } else {
             const newProduct: Product = { ...values, id: newProductId };
             onAddProduct(newProduct);
             toast({ title: 'Product Staged', description: `${values.name} is ready to be saved.` });
             setIsOpen(false);
             resetForm();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) resetForm(); }}>
            <DialogTrigger asChild>
                <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add Product</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add a New Product</DialogTitle>
                    <DialogDescription>Fill out the details for your new product. It will be saved when you click "Save & Continue".</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormItem>
                            <FormLabel>Product Image</FormLabel>
                            <FormControl>
                                <Input type="file" accept="image/*" onChange={handleFileChange} />
                            </FormControl>
                            {imagePreview && (
                                <div className="mt-2 relative w-full aspect-video rounded-md overflow-hidden border">
                                    <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                                </div>
                            )}
                            {uploadProgress !== null && <Progress value={uploadProgress} className="mt-2 h-2" />}
                            <FormMessage />
                        </FormItem>
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="price" render={({ field }) => (
                                <FormItem><FormLabel>Price (ZAR)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="sku" render={({ field }) => (
                                <FormItem><FormLabel>SKU (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Add Product'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function Step5Products({ member, onSave }: { member: any, onSave: (newData: any) => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    
    const [products, setProducts] = useState<Product[]>(member.shop?.products || []);

    const handleAddProduct = (newProduct: Product) => {
        setProducts(currentProducts => [...currentProducts, newProduct]);
    };
    
    const handleRemoveProduct = (productId: string) => {
        setProducts(currentProducts => currentProducts.filter(p => p.id !== productId));
    }
    
    const handleSave = async () => {
        setIsSaving(true);
        const memberDocRef = doc(firestore, 'members', member.id);

        const dataToUpdate = {
            'shop.products': products,
            'shop.updatedAt': serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        try {
            await updateDoc(memberDocRef, dataToUpdate);
            toast({ title: 'Step 5 Saved!', description: 'Your product list has been updated.' });
            onSave({ products }); // Pass the new product list to the main wizard state
        } catch (serverError: any) {
             const permissionError = new FirestorePermissionError({
                path: memberDocRef.path, operation: 'update', requestResourceData: dataToUpdate,
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: 'Update Failed', description: serverError.message });
        } finally {
            setIsSaving(false);
        }
    }


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <p className="text-muted-foreground">Add products to your shop's catalogue.</p>
                <ProductDialog onAddProduct={handleAddProduct} memberId={member.id} />
            </div>
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Image</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.length > 0 ? (
                                products.map(product => (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            <div className="w-16 h-16 relative bg-muted rounded-md overflow-hidden">
                                                {product.imageUrl ? (
                                                    <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full">
                                                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>{product.sku || 'N/A'}</TableCell>
                                        <TableCell className="text-right font-mono">R {product.price.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveProduct(product.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                        You haven't added any products yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save & Continue
            </Button>
        </div>
    );
}



// ====== WIZARD CONTROLLER ======
const STEPS = [
    { id: 'identity', title: 'Core Identity' },
    { id: 'location', title: 'Location & Contact' },
    { id: 'branding', title: 'Branding' },
    { id: 'seo', title: 'SEO & Tags' },
    { id: 'products', title: 'Products' },
    { id: 'preview', title: 'Preview' },
];

export default function ShopWizard({ member }: { member: any }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [shopData, setShopData] = useState(member.shop || {});

  const handleSaveAndNext = (newData: any) => {
    const updatedShopData = { ...shopData, ...newData };
    setShopData(updatedShopData);

    if(currentStepIndex < STEPS.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
    }
  }

  const renderStepContent = () => {
    const stepId = STEPS[currentStepIndex].id;
    switch (stepId) {
      case 'identity':
        return <Step1CoreIdentity member={{...member, shop: shopData}} onSave={handleSaveAndNext} />;
      case 'location':
        return <Step2LocationContact member={{...member, shop: shopData}} onSave={handleSaveAndNext} />;
      case 'branding':
        return <Step3Branding member={{...member, shop: shopData}} onSave={handleSaveAndNext} />;
      case 'seo':
        return <Step4Seo member={{...member, shop: shopData}} onSave={handleSaveAndNext} />;
      case 'products':
        return <Step5Products member={{...member, shop: shopData}} onSave={handleSaveAndNext} />;
      case 'preview':
        return <div className="text-center p-8">Step 6: Final Preview & Submit for Review will go here.</div>;
      default:
        return <div>Step not found</div>;
    }
  };

  const status = shopData.status || 'draft';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Shop Setup Progress</h3>
        <Badge variant={statusColors[status] || 'secondary'} className="capitalize">
            Status: {status.replace(/_/g, ' ')}
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

       {status === 'approved' && (
           <div className="text-center p-4 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded-lg">
                <p className="font-semibold text-green-800 dark:text-green-200">Your shop is live! Any changes you save will be visible to the public immediately.</p>
           </div>
       )}
    </div>
  );
}
