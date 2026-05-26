'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import { Loader2, Upload, FileJson, ClipboardPaste, Zap, CheckCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BulkImportDialogProps {
    type: string;
    onComplete: () => void;
    children: React.ReactNode;
}

export function BulkImportDialog({ type, onComplete, children }: BulkImportDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [pasteData, setPasteData] = useState('');
    const { toast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    /**
     * Resilient JSON Parser
     * Handles markdown wrappers and extracts valid objects from fragmented text.
     */
    const processJsonData = (rawText: string) => {
        let results: any[] = [];
        let text = rawText.trim();

        // 1. Strip Markdown code blocks if present
        if (text.includes('```')) {
            text = text.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
        }

        // 2. Try standard parsing first
        try {
            const parsed = JSON.parse(text);
            results = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
            // 3. Fallback: Regex extraction for { ... } blocks
            const objectRegex = /\{(?:[^{}]|((?:\{[^{}]*\})))*\}/g;
            const matches = text.match(objectRegex);

            if (matches) {
                matches.forEach(m => {
                    try {
                        results.push(JSON.parse(m));
                    } catch (innerError) {
                        // Skip unparseable fragments
                    }
                });
            }
        }

        if (results.length === 0) {
            throw new Error("No valid data objects found. Please ensure the AI output contains blocks like { \"company_name\": ... }");
        }

        return results.map((item: any) => ({
            companyName: item.company_name || item.companyName || item.company || 'Unknown Company',
            contactPerson: item.contact_person || item.contactPerson || item.contact || 'N/A',
            email: item.email_address || item.email || '',
            phone: item.telephone_number || item.phone || item.cell || '',
            website: item.website || item.url || '',
            address: item.physical_address || item.address || '',
        }));
    };

    const handleImport = async (source: 'file' | 'paste') => {
        const text = source === 'file' ? await file?.text() : pasteData;
        if (!text) return;

        setIsUploading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            let partners: any[] = [];

            // Process based on source
            if (source === 'paste' || (file && (file.name.toLowerCase().endsWith('.json') || text.includes('{')))) {
                partners = processJsonData(text);
            } else {
                // CSV Parsing Logic
                const rows = text.split(/\r?\n/).filter(row => row.trim().length > 0);
                if (rows.length < 2) throw new Error("File is empty or invalid format.");
                const headers = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
                partners = rows.slice(1).map(row => {
                    const values = row.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
                    const p: any = {};
                    headers.forEach((h, i) => {
                        if (h.includes('company')) p.companyName = values[i];
                        else if (h.includes('email')) p.email = values[i];
                        else if (h.includes('phone') || h === 'telephone_number') p.phone = values[i];
                        else if (h.includes('name') || h === 'contact_person') p.contactPerson = values[i];
                        else if (h.includes('website')) p.website = values[i];
                        else if (h.includes('address')) p.address = values[i];
                    });
                    return p;
                });
            }

            const validPartners = partners.filter(p => p.companyName && p.companyName !== 'Unknown Company');
            if (validPartners.length === 0) throw new Error("No valid company records were found in the text provided.");

            const response = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'bulkSavePartners',
                    payload: { partners: validPartners, type }
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Import failed on server.");
            }

            toast({ title: "Import Successful", description: `Successfully processed ${validPartners.length} records.` });
            setIsOpen(false);
            setPasteData('');
            onComplete();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Import Error", description: e.message });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Bulk Import {type}s</DialogTitle>
                    <DialogDescription>Paste the results from Google AI or upload a CSV/JSON file.</DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="paste" className="py-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="paste"><ClipboardPaste className="mr-2 h-4 w-4" /> Paste Result</TabsTrigger>
                        <TabsTrigger value="file"><Upload className="mr-2 h-4 w-4" /> Upload File</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="paste" className="space-y-4 pt-4">
                        <Alert className="bg-primary/5 border-primary/20">
                            <Zap className="h-4 w-4 text-primary" />
                            <AlertTitle>Smart Markdown Detection</AlertTitle>
                            <AlertDescription>I can now strip markdown wrappers automatically. Just paste exactly what the AI gave you.</AlertDescription>
                        </Alert>
                        <div className="space-y-2">
                            <Label>Paste Data Below</Label>
                            <Textarea 
                                placeholder="Paste the text from Google AI here..." 
                                className="min-h-[250px] font-mono text-xs" 
                                value={pasteData}
                                onChange={(e) => setPasteData(e.target.value)}
                            />
                        </div>
                        <Button className="w-full" onClick={() => handleImport('paste')} disabled={isUploading || !pasteData.trim()}>
                            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4" />}
                            Process & Import
                        </Button>
                    </TabsContent>

                    <TabsContent value="file" className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="import-file">Select CSV or JSON File</Label>
                            <Input id="import-file" type="file" accept=".csv,.json" onChange={handleFileChange} disabled={isUploading} />
                        </div>
                        <Button className="w-full" onClick={() => handleImport('file')} disabled={isUploading || !file}>
                            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                            Upload and Import
                        </Button>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}