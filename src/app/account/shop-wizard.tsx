
'use client';

import React from 'react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useStorage, useCollection, useMemoFirebase, getClientSideAuthToken } from '@/firebase';
import { doc, updateDoc, serverTimestamp, setDoc, addDoc, deleteDoc, collection } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Loader2, Save, CheckCircle, LayoutGrid, List, Image as ImageIcon, Sparkles, PlusCircle, Edit, Trash2, Send, Eye } from 'lucide-react';
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

function Step1CoreIdentity({ shop, onSave }: { shop: any, onSave: (newData: any) => void }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<Step1FormValues>({
    resolver: zodResolver(shopStep1Schema),
    defaultValues: {
      shopName: shop.shopName || '',
      shopDescription: shop.shopDescription || '',
      category: shop.category || '',
    }
  });

  const onSubmit = async (values: Step1FormValues) => {
    if (!user) return;
    setIsSaving(true);
    
    const dataToUpdate = {
        ...values,
        updatedAt: { _methodName: 'serverTimestamp' },
    };

    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication token not found.");

        const response = await fetch('/api/updateUserDoc', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                path: `members/${user.uid}/shops/${shop.id}`,
                data: dataToUpdate
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to update shop.');
        }

        toast({ title: 'Step 1 Saved!', description: 'Your core shop details have been updated.' });
        onSave(values);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
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

// ====== STEP 2: Products ======
const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().positive('Price must be a positive number'),
  sku: z.string().optional(),
  imageUrl: z.string().optional(),
});
type ProductFormValues = z.infer<typeof productSchema>;

function ProductDialog({ shop, product, onSave, children }: { shop: any, product?: any, onSave: () => void, children: React.ReactNode }) {
  const { user } = useUser();
  const storage = useStorage();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product ? {
        ...product
    } : { name: '', description: '', price: 0, sku: '', imageUrl: '' }
  });
  
  useEffect(() => {
    if (isOpen) {
        setUploadProgress(null); 
        if (product) {
            form.reset(product);
        } else {
            form.reset({ name: '', description: '', price: 0, sku: '', imageUrl: '' });
        }
    }
  }, [isOpen, product, form]);

  const onSubmit = async (values: ProductFormValues) => {
    if (!user) return;
    setIsSaving(true);
    
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication token not found.");
        
        let response;
        if (product?.id) { // Editing existing product
            const productData = {
                ...values,
                shopId: shop.id,
                ownerId: user.uid,
                updatedAt: { _methodName: 'serverTimestamp' },
            };
            response = await fetch('/api/updateUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: `members/${user.uid}/shops/${shop.id}/products/${product.id}`, data: productData }),
            });
            if (response.ok) toast({ title: 'Product Updated!' });
        } else { // Creating new product
             const productData = {
                ...values,
                shopId: shop.id,
                ownerId: user.uid,
                createdAt: { _methodName: 'serverTimestamp' },
                updatedAt: { _methodName: 'serverTimestamp' },
            };
            response = await fetch('/api/addUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ collectionPath: `members/${user.uid}/shops/${shop.id}/products`, data: productData }),
            });
            if (response.ok) toast({ title: 'Product Added!' });
        }

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error || 'Failed to save product.');
        }

        onSave();
        setIsOpen(false);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    } finally {
        setIsSaving(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !storage) return;

    setUploadProgress(0);
    const imageRef = storageRef(storage, `products/${user.uid}/${shop.id}/${Date.now()}-${file.name}`);
    const uploadTask = uploadBytesResumable(imageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        toast({ variant: "destructive", title: "Upload failed", description: error.message });
        setUploadProgress(null);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          form.setValue('imageUrl', downloadURL, { shouldValidate: true });
          toast({ title: "Image uploaded!" });
          setUploadProgress(null);
        });
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="price" render={({ field }) => (
                        <FormItem><FormLabel>Price (ZAR)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="sku" render={({ field }) => (
                        <FormItem><FormLabel>SKU (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                 <FormField control={form.control} name="imageUrl" render={({ field }) => (
                    <FormItem><FormLabel>Product Image</FormLabel>
                    <FormControl>
                        <div>
                             <Input type="file" accept="image/*" onChange={handleImageUpload} className="mb-2" />
                             {uploadProgress !== null && <Progress value={uploadProgress} className="h-2" />}
                             {field.value && <Image src={field.value} alt="Product preview" width={100} height={100} className="mt-2 rounded-md object-cover" />}
                        </div>
                    </FormControl>
                    <FormMessage /></FormItem>
                )} />
                <DialogFooter>
                    <Button type="submit" disabled={isSaving || form.formState.isSubmitting || (uploadProgress !== null && uploadProgress < 100)}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                        Save Product
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function Step2Products({ shop, onSave }: { shop: any, onSave: (newData?: any) => void }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const productsCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `members/${user.uid}/shops/${shop.id}/products`);
  }, [firestore, user, shop.id]);

  const { data: products, isLoading, forceRefresh } = useCollection(productsCollection);
  
  const handleDelete = async (productId: string) => {
    if (!user) return;
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication token not found.");
        
        const response = await fetch('/api/deleteUserDoc', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: `members/${user.uid}/shops/${shop.id}/products/${productId}` }),
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error || 'Failed to delete product.');
        }

        toast({ title: 'Product Deleted' });
        forceRefresh();
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
    }
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Your Products</h3>
            <ProductDialog shop={shop} onSave={forceRefresh}>
                <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Product</Button>
            </ProductDialog>
        </div>
        
        {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
        ) : products && products.length > 0 ? (
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead><TableHead>Price</TableHead><TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map(p => (
                            <TableRow key={p.id}>
                                <TableCell className="font-medium">{p.name}</TableCell>
                                <TableCell>R {p.price.toFixed(2)}</TableCell>
                                <TableCell className="text-right space-x-2">
                                     <ProductDialog shop={shop} product={p} onSave={forceRefresh}>
                                        <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                                     </ProductDialog>
                                     <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        ) : (
            <div className="text-center p-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">You haven't added any products yet.</p>
            </div>
        )}
        
        <Button onClick={() => onSave()}>
          Save & Continue
        </Button>
    </div>
  )
}


// ====== STEP 3: Appearance ======
const shopStep3Schema = z.object({
  template: z.string().min(1, "Please select a template"),
  theme: z.string().min(1, "Please select a theme"),
});
type Step3FormValues = z.infer<typeof shopStep3Schema>;

function Step3Appearance({ shop, onSave }: { shop: any, onSave: (newData: any) => void }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<Step3FormValues>({
    resolver: zodResolver(shopStep3Schema),
    defaultValues: {
      template: shop.template || 'modern-grid',
      theme: shop.theme || 'forest-green',
    }
  });

  const onSubmit = async (values: Step3FormValues) => {
    if (!user) return;
    setIsSaving(true);
    const dataToUpdate = { ...values, updatedAt: { _methodName: 'serverTimestamp' } };

    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication token not found.");
        
        const response = await fetch('/api/updateUserDoc', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: `members/${user.uid}/shops/${shop.id}`, data: dataToUpdate }),
        });

        if (!response.ok) throw new Error((await response.json()).error || 'Failed to save.');

        toast({ title: 'Step 3 Saved!', description: 'Your shop appearance has been updated.' });
        onSave(values);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField control={form.control} name="template" render={({ field }) => (
                <FormItem className="space-y-3">
                <FormLabel className="text-base">Shop Layout Template</FormLabel>
                <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormItem>
                        <Label className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground", field.value === 'modern-grid' && "border-primary")}>
                            <FormControl><RadioGroupItem value="modern-grid" className="sr-only" /></FormControl>
                            <LayoutGrid className="h-12 w-12 mb-2" />
                            <span className="font-bold">Modern Grid</span>
                        </Label>
                    </FormItem>
                     <FormItem>
                        <Label className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground", field.value === 'classic-list' && "border-primary")}>
                            <FormControl><RadioGroupItem value="classic-list" className="sr-only" /></FormControl>
                            <List className="h-12 w-12 mb-2" />
                            <span className="font-bold">Classic List</span>
                        </Label>
                    </FormItem>
                    </RadioGroup>
                </FormControl>
                <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="theme" render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-base">Color Theme</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a theme" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="forest-green">Forest Green (Default)</SelectItem>
                            <SelectItem value="ocean-blue">Ocean Blue</SelectItem>
                            <SelectItem value="industrial-grey">Industrial Grey</SelectItem>
                            <SelectItem value="sunset-orange">Sunset Orange</SelectItem>
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
  )
}

// ====== STEP 4: SEO ======
const shopStep4Schema = z.object({
  metaTitle: z.string().min(1, "Meta title is required"),
  metaDescription: z.string().min(1, "Meta description is required"),
  tags: z.array(z.string()).min(1, "At least one tag is required"),
});
type Step4FormValues = z.infer<typeof shopStep4Schema>;

function Step4Seo({ shop, onSave }: { shop: any, onSave: (newData: any) => void }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<Step4FormValues>({
    resolver: zodResolver(shopStep4Schema),
    defaultValues: {
      metaTitle: shop.metaTitle || '',
      metaDescription: shop.metaDescription || '',
      tags: shop.tags || [],
    }
  });

  const handleGenerateSeo = async () => {
    setIsGenerating(true);
    try {
        const result = await generateShopSeo({
            shopName: shop.shopName,
            shopDescription: shop.shopDescription,
        });
        if (result) {
            form.setValue('metaTitle', result.metaTitle);
            form.setValue('metaDescription', result.metaDescription);
            form.setValue('tags', result.tags);
            toast({ title: 'SEO Content Generated!', description: 'Review and save the AI-generated content.' });
        }
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'AI Generation Failed', description: e.message });
    } finally {
        setIsGenerating(false);
    }
  }

  const onSubmit = async (values: Step4FormValues) => {
    if (!user) return;
    setIsSaving(true);
    const dataToUpdate = { ...values, updatedAt: { _methodName: 'serverTimestamp' } };

    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication token not found.");
        
        const response = await fetch('/api/updateUserDoc', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: `members/${user.uid}/shops/${shop.id}`, data: dataToUpdate }),
        });

        if (!response.ok) throw new Error((await response.json()).error || 'Failed to save.');
        
        toast({ title: 'Step 4 Saved!', description: 'Your SEO settings have been updated.' });
        onSave(values);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center justify-between">
                <p className="max-w-prose">Let our AI assistant generate SEO-friendly content for you based on your shop name and description.</p>
                <Button type="button" onClick={handleGenerateSeo} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                    Generate with AI
                </Button>
            </CardContent>
        </Card>
        <FormField control={form.control} name="metaTitle" render={({ field }) => (
          <FormItem><FormLabel>Meta Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="metaDescription" render={({ field }) => (
          <FormItem><FormLabel>Meta Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="tags" render={({ field }) => (
          <FormItem>
            <FormLabel>Tags / Keywords</FormLabel>
            <FormControl>
                <Input 
                    {...field} 
                    value={Array.isArray(field.value) ? field.value.join(', ') : ''} 
                    onChange={e => field.onChange(e.target.value.split(',').map(s => s.trim()))}
                    placeholder="e.g., truck parts, scania, filters"
                />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save & Continue
        </Button>
      </form>
    </Form>
  )
}

// ====== PREVIEW COMPONENT ======
const formatPrice = (price: number) => {
    if (typeof price !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(price);
};

function ShopPreview({ shop, products }: { shop: any, products: any[] }) {
    const renderGrid = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
                <Card key={product.id} className="overflow-hidden">
                    <div className="relative aspect-square bg-muted">
                        {product.imageUrl && <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />}
                    </div>
                    <CardHeader>
                        <CardTitle className="text-base">{product.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center">
                        <p className="font-bold">{formatPrice(product.price)}</p>
                        <Button size="sm">Add</Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );

    const renderList = () => (
        <div className="space-y-4">
            {products.map(product => (
                 <Card key={product.id} className="flex items-center">
                    <div className="relative h-24 w-24 flex-shrink-0 bg-muted">
                        {product.imageUrl && <Image src={product.imageUrl} alt={product.name} fill className="object-cover rounded-l-lg" />}
                    </div>
                    <CardContent className="p-4 flex-grow">
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                    </CardContent>
                    <div className="p-4 text-right">
                         <p className="font-bold">{formatPrice(product.price)}</p>
                         <Button size="sm" className="mt-1">Add</Button>
                    </div>
                </Card>
            ))}
        </div>
    );
    
    return (
        <div className="bg-background p-6 rounded-lg border">
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold">{shop.shopName}</h2>
                <p className="text-muted-foreground">{shop.shopDescription}</p>
                 <div className="mt-2 flex justify-center flex-wrap gap-1">
                    {shop.tags?.map((tag: string) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                </div>
            </div>

            {products && products.length > 0 ? (
                shop.template === 'classic-list' ? renderList() : renderGrid()
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">No products have been added yet.</p>
                </div>
            )}
        </div>
    );
}

// ====== STEP 5: Preview & Submit ======
function Step5Preview({ shop, onSave }: { shop: any; onSave: (newData: any) => void }) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const productsCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `members/${user.uid}/shops/${shop.id}/products`);
  }, [firestore, user, shop.id]);

  const { data: products, isLoading: areProductsLoading } = useCollection(productsCollection);

  const handleSubmitForReview = async () => {
    if (!user) return;

    setIsSubmitting(true);
    const dataToUpdate = {
      status: 'pending_review',
      updatedAt: { _methodName: 'serverTimestamp' },
    };

    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Authentication token not found.");
      
      const response = await fetch('/api/updateUserDoc', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: `members/${user.uid}/shops/${shop.id}`, data: dataToUpdate }),
      });

      if (!response.ok) throw new Error((await response.json()).error || 'Failed to submit.');

      toast({
        title: 'Shop Submitted!',
        description: 'Your shop is now pending review by our admin team.',
      });
      onSave({ status: 'pending_review' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Final Review</h3>
        <p className="text-sm text-muted-foreground">
          Review your shop details below. Use the Preview button to see how it will look.
        </p>
      </div>
      
      <Dialog>
        <DialogTrigger asChild>
            <Button variant="outline"><Eye className="mr-2 h-4 w-4" /> Preview Shop</Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl h-[80vh]">
            <DialogHeader>
                <DialogTitle>Shop Preview</DialogTitle>
                 <DialogDescription>This is how your shop will appear to customers.</DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto pr-4 -mr-4">
                 {areProductsLoading ? (
                    <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div>
                 ) : (
                    <ShopPreview shop={shop} products={products || []} />
                 )}
            </div>
        </DialogContent>
      </Dialog>
      
      <div className="mt-6 pt-6 border-t">
        {shop.status === 'draft' || shop.status === 'rejected' ? (
          <Button onClick={handleSubmitForReview} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Submit for Review
          </Button>
        ) : (
          <div className="text-center p-4 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded-lg">
             <p className="font-semibold text-green-800 dark:text-green-200">Your shop is currently {shop.status === 'approved' ? 'approved and live' : 'pending review'}.</p>
          </div>
        )}
      </div>
    </div>
  );
}


// ====== WIZARD CONTROLLER ======
const STEPS = [
    { id: 'identity', title: 'Core Identity' },
    { id: 'products', title: 'Products'},
    { id: 'appearance', title: 'Appearance'},
    { id: 'seo', title: 'SEO & Tags'},
    { id: 'preview', title: 'Preview & Submit' },
];

export default function ShopWizard({ shop }: { shop: any }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [shopData, setShopData] = useState(shop);

  const handleSaveAndNext = useCallback((newData: any) => {
    const updatedShopData = { ...shopData, ...newData };
    setShopData(updatedShopData);

    if(currentStepIndex < STEPS.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
    }
  }, [currentStepIndex, shopData]);

  const renderStepContent = () => {
    const stepId = STEPS[currentStepIndex].id;
    switch (stepId) {
      case 'identity':
        return <Step1CoreIdentity shop={shopData} onSave={handleSaveAndNext} />;
      case 'products':
        return <Step2Products shop={shopData} onSave={handleSaveAndNext} />;
      case 'appearance':
        return <Step3Appearance shop={shopData} onSave={handleSaveAndNext} />;
      case 'seo':
        return <Step4Seo shop={shopData} onSave={handleSaveAndNext} />;
      case 'preview':
        return <Step5Preview shop={shopData} onSave={handleSaveAndNext} />;
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
