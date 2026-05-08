
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Bot, Sparkles, AlertTriangle } from 'lucide-react';
import { leadGenerationFlow, type LeadGenerationInput } from '@/ai/flows/lead-generation-flow';
import Link from 'next/link';
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Define the schema locally to avoid importing from a shared server/client file.
const LeadGenerationInputSchema = z.object({
  prompt: z.string().min(20, 'Please provide a detailed prompt.').describe('A detailed prompt for the AI agent, instructing it what to research.'),
});


const defaultPrompt = `You are an AI research assistant. Your goal is to find 5 potential leads for transport companies in South Africa that would be good candidates for our logistics platform. For each lead, find the company name, their likely role (e.g., "Vendor", "Buyer", "Transporter"), a physical address, a website, a phone number, and an email address if possible. Format the output as a list of leads.`;

export default function LeadsAgent() {
    const [isLoading, setIsLoading] = useState(false);
    const [quotaError, setQuotaError] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<LeadGenerationInput>({
        resolver: zodResolver(LeadGenerationInputSchema),
        defaultValues: {
            prompt: defaultPrompt,
        },
    });
    
    const onSubmit = useCallback(async (values: LeadGenerationInput) => {
        setIsLoading(true);
        setQuotaError(null);
        try {
            const result = await leadGenerationFlow(values);
            
            if (result.leads && result.leads.length > 0) {
                 toast({
                    title: "Leads Found!",
                    description: `${result.leads.length} potential leads have been discovered.`,
                });
                const queryParams = new URLSearchParams({
                    view: 'leads-database',
                    action: 'add-member',
                });
                
                // For simplicity, we'll just pass the first lead's data. 
                // A real implementation might pass all leads or save them first.
                const firstLead = result.leads[0];
                if(firstLead.companyName) queryParams.set('newCompanyName', firstLead.companyName);
                if(firstLead.role) queryParams.set('newRole', firstLead.role);
                if(firstLead.address) queryParams.set('newAddress', firstLead.address);
                if(firstLead.website) queryParams.set('newWebsite', firstLead.website);
                if(firstLead.phone) queryParams.set('newPhone', firstLead.phone);
                if(firstLead.email) queryParams.set('newEmail', firstLead.email);
                if(firstLead.contactPerson) queryParams.set('newContactPerson', firstLead.contactPerson);

                router.push(`/backend?${queryParams.toString()}`);

            } else {
                 toast({
                    variant: "destructive",
                    title: "No Leads Found",
                    description: "The agent could not find any leads matching your criteria.",
                });
            }

        } catch (e: any) {
            console.error("Lead generation failed:", e);
            if (e.message?.includes('429') || e.message?.toLowerCase().includes('quota') || e.message?.toLowerCase().includes('resource exhausted')) {
                setQuotaError("The AI service rate limit has been exceeded (429 Resource Exhausted). This usually happens when generating many leads at once. Please wait 60 seconds before trying again.");
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Lead Generation Failed',
                    description: e.message,
                });
            }
        } finally {
            setIsLoading(false);
        }
    }, [toast, router]);

    return (
        <div className="space-y-6">
            {quotaError && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Rate Limit Reached</AlertTitle>
                    <AlertDescription>
                        {quotaError}
                        <div className="mt-2">
                             <Button asChild variant="link" className="p-0 h-auto text-xs text-destructive-foreground underline">
                                <Link href="/docs/quota-increase-guide.md" target="_blank">View Quota Increase Guide</Link>
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="h-6 w-6" />
                        AI Lead Generation Agent
                    </CardTitle>
                    <CardDescription>
                        Instruct the AI agent to research and generate potential sales leads. The results will be automatically added to the lead database.
                    </CardDescription>
                </CardHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="prompt"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Agent Prompt</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter your detailed prompt here..."
                                            className="min-h-[250px] font-mono text-sm"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="mr-2 h-4 w-4" />
                                )}
                                Generate Leads
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    );
}
