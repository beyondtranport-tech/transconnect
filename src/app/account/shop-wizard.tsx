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
import { generateImage } from '@/ai/flows/image-generation-flow';
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
          Save &amp; Continue
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

function AIGenerateDialog({ onGenerate, children, canEdit }: { onGenerate: (newUrl: string) => void, children: React.ReactNode, canEdit: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt) {
      toast({ variant: 'destructive', title: 'Prompt is required' });
      return;
    }
    setIsLoading(true);
    setGeneratedImage(null);

    try {
      const result = await generateImage({ prompt });
      setGeneratedImage(result.imageDataUri);
      toast({ title: 'Image Generated!', description: 'Your new image is ready.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Generation Failed', description: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyImage = () => {
    if (generatedImage) {
        onGenerate(generatedImage);
        setIsOpen(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI Image Generator</DialogTitle>
          <DialogDescription>
            Describe the product image you want to create.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="generate-prompt">Prompt</Label>
            <Input id="generate-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., A shiny chrome truck exhaust pipe" />
          </div>
          <div className="relative aspect-square w-full rounded-md border border-dashed flex items-center justify-center bg-muted">
            {isLoading ? (
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="mt-2 text-sm text-muted-foreground">Generating...</p>
              </div>
            ) : generatedImage ? (
              <Image src={generatedImage} alt="Generated" fill className="rounded-md object-contain" />
            ) : (
              <p className="text-sm text-muted-foreground">Generated image will appear here.</p>
            )}
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
           {generatedImage ? (
                <Button onClick={handleApplyImage}>Use This Image</Button>
           ) : <div />}
           <Button onClick={handleGenerate} disabled={isLoading || !canEdit}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate New Image
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function ProductDialog({ shop, product, onSave, children, canEdit }: { shop: any, product?: any, onSave: () => void, children: React.ReactNode, canEdit: boolean }) {
  const { user } = useUser();
  const storage = useStorage();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      price: product?.price || 0,
      sku: product?.sku || '',
      imageUrl: product?.imageUrl || '',
    },
  });

  const handleImageGenerated = (newUrl: string) => {
    form.setValue('imageUrl', newUrl);
  };

  const onSubmit = async (values: ProductFormValues) => {
    if (!user || !shop.companyId || !shop.id) return;
    setIsSaving(true);

    const dataToUpdate = {
        ...values,
        updatedAt: { _methodName: 'serverTimestamp' },
    };

    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication token not found.");

        const path = product ? `companies/${shop.companyId}/shops/${shop.id}/products/${product.id}` : `companies/${shop.companyId}/shops/${shop.id}/products`;

        const response = await fetch('/api/updateUserDoc', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                path: path,
                data: dataToUpdate,
                isMerge: product !== undefined // Merge if it's an update
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to update product.');
        }

        toast({ title: product ? 'Product Updated!' : 'Product Created!', description: 'Your product has been saved.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
        setIsSaving(false);
        setIsOpen(false);
        onSave();
    }
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    const uploadFile = async () => {
      if (!file || !storage || !user || !shop.companyId || !shop.id) return;

      setUploading(true);
      const storageRef = ref(storage, `companies/${shop.companyId}/shops/${shop.id}/products/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progress);
        },
        (error) => {
          toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
          setUploading(false);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            form.setValue('imageUrl', downloadURL);
            toast({ title: 'Upload Complete!', description: 'Your image has been uploaded.' });
          } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to get URL', description: error.message });
          } finally {
            setUploading(false);
          }
        }
      );
    };

    uploadFile();
  }, [file, storage, user, shop, form, toast]);


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {product ? 'Update details for your product.' : 'Enter details for your new product.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <fieldset disabled={!canEdit} className="space-y-6">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl><Input placeholder="Product Name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="Describe the product..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="sku" render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU (Optional)</FormLabel>
                    <FormControl><Input placeholder="SKU123" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

                <div className="border rounded-md p-4 bg-muted/50">
                    <FormField control={form.control} name="imageUrl" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Product Image</FormLabel>
                            <FormControl>
                                <div className="relative aspect-square w-full rounded-md border border-dashed flex items-center justify-center bg-muted">
                                    {field.value ? (
                                        <Image src={field.value} alt="Product" fill className="rounded-md object-contain" />
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No image selected.</p>
                                    )}
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                   <div className="flex items-center justify-between mt-4">
                        <div>
                            <Label htmlFor="image-upload" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
                                Upload Image
                            </Label>
                            <Input type="file" id="image-upload" className="hidden" onChange={handleFileChange} disabled={uploading || !canEdit} />
                        </div>

                        <AIGenerateDialog onGenerate={handleImageGenerated} canEdit={canEdit}>
                            <Button type="button" variant="secondary" disabled={uploading || !canEdit}>
                                <Wand2 className="mr-2 h-4 w-4" /> Generate Image
                            </Button>
                        </AIGenerateDialog>
                    </div>

                    {uploading && (
                        <Progress value={progress} className="mt-2" />
                    )}
                </div>
            </fieldset>
            <DialogFooter className="sm:justify-between">
                 <Button type="submit" disabled={isSaving || uploading || !canEdit}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {product ? 'Update Product' : 'Create Product'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


function Step2Products({ shop, canEdit }: { shop: any, canEdit: boolean }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [products, setProducts] = useState<any[]>([]);

    const { hasPermission } = usePermissions();
    const canManageProducts = useMemo(() => hasPermission('manageProducts', shop?.id), [hasPermission, shop?.id]);


    useEffect(() => {
        if (!firestore || !shop?.companyId || !shop?.id) return;
        setIsLoading(true);

        const productsCollection = collection(firestore, `companies/${shop.companyId}/shops/${shop.id}/products`);

        const unsubscribe = useMemoFirebase(() => productsCollection, 'collectionData', { idField: 'id' }, (data) => {
            setProducts(data);
            setIsLoading(false);
        });

        return () => unsubscribe();

    }, [firestore, shop?.companyId, shop?.id]);
    
    const handleProductSaved = () => {
      //  toast({ title: 'Products Saved!', description: 'Your product details have been updated.' });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Products</h3>
                <ProductDialog shop={shop} onSave={handleProductSaved} canEdit={canEdit && canManageProducts}>
                    <Button><PlusCircle className="mr-2 h-4 w-4"/> Add Product</Button>
                </ProductDialog>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : products.length === 0 ? (
                <Alert>
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>No products yet!</AlertTitle>
                    <AlertDescription>Add your first product to start selling.</AlertDescription>
                </Alert>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Image</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        {product.imageUrl ? (
                                            <div className="relative h-12 w-12">
                                                <Image src={product.imageUrl} alt={product.name} fill className="object-contain" />
                                            </div>
                                        ) : (
                                            <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell>${product.price.toFixed(2)}</TableCell>
                                    <TableCell>{product.sku || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <ProductDialog shop={shop} product={product} onSave={handleProductSaved} canEdit={canEdit && canManageProducts}>
                                                <Button variant="ghost" size="icon">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </ProductDialog>
                                            <Button variant="ghost" size="icon">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}

// ====== STEP 3: Appearance ======
const shopStep3Schema = z.object({
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    logoUrl: z.string().optional(),
    coverImageUrl: z.string().optional(),
});

type Step3FormValues = z.infer<typeof shopStep3Schema>;

function Step3Appearance({ shop, onSave, canEdit }: { shop: any, onSave: (newData: any) => void, canEdit: boolean }) {
  const { user } = useUser();
  const storage = useStorage();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [progressLogo, setProgressLogo] = useState(0);
  const [progressCover, setProgressCover] = useState(0);
  const [fileLogo, setFileLogo] = useState<File | null>(null);
  const [fileCover, setFileCover] = useState<File | null>(null);

  const form = useForm<Step3FormValues>({
    resolver: zodResolver(shopStep3Schema),
    defaultValues: {
      primaryColor: shop.primaryColor || '',
      secondaryColor: shop.secondaryColor || '',
      logoUrl: shop.logoUrl || '',
      coverImageUrl: shop.coverImageUrl || '',
    }
  });

  const onSubmit = async (values: Step3FormValues) => {
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

        toast({ title: 'Step 3 Saved!', description: 'Your shop appearance details have been updated.' });
        onSave(values);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
        setIsSaving(false);
    }
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    if (e.target.files && e.target.files.length > 0) {
      if (type === 'logo') {
        setFileLogo(e.target.files[0]);
      } else {
        setFileCover(e.target.files[0]);
      }
    }
  };


  useEffect(() => {
    const uploadFile = async (file: File | null, type: 'logo' | 'cover') => {
      if (!file || !storage || !user || !shop.companyId || !shop.id) return;

      if (type === 'logo') setUploadingLogo(true);
      if (type === 'cover') setUploadingCover(true);
      const storageRef = ref(storage, `companies/${shop.companyId}/shops/${shop.id}/${type}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (type === 'logo') setProgressLogo(progress);
          if (type === 'cover') setProgressCover(progress);
        },
        (error) => {
          toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
          if (type === 'logo') setUploadingLogo(false);
          if (type === 'cover') setUploadingCover(false);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            form.setValue(type === 'logo' ? 'logoUrl' : 'coverImageUrl', downloadURL);
            toast({ title: 'Upload Complete!', description: 'Your image has been uploaded.' });
          } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to get URL', description: error.message });
          } finally {
            if (type === 'logo') setUploadingLogo(false);
            if (type === 'cover') setUploadingCover(false);
          }
        }
      );
    };

    if (fileLogo) uploadFile(fileLogo, 'logo');
    if (fileCover) uploadFile(fileCover, 'cover');
  }, [fileLogo, fileCover, storage, user, shop, form, toast]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <fieldset disabled={!canEdit} className="space-y-6">
             <div className="border rounded-md p-4 bg-muted/50">
                <FormField control={form.control} name="logoUrl" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Logo Image</FormLabel>
                        <FormControl>
                            <div className="relative aspect-square w-32 rounded-md border border-dashed flex items-center justify-center bg-muted">
                                {field.value ? (
                                    <Image src={field.value} alt="Logo" fill className="rounded-md object-contain" />
                                ) : (
                                    <p className="text-sm text-muted-foreground">No logo selected.</p>
                                )}
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <Label htmlFor="logo-upload" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
                    Upload Logo
                </Label>
                <Input type="file" id="logo-upload" className="hidden" onChange={(e) => handleFileChange(e, 'logo')} disabled={uploadingLogo} />
                {uploadingLogo && (
                    <Progress value={progressLogo} className="mt-2" />
                )}
            </div>

             <div className="border rounded-md p-4 bg-muted/50">
                <FormField control={form.control} name="coverImageUrl" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Cover Image</FormLabel>
                        <FormControl>
                            <div className="relative aspect-video w-full rounded-md border border-dashed flex items-center justify-center bg-muted">
                                {field.value ? (
                                    <Image src={field.value} alt="Cover" fill className="rounded-md object-contain" />
                                ) : (
                                    <p className="text-sm text-muted-foreground">No cover image selected.</p>
                                )}
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <Label htmlFor="cover-upload" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
                    Upload Cover
                </Label>
                <Input type="file" id="cover-upload" className="hidden" onChange={(e) => handleFileChange(e, 'cover')} disabled={uploadingCover} />
                {uploadingCover && (
                    <Progress value={progressCover} className="mt-2" />
                )}
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="primaryColor" render={({ field }) => (
              <FormItem>
                <FormLabel>Primary Color</FormLabel>
                <FormControl><Input type="color" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="secondaryColor" render={({ field }) => (
              <FormItem>
                <FormLabel>Secondary Color</FormLabel>
                <FormControl><Input type="color" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </fieldset>

        <Button type="submit" disabled={isSaving || uploadingLogo || uploadingCover}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save &amp; Continue
        </Button>
      </form>
    </Form>
  );
}

// ====== STEP 4: Social Links ======
const shopStep4Schema = z.object({
  facebookLink: z.string().url("Invalid URL").optional().or(z.literal('')),
  instagramLink: z.string().url("Invalid URL").optional().or(z.literal('')),
  twitterLink: z.string().url("Invalid URL").optional().or(z.literal('')),
  linkedinLink: z.string().url("Invalid URL").optional().or(z.literal('')),
  youtubeLink: z.string().url("Invalid URL").optional().or(z.literal('')),
});

type Step4FormValues = z.infer<typeof shopStep4Schema>;

function Step4SocialLinks({ shop, onSave, canEdit }: { shop: any, onSave: (newData: any) => void, canEdit: boolean }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<Step4FormValues>({
    resolver: zodResolver(shopStep4Schema),
    defaultValues: {
      facebookLink: shop.facebookLink || '',
      instagramLink: shop.instagramLink || '',
      twitterLink: shop.twitterLink || '',
      linkedinLink: shop.linkedinLink || '',
      youtubeLink: shop.youtubeLink || '',
    }
  });

  const onSubmit = async (values: Step4FormValues) => {
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

        toast({ title: 'Step 4 Saved!', description: 'Your social links have been updated.' });
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
          <FormField control={form.control} name="facebookLink" render={({ field }) => (
            <FormItem>
              <FormLabel>Facebook Link</FormLabel>
              <FormControl><Input placeholder="https://facebook.com/yourshop" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="instagramLink" render={({ field }) => (
            <FormItem>
              <FormLabel>Instagram Link</FormLabel>
              <FormControl><Input placeholder="https://instagram.com/yourshop" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="twitterLink" render={({ field }) => (
            <FormItem>
              <FormLabel>Twitter Link</FormLabel>
              <FormControl><Input placeholder="https://twitter.com/yourshop" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="linkedinLink" render={({ field }) => (
            <FormItem>
              <FormLabel>LinkedIn Link</FormLabel>
              <FormControl><Input placeholder="https://linkedin.com/yourshop" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="youtubeLink" render={({ field }) => (
            <FormItem>
              <FormLabel>YouTube Link</FormLabel>
              <FormControl><Input placeholder="https://youtube.com/yourshop" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </fieldset>

        <Button type="submit" disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save &amp; Continue
        </Button>
      </form>
    </Form>
  );
}

// ====== STEP 5: Review & Submit ======
function Step5ReviewAndSubmit({ shop, canEdit }: { shop: any, canEdit: boolean }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !shop.companyId) return;
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
        toast({ title: 'Shop Submitted!', description: 'Your shop has been submitted for review.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Review &amp; Submit</h3>
      <p className="text-muted-foreground">
        Please review your shop details before submitting. Once submitted, your shop will be reviewed by our team.
      </p>

      <ShopPreview shop={shop} />

      <Button onClick={handleSubmit} disabled={isSubmitting || !canEdit}>
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
        Submit for Review
      </Button>
    </div>
  );
}

export function ShopWizard({ shop }: { shop: any }) {
  const [activeStep, setActiveStep] = useState(1);
  const [shopData, setShopData] = useState(shop);
  const { hasPermission } = usePermissions();

  const canEdit = useMemo(() => {
      return shop.status === 'draft' || shop.status === 'rejected';
  }, [shop.status]);

  const handleNext = () => {
    setActiveStep((step) => step + 1);
  };

  const handlePrevious = () => {
    setActiveStep((step) => step - 1);
  };

  const handleSaveStep = (newData: any) => {
    setShopData((prevData: any) => ({ ...prevData, ...newData }));
    handleNext();
  };

   const handleSeoGenerated = (seoData: any) => {
    setShopData((prevData: any) => ({ ...prevData, ...seoData }));
  };

  const steps = useMemo(() => [
    {
      id: 1,
      label: 'Core Identity',
      content: <Step1CoreIdentity shop={shopData} onSave={handleSaveStep} onSeoGenerated={handleSeoGenerated} canEdit={canEdit} />,
    },
    {
      id: 2,
      label: 'Products',
      content: <Step2Products shop={shopData} canEdit={canEdit} />,
    },
    {
      id: 3,
      label: 'Appearance',
      content: <Step3Appearance shop={shopData} onSave={handleSaveStep} canEdit={canEdit} />,
    },
    {
      id: 4,
      label: 'Social Links',
      content: <Step4SocialLinks shop={shopData} onSave={handleSaveStep} canEdit={canEdit} />,
    },
    {
      id: 5,
      label: 'Review & Submit',
      content: <Step5ReviewAndSubmit shop={shopData} canEdit={canEdit} />,
    },
  ], [shopData, canEdit]);

  const currentStep = useMemo(() => steps.find((step) => step.id === activeStep), [activeStep, steps]);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Shop Wizard</h2>
        {shop.status && (
          <Badge variant={statusColors[shop.status]}>{shop.status.replace(/_/g, ' ')}</Badge>
        )}
      </div>

      <div className="space-y-2">
        <Progress value={(activeStep / steps.length) * 100} />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {activeStep} of {steps.length}</span>
          <span>{currentStep?.label}</span>
        </div>
      </div>

      {currentStep?.content}

      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrevious} disabled={activeStep === 1}>
          Previous
        </Button>
        {activeStep < steps.length ? (
          <div />
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
