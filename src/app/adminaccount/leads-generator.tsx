'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Bot, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { leadGenerationFlow } from '@/ai/flows/lead-generation-flow';
import { LeadGenerationInputSchema, type LeadGenerationInput, type LeadGenerationOutput } from '@/ai/schemas';
import { getClientSideAuthToken } from '@/firebase';
import { useRouter } from 'next/navigation';
import { provinces } from '@/lib/geodata';

export default function LeadsGenerator() {
    const [isLoading, setIsLoading] = useState(false);
    const [generatedLeads, setGeneratedLeads] = useState<LeadGenerationOutput['leads']>([]);
    const [cities, setCities] = useState<string[]>([]);
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<LeadGenerationInput>({
        resolver: zodResolver(LeadGenerationInputSchema),
        defaultValues: {
            businessType: '',
            region: 'Gauteng',
            city: '',
            quantity: 10,
        },
    });

    const watchedRegion = form.watch('region');

    useEffect(() => {
        const selectedProvince = provinces.find(p => p.name === watchedRegion);
        setCities(selectedProvince ? selectedProvince.cities : []);
        form.setValue('city', ''); // Reset city when province changes
    }, [watchedRegion, form]);

    const onSubmit = async (values: LeadGenerationInput) => {
        setIsLoading(true);
        setGeneratedLeads([]);
        try {
            const result = await leadGenerationFlow(values);
            if (result.leads.length > 0) {
                setGeneratedLeads(result.leads);
                toast({ title: 'Leads Generated', description: `Found ${result.leads.length} potential leads.` });
            } else {
                toast({ title: 'No Leads Found', description: 'The AI agent could not find any leads for your criteria. Try adjusting your request.' });
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Agent Failed', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveLeads = async () => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            
            const response = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'saveLeads',
                    payload: { leads: generatedLeads }
                }),
            });
            
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to save leads.');
            
            toast({ title: "Leads Saved!", description: `${generatedLeads.length} leads have been added to your database.` });
            setGeneratedLeads([]); // Clear the list after saving
            router.push('/adminaccount?view=leads'); // Navigate to the leads list
        } catch (e: any) {
             toast({ variant: 'destructive', title: 'Save Failed', description: e.message });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Bot className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle>AI Lead Generation Agent</CardTitle>
                            <CardDescription>Instruct the AI agent to find potential member leads for you.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <FormField control={form.control} name="businessType" render={({ field }) => ( <FormItem><FormLabel>Business Type to Find</FormLabel><FormControl><Input placeholder="e.g., Trucking companies" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                
                                <FormField control={form.control} name="region" render={({ field }) => ( <FormItem><FormLabel>Province</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a province" /></SelectTrigger></FormControl><SelectContent>{provinces.map(p => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />

                                <FormField control={form.control} name="city" render={({ field }) => ( <FormItem><FormLabel>City / Town</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={cities.length === 0}><FormControl><SelectTrigger><SelectValue placeholder="Select a city" /></SelectTrigger></FormControl><SelectContent>{cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                                
                                <FormField control={form.control} name="quantity" render={({ field }) => ( <FormItem><FormLabel>Number of Leads (1-25)</FormLabel><FormControl><Input type="number" min="1" max="25" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            </div>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                                Generate Leads
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {generatedLeads.length > 0 && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Generated Leads</CardTitle>
                        <CardDescription>Review the leads found by the AI agent. Click "Save All" to add them to your database.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                           {generatedLeads.map((lead, index) => (
                                <li key={index} className="p-3 border rounded-md bg-background">
                                    <p className="font-semibold">{lead.companyName}</p>
                                    <p className="text-sm text-muted-foreground">{lead.role}</p>
                                    {lead.email && <p className="text-xs font-mono">{lead.email}</p>}
                                </li>
                           ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSaveLeads} disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                            Save All Leads to Database
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
