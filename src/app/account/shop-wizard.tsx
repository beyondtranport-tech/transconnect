'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useStorage, useCollection, useMemoFirebase, getClientSideAuthToken } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Loader2, Save, CheckCircle, LayoutGrid, List, Image as ImageIcon, Sparkles, PlusCircle, Edit, Trash2, Send, Eye, ShoppingCart, Mail, Phone, UploadCloud, GalleryHorizontal } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { generateShopSeo } from '@/ai/flows/seo-flow';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import placeholderImageData from '@/lib/placeholder-images.json';
import { ShopPreview } from '@/components/shop-preview';
const { placeholderImages } = placeholderImageData;


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
  contactEmail: z.string().email("Please enter a valid email.").optional().or(z.literal('')),
  contactPhone: z.string().optional(),
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
      contactEmail: shop.contactEmail || '',
      contactPhone: shop.contactPhone || '',
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
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <FormField control={form.control} name="contactEmail" render={({ field }) => (
                <FormItem>
                    <FormLabel>Public Contact Email</FormLabel>
                    <FormControl><Input placeholder="shop@example.com" {...field} /></FormControl>
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
        ...product,
    } : { name: '', description: '', price: '' as any, sku: '', imageUrl: '' }
  });
  
  useEffect(() => {
    if (isOpen) {
        setUploadProgress(null); 
        if (product) {
            form.reset(product);
        } else {
            form.reset({ name: '', description: '', price: '' as any, sku: '', imageUrl: '' });
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
          setUploadProgress(100);
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

// ====== STEP 3: Promotions ======
const promotionSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

const shopStep3Schema = z.object({
  heroBannerUrl: z.string().optional(),
  promotions: z.array(promotionSchema).optional(),
});
type Step3FormValues = z.infer<typeof shopStep3Schema>;

function ImageGalleryDialog({ category, onSelect, children }: { category: string, onSelect: (url: string) => void, children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (imageUrl: string) => {
        onSelect(imageUrl);
        setIsOpen(false);
    };

    const filteredImages = useMemo(() => {
        if (!category) return placeholderImages.filter(img => img.category === 'General');
        return placeholderImages.filter(img => img.category === category || img.category === 'General');
    }, [category]);


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Choose an Image from the Gallery</DialogTitle>
                    <DialogDescription>Showing images for category: <span className="font-semibold text-primary">{category || 'General'}</span></DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[60vh]">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                        {filteredImages.map((img) => (
                            <button
                                key={img.id}
                                onClick={() => handleSelect(img.imageUrl)}
                                className="relative aspect-video rounded-md overflow-hidden group border-2 border-transparent hover:border-primary focus:border-primary focus:outline-none"
                            >
                                <Image src={img.imageUrl} alt={img.description} fill className="object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <CheckCircle className="h-8 w-8 text-white" />
                                </div>
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

function ImagePicker({ onUpload, title, currentImage, category }: { onUpload: (url: string) => void, title: string, currentImage?: string | null, category: string }) {
    const { user } = useUser();
    const storage = useStorage();
    const { toast } = useToast();
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [preview, setPreview] = useState<string | null>(currentImage || null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        setPreview(currentImage || null);
    }, [currentImage]);

    const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user || !storage) return;

        setUploadProgress(0);
        const imageRef = storageRef(storage, `shops/${user.uid}/${Date.now()}-${file.name}`);
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
                    onUpload(downloadURL);
                    setPreview(downloadURL);
                    setUploadProgress(100);
                    toast({ title: `${title} Image Uploaded!` });
                });
            }
        );
    };

    return (
        <div className="space-y-2">
            <Label>{title}</Label>
            <Card className="p-4">
                {preview ? (
                    <div className="relative aspect-video w-full rounded-md overflow-hidden">
                        <Image src={preview} alt="Preview" fill className="object-cover" />
                        <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => { setPreview(null); onUpload(''); }}>Change</Button>
                    </div>
                ) : (
                    <div className="flex items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg bg-card hover:bg-accent flex-col gap-2">
                         <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
                         <Button type="button" onClick={() => fileInputRef.current?.click()} variant="ghost">
                            <UploadCloud className="mr-2 h-4 w-4" />
                            Upload Image
                         </Button>
                        <ImageGalleryDialog category={category} onSelect={(url) => { onUpload(url); setPreview(url); }}>
                           <Button type="button" variant="ghost">
                             <GalleryHorizontal className="mr-2 h-4 w-4" />
                             Choose from Gallery
                           </Button>
                        </ImageGalleryDialog>
                    </div>
                )}
                 {uploadProgress !== null && uploadProgress < 100 && <Progress value={uploadProgress} className="h-1 mt-2" />}
            </Card>
        </div>
    );
}

function Step3Promotions({ shop, onSave }: { shop: any, onSave: (newData: any) => void }) {
    const { user } = useUser();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<Step3FormValues>({
        resolver: zodResolver(shopStep3Schema),
        defaultValues: {
            heroBannerUrl: shop.heroBannerUrl || '',
            promotions: shop.promotions || [],
        },
    });
    
    const { fields, append, remove, update } = useFieldArray({
        control: form.control,
        name: "promotions",
    });
    
    useEffect(() => {
        // Ensure there are always 3 promotion slots
        const currentCount = fields.length;
        if (currentCount < 3) {
            for (let i = 0; i < 3 - currentCount; i++) {
                append({ title: '', description: '', imageUrl: '' });
            }
        }
    }, [fields, append]);


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

            toast({ title: 'Step 3 Saved!', description: 'Your promotions have been updated.' });
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
                <div>
                    <h3 className="text-lg font-medium">Hero Banner</h3>
                    <p className="text-sm text-muted-foreground">This is the main banner at the top of your shop page.</p>
                    <div className="mt-4">
                        <FormField
                            control={form.control}
                            name="heroBannerUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <ImagePicker title="Hero Banner" onUpload={(url) => field.onChange(url)} currentImage={field.value} category={shop.category} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Separator />

                <div>
                    <h3 className="text-lg font-medium">Promotional Blocks</h3>
                    <p className="text-sm text-muted-foreground">Highlight specials, new arrivals, or key categories. (Up to 3)</p>
                     <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {fields.slice(0, 3).map((field, index) => (
                           <Card key={field.id} className="p-4 space-y-4">
                               <FormField control={form.control} name={`promotions.${index}.imageUrl`} render={({ field: imageField }) => (
                                    <FormItem>
                                        <FormControl>
                                            <ImagePicker title={`Promotion ${index + 1} Image`} onUpload={(url) => imageField.onChange(url)} currentImage={imageField.value} category={shop.category} />
                                        </FormControl>
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name={`promotions.${index}.title`} render={({ field }) => (
                                    <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} placeholder="e.g., Tire Sale" /></FormControl></FormItem>
                                )}/>
                                <FormField control={form.control} name={`promotions.${index}.description`} render={({ field }) => (
                                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} placeholder="e.g., 20% off all truck tires" /></FormControl></FormItem>
                                )}/>
                           </Card>
                        ))}
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


// ====== STEP 4: Appearance ======
const shopStep4Schema = z.object({
  template: z.string().min(1, "Please select a template"),
  theme: z.string().min(1, "Please select a theme"),
});
type Step4FormValues = z.infer<typeof shopStep4Schema>;

function Step4Appearance({ shop, onSave }: { shop: any, onSave: (newData: any) => void }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<Step4FormValues>({
    resolver: zodResolver(shopStep4Schema),
    defaultValues: {
      template: shop.template || 'modern-grid',
      theme: shop.theme || 'forest-green',
    }
  });

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

        toast({ title: 'Step 4 Saved!', description: 'Your shop appearance has been updated.' });
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

// ====== STEP 5: SEO & PREVIEW ======
const shopStep5Schema = z.object({
  metaTitle: z.string().min(1, "Meta title is required"),
  metaDescription: z.string().min(1, "Meta description is required"),
  tags: z.array(z.string()).min(1, "At least one tag is required"),
});
type Step5FormValues = z.infer<typeof shopStep5Schema>;


function Step5SeoAndPreview({ shop, onSave }: { shop: any; onSave: (newData: any) => void }) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const productsCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `members/${user.uid}/shops/${shop.id}/products`);
  }, [firestore, user, shop.id]);

  const { data: products, isLoading: areProductsLoading } = useCollection(productsCollection);

  const form = useForm<Step5FormValues>({
    resolver: zodResolver(shopStep5Schema),
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
  };

  const onSubmit = async (values: Step5FormValues) => {
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
        
        toast({ title: 'Step 5 Saved!', description: 'Your SEO settings have been updated.' });
        onSave(values); // This will advance to the next step
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
        setIsSaving(false);
    }
  };
  
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
        
        <Separator />

        <div className="flex items-center gap-4">
            <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save
            </Button>
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline"><Eye className="mr-2 h-4 w-4" /> Preview Shop</Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl h-[90vh] p-0 border-0">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Shop Preview</DialogTitle>
                         <DialogDescription>This is how your shop will appear to customers.</DialogDescription>
                    </DialogHeader>
                    <div className="w-full h-full overflow-y-auto">
                         {areProductsLoading ? (
                            <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div>
                         ) : (
                            <ShopPreview shop={shop} products={products || []} />
                         )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
      
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
      </form>
    </Form>
  )
}


// ====== WIZARD CONTROLLER ======
const STEPS = [
    { id: 'identity', title: 'Core Identity' },
    { id: 'products', title: 'Products'},
    { id: 'promotions', title: 'Promotions' },
    { id: 'appearance', title: 'Appearance'},
    { id: 'seo', title: 'SEO & Preview'},
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
  
  const handleSave = useCallback((newData: any) => {
    const updatedShopData = { ...shopData, ...newData };
    setShopData(updatedShopData);
  }, [shopData]);


  const renderStepContent = () => {
    const stepId = STEPS[currentStepIndex].id;
    switch (stepId) {
      case 'identity':
        return <Step1CoreIdentity shop={shopData} onSave={handleSaveAndNext} />;
      case 'products':
        return <Step2Products shop={shopData} onSave={handleSaveAndNext} />;
      case 'promotions':
        return <Step3Promotions shop={shopData} onSave={handleSaveAndNext} />;
      case 'appearance':
        return <Step4Appearance shop={shopData} onSave={handleSaveAndNext} />;
      case 'seo':
        return <Step5SeoAndPreview shop={shopData} onSave={handleSave} />;
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
