'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import { Loader2, Upload, FileText, Download } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface BulkImportDialogProps {
    type: string;
    onComplete: () => void;
    children: React.ReactNode;
}

export function BulkImportDialog({ type, onComplete, children }: BulkImportDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const { toast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setIsUploading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            const text = await file.text();
            
            // 1. Remove UTF-8 BOM if present
            const cleanText = text.startsWith('\ufeff') ? text.slice(1) : text;
            
            // 2. Split lines and filter empty ones
            const rows = cleanText.split(/\r?\n/).filter(row => row.trim().length > 0);
            
            if (rows.length < 2) {
                throw new Error("CSV file is empty or missing data rows.");
            }

            // 3. Detect delimiter
            const firstRow = rows[0];
            let delimiter = ',';
            if (firstRow.includes(';')) delimiter = ';';
            if (firstRow.includes('\t')) delimiter = '\t';

            // 4. Parse headers
            const headers = firstRow.split(delimiter).map(h => h.trim().toLowerCase().replace(/["']/g, ''));
            const dataRows = rows.slice(1);

            const partners = dataRows.map((row) => {
                const values = row.split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''));
                const partner: any = {};
                
                headers.forEach((header, index) => {
                    const val = values[index];
                    if (!val) return; 

                    if (header === 'name' || header === 'contact' || header === 'contact name') {
                        const nameParts = val.split(' ');
                        partner.firstName = nameParts[0] || 'Member';
                        partner.lastName = nameParts.slice(1).join(' ') || 'Candidate';
                    } else if (header.includes('email')) {
                        partner.email = val;
                    } else if (header.includes('phone') || header.includes('cell') || header.includes('mobile')) {
                        partner.phone = val;
                    } else if (header.includes('company') || header.includes('business')) {
                        partner.companyName = val;
                    } else if (header.includes('address')) {
                        partner.address = val;
                    } else if (header.includes('website') || header.includes('url')) {
                        partner.website = val;
                    }
                });

                // Default values for minimal records (e.g. only company name provided)
                if (!partner.firstName) partner.firstName = 'Member';
                if (!partner.lastName) partner.lastName = 'Candidate';
                if (!partner.companyName && partner.firstName !== 'Member') {
                    partner.companyName = `${partner.firstName} ${partner.lastName}`;
                }

                return partner;
            }).filter(p => p.companyName || p.email);

            if (partners.length === 0) {
                throw new Error(`No valid records found. Ensure your CSV has a 'Company' or 'Name' header.`);
            }

            const response = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'bulkSavePartners',
                    payload: { partners, type }
                }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Import failed.");

            toast({ title: "Import Successful", description: `Added ${partners.length} ${type}s. You can now use AI Enrichment to find missing details.` });
            setIsOpen(false);
            onComplete();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Import Failed", description: e.message });
        } finally {
            setIsUploading(false);
            setFile(null);
        }
    };

    const downloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,Company,Email,Phone,Name\nABC Transporters,info@abc.com,0111234567,John Doe\nSwift Haulage,,,Jane Smith";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `import_template_${type}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Bulk Import {type.charAt(0).toUpperCase() + type.slice(1)}s</DialogTitle>
                    <DialogDescription>Upload a CSV file. If you only have company names, our AI can help find emails later.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Alert>
                        <FileText className="h-4 w-4" />
                        <AlertTitle>Minimal Requirements</AlertTitle>
                        <AlertDescription>
                            Your CSV must have at least a <code className="bg-muted px-1 rounded">Company</code> header.
                        </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                        <Label htmlFor="csv-file">Select CSV File</Label>
                        <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} disabled={isUploading} />
                    </div>
                    <Button variant="link" size="sm" onClick={downloadTemplate} className="px-0 h-auto font-semibold">
                        <Download className="mr-2 h-4 w-4" /> Download Sample CSV
                    </Button>
                </div>
                <DialogFooter className="sm:justify-between">
                    <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isUploading}>Cancel</Button>
                    <Button onClick={handleImport} disabled={!file || isUploading}>
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                        Start Import
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
