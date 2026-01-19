'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles, Bot, Save, Search, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { leadResearchFlow } from '@/ai/flows/lead-research-flow';
import { LeadResearchInputSchema, type LeadResearchOutput } from '@/ai/schemas';
import type { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type LeadResearchInput = z.infer<typeof LeadResearchInputSchema>;

export default function LeadsAgent() {
    const [isLoading, setIsLoading] = useState(false);
    const [generatedLeads, setGeneratedLeads] = useState<LeadResearchOutput['leads']>([]);
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<LeadResearchInput>({
        resolver: zodResolver(LeadResearchInputSchema),
        defaultValues: {
            topic: '',
            quantity: 5,
        },
    });

    const onSubmit = async (values: LeadResearchInput) => {
        setIsLoading(true);
        setGeneratedLeads([]);
        try {
            const result = await leadResearchFlow(values);
            if (result.leads.length > 0) {
                setGeneratedLeads(result.leads);
                toast({ title: 'Research Complete', description: `Found ${result.leads.length} potential leads.` });
            } else {
                toast({ title: 'No Results', description: 'The AI agent could not find any companies for your query. Try a broader topic.' });
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Agent Failed', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleAddLead = (lead: { companyName: string, role: string, address?: string | null, website?: string | null, phone?: string | null, email?: string | null, contactPerson?: string | null }) => {
        console.log("Adding lead:", lead);
        toast({
            title: "Redirecting to Add Lead",
            description: `Pre-filling new lead for ${lead.companyName}.`
        });
        const queryParams = new URLSearchParams({
            newCompanyName: lead.companyName,
            newRole: lead.role,
        });
        if (lead.address) queryParams.set('newAddress', lead.address);
        if (lead.website) queryParams.set('newWebsite', lead.website);
        if (lead.phone) queryParams.set('newPhone', lead.phone);
        if (lead.email) queryParams.set('newEmail', lead.email);
        if (lead.contactPerson) queryParams.set('newContactPerson', lead.contactPerson);

        router.push(`/adminaccount?view=leads-database&${queryParams.toString()}`);
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Bot className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle>AI Lead Research Agent</CardTitle>
                            <CardDescription>Instruct the AI agent to research potential leads for you.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                             <Alert>
                                <Sparkles className="h-4 w-4" />
                                <AlertTitle>How this works</AlertTitle>
                                <AlertDescription>
                                   This agent uses the Google Search API to find real companies based on your topic. The results are a starting point for your own research. Please note that a valid API key is required.
                                </AlertDescription>
                            </Alert>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField control={form.control} name="topic" render={({ field }) => ( <FormItem className="md:col-span-2"><FormLabel>Research Topic</FormLabel><FormControl><Input placeholder="e.g., 'truck and trailer repair shops in Gauteng' or 'largest logistics companies in South Africa'" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="quantity" render={({ field }) => ( <FormItem><FormLabel>Number of Leads (1-10)</FormLabel><FormControl><Input type="number" min="1" max="10" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            </div>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4" />}
                                Start Research
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {isLoading && (
                 <div className="text-center py-10">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                    <p className="mt-4 text-muted-foreground">AI agent is conducting research...</p>
                </div>
            )}

            {generatedLeads.length > 0 && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Research Results</CardTitle>
                        <CardDescription>Review the potential leads found by the AI. Verify their details and add them to your database.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                           {generatedLeads.map((lead, index) => (
                                <li key={index} className="flex items-center justify-between p-3 border rounded-md bg-background">
                                    <div className="space-y-1">
                                        <p className="font-semibold">{lead.companyName}</p>
                                        <p className="text-sm text-muted-foreground">Role: {lead.role}</p>
                                        {lead.website && <p className="text-xs text-primary hover:underline"><a href={lead.website} target="_blank" rel="noopener noreferrer">{lead.website}</a></p>}
                                        {lead.address && <p className="text-xs text-muted-foreground">Address: {lead.address}</p>}
                                        {lead.phone && <p className="text-xs text-muted-foreground">Phone: {lead.phone}</p>}
                                        {lead.email && <p className="text-xs text-muted-foreground">Email: {lead.email}</p>}
                                        {lead.contactPerson && <p className="text-xs text-muted-foreground">Contact: {lead.contactPerson}</p>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleAddLead(lead)}>
                                            <PlusCircle className="mr-2 h-4 w-4" /> Add to Database
                                        </Button>
                                    </div>
                                </li>
                           ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
