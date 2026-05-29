
'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
import { Loader2, Save, CheckCircle, PlusCircle, Edit, Trash2, Send, Truck, MapPin, DollarSign, ArrowRight, ArrowLeft, Info, AlertTriangle, Map, Warehouse } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { usePermissions } from '@/hooks/use-permissions';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

// ====== SCHEMAS ======

const shopStep1Schema = z.object({
  shopName: z.string().min(1, "Name is required."),
  shopDescription: z.string().min(1, "Please provide a description."),
  category: z.string().min(1, "Please select a category."),
  websiteUrl: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
  contactEmail: z.string().email("Please enter a valid email.").optional().or(z.literal('')),
  contactPhone: z.string().optional(),
});

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().positive('Price must be a positive number'),
  sku: z.string().optional(),
  stock: z.coerce.number().min(0).optional(),
});

const routeSchema = z.object({
    name: z.string().min(1, 'Origin (From) is required'),
    destination: z.string().min(1, 'Destination (To) is required'),
    description: z.string().min(1, 'Service details are required'),
    price: z.coerce.number().positive('Rate must be a positive number'),
    rateType: z.enum(['per-km', 'flat-rate']).default('per-km'),
    vehicleType: z.string().min(1, 'Vehicle type is required'),
});

// ====== STEP 1: Core Identity ======

function StepCoreIdentity({ shop, onSave, canEdit }: { shop: any, onSave: (newData: any) => void, canEdit: boolean }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const isTransporter = shop.shopType === 'transporter';

  const form = useForm<z.infer<typeof shopStep1Schema>>({
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

  const onSubmit = async (values: z.infer<typeof shopStep1Schema>) => {
    if (!user || !shop.companyId) return;
    setIsSaving(true);
    
    try {
        const token = await getClientSideAuthToken();
        if (!token) throw new Error("Authentication failed.");
        
        await fetch('/api/updateUserDoc', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                path: `companies/${shop.companyId}/shops/${shop.id}`,
                data: { ...values, updatedAt: { _methodName: 'serverTimestamp' } }
            }),
        });

        toast({ title: 'Profile Updated!' });
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
                    <FormLabel>{isTransporter ? 'Company Branding Name' : 'Shop Name'}</FormLabel>
                    <FormControl><Input placeholder={isTransporter ? "e.g. Swift Hauliers" : "e.g. Parts World"} {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="shopDescription" render={({ field }) => (
                <FormItem>
                    <FormLabel>{isTransporter ? 'Professional Summary' : 'Shop Description'}</FormLabel>
                    <FormControl><Textarea placeholder={isTransporter ? "Describe your service history and reliability..." : "Describe what your shop offers..."} {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                    <FormLabel>Primary Industry Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {isTransporter ? (
                                <>
                                    <SelectItem value="Long-Haul">Long-Haul</SelectItem>
                                    <SelectItem value="Local-Distribution">Local Distribution</SelectItem>
                                    <SelectItem value="Refrigerated">Refrigerated</SelectItem>
                                    <SelectItem value="Abnormal-Load">Abnormal Load</SelectItem>
                                </>
                            ) : (
                                <>
                                    <SelectItem value="Parts">Parts</SelectItem>
                                    <SelectItem value="Services">Services</SelectItem>
                                    <SelectItem value="Tires">Tires</SelectItem>
                                    <SelectItem value="Equipment">Equipment</SelectItem>
                                </>
                            )}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )} />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="contactEmail" render={({ field }) => (
                    <FormItem><FormLabel>Contact Email</FormLabel><FormControl><Input placeholder="contact@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="contactPhone" render={({ field }) => (
                    <FormItem><FormLabel>Contact Phone</FormLabel><FormControl><Input placeholder="011 123 4567" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
        </fieldset>
        <Button type="submit" disabled={isSaving || !canEdit}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Details
        </Button>
      </form>
    </Form>
  );
}

// ====== STEP 2: Catalog (Products or Routes) ======

function ProductDialog({ shop, item, onComplete, children, canEdit }: { shop: any, item?: any, onComplete: () => void, children: React.ReactNode, canEdit: boolean }) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isTransporter = shop.shopType === 'transporter';

  const form = useForm<any>({
    resolver: zodResolver(isTransporter ? routeSchema : productSchema),
    defaultValues: item || (isTransporter 
        ? { name: '', destination: '', description: '', price: 0, rateType: 'per-km', vehicleType: '' } 
        : { name: '', description: '', price: 0, sku: '', stock: 0 }),
  });
  
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
             <div className={cn("grid gap-4", isTransporter ? "grid-cols-2" : "grid-cols-1")}>
                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>{isTransporter ? 'Origin (From)' : 'Product Name'}</FormLabel><FormControl><Input placeholder={isTransporter ? "e.g. Johannesburg" : ""} {...field} /></FormControl><FormMessage /></FormItem> )} />
                {isTransporter && (
                    <FormField control={form.control} name="destination" render={({ field }) => ( <FormItem><FormLabel>Destination (To)</FormLabel><FormControl><Input placeholder="e.g. Durban" {...field} /></FormControl><FormMessage /></FormItem> )} />
                )}
             </div>
             <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>{isTransporter ? 'Service Frequency/Details' : 'Description'}</FormLabel><FormControl><Textarea placeholder={isTransporter ? "e.g. Twice weekly departures..." : "Product specs..."} {...field} /></FormControl><FormMessage /></FormItem> )} />
             <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="price" render={({ field }) => ( <FormItem><FormLabel>{isTransporter ? 'Rate (R)' : 'Price (R)'}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                {isTransporter ? (
                    <FormField control={form.control} name="rateType" render={({ field }) => (
                        <FormItem><FormLabel>Pricing Model</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a type..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="per-km">Per Kilometer</SelectItem><SelectItem value="flat-rate">Flat Rate</SelectItem></SelectContent></Select></FormItem>
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
                                <SelectItem value="8-ton">8-ton</SelectItem>
                                <SelectItem value="1-ton">1-ton Van</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormItem>
                )} />
             )}
             <DialogFooter className="pt-4 border-t">
                 <Button type="submit" disabled={isSaving}>
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

// ====== STEP 3: Fleet Gallery (Transporters Only) ======

function StepFleetGallery({ shop, canEdit, onSave }: { shop: any, canEdit: boolean, onSave: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [selectedFleetIds, setSelectedFleetIds] = useState<string[]>(shop.showcaseFleetIds || []);

    // Fetch all contributions (Trucks/Trailers) for this company
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
            onSave();
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
                    <p className="text-sm text-muted-foreground">To showcase your fleet, you must first upload your RC1 details in the Contribution Hub.</p>
                    <Button asChild className="mt-4" variant="default">
                        <Link href="/contribute">
                            <PlusCircle className="mr-2 h-4 w-4" /> Contribute Fleet Data
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}

// ====== STEP 4: Commercials ======

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
            <div>
                <h3 className="text-xl font-semibold">Commercial Agreement</h3>
                <p className="text-sm text-muted-foreground mt-1">Define the platform split for transactions processed through your profile.</p>
            </div>
            
            <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-5 w-5" />Platform Commission Rate</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Input type="number" step="0.1" value={rate} onChange={e => setRate(parseFloat(e.target.value))} className="w-24 text-lg font-bold" />
                        <span className="text-lg font-bold">%</span>
                        <div className="flex-1">
                             <Progress value={(rate / 5) * 100} className="h-2" />
                             <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase">Industry Standard: 2.5%</p>
                        </div>
                    </div>
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Revenue Sharing</AlertTitle>
                        <AlertDescription className="text-xs">This rate is applied to bookings/sales made through your profile. Higher rates can be negotiated for priority listing status.</AlertDescription>
                    </Alert>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSave} disabled={isSaving || !canEdit}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4" />}
                        Accept & Register Commercials
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

// ====== MAIN WIZARD ======

export function ShopWizard({ shop, onUpdate }: { shop: any, onUpdate: () => void }) {
    const [currentStep, setCurrentStep] = useState(0);
    const isTransporter = shop.shopType === 'transporter';

    const wizardSteps = useMemo(() => {
        const base = [
            { id: 'details', name: 'Core Details', component: <StepCoreIdentity shop={shop} onSave={onUpdate} canEdit={true} /> },
            { id: 'catalog', name: isTransporter ? 'Routes & Rates' : 'Product Catalog', component: <StepCatalog shop={shop} canEdit={true} /> },
        ];
        if (isTransporter) {
            base.push({ id: 'fleet', name: 'Fleet Gallery', component: <StepFleetGallery shop={shop} canEdit={true} onSave={onUpdate} /> });
        }
        base.push(
            { id: 'commercials', name: 'Commercials', component: <StepCommercials shop={shop} canEdit={true} /> },
            { id: 'publish', name: 'Publish', component: <StepPublish shop={shop} onSave={onUpdate} /> }
        );
        return base;
    }, [shop, isTransporter, onUpdate]);
    
    return (
        <div className="space-y-6">
            <Progress value={((currentStep + 1) / wizardSteps.length) * 100} />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-1">
                    <nav className="flex flex-col gap-2">
                        {wizardSteps.map((step, index) => (
                             <Button
                                key={step.id}
                                variant={currentStep === index ? 'secondary' : 'ghost'}
                                className="justify-start gap-2"
                                onClick={() => setCurrentStep(index)}
                            >
                                <div className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold", currentStep >= index ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{index + 1}</div>
                                {step.name}
                            </Button>
                        ))}
                    </nav>
                </div>
                <div className="md:col-span-3">
                    {wizardSteps[currentStep].component}
                </div>
            </div>
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
                })
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
            <h3 className="text-2xl font-bold">Review & Publish</h3>
            <p className="text-muted-foreground">Submit your {shop.shopType === 'transporter' ? 'service profile' : 'shop'} for admin verification.</p>
            <Button onClick={handleSubmitForReview} disabled={isSubmitting || shop.status === 'pending_review'} size="lg">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Submit for Verification
            </Button>
        </div>
    );
}
