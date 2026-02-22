
'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { PlusCircle, FileSignature, Loader2, Save } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useForm, FormProvider } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const dummySecurityDocs = [
    { id: 'sec-001', name: 'Cession of Book Debts', client: 'Sample Transport Co.', agreement: 'AG-101', docStatus: 'Generated', recordStatus: 'Unconfirmed' },
    { id: 'sec-002', name: 'Suretyship by Directors', client: 'Another Client Ltd', agreement: 'AG-205', docStatus: 'Signed In', recordStatus: 'Confirmed' },
];

const docStatusOptions = ["Generated", "Sent", "Received", "Checked", "Signed In"];

const securitySchema = z.object({
  name: z.string().min(1, 'Agreement type is required.'),
  client: z.string().min(1, 'Client is required.'),
  agreement: z.string().min(1, 'Agreement is required.'),
  docStatus: z.string().optional(),
  recordStatus: z.string().optional(),
});

type SecurityFormValues = z.infer<typeof securitySchema>;

function SecurityWizard({ securityDoc, onBack, onSaveSuccess }: { securityDoc?: any; onBack: () => void; onSaveSuccess: () => void; }) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const methods = useForm<SecurityFormValues>({
        resolver: zodResolver(securitySchema),
        defaultValues: securityDoc || { name: '', client: '', agreement: '', docStatus: 'Generated', recordStatus: 'Unconfirmed' },
    });

    const onSubmit = async (values: SecurityFormValues) => {
        setIsLoading(true);
        console.log("Saving security doc:", { id: securityDoc?.id, ...values });
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({ title: securityDoc ? 'Document Updated' : 'Document Added' });
        setIsLoading(false);
        onSaveSuccess();
    };

    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle>{securityDoc ? 'Edit' : 'Add'} Security Agreement</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField control={methods.control} name="name" render={({ field }) => (<FormItem><FormLabel>Agreement Type</FormLabel><FormControl><Input placeholder="e.g., Cession of Book Debts" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={methods.control} name="client" render={({ field }) => (<FormItem><FormLabel>Client</FormLabel><FormControl><Input placeholder="Client Name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={methods.control} name="agreement" render={({ field }) => (<FormItem><FormLabel>Main Agreement ID</FormLabel><FormControl><Input placeholder="e.g., AG-101" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={methods.control} name="docStatus" render={({ field }) => (<FormItem><FormLabel>Document Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{docStatusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></FormItem>)} />
                    </CardContent>
                    <CardFooter className="justify-between">
                        <Button variant="ghost" onClick={onBack}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>} Save</Button>
                    </CardFooter>
                </Card>
            </form>
        </FormProvider>
    );
}

export default function SecurityContent() {
    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
    const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

    const handleEdit = useCallback((doc: any) => {
        setSelectedDoc(doc);
        setView('edit');
    }, []);

    const columns: ColumnDef<any>[] = useMemo(() => [
        { accessorKey: 'name', header: 'Agreement Type', cell: ({ row }) => <span>{row.original.name}</span> },
        { accessorKey: 'client', header: 'Client', cell: ({ row }) => <span>{row.original.client}</span> },
        { accessorKey: 'agreement', header: 'Main Agreement', cell: ({ row }) => <span className="font-mono text-xs">{row.original.agreement}</span> },
        { accessorKey: 'docStatus', header: 'Document Status', cell: ({ row }) => <Badge>{row.original.docStatus}</Badge> },
        { accessorKey: 'recordStatus', header: 'Record Status', cell: ({ row }) => <Badge>{row.original.recordStatus}</Badge> },
        { id: 'actions', header: () => <div className="text-right">Actions</div>, cell: ({ row }) => <div className="text-right"><Button variant="ghost" size="sm" onClick={() => handleEdit(row.original)}>Edit</Button></div> },
    ], [handleEdit]);
    
    if (view === 'create' || view === 'edit') {
        return <SecurityWizard securityDoc={selectedDoc} onBack={() => setView('list')} onSaveSuccess={() => setView('list')} />;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-start">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <FileSignature /> Security Agreements Register
                    </CardTitle>
                    <CardDescription>
                        Track non-tangible security agreements like deeds of surety and cessions of book debt.
                    </CardDescription>
                </div>
                <Button onClick={() => setView('create')}><PlusCircle className="mr-2 h-4 w-4" /> Add Security Agreement</Button>
            </CardHeader>
            <CardContent>
                <DataTable columns={columns} data={dummySecurityDocs} />
            </CardContent>
        </Card>
    );
}
