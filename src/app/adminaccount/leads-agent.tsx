
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Bot, Save, Search, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { leadResearchFlow, LeadResearchInputSchema, type LeadResearchOutput } from '@/ai/flows/lead-research-flow';
import type { z } from 'zod';
import { roles } from '@/lib/roles';
import { getClientSideAuthToken } from '@/firebase';
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
    
    const handleAddLead = (lead: { companyName: string, role: string }) => {
        // Here you would typically open a dialog pre-filled with this info
        // For now, we'll just log it and redirect to the database page
        console.log("Adding lead:", lead);
        toast({
            title: "Redirecting to Add Lead",
            description: `Pre-filling new lead for ${lead.companyName}.`
        });
        // A more advanced implementation would use a dialog here
        router.push(`/adminaccount?view=leads-database&newCompanyName=${encodeURIComponent(lead.companyName)}&newRole=${encodeURIComponent(lead.role)}`);
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
                                   Describe the type of companies you're looking for. The AI will generate a list of potential company names based on its training data. This is a starting point for your own research.
                                </AlertDescription>
                            </Alert>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField control={form.control} name="topic" render={({ field }) => ( <FormItem className="md:col-span-2"><FormLabel>Research Topic</FormLabel><FormControl><Input placeholder="e.g., 'truck and trailer repair shops in Gauteng' or 'largest logistics companies in South Africa'" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="quantity" render={({ field }) => ( <FormItem><FormLabel>Number of Leads (1-25)</FormLabel><FormControl><Input type="number" min="1" max="25" {...field} /></FormControl><FormMessage /></FormItem> )} />
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
                                    <div>
                                        <p className="font-semibold">{lead.companyName}</p>
                                        <p className="text-sm text-muted-foreground">Suggested Role: {lead.role}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={`https://www.google.com/search?q=${encodeURIComponent(lead.companyName)}`} target="_blank" rel="noopener noreferrer">
                                                <Search className="mr-2 h-4 w-4" /> Verify
                                            </a>
                                        </Button>
                                        <Button size="sm" onClick={() => handleAddLead(lead)}>
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
