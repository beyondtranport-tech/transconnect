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
import { useFirestore, useUser, useStorage, useCollection, getClientSideAuthToken, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { Loader2, Save, CheckCircle, LayoutGrid, List, Image as ImageIcon, Sparkles, PlusCircle, Edit, Trash2, Send, Eye, ShoppingCart, Mail, Phone, UploadCloud, Wand2, Video, Search, ShieldAlert, Download, Copy, FileText, View, DollarSign, ArrowRight, RefreshCcw, AlertTriangle } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { generateImage } from '@/ai/flows/image-generation-flow';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import placeholderImageData from '@/lib/placeholder-images.json';
import { ShopPreview } from '@/components/shop-preview';
import { usePermissions } from '@/hooks/use-permissions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generateShopSeo } from '@/ai/flows/seo-flow.ts';
import { generateSocialLinks } from '@/ai/flows/social-link-generator-flow';
import { useConfig } from '@/hooks/use-config';
import { Checkbox } from '@/components/ui/checkbox';


const { placeholderImages } = placeholderImageData;


const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  draft: 'secondary',
  pending_review: 'outline',
  approved: 'default',
  rejected: 'destructive',
};

const fileToDataUri = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
});


// ====== STEP 1: Core Identity ======
const shopStep1Schema = z.object({
  shopName: z.string().min(1, "Shop name is required."),
  shopDescription: z.string().min(1, "Please provide a brief description for your shop."),
  category: z.string().min(1, "Please select a category."),
  contactEmail: z.string().email("Please enter a valid email.").optional().or(z.literal('')),
  contactPhone: z.string().optional(),
});

type Step1FormValues = z.infer<typeof shopStep1Schema>;

function StepCoreIdentity({ shop, onSave, canEdit }: { shop: any, onSave: (newData: any) => void, canEdit: boolean }) {
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
    if (!user || !shop.companyId) return;
    setIsSaving(true);
    
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
                data: { ...values, updatedAt: { _methodName: 'serverTimestamp' } }
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
  imageUrls: z.array(z.string()).optional(),
});
type ProductFormValues = z.infer<typeof productSchema>;

function AIGenerateDialog({ 
  onGenerate, 
  children, 
  canEdit,
  title,
  description,
  promptTemplate,
  shop
}: { 
  onGenerate: (newUrl: string) => void, 
  children: React.ReactNode, 
  canEdit: boolean,
  title: string,
  description: string,
  promptTemplate: string,
  shop: any,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState(promptTemplate || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const { toast } = useToast();
  
  const { user } = useUser();
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) {
        setPrompt(promptTemplate || '');
        setGeneratedImage(null);
        setUploadProgress(0);
        setIsApplying(false);
    }
  }, [isOpen, promptTemplate]);

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
      toast({ title: 'Image Generated!', description: 'Review the image below and choose an action.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Generation Failed', description: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyImage = async () => {
    if (!generatedImage || !user) {
      toast({ variant: 'destructive', title: 'Could not apply image.' });
      return;
    }
    setIsApplying(true);
    setUploadProgress(10); // Initial progress

    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error("Authentication failed.");

      const isHeroBanner = title.toLowerCase().includes('hero');
      const folder = `user-assets/${user.uid}/${isHeroBanner ? 'hero-images' : 'product-images'}`;
      const fileName = `generated_${Date.now()}.png`;

      setUploadProgress(30);

      const response = await fetch('/api/uploadImageAsset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileDataUri: generatedImage, folder, fileName }),
      });
      
      setUploadProgress(80);

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to upload image.');
      }

      setUploadProgress(100);
      onGenerate(result.url);
      toast({ title: 'Image Applied!', description: 'The new image has been added.' });
      setIsOpen(false);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed to apply image', description: e.message });
      setIsApplying(false);
    }
  };
  
    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `generated-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
            title: 'Image Downloaded',
            description: 'The image has been saved to your downloads folder.',
        });
    };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {description}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-4">
            <div className="space-y-2">
              <Label htmlFor="generate-prompt">Prompt</Label>
              <Textarea id="generate-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., A shiny chrome truck exhaust pipe" rows={5}/>
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
            {isApplying && <Progress value={uploadProgress} className="w-full" />}
          </div>
          <DialogFooter className="mt-auto flex-shrink-0 pt-4 sm:justify-between">
             <div className="flex flex-wrap items-center gap-2">
                  {generatedImage && (
                      <>
                          <Button onClick={handleApplyImage} disabled={isApplying}>
                              {isApplying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                              Apply Image
                          </Button>
                          <Button variant="secondary" onClick={handleDownload} disabled={isApplying}>
                              <Download className="mr-2 h-4 w-4" /> Download
                          </Button>
                      </>
                  )}
             </div>
             <Button onClick={handleGenerate} disabled={isLoading || isApplying || !canEdit}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Generate New Image
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


function ProductDialog({ shop, product, onComplete, children, canEdit }: { shop: any, product?: any, onComplete: () => void, children: React.ReactNode, canEdit: boolean }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      price: product?.price || 0,
      sku: product?.sku || '',
      imageUrls: product?.imageUrls || [],
    },
  });
  
  useEffect(() => {
    if (isOpen) {
        form.reset({
            name: product?.name || '',
            description: product?.description || '',
            price: product?.price || 0,
            sku: product?.sku || '',
            imageUrls: product?.imageUrls || [],
        });
    }
  }, [isOpen, product, form]);

  const handleImageGenerated = (newUrl: string) => {
    const currentUrls = form.getValues('imageUrls') || [];
    form.setValue('imageUrls', [...currentUrls, newUrl]);
  };

  const onSubmit = async (values: ProductFormValues) => {
    if (!user || !shop.companyId || !shop.id) return;
    setIsSaving(true);
    
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication token not found.");
        
        const path = product ? `companies/${shop.companyId}/shops/${shop.id}/products/${product.id}` : `companies/${shop.companyId}/shops/${shop.id}/products`;
        
        const dataToSave = {
            ...values,
            imageUrls: values.imageUrls || [],
        }

        const body = product
          ? { path, data: { ...dataToSave, updatedAt: { _methodName: 'serverTimestamp' } } }
          : { collectionPath: path, data: dataToSave };

        const apiEndpoint = product ? '/api/updateUserDoc' : '/api/addUserDoc';
        
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to save product.');
        }

        toast({ title: product ? 'Product Updated!' : 'Product Created!', description: 'Your product has been saved.' });
        onComplete();
        setIsOpen(false);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    } finally {
        setIsSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setUploadProgress(10); // Initial progress

    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");

        const fileDataUri = await fileToDataUri(file);
        setUploadProgress(30);

        const folder = `user-assets/${user.uid}/product-images`;
        const fileName = `${Date.now()}_${file.name}`;
        
        const response = await fetch('/api/uploadImageAsset', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileDataUri, folder, fileName }),
        });

        setUploadProgress(80);
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to upload image.');
        }
        
        const currentUrls = form.getValues('imageUrls') || [];
        form.setValue('imageUrls', [...currentUrls, result.url], { shouldValidate: true });
        
        setUploadProgress(100);
        toast({ title: 'Image Uploaded!', description: 'Image is ready. Fill out product details and click "Create Product" to save.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
    } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
        setUploading(false);
        setUploadProgress(0);
    }
};


  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-w-2xl flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {product ? 'Update details for your product.' : 'Enter details for your new product.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
               <div className="flex-1 overflow-y-auto space-y-6 pr-4 py-4">
                  <fieldset disabled={!canEdit || uploading} className="space-y-6">
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

                      <div className="border rounded-md p-4 bg-muted/50 space-y-4">
                         <FormField control={form.control} name="imageUrls" render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Product Images</FormLabel>
                                  <FormControl>
                                      <div className="grid grid-cols-3 gap-2">
                                          {(field.value || []).map((url) => (
                                              <div key={url} className="relative aspect-square">
                                                  <Image src={url} alt="Product image 1" fill className="object-contain border" />
                                                  <Button
                                                      type="button"
                                                      variant="destructive"
                                                      size="icon"
                                                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                                      onClick={() => {
                                                          const newUrls = [...(field.value || [])];
                                                          const indexToRemove = newUrls.indexOf(url);
                                                          if (indexToRemove > -1) {
                                                              newUrls.splice(indexToRemove, 1);
                                                          }
                                                          form.setValue('imageUrls', newUrls);
                                                      }}
                                                      disabled={!canEdit}
                                                  >
                                                      <Trash2 className="h-4 w-4" />
                                                  </Button>
                                              </div>
                                          ))}
                                          {(!field.value || field.value.length === 0) && (
                                              <div className="col-span-3 relative aspect-square w-full rounded-md border border-dashed flex items-center justify-center bg-muted">
                                                  <p className="text-sm text-muted-foreground">No images selected.</p>
                                              </div>
                                          )}
                                      </div>
                                  </FormControl>
                                  <FormMessage />
                              </FormItem>
                          )} />
                          
                          {uploading && (
                                <div className="space-y-1">
                                    <Label className="text-xs">Uploading...</Label>
                                    <Progress value={uploadProgress} className="h-2"/>
                                </div>
                          )}
                          <div className="flex items-center justify-between mt-4">
                              <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading || !canEdit}>
                                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>}
                                  Upload Image
                              </Button>
                              <Input ref={fileInputRef} type="file" id="image-upload" className="hidden" onChange={handleFileChange} disabled={uploading || !canEdit} accept="image/*" />
                               <AIGenerateDialog 
                                  onGenerate={handleImageGenerated} 
                                  canEdit={canEdit}
                                  title="AI Product Image Generator"
                                  description="Describe the product image you want to create. Be specific for best results."
                                  promptTemplate="A clean, professional studio photograph of a [Your Product Name, e.g., chrome truck exhaust pipe] on a white background. The lighting should be bright and highlight the product's details."
                                  shop={shop}
                              >
                                  <Button type="button" variant="secondary" disabled={uploading || !canEdit}>
                                      <Wand2 className="mr-2 h-4 w-4" /> Generate Image
                                  </Button>
                              </AIGenerateDialog>
                          </div>
                      </div>
                  </fieldset>
              </div>
              <DialogFooter className="sm:justify-between mt-auto flex-shrink-0 pt-4 border-t">
                   <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                   <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isSaving || uploading || !canEdit}>
                      {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      {product ? 'Update Product' : 'Create Product'}
                  </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}


function StepProducts({ shop, canEdit }: { shop: any, canEdit: boolean }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !shop?.companyId || !shop?.id) return null;
    return collection(firestore, `companies/${shop.companyId}/shops/${shop.id}/products`);
  }, [firestore, shop.companyId, shop.id]);

  const { data: products, isLoading, forceRefresh } = useCollection(productsQuery);
  
  const { can } = usePermissions();
  const canManageProducts = can('manage', 'products');
  const canDeleteProducts = can('delete', 'products');

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");
        
        const response = await fetch('/api/deleteUserDoc', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: `companies/${shop.companyId}/shops/${shop.id}/products/${productToDelete.id}` }),
        });
        
        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error || 'Failed to delete product.');
        }
        
        toast({ title: "Product Deleted" });
        forceRefresh();
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
    } finally {
        setIsDeleting(false);
        setProductToDelete(null);
        setIsDeleteAlertOpen(false);
    }
  };

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Products</h3>
            <ProductDialog shop={shop} onComplete={forceRefresh} canEdit={canEdit && canManageProducts}>
                <Button><PlusCircle className="mr-2 h-4 w-4"/> Add Product</Button>
            </ProductDialog>
        </div>

        {isLoading ? (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : products && products.length > 0 ? (
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
                                    <div className="relative h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                                        {(product.imageUrls && product.imageUrls[0]) ? (
                                            <Image src={product.imageUrls[0]} alt={product.name} fill className="object-contain border" />
                                        ) : (
                                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>{product.name}</TableCell>
                                <TableCell>R {product.price.toFixed(2)}</TableCell>
                                <TableCell>{product.sku || '-'}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <ProductDialog shop={shop} product={product} onComplete={forceRefresh} canEdit={canEdit && canManageProducts}>
                                            <Button variant="ghost" size="icon">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </ProductDialog>
                                        <AlertDialog open={isDeleteAlertOpen && productToDelete?.id === product.id} onOpenChange={(open) => {if(!open) setIsDeleteAlertOpen(false)}}>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" onClick={() => {setProductToDelete(product); setIsDeleteAlertOpen(true);}} disabled={!canEdit || !canDeleteProducts}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete the product "{productToDelete?.name}". This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel onClick={() => setProductToDelete(null)}>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleDeleteProduct} disabled={isDeleting} variant="destructive">
                                                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Delete'}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        ) : (
            <Alert>
                <ShoppingCart className="h-4 w-4" />
                <AlertTitle>No products yet!</AlertTitle>
                <AlertDescription>Add your first product to start selling.</AlertDescription>
            </Alert>
        )}
    </div>
  );
}

// ====== STEP 3: Appearance ======
const shopStep3Schema = z.object({
    heroBannerUrl: z.string().optional(),
});

type Step3FormValues = z.infer<typeof shopStep3Schema>;

function StepAppearance({ shop, onSave, canEdit }: { shop: any, onSave: (newData: any) => void, canEdit: boolean }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const form = useForm<Step3FormValues>({
    resolver: zodResolver(shopStep3Schema),
    defaultValues: {
      heroBannerUrl: shop.heroBannerUrl || '',
    }
  });
  
  useEffect(() => {
    form.reset({ heroBannerUrl: shop.heroBannerUrl || '' });
  }, [shop.heroBannerUrl, form]);

  const handleImageGenerated = (newUrl: string) => {
    form.setValue('heroBannerUrl', newUrl);
  };
  
  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");

        const fileDataUri = await fileToDataUri(file);
        setUploadProgress(30);

        const folder = `user-assets/${user.uid}/hero-images`;
        const fileName = `hero_${Date.now()}_${file.name}`;
        
        const response = await fetch('/api/uploadImageAsset', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileDataUri, folder, fileName }),
        });

        setUploadProgress(80);
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to upload image.');
        }
        
        form.setValue('heroBannerUrl', result.url, { shouldValidate: true });
        
        setUploadProgress(100);
        toast({ title: 'Image Uploaded!' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
    } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
        setIsUploading(false);
        setUploadProgress(0);
    }
  };
  
  const onSubmit = async (values: Step3FormValues) => {
    if (!user || !shop.companyId) return;
    setIsSaving(true);
    
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
                data: { ...values, updatedAt: { _methodName: 'serverTimestamp' } }
            }),
        });

        if (!response.ok) {
          const result = await response.json();
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <fieldset disabled={!canEdit} className="space-y-6">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-4">
                 <h3 className="font-semibold flex items-center gap-2"><ImageIcon className="h-5 w-5 text-primary"/> Hero Banner</h3>
                <p className="text-sm text-muted-foreground">
                   Upload your own hero banner image or generate one with AI. Recommended size: 1200x400 pixels.
                </p>
                <FormField control={form.control} name="heroBannerUrl" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Hero Banner Image</FormLabel>
                        <FormControl>
                            <div className="relative aspect-video w-full rounded-md border border-dashed flex items-center justify-center bg-muted">
                                {field.value ? (
                                    <Image src={field.value} alt="Hero Banner" fill className="object-cover" />
                                ) : (
                                    <p className="text-sm text-muted-foreground">No hero banner generated yet.</p>
                                )}
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                {isUploading && (
                  <div className="space-y-1">
                      <Label className="text-xs">Uploading...</Label>
                      <Progress value={uploadProgress} className="h-2"/>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-4">
                  <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading || !canEdit}>
                      {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4"/>}
                      Upload Image
                  </Button>
                  <Input ref={fileInputRef} type="file" id="hero-image-upload" className="hidden" onChange={handleHeroImageUpload} disabled={isUploading || !canEdit} accept="image/*" />

                  <AIGenerateDialog 
                    onGenerate={handleImageGenerated} 
                    canEdit={canEdit}
                    title="AI Hero Banner Generator"
                    description="Describe the hero image you want for your shop. Be specific about the truck, setting, and mood."
                    promptTemplate="A cinematic, wide-angle photograph of a [Your Truck Type, e.g., Scania R 560] truck driving on a scenic highway. The style should be professional, high-quality, and inspiring, with a beautiful sunset in the background."
                    shop={shop}
                >
                    <Button type="button" variant="secondary" disabled={isUploading || !canEdit}>
                        <Wand2 className="mr-2 h-4 w-4" /> Generate with AI
                    </Button>
                  </AIGenerateDialog>
                </div>
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

// ====== STEP 4: Social Links ======
const shopStep4Schema = z.object({
  facebookLink: z.string().url("Invalid URL").optional().or(z.literal('')),
  instagramLink: z.string().url("Invalid URL").optional().or(z.literal('')),
  twitterLink: z.string().url("Invalid URL").optional().or(z.literal('')),
  linkedinLink: z.string().url("Invalid URL").optional().or(z.literal('')),
  youtubeLink: z.string().url("Invalid URL").optional().or(z.literal('')),
});

type Step4FormValues = z.infer<typeof shopStep4Schema>;

function StepSocialLinks({ shop, onSave, canEdit }: { shop: any, onSave: (newData: any) => void, canEdit: boolean }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
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

  useEffect(() => {
    form.reset({
      facebookLink: shop.facebookLink || '',
      instagramLink: shop.instagramLink || '',
      twitterLink: shop.twitterLink || '',
      linkedinLink: shop.linkedinLink || '',
      youtubeLink: shop.youtubeLink || '',
    });
  }, [shop, form]);
  
  const handleGenerateLinks = async () => {
    setIsGenerating(true);
    try {
        const result = await generateSocialLinks({ shopName: shop.shopName });
        if (result.facebookLink) form.setValue('facebookLink', result.facebookLink);
        if (result.instagramLink) form.setValue('instagramLink', result.instagramLink);
        if (result.twitterLink) form.setValue('twitterLink', result.twitterLink);
        if (result.linkedinLink) form.setValue('linkedinLink', result.linkedinLink);
        if (result.youtubeLink) form.setValue('youtubeLink', result.youtubeLink);
        toast({ title: 'Suggestions Generated!', description: 'Review the suggested links and save.' });
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'AI Generation Failed', description: e.message });
    } finally {
        setIsGenerating(false);
    }
  };

  const onSubmit = async (values: Step4FormValues) => {
    if (!user || !shop.companyId) return;
    setIsSaving(true);
    
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
                data: { ...values, updatedAt: { _methodName: 'serverTimestamp' } }
            }),
        });

        if (!response.ok) {
          const result = await response.json();
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
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary"/> AI Link Suggester</h3>
            <p className="text-sm text-muted-foreground">
                Let our AI assistant suggest conventional URLs for your social media pages based on your shop name. Note: This does not create the pages for you.
            </p>
            <Button type="button" onClick={handleGenerateLinks} disabled={isGenerating || !canEdit}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate AI Suggestions
            </Button>
        </div>

        <fieldset disabled={!canEdit} className="space-y-6">
          <FormField control={form.control} name="facebookLink" render={({ field }) => (
              <FormItem>
                  <FormLabel>Facebook</FormLabel>
                  <FormControl><Input placeholder="https://facebook.com/yourshop" {...field} /></FormControl>
                  <FormMessage />
              </FormItem>
          )} />
          <FormField control={form.control} name="instagramLink" render={({ field }) => (
              <FormItem>
                  <FormLabel>Instagram</FormLabel>
                  <FormControl><Input placeholder="https://instagram.com/yourshop" {...field} /></FormControl>
                  <FormMessage />
              </FormItem>
          )} />
          <FormField control={form.control} name="twitterLink" render={({ field }) => (
              <FormItem>
                  <FormLabel>Twitter (X)</FormLabel>
                  <FormControl><Input placeholder="https://x.com/yourshop" {...field} /></FormControl>
                  <FormMessage />
              </FormItem>
          )} />
          <FormField control={form.control} name="linkedinLink" render={({ field }) => (
              <FormItem>
                  <FormLabel>LinkedIn</FormLabel>
                  <FormControl><Input placeholder="https://linkedin.com/company/yourshop" {...field} /></FormControl>
                  <FormMessage />
              </FormItem>
          )} />
          <FormField control={form.control} name="youtubeLink" render={({ field }) => (
              <FormItem>
                  <FormLabel>YouTube</FormLabel>
                  <FormControl><Input placeholder="https://youtube.com/yourshop" {...field} /></FormControl>
                  <FormMessage />
              </FormItem>
          )} />
        </fieldset>

        <Button type="submit" disabled={isSaving || !canEdit}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save &amp; Continue
        </Button>
      </form>
    </Form>
  );
}

// ====== STEP 5: SEO ======
const shopStep5Schema = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type Step5FormValues = z.infer<typeof shopStep5Schema>;

function StepSeo({ shop, onSave, canEdit, onSeoGenerated }: { shop: any, onSave: (newData: any) => void, canEdit: boolean, onSeoGenerated: (seoData: any) => void }) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);

  const form = useForm<Step5FormValues>({
    resolver: zodResolver(shopStep5Schema),
    defaultValues: {
      metaTitle: shop.metaTitle || '',
      metaDescription: shop.metaDescription || '',
      tags: shop.tags || [],
    },
  });

   useEffect(() => {
    form.reset({
      metaTitle: shop.metaTitle || '',
      metaDescription: shop.metaDescription || '',
      tags: shop.tags || [],
    });
  }, [shop, form]);

   const handleGenerateSeo = async () => {
    setIsGeneratingSeo(true);
    try {
        const result = await generateShopSeo({
            shopName: shop.shopName,
            shopDescription: shop.shopDescription,
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

  const onSubmit = async (values: Step5FormValues) => {
    setIsSaving(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication token not found.");
        
        await fetch('/api/updateUserDoc', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                path: `companies/${shop.companyId}/shops/${shop.id}`,
                data: { ...values, updatedAt: { _methodName: 'serverTimestamp' } }
            }),
        });

        toast({ title: 'Step 5 Saved!', description: 'Your SEO details have been updated.' });
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
             <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><Search className="h-5 w-5 text-primary"/> AI SEO Booster</h3>
                <p className="text-sm text-muted-foreground">
                   Let our AI assistant generate an SEO-friendly title, description, and tags for your shop based on the name and description from Step 1.
                </p>
                <Button type="button" onClick={handleGenerateSeo} disabled={isGeneratingSeo || !canEdit}>
                    {isGeneratingSeo ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                    Generate SEO Content
                </Button>
                <Separator />
                <div className="space-y-4 pt-2">
                    <FormField control={form.control} name="metaTitle" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Meta Title</FormLabel>
                            <FormControl><Input placeholder="Your SEO Title" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="metaDescription" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Meta Description</FormLabel>
                            <FormControl><Textarea placeholder="Your SEO Description" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="tags" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Keywords / Tags</FormLabel>
                            <FormControl><Input placeholder="e.g. truck parts, diesel mechanic, scania" defaultValue={Array.isArray(field.value) ? field.value.join(', ') : ''} onChange={(e) => field.onChange(e.target.value.split(',').map(s => s.trim()))} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
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

// ====== STEP 6: Legal Documents ======
const shopStep6Schema = z.object({
    termsUrl: z.string().url().optional().or(z.literal('')),
    returnsPolicyUrl: z.string().url().optional().or(z.literal('')),
    privacyPolicyUrl: z.string().url().optional().or(z.literal('')),
});

type Step6FormValues = z.infer<typeof shopStep6Schema>;

function StepLegal({ shop, onSave, canEdit }: { shop: any, onSave: (newData: any) => void, canEdit: boolean }) {
    const { user } = useUser();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const form = useForm<Step6FormValues>({
        resolver: zodResolver(shopStep6Schema),
        defaultValues: {
            termsUrl: shop.termsUrl || '',
            returnsPolicyUrl: shop.returnsPolicyUrl || '',
            privacyPolicyUrl: shop.privacyPolicyUrl || '',
        }
    });

    useEffect(() => {
        form.reset({
            termsUrl: shop.termsUrl || '',
            returnsPolicyUrl: shop.returnsPolicyUrl || '',
            privacyPolicyUrl: shop.privacyPolicyUrl || '',
        });
    }, [shop, form]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof Step6FormValues) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        if (file.type !== 'application/pdf') {
            toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload a PDF document.' });
            return;
        }

        setUploading(fieldName);
        setProgress(10);
        
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            const fileDataUri = await fileToDataUri(file);
            setProgress(30);

            const folder = `user-assets/${user.uid}/shop-documents`;
            const fileName = `${fieldName}_${Date.now()}.pdf`;
            
            const response = await fetch('/api/uploadImageAsset', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileDataUri, folder, fileName, contentType: 'application/pdf' }),
            });

            setProgress(80);
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to upload document.');
            }
            
            form.setValue(fieldName, result.url);
            setProgress(100);
            toast({ title: 'Document Uploaded!', description: 'Remember to save your changes.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
        } finally {
            setUploading(null);
            setProgress(0);
            if (e.target) e.target.value = ''; // Reset file input
        }
    };
    
    const onSubmit = async (values: Step6FormValues) => {
        if (!user || !shop.companyId) return;
        setIsSaving(true);
        
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication token not found.");
            
            await fetch('/api/updateUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: `companies/${shop.companyId}/shops/${shop.id}`,
                    data: { ...values, updatedAt: { _methodName: 'serverTimestamp' } }
                }),
            });

            toast({ title: 'Step 6 Saved!', description: 'Your legal documents have been linked.' });
            onSave(values);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        } finally {
            setIsSaving(false);
        }
    };
    
    const DocumentField = ({ fieldName, label }: { fieldName: keyof Step6FormValues; label: string; }) => {
        const fileInputRef = React.useRef<HTMLInputElement>(null);
        const url = form.watch(fieldName);

        return (
            <div className="space-y-2">
                <FormLabel>{label}</FormLabel>
                {url ? (
                    <div className="flex items-center gap-2">
                        <Input value={url} readOnly />
                        <Button asChild variant="secondary"><a href={url} target="_blank" rel="noopener noreferrer"><View className="h-4 w-4" /></a></Button>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No document uploaded.</p>
                )}
                {uploading === fieldName && <Progress value={progress} className="h-2 w-full" />}
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={!!uploading || !canEdit}>
                    {uploading === fieldName ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4" />}
                    {url ? 'Upload New' : 'Upload PDF'}
                </Button>
                <Input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleFileUpload(e, fieldName)} accept=".pdf" />
            </div>
        );
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                 <div className="space-y-6">
                    <DocumentField fieldName="termsUrl" label="Terms &amp; Conditions" />
                    <DocumentField fieldName="returnsPolicyUrl" label="Returns Policy" />
                    <DocumentField fieldName="privacyPolicyUrl" label="Privacy Policy" />
                </div>
                <Button type="submit" disabled={isSaving || !!uploading || !canEdit}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save &amp; Continue
                </Button>
            </form>
        </Form>
    );
}

// ====== STEP 7: Commercials ======
const proposalSchema = z.object({
    percentage: z.coerce.number().min(0, "Cannot be negative").max(100, "Cannot be over 100"),
});
type ProposalFormValues = z.infer<typeof proposalSchema>;

function StepCommercials({ shop, canEdit, onSave }: { shop: any, onSave: (newData: any) => void, canEdit: boolean }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isProposing, setIsProposing] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const { data: mallCommissions, isLoading: areCommissionsLoading } = useConfig<any>('mallCommissions');

  const agreementsQuery = useMemoFirebase(() => {
    if (!firestore || !shop.companyId || !shop.id) return null;
    return collection(firestore, `companies/${shop.companyId}/shops/${shop.id}/agreements`);
  }, [firestore, shop.companyId, shop.id]);

  const { data: agreements, isLoading: areAgreementsLoading, forceRefresh } = useCollection(agreementsQuery);

  const activeAgreement = useMemo(() => agreements?.find(a => a.status === 'active'), [agreements]);
  const proposedAgreement = useMemo(() => agreements?.find(a => a.status === 'proposed'), [agreements]);

  const form = useForm<ProposalFormValues>({
      resolver: zodResolver(proposalSchema),
      defaultValues: {
          percentage: mallCommissions?.supplierMall || 2.5
      }
  });

  useEffect(() => {
    if (mallCommissions?.supplierMall) {
        form.setValue('percentage', mallCommissions.supplierMall);
    }
  }, [mallCommissions, form]);

  const handlePropose = async (values: ProposalFormValues) => {
      if (!user) return;
      setIsProposing(true);
      try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");

        const response = await fetch('/api/addUserDoc', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                collectionPath: `companies/${shop.companyId}/shops/${shop.id}/agreements`,
                data: {
                    percentage: values.percentage,
                    status: 'proposed',
                    effectiveDate: { _methodName: 'serverTimestamp' }, // will be updated on approval
                    proposedBy: user.uid,
                }
            })
        });

        if (!response.ok) throw new Error((await response.json()).error || 'Failed to submit proposal.');

        toast({ title: "Proposal Submitted", description: "Your proposed commission rate has been sent for review." });
        forceRefresh();

      } catch (error: any) {
         toast({ variant: 'destructive', title: 'Proposal Failed', description: error.message });
      } finally {
        setIsProposing(false);
      }
  };

  const handleAccept = async () => {
    if (!user || !shop.companyId || !proposedAgreement) return;
    setIsAccepting(true);

    try {
      const token = await getClientSideAuthToken();
      if (!token) throw new Error('Authentication failed.');

      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'acceptCommercialAgreement',
          payload: {
            companyId: shop.companyId,
            shopId: shop.id,
            agreementId: proposedAgreement.id,
            userId: user.uid,
          }
        }),
      });

      if (!response.ok) throw new Error((await response.json()).error || 'Failed to accept agreement.');

      toast({ title: 'Agreement Accepted!', description: `The new commission of ${proposedAgreement.percentage}% is now active.` });
      forceRefresh();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
      setIsAccepting(false);
    }
  };

  const isLoading = areAgreementsLoading || areCommissionsLoading;

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : activeAgreement ? (
        <Card>
          <CardHeader>
            <CardTitle>Active Commercial Agreement</CardTitle>
            <CardDescription>This is the current commission structure for sales in your shop.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">{activeAgreement.percentage}%</div>
            <p className="text-sm text-muted-foreground mt-1">Platform Commission</p>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">Effective since: {new Date(activeAgreement.effectiveDate).toLocaleDateString()}</p>
          </CardFooter>
        </Card>
      ) : null}
      
       {proposedAgreement ? (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle>Agreement Proposed</CardTitle>
            <CardDescription>
                {proposedAgreement.proposedBy === user?.uid 
                ? "Your proposal is awaiting review by the platform administrator."
                : "A new commercial agreement is awaiting your approval."
                }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{proposedAgreement.percentage}%</div>
            <p className="text-sm text-muted-foreground mt-1">Proposed Platform Commission</p>
          </CardContent>
           {proposedAgreement.proposedBy !== user?.uid && (
               <CardFooter>
                <Button onClick={() => setIsAlertOpen(true)} disabled={isAccepting || !canEdit}>
                  {isAccepting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4" />}
                  Accept New Agreement
                </Button>
              </CardFooter>
           )}
        </Card>
      ) : !activeAgreement ? (
        <Card>
            <CardHeader>
                <CardTitle>Propose Commercial Terms</CardTitle>
                <CardDescription>
                    The default platform commission for your shop category is {mallCommissions?.supplierMall || 'N/A'}%. You can accept these terms or propose a different rate for review.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handlePropose)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="percentage"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Proposed Commission Rate (%)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <Button type="submit" disabled={isProposing || !canEdit}>
                            {isProposing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Submit Proposal
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
      ) : null}

        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Accept Agreement?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to accept the proposed commission rate of {proposedAgreement?.percentage}%? This will archive any previous agreements and make this one active.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleAccept} disabled={isAccepting}>
                        Yes, Accept Agreement
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>


      <div className="pt-6">
         <Button onClick={() => onSave({})} disabled={!activeAgreement}>
            Save &amp; Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ====== NEW Terms STEP ======
function StepTerms({ onSave, onTermsAgreed, canEdit }: { onSave: (newData: any) => void; onTermsAgreed: (agreed: boolean) => void; canEdit: boolean; }) {
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [agreeReturns, setAgreeReturns] = useState(false);
    const [agreePrivacy, setAgreePrivacy] = useState(false);

    useEffect(() => {
        onTermsAgreed(agreeTerms && agreeReturns && agreePrivacy);
    }, [agreeTerms, agreeReturns, agreePrivacy, onTermsAgreed]);
    
    return (
        <div className="space-y-6">
            <CardHeader className="px-0">
                <CardTitle>Terms &amp; Policies</CardTitle>
                <CardDescription>
                    Please review and agree to our terms and policies. Accepting these is required to publish your shop.
                </CardDescription>
            </CardHeader>
            
            <div className="space-y-4 rounded-md border p-6">
                <div className="flex items-start space-x-3">
                    <Checkbox id="terms" checked={agreeTerms} onCheckedChange={(checked) => setAgreeTerms(!!checked)} disabled={!canEdit} />
                    <Label htmlFor="terms" className="text-sm font-normal leading-relaxed">
                        I have read and agree to the TransConnect <Link href="/terms" target="_blank" className="underline text-primary">Terms of Service</Link>.
                    </Label>
                </div>
                <div className="flex items-start space-x-3">
                    <Checkbox id="returns" checked={agreeReturns} onCheckedChange={(checked) => setAgreeReturns(!!checked)} disabled={!canEdit} />
                    <Label htmlFor="returns" className="text-sm font-normal leading-relaxed">
                        I confirm that my shop will adhere to the platform's standard <Link href="/terms#returns" target="_blank" className="underline text-primary">Return Policy</Link>, unless my own is provided in the Legal Docs step.
                    </Label>
                </div>
                <div className="flex items-start space-x-3">
                    <Checkbox id="privacy" checked={agreePrivacy} onCheckedChange={(checked) => setAgreePrivacy(!!checked)} disabled={!canEdit} />
                    <Label htmlFor="privacy" className="text-sm font-normal leading-relaxed">
                        I understand and agree to the TransConnect <Link href="/privacy" target="_blank" className="underline text-primary">Privacy Policy</Link> regarding the handling of customer data.
                    </Label>
                </div>
            </div>

            <Button onClick={() => onSave({})} disabled={!canEdit || !(agreeTerms && agreeReturns && agreePrivacy)}>
                Agree &amp; Continue
                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
    );
}

// ====== NEW PUBLISH STEP ======
function StepPublish({ onPublish, isPublishing, allStepsComplete, canEdit }: { onPublish: () => void; isPublishing: boolean; allStepsComplete: boolean; canEdit: boolean; }) {
    return (
        <div className="space-y-6">
            <CardHeader className="px-0">
                <CardTitle>Publish Your Shop</CardTitle>
                <CardDescription>
                    By publishing your shop, you agree to our terms and policies. Your shop will be live and visible to all members of the TransConnect ecosystem.
                </CardDescription>
            </CardHeader>
            
            {!allStepsComplete && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Incomplete Setup</AlertTitle>
                    <AlertDescription>
                        You must complete all previous steps before you can publish your shop. A checkmark will appear next to each completed step in the sidebar.
                    </AlertDescription>
                </Alert>
            )}

            <Button onClick={onPublish} disabled={!allStepsComplete || isPublishing || !canEdit}>
                {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Publish Shop
            </Button>
        </div>
    );
}

// NEW PREVIEW STEP COMPONENT
function StepPreview({
  shop,
  products,
  onApprove,
  onMakeChanges,
}: {
  shop: any;
  products: any[];
  onApprove: () => void;
  onMakeChanges: () => void;
}) {
  return (
    <div className="space-y-6">
      <CardHeader className="px-0">
        <CardTitle>Shop Preview</CardTitle>
        <CardDescription>
          This is how your shop will appear to customers. Review everything
          carefully before publishing.
        </CardDescription>
      </CardHeader>

      <div className="border-2 border-dashed rounded-lg p-2 bg-muted">
        <div className="h-[60vh] overflow-y-auto">
            <ShopPreview shop={shop} products={products} />
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 mt-6 border-t">
        <Button variant="outline" onClick={onMakeChanges}>
          <Edit className="mr-2 h-4 w-4" />
          Make Changes
        </Button>
        <Button onClick={onApprove}>
          Looks Good, Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}


// ====== MAIN WIZARD COMPONENT ======
export function ShopWizard({ shop: initialShop, onShopUpdate }: { shop: any, onShopUpdate: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [shopData, setShopData] = useState(initialShop);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const { can, isLoading: permissionsLoading } = usePermissions();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    setShopData(initialShop);
  }, [initialShop]);
  
  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !shopData?.companyId || !shopData?.id) return null;
    return collection(firestore, `companies/${shopData.companyId}/shops/${shopData.id}/products`);
  }, [firestore, shopData.companyId, shopData.id]);
  const { data: products, forceRefresh: forceRefreshProducts } = useCollection(productsQuery);

  const agreementsQuery = useMemoFirebase(() => {
    if (!firestore || !shopData?.companyId || !shopData?.id) return null;
    return collection(firestore, `companies/${shopData.companyId}/shops/${shopData.id}/agreements`);
  }, [firestore, shopData.companyId, shopData.id]);
  const { data: agreements } = useCollection(agreementsQuery);
  const activeAgreement = useMemo(() => agreements?.find(a => a.status === 'active'), [agreements]);


  const handleSave = (newData: any) => {
    setShopData({ ...shopData, ...newData });
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
    forceRefreshProducts();
  };

  const handleSeoGenerated = (seoData: any) => {
    setShopData({
      ...shopData,
      metaTitle: seoData.metaTitle,
      metaDescription: seoData.metaDescription,
      tags: seoData.tags,
    });
  };
  
  const handlePublish = async () => {
    setIsPublishing(true);
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");

        const updateStatusResponse = await fetch('/api/updateUserDoc', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                path: `companies/${shopData.companyId}/shops/${shopData.id}`,
                data: { status: 'approved', updatedAt: { _methodName: 'serverTimestamp' } }
            }),
        });
        if (!updateStatusResponse.ok) throw new Error((await updateStatusResponse.json()).error || 'Failed to update shop status.');

        const syncResponse = await fetch('/api/syncShopProducts', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ shopId: shopData.id, companyId: shopData.companyId })
        });
        if (!syncResponse.ok) throw new Error((await syncResponse.json()).error || 'Failed to publish shop.');

        toast({ title: 'Shop Published!', description: 'Your shop is now live on the platform.' });
        onShopUpdate();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Publishing Failed', description: error.message });
    } finally {
        setIsPublishing(false);
    }
  };
  
  const canEditShop = can('edit', 'shop');

  const stepCompleteness = useMemo(() => {
    return {
        'Core Identity': !!(shopData.shopName && shopData.shopDescription && shopData.category),
        'Products': !!(products && products.length > 0),
        'Appearance': !!shopData.heroBannerUrl,
        'Social Links': !!(shopData.facebookLink || shopData.instagramLink || shopData.twitterLink),
        'SEO': !!(shopData.metaTitle && shopData.metaDescription && shopData.tags?.length > 0),
        'Legal Docs': !!(shopData.termsUrl || shopData.returnsPolicyUrl || shopData.privacyPolicyUrl),
        'Commercials': !!activeAgreement,
        'Terms': termsAgreed,
    };
  }, [shopData, products, activeAgreement, termsAgreed]);
  
  const allStepsComplete = useMemo(() => {
    const requiredSteps = Object.keys(stepCompleteness);
    return requiredSteps.every(step => stepCompleteness[step as keyof typeof stepCompleteness]);
  }, [stepCompleteness]);


  const completenessPercentage = useMemo(() => {
    const completedCount = Object.values(stepCompleteness).filter(Boolean).length;
    const totalSteps = Object.keys(stepCompleteness).length;
    return (completedCount / totalSteps) * 100;
  }, [stepCompleteness]);

  const steps = [
    { id: 'Core Identity', component: <StepCoreIdentity shop={shopData} onSave={handleSave} canEdit={canEditShop} /> },
    { id: 'Products', component: <StepProducts shop={shopData} canEdit={canEditShop} /> },
    { id: 'Appearance', component: <StepAppearance shop={shopData} onSave={handleSave} canEdit={canEditShop} /> },
    { id: 'Social Links', component: <StepSocialLinks shop={shopData} onSave={handleSave} canEdit={canEditShop} /> },
    { id: 'SEO', component: <StepSeo shop={shopData} onSave={handleSave} canEdit={canEditShop} onSeoGenerated={handleSeoGenerated} /> },
    { id: 'Legal Docs', component: <StepLegal shop={shopData} onSave={handleSave} canEdit={canEditShop} /> },
    { id: 'Commercials', component: <StepCommercials shop={shopData} onSave={handleSave} canEdit={canEditShop} /> },
    { id: 'Terms', component: <StepTerms onSave={handleSave} onTermsAgreed={setTermsAgreed} canEdit={canEditShop} /> },
    { id: 'Preview', component: <StepPreview shop={shopData} products={products || []} onApprove={() => setCurrentStep(currentStep + 1)} onMakeChanges={() => setCurrentStep(0)} /> },
    { id: 'Publish', component: <StepPublish onPublish={handlePublish} isPublishing={isPublishing} allStepsComplete={allStepsComplete} canEdit={canEditShop} /> },
  ];

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Shop Status: <Badge variant={statusColors[shopData.status] || 'secondary'} className="capitalize text-base">{shopData.status.replace(/_/g, ' ')}</Badge></h3>
            <div className="text-right">
                <p className="text-sm font-medium">Profile Completeness</p>
                <Progress value={completenessPercentage} className="w-40 mt-1" />
            </div>
        </div>
        
        {permissionsLoading && (
            <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="ml-3">Loading permissions...</p>
            </div>
        )}
        {!canEditShop && !permissionsLoading && (
             <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Read-Only Mode</AlertTitle>
                <AlertDescription>
                    You do not have permission to edit this shop. The fields are disabled.
                </AlertDescription>
            </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
            <div className="flex flex-col gap-1">
                 {steps.map((step, index) => {
                    const isCompleted = (step.id === 'Publish' || step.id === 'Preview') ? true : stepCompleteness[step.id as keyof typeof stepCompleteness];
                     return (
                        <Button 
                            key={step.id} 
                            variant={currentStep === index ? 'default' : 'ghost'}
                            onClick={() => handleStepClick(index)}
                            className="justify-start gap-2"
                        >
                            {step.id !== 'Publish' && step.id !== 'Preview' && (
                                isCompleted ? <CheckCircle className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4"/>
                            )}
                            {step.id}
                        </Button>
                    )
                 })}
            </div>
            <div className="md:border-l md:pl-8">
                {steps[currentStep].component}
            </div>
        </div>
    </div>
  );
}
