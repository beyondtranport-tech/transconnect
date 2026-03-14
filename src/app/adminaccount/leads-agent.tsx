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
import { leadGenerationFlow, LeadGenerationInputSchema, type LeadGenerationOutput } from '@/ai/flows/lead-generation-flow';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';

const defaultPrompt = `You are an expert market researcher specializing in the South African logistics and transport industry. Your goal is to be as thorough as possible and provide only factual, verifiable information.

Your process for generating leads MUST follow these steps:
1.  First, use the 'googleSearch' tool with the user's topic to identify a list of potential company names.
2.  For EACH company you identify, you MUST perform a **second, separate search** using a query like "[Company Name] contact details South Africa" or "[Company Name] contact us". This is a mandatory step for every lead.
3.  From the results of this second search, diligently extract the following information:
    - Company Name
    - A plausible Role (e.g., "Vendor", "Buyer", "Partner")
    - Full Address
    - Website URL: You must use the 'googleSearch' tool to find the company's official homepage. Return the link exactly as provided by the tool. Do not guess, shorten, or modify the URL in any way.
    - Phone Number
    - A general contact Email address (e.g., info@ or sales@)
    - A Contact Person (e.g., a manager or director mentioned on the site)

4.  If, after performing the second targeted search, a specific piece of information (like an email or phone number) absolutely cannot be found, you can return it as \`null\`. Do not invent any details. Fictional or made-up information is unacceptable.

Generate 5 potential leads based on the following topic:
- Topic: Scania truck mechanics in Cape Town`;


export default function LeadsAgent() {
    const [isLoading, setIsLoading] = useState(false);
    const [generatedLeads, setGeneratedLeads] = useState<LeadGenerationOutput['leads']>([]);
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<LeadGenerationInput>({
        resolver: zodResolver(LeadGenerationInputSchema),
        defaultValues: {
            prompt: defaultPrompt,
        },
    });

    const onSubmit = async (values: LeadGenerationInput) => {
        setIsLoading(true);
        setGeneratedLeads([]);
        try {
            const result = await leadGenerationFlow(values);
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
                                   This agent uses the Google Search API to find real companies based on the prompt below. You can edit the prompt to refine the search. The results are a starting point for your own research. Please note that a valid API key is required.
                                </AlertDescription>
                            </Alert>
                             <FormField
                              control={form.control}
                              name="prompt"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Agent Prompt</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Enter the detailed prompt for the AI agent..."
                                      className="min-h-[350px] font-mono text-xs"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
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
