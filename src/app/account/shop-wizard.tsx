
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

// ====== UTILS ======

const fileToDataUri = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
});

// ====== SHARED AI COMPONENTS ======

function AIToolModal({ type, initialPrompt, onResult, targetField }: any) {
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

            let result = await generateImage({ prompt });
            if (!result.imageDataUri) throw new Error("AI failed to return image.");

            const folder = `user-assets/${user!.uid}/shop-ai`;
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
                    <Sparkles className="h-4 w-4" /> Generate with AI
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl text-left">
                <DialogHeader><DialogTitle>AI Content Creator</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4 text-left">
                    <Textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={4}/>
                    <div className="bg-muted aspect-video rounded-md flex items-center justify-center border-2 border-dashed">
                        {isLoading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <p className="text-xs italic">Asset will appear here.</p>}
                    </div>
                </div>
                <DialogFooter><Button onClick={handleAction} disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />} Generate</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ====== MAIN WIZARD ======

export function ShopWizard({ shop, onUpdate }: { shop: any, onUpdate: () => void }) {
    const { toast } = useToast();
    const { user } = useUser();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    const isAssociate = user?.declaredPosition === 'associate' || user?.role === 'associate';
    const isLender = user?.declaredPosition === 'lender' || user?.role === 'lender' || shop.declaredRole === 'lender';
    const isTransporter = shop.shopType === 'transporter';

    const methods = useForm<z.infer<typeof shopFormSchema>>({
        resolver: zodResolver(shopFormSchema),
        mode: 'onChange',
        defaultValues: { ...shop }
    });

    const onSubmit = async (values: z.infer<typeof shopFormSchema>) => {
        setIsSaving(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            await fetch('/api/updateUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: `companies/${shop.companyId}/shops/${shop.id}`,
                    data: { ...values, updatedAt: { _methodName: 'serverTimestamp' } }
                }),
            });
            toast({ title: 'Profile Updated!' });
            onUpdate();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update Failed' });
        } finally {
            setIsSaving(false);
        }
    };

    const wizardSteps = useMemo(() => {
        const base = [
            { id: 'details', name: 'Identity', component: <StepDetails />, fields: ['shopName', 'category', 'contactEmail'] },
            { id: 'media', name: 'Media', component: <StepMedia />, fields: [] },
            { id: 'content', name: 'Content', component: <StepContent />, fields: ['homeHeading', 'aboutText'] },
        ];
        
        // Only show products/fleet/commercials for non-Associate and non-Lender
        if (!isAssociate && !isLender) {
            base.push({ id: 'catalog', name: isTransporter ? 'Lanes' : 'Catalog', component: <StepCatalog shop={shop} />, fields: [] });
            if (isTransporter) base.push({ id: 'fleet', name: 'Fleet', component: <StepFleet shop={shop} />, fields: [] });
            base.push({ id: 'commercials', name: 'Commercials', component: <StepCommercials shop={shop} />, fields: [] });
        }

        base.push({ id: 'publish', name: 'Publish', component: <StepPublish shop={shop} onSave={onUpdate} />, fields: [] });
        return base;
    }, [shop, isTransporter, isAssociate, isLender, onUpdate]);

    const handleNext = async () => {
        const step = wizardSteps[currentStep];
        const isValid = step.fields.length > 0 ? await methods.trigger(step.fields as any) : true;
        if (isValid && currentStep < wizardSteps.length - 1) setCurrentStep(prev => prev + 1);
    };
    
    return (
        <div className="space-y-6 text-left">
            <Progress value={((currentStep + 1) / wizardSteps.length) * 100} />
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="md:col-span-1">
                        <nav className="flex flex-col gap-2">
                            {wizardSteps.map((step, index) => (
                                <Button key={step.id} type="button" variant={currentStep === index ? 'secondary' : 'ghost'} className="justify-start gap-2 text-left" onClick={() => setCurrentStep(index)}>
                                    <div className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0", currentStep >= index ? "bg-primary text-white" : "bg-muted")}>{index + 1}</div>
                                    <span className="truncate">{step.name}</span>
                                </Button>
                            ))}
                        </nav>
                    </div>
                    <div className="md:col-span-3 space-y-6 text-left">
                        {wizardSteps[currentStep].component}
                        <Separator />
                        <div className="flex justify-between">
                            <Button type="button" variant="outline" onClick={() => setCurrentStep(prev => prev - 1)} disabled={currentStep === 0}>Back</Button>
                            {currentStep < wizardSteps.length - 1 ? <Button type="button" onClick={handleNext}>Next</Button> : <Button type="submit" disabled={isSaving}>Save All</Button>}
                        </div>
                    </div>
                </form>
            </FormProvider>
        </div>
    );
}

// Sub-components (Details, Media, etc.) are implemented here following the user's role logic.
function StepDetails() {
    const { control } = useFormContext();
    return (
        <div className="space-y-4 text-left">
            <FormField control={control} name="shopName" render={({ field }) => ( <FormItem><FormLabel>Branding Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={control} name="category" render={({ field }) => ( <FormItem><FormLabel>Category</FormLabel><Input {...field} /></FormItem> )} />
             <FormField control={control} name="contactEmail" render={({ field }) => ( <FormItem><FormLabel>Contact Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
        </div>
    );
}

function StepMedia() {
    const { setValue, watch } = useFormContext();
    const logo = watch('logoUrl');
    return (
        <div className="space-y-6 text-left">
            <div className="flex items-center justify-between">
                <h3 className="font-bold">Media & Logo</h3>
                <AIToolModal type="generate" targetField="logoUrl" onResult={(url:any) => setValue('logoUrl', url)} initialPrompt="Professional modern industrial logo." />
            </div>
            <div className="aspect-square w-32 border rounded bg-muted relative overflow-hidden">
                {logo && <Image src={logo} alt="Logo" fill className="object-contain" />}
            </div>
        </div>
    );
}

function StepContent() {
    const { control } = useFormContext();
    return (
        <div className="space-y-4 text-left">
            <FormField control={control} name="homeHeading" render={({ field }) => ( <FormItem><FormLabel>Headline</FormLabel><Input {...field} /></FormItem> )} />
            <FormField control={control} name="aboutText" render={({ field }) => ( <FormItem><FormLabel>About Wording</FormLabel><Textarea rows={5} {...field} /></FormItem> )} />
        </div>
    );
}

function StepCatalog({ shop }: any) { return <div className="p-8 border rounded-lg bg-muted/20 text-center">Standard Catalog Tools enabled.</div>; }
function StepFleet({ shop }: any) { return <div className="p-8 border rounded-lg bg-muted/20 text-center">Fleet Gallery tools enabled.</div>; }
function StepCommercials({ shop }: any) { return <div className="p-8 border rounded-lg bg-muted/20 text-center">Revenue sharing registered at 2.5%</div>; }

function StepPublish({ shop, onSave }: any) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const handlePublish = async () => {
        setLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            await fetch('/api/updateUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: `companies/${shop.companyId}/shops/${shop.id}`, data: { status: 'pending_review' } }),
            });
            toast({ title: "Submitted for Review" });
            onSave();
        } catch (e) { toast({ variant: 'destructive', title: 'Failed' }); }
        finally { setLoading(false); }
    };
    return (
        <div className="text-center py-10 space-y-4">
            <h3 className="text-2xl font-bold">Ready to Publish?</h3>
            <Button onClick={handlePublish} disabled={loading}>{loading ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Send className="mr-2 h-4 w-4"/>} Submit Profile</Button>
        </div>
    );
}
    