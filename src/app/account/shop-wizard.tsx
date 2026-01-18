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
import { Loader2, Save, CheckCircle, LayoutGrid, List, Image as ImageIcon, Sparkles, PlusCircle, Edit, Trash2, Send, Eye, ShoppingCart, Mail, Phone, UploadCloud, GalleryHorizontal, Wand2, Video, Search, ShieldAlert } from 'lucide-react';
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
import { usePermissions } from '@/hooks/use-permissions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

function Step1CoreIdentity({ shop, onSave, onSeoGenerated, canEdit }: { shop: any, onSave: (newData: any) => void, onSeoGenerated: (seoData: any) => void, canEdit: boolean }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);

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

  const handleGenerateSeo = async () => {
    setIsGeneratingSeo(true);
    try {
        const result = await generateShopSeo({
            shopName: form.getValues('shopName'),
            shopDescription: form.getValues('shopDescription'),
        });
        if (result) {
            onSeoGenerated(result);
            toast({ title: 'SEO Content Generated!', description: 'Your new meta title, description, and tags have been populated.' });
        }
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'AI Generation Failed', description: e.message });
    } finally {
        setIsGeneratingSeo(false);
    }
  };


  const onSubmit = async (values: Step1FormValues) => {
    if (!user || !shop.companyId) return;
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
                path: `companies/${shop.companyId}/shops/${shop.id}`,
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
        <fieldset disabled={!canEdit} className="space-y-6">
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
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!canEdit}>
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

            <Separator />

            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                <h3 className="font-semibold flex items-center gap-2"><Search className="h-5 w-5 text-primary"/> AI SEO Booster</h3>
                <p className="text-sm text-muted-foreground">
                    Let our AI assistant generate an SEO-friendly title, description, and tags for your shop based on the name and description you provided above. This will help customers find you on search engines.
                </p>
                <Button type="button" onClick={handleGenerateSeo} disabled={isGeneratingSeo || !canEdit}>
                    {isGeneratingSeo ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                    Generate SEO Content
                </Button>
            </div>
        </fieldset>

        <Button type="submit" disabled={isSaving || !canEdit}>
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

function ProductDialog({ shop, product, onSave, children, canEdit }: { shop: any, product?: any, onSave: () => void, children: React.ReactNode, canEdit: boolean }) {
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
    if (!user || !shop.companyId) return;
    setIsSaving(true);
    
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication token not found.");
        
        let response;
        if (product?.id) { // Editing existing product
            const productData = {
                ...values,
                shopId: shop.id,
                ownerId: shop.ownerId,
                updatedAt: { _methodName: 'serverTimestamp' },
            };
            response = await fetch('/api/updateUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: `companies/${shop.companyId}/shops/${shop.id}/products/${product.id}`, data: productData }),
            });
            if (response.ok) toast({ title: 'Product Updated!' });
        } else { // Creating new product
             const productData = {
                ...values,
                shopId: shop.id,
                ownerId: shop.ownerId,
                createdAt: { _methodName: 'serverTimestamp' },
                updatedAt: { _methodName: 'serverTimestamp' },
            };
            response = await fetch('/api/addUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ collectionPath: `companies/${shop.companyId}/shops/${shop.id}/products`, data: productData }),
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

  const onEnhance = (enhancedUrl: string) => {
    form.setValue('imageUrl', enhancedUrl, { shouldValidate: true });
    toast({ title: "Image Enhanced!", description: "The new image has been applied." });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <fieldset disabled={!canEdit} className="space-y-4">
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
                        <FormItem>
                        <FormLabel>Product Image</FormLabel>
                        <FormControl>
                            <div>
                                <Input type="file" accept="image/*" onChange={handleImageUpload} className="mb-2" disabled={!canEdit} />
                                {uploadProgress !== null && <Progress value={uploadProgress} className="h-2" />}
                                {field.value && 
                                    <div className="mt-2 relative w-24 h-24">
                                    <Image src={field.value} alt="Product preview" width={100} height={100} className="rounded-md object-cover" />
                                    <AIEnhanceDialog currentImageUri={field.value} onEnhance={onEnhance} canEdit={canEdit}>
                                        <Button variant="outline" size="sm" className="absolute -top-2 -right-2 h-7 w-7 p-1 rounded-full" disabled={!canEdit}><Wand2 className="h-4 w-4" /></Button>
                                    </AIEnhanceDialog>
                                    </div>
                                }
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )} />
                </fieldset>
                <DialogFooter>
                     <Button type="submit" disabled={isSaving || form.formState.isSubmitting || (uploadProgress !== null && uploadProgress < 100) || !canEdit}>
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

function AIEnhanceDialog({ currentImageUri, onEnhance, children, canEdit }: { currentImageUri: string, onEnhance: (newUrl: string) => void, children: React.ReactNode, canEdit: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleEnhance = async () => {
    if (!prompt) {
      toast({ variant: 'destructive', title: 'Prompt is required.'});
      return;
    }
    setIsLoading(true);

    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Authentication token not found.");
      
      const response = await fetch('/api/enhanceImage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageDataUri: currentImageUri, prompt: prompt })
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to enhance image');

      onEnhance(result.enhancedImageDataUri);
      setIsOpen(false);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Enhancement Failed', description: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI Image Enhancement</DialogTitle>
          <DialogDescription>Describe how you want to change the image. For example: "place this on a clean white background".</DialogDescription>
        </DialogHeader>
        <fieldset disabled={!canEdit} className="space-y-4 py-4">
          <div className="relative w-40 h-40 mx-auto rounded-md overflow-hidden">
             <Image src={currentImageUri} alt="Current product" fill className="object-cover"/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompt">Your Instructions</Label>
            <Input id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., make the background a workshop setting" />
          </div>
        </fieldset>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleEnhance} disabled={isLoading || !canEdit}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
            Enhance Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AIVideoDialog({ children, canEdit }: { children: React.ReactNode, canEdit: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [videoUri, setVideoUri] = useState<string | null>(null);
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!prompt) {
            toast({ variant: 'destructive', title: 'Prompt is required.' });
            return;
        }
        setIsLoading(true);
        setVideoUri(null);

        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication token not found.");
            
            const response = await fetch('/api/generateVideo', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt, durationSeconds: 8 })
            });
            
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to generate video');

            setVideoUri(result.videoDataUri);
            toast({ title: "Video Generated!", description: "Review your new video ad." });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Video Generation Failed', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>AI Video Ad Generator</DialogTitle>
                    <DialogDescription>
                        Describe the video you want to create for your product. Be descriptive!
                        For example: "A cinematic 360-degree view of a chrome truck wheel, sparkling under studio lights."
                    </DialogDescription>
                </DialogHeader>
                <fieldset disabled={!canEdit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="video-prompt">Video Prompt</Label>
                        <Textarea id="video-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., A cinematic fly-around of a heavy-duty truck engine..." />
                    </div>
                    
                    {isLoading && (
                        <div className="text-center py-10">
                            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                            <p className="mt-4 text-muted-foreground">Generating video... This may take a minute or two.</p>
                        </div>
                    )}
                    
                    {videoUri && (
                        <div>
                            <h4 className="font-semibold mb-2">Generated Video:</h4>
                            <video controls src={videoUri} className="w-full rounded-md" />
                        </div>
                    )}
                </fieldset>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
                    <Button onClick={handleGenerate} disabled={isLoading || !canEdit}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                        Generate Video
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function Step2Products({ shop, onSave, canEdit }: { shop: any, onSave: (newData?: any) => void, canEdit: boolean }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const productsCollection = useMemoFirebase(() => {
    if (!firestore || !shop.companyId) return null;
    return collection(firestore, `companies/${shop.companyId}/shops/${shop.id}/products`);
  }, [firestore, shop.companyId, shop.id]);

  const { data: products, isLoading, forceRefresh } = useCollection(productsCollection);
  
  const handleDelete = async (productId: string) => {
    if (!user || !shop.companyId) return;
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication token not found.");
        
        const response = await fetch('/api/deleteUserDoc', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: `companies/${shop.companyId}/shops/${shop.id}/products/${productId}` }),
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
            <ProductDialog shop={shop} onSave={forceRefresh} canEdit={canEdit}>
                <Button disabled={!canEdit}><PlusCircle className="mr-2 h-4 w-4" /> Add Product</Button>
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
                                <TableCell className="text-right space-x-1">
                                     <AIVideoDialog canEdit={canEdit}>
                                        <Button variant="outline" size="icon" disabled={!canEdit}><Video className="h-4 w-4"/></Button>
                                     </AIVideoDialog>
                                     <ProductDialog shop={shop} product={p} onSave={forceRefresh} canEdit={canEdit}>
                                        <Button variant="ghost" size="icon" disabled={!canEdit}><Edit className="h-4 w-4"/></Button>
                                     </ProductDialog>
                                     <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} disabled={!canEdit}><Trash2 className="h-4 w-4 text-destructive"/></Button>
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
        
        <Button onClick={() => onSave()} disabled={!canEdit}>
          Save & Continue
        </Button>
    </div>
  )
}

// ... rest of the file is unchanged ...
