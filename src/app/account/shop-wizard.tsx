'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useStorage, useCollection, getClientSideAuthToken, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { Loader2, Save, CheckCircle, LayoutGrid, List, Image as ImageIcon, Sparkles, PlusCircle, Edit, Trash2, Send, Eye, ShoppingCart, Mail, Phone, UploadCloud, Wand2, Video, Search, ShieldAlert, Download, Copy, FileText, View, DollarSign, ArrowRight, RefreshCcw, AlertTriangle, XCircle, FileUp } from 'lucide-react';
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
import { generateShopSeo } from '@/ai/flows/seo-flow';
import { generateSocialLinks } from '@/ai/flows/social-link-generator-flow';
import { useConfig } from '@/hooks/use-config';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter } from 'next/navigation';


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
  websiteUrl: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
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
      websiteUrl: shop.websiteUrl || '',
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
             <FormField control={form.control} name="websiteUrl" render={({ field }) => (
                <FormItem>
                    <FormLabel>Main Website URL (Optional)</FormLabel>
                    <FormControl><Input placeholder="https://your-main-website.com" {...field} /></FormControl>
                    <FormDescription>Link to your existing website for more info. Purchases will still happen on Logistics Flow.</FormDescription>
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
  stock: z.coerce.number().min(0, "Stock can't be negative.").optional(),
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
      stock: product?.stock ?? 0,
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
            stock: product?.stock ?? 0,
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
        if (!token) throw new Error("Authentication failed.");
        
        const path = product ? `companies/${shop.companyId}/shops/${shop.id}/products/${product.id}` : `companies/${shop.companyId}/shops/${shop.id}/products`;
        
        const dataToSave = {
            ...values,
            stock: Number(values.stock || 0),
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
        if (!response.ok || !result.success) throw new Error(result.error || 'Failed to upload image.');
        
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
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                           <FormField control={form.control} name="stock" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Units in Stock</FormLabel>
                                <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
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
            body: JSON.stringify({ path: `companies/${shop.companyId}/shops/${shop.id}/products/${productToDelete.id}`})
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
                <Button disabled={!canEdit || !canManageProducts}><PlusCircle className="mr-2 h-4 w-4" /> Add Product</Button>
            </ProductDialog>
        </div>

        {isLoading ? (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin" />
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
                            <TableHead>Stock</TableHead>
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
                                <TableCell>{product.stock ?? 0}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <ProductDialog shop={shop} product={product} onComplete={forceRefresh} canEdit={canEdit && canManageProducts}>
                                            <Button variant="ghost" size="icon" disabled={!canEdit || !canManageProducts}>
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
                                                <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>
                                                        This will permanently delete the product "{productToDelete?.name}". This action cannot be undone.
                                                    </AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel onClick={() => setProductToDelete(null)}>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleDeleteProduct} disabled={isDeleting} className={buttonVariants({ variant: "destructive" })}>
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
                <AlertDescription>Add your first product to start selling. If you have an existing website with a product catalog, you can link to it in Step 1 instead of adding products manually.</AlertDescription>
            </Alert>
        )}
    </div>
  );
}
//... Omitted for brevity: a lot of other steps here.
