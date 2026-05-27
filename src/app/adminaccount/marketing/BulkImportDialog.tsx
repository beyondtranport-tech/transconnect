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
     * Resilient Data Extractor
     * Picks out JSON records even from messy conversational text or markdown blocks.
     */
    const extractItemsFromText = (rawText: string) => {
        let results: any[] = [];
        let text = rawText.trim();

        // 1. Markdown Cleanup
        if (text.includes('```')) {
            text = text.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
        }

        // 2. Direct Parse Attempt
        try {
            const parsed = JSON.parse(text);
            return Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
            // 3. Fragment Recovery (Regex Extraction for { ... } or [ ... ])
            const objectRegex = /\{(?:[^{}]|((?:\{[^{}]*\})))*\}/g;
            const matches = text.match(objectRegex);

            if (matches) {
                matches.forEach(m => {
                    try {
                        const obj = JSON.parse(m);
                        if (obj && typeof obj === 'object') results.push(obj);
                    } catch (innerError) {
                        // Skip non-json noise
                    }
                });
            }
        }

        if (results.length === 0) {
            throw new Error("No valid JSON found. Ensure the response contains valid record objects.");
        }

        return results;
    };

    const handleImport = async (source: 'file' | 'paste') => {
        const text = source === 'file' ? await file?.text() : pasteData;
        if (!text) return;

        setIsUploading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            const rawPartners = extractItemsFromText(text);

            const response = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'bulkSavePartners',
                    payload: { partners: rawPartners, type }
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || "Import failed on server.");
            }

            toast({ 
                title: "Import Successful", 
                description: result.message || `Processed ${rawPartners.length} records.`
            });
            
            setIsOpen(false);
            setPasteData('');
            setFile(null);
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
                    <DialogDescription>Paste the raw response from the AI. Our parser will extract the relevant data automatically.</DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="paste" className="py-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="paste"><ClipboardPaste className="mr-2 h-4 w-4" /> Paste Results</TabsTrigger>
                        <TabsTrigger value="file"><Upload className="mr-2 h-4 w-4" /> Upload File</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="paste" className="space-y-4 pt-4">
                        <Alert className="bg-primary/5 border-primary/20">
                            <Zap className="h-4 w-4 text-primary" />
                            <AlertTitle>Intelligent Parser Active</AlertTitle>
                            <AlertDescription>You can paste the entire AI chat response here. We'll find the JSON records and map them to your existing IDs.</AlertDescription>
                        </Alert>
                        <div className="space-y-2">
                            <Label>Paste AI Response</Label>
                            <Textarea 
                                placeholder="Paste the response from AI here..." 
                                className="min-h-[300px] font-mono text-xs" 
                                value={pasteData}
                                onChange={(e) => setPasteData(e.target.value)}
                            />
                        </div>
                        <Button className="w-full" onClick={() => handleImport('paste')} disabled={isUploading || !pasteData.trim()}>
                            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4" />}
                            Extract and Import Data
                        </Button>
                    </TabsContent>

                    <TabsContent value="file" className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="import-file">Select JSON File</Label>
                            <Input id="import-file" type="file" accept=".json" onChange={handleFileChange} disabled={isUploading} />
                        </div>
                        <Button className="w-full" onClick={() => handleImport('file')} disabled={isUploading || !file}>
                            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                            Upload and Process
                        </Button>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
