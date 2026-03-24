'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, UploadCloud } from 'lucide-react';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

const fileToDataUri = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
});

// API Helper
async function performAdminAction(token: string, action: string, payload: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for action: ${action}`);
    }
    return result;
}

const securitySchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  agreementId: z.string().min(1, "Agreement is required"),
  documentName: z.string().min(1, 'Document name is required'),
  documentType: z.string().min(1, 'Document type is required'),
  fileUrl: z.string().min(1, 'A file must be uploaded'),
});
type SecurityFormValues = z.infer<typeof securitySchema>;

interface EditSecurityDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  security?: any;
  clients: any[];
  agreements: any[];
  onSave: () => void;
}

export function EditSecurityDialog({ isOpen, onOpenChange, security, clients, agreements, onSave }: EditSecurityDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const { user } = useUser();
    const { toast } = useToast();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const form = useForm<SecurityFormValues>({
        resolver: zodResolver(securitySchema),
    });

    const selectedClientId = form.watch('clientId');

    const filteredAgreements = useMemo(() => {
        return agreements.filter(a => a.clientId === selectedClientId);
    }, [agreements, selectedClientId]);

    useEffect(() => {
        if (isOpen) {
            form.reset({
                clientId: security?.clientId || '',
                agreementId: security?.agreementId || '',
                documentName: security?.documentName || '',
                documentType: security?.documentType || '',
                fileUrl: security?.fileUrl || '',
            });
        }
    }, [isOpen, security, form]);
    
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        setUploading(true);
        setProgress(10);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            const fileDataUri = await fileToDataUri(file);
            setProgress(30);

            const folder = `user-assets/${user.uid}/lending-securities`;
            const fileName = `${Date.now()}_${file.name}`;
            
            const response = await fetch('/api/uploadImageAsset', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileDataUri, folder, fileName, contentType: file.type }),
            });
            setProgress(80);
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            
            form.setValue('fileUrl', result.url, { shouldValidate: true });
            if (!form.getValues('documentName')) {
                form.setValue('documentName', file.name);
            }
            setProgress(100);
            toast({ title: 'Upload Successful' });
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Upload Failed', description: err.message });
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
            setUploading(false);
            setProgress(0);
        }
    };


    const onSubmit = async (values: SecurityFormValues) => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            await performAdminAction(token, 'saveLendingSecurity', { security: { id: security?.id, ...values } });
            toast({ title: security ? 'Security Document Updated' : 'Security Document Saved' });
            onSave();
            onOpenChange(false);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Save Failed', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{security ? 'Edit Security Document' : 'Add New Security Document'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                        <FormField control={form.control} name="clientId" render={({ field }) => (<FormItem><FormLabel>Client</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a client..." /></SelectTrigger></FormControl><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="agreementId" render={({ field }) => (<FormItem><FormLabel>Agreement</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedClientId}><FormControl><SelectTrigger><SelectValue placeholder="Select an agreement..." /></SelectTrigger></FormControl><SelectContent>{filteredAgreements.map(a => <SelectItem key={a.id} value={a.id}>{a.description}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="documentName" render={({ field }) => (<FormItem><FormLabel>Document Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="documentType" render={({ field }) => (<FormItem><FormLabel>Document Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="surety">Surety</SelectItem><SelectItem value="pledge">Pledge</SelectItem><SelectItem value="cession">Cession</SelectItem><SelectItem value="notarial_bond">Notarial Bond</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        </div>
                        <FormField control={form.control} name="fileUrl" render={({ field }) => (
                            <FormItem>
                                <FormLabel>File</FormLabel>
                                <FormControl>
                                    <div className="flex items-center gap-2">
                                        <Input value={field.value} readOnly className="flex-grow"/>
                                        <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                                            <UploadCloud className="h-4 w-4" />
                                        </Button>
                                         <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} disabled={uploading} />
                                    </div>
                                </FormControl>
                                {uploading && <Progress value={progress} className="w-full mt-2" />}
                                <FormMessage />
                            </FormItem>
                        )} />

                        <DialogFooter className="pt-4">
                            <Button type="submit" disabled={isLoading || uploading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>} Save Document</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
