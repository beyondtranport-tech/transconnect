
'use client';

import React, { Suspense, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TrendingUp, DollarSign, Users, Percent, Handshake, Map, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const defaultValues = {
    budgetInputs: {
        revenue: {
            membershipFees: 250,
            connectPlanAdoptionRate: 15, 
            avgConnectPlanFee: 50,
            mallCommissionRate: 2.5, 
            avgMallSpendPerMember: 1000, 
            techServicesAdoptionRate: 10,
            avgTechSpendPerMember: 150
        },
        cogs: { memberCommissionShare: 50, isaCommissionRate: 20 },
        opexSalaries: [
            { role: 'Executive Director', count: 1, salary: 150000 },
            { role: 'Non-Executive Director', count: 2, salary: 25000 },
            { role: 'Manager', count: 3, salary: 75000 },
            { role: 'Admin', count: 4, salary: 35000 },
        ],
        opexOther: {
            digitalAdvertising: 30000, contentCreation: 15000, eventsAndSponsorships: 10000,
            officeRental: 35000, utilities: 15000, insurance: 5000,
            legalAndProfessional: 10000, bankCharges: 2000, telephone: 8000,
            travelAndEntertainment: 5000, platformCosts: 20000, softwareLicenses: 10000
        }
    }
};

function BudgetPageComponent() {
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm({
        defaultValues: useCallback(() => {
            if (typeof window !== 'undefined') {
                const saved = localStorage.getItem('accountBudgetAssumptions_v1');
                if (saved) return JSON.parse(saved);
            }
            return defaultValues;
        }, [])()
    });

    const { control, handleSubmit } = form;

    const { fields: staffFields } = useFieldArray({
        control,
        name: "budgetInputs.opexSalaries"
    });
    
    const onSubmit = (data: any) => {
        localStorage.setItem('accountBudgetAssumptions_v1', JSON.stringify(data));
        
        toast({
            title: "Generating Forecast...",
            description: "Your assumptions have been saved. Redirecting to the forecast.",
        });

        router.push(`/account?view=forecast`);
    };

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                 <div className="space-y-8">
                    {/* Revenue */}
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign />Revenue Assumptions</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <FormField name="budgetInputs.revenue.membershipFees" control={control} render={({field}) => <FormItem><FormLabel>Avg. Membership Fee</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                            <FormField name="budgetInputs.revenue.connectPlanAdoptionRate" control={control} render={({field}) => <FormItem><FormLabel>Connect Plan Adoption (%)</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                            <FormField name="budgetInputs.revenue.avgConnectPlanFee" control={control} render={({field}) => <FormItem><FormLabel>Avg. Connect Plan Fee</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                            <FormField name="budgetInputs.revenue.mallCommissionRate" control={control} render={({field}) => <FormItem><FormLabel>Mall Commission (%)</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                            <FormField name="budgetInputs.revenue.avgMallSpendPerMember" control={control} render={({field}) => <FormItem><FormLabel>Avg. Mall Spend / Member</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                            <FormField name="budgetInputs.revenue.techServicesAdoptionRate" control={control} render={({field}) => <FormItem><FormLabel>Tech Services Adoption (%)</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                            <FormField name="budgetInputs.revenue.avgTechSpendPerMember" control={control} render={({field}) => <FormItem><FormLabel>Avg. Tech Spend / Member</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                        </CardContent>
                    </Card>

                    {/* COGS */}
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Percent />Cost of Goods Sold (COGS)</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField name="budgetInputs.cogs.memberCommissionShare" control={control} render={({field}) => <FormItem><FormLabel>Member Commission Share (%)</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                            <FormField name="budgetInputs.cogs.isaCommissionRate" control={control} render={({field}) => <FormItem><FormLabel>ISA Commission Rate (%)</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                        </CardContent>
                    </Card>
                    
                    {/* OPEX */}
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Users />Operating Expenses (OPEX)</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="font-semibold text-lg">Salaries (Monthly)</h3>
                                <div className="mt-4 space-y-2">
                                    {staffFields.map((item, index) => (
                                        <div key={item.id} className="grid grid-cols-3 gap-4">
                                            <Input value={item.role} disabled />
                                            <FormField name={`budgetInputs.opexSalaries.${index}.count`} control={control} render={({field}) => <FormItem><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                            <FormField name={`budgetInputs.opexSalaries.${index}.salary`} control={control} render={({field}) => <FormItem><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <h3 className="font-semibold text-lg">Other Expenses (Monthly)</h3>
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <FormField name="budgetInputs.opexOther.digitalAdvertising" control={control} render={({field}) => <FormItem><FormLabel>Digital Advertising</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                    <FormField name="budgetInputs.opexOther.contentCreation" control={control} render={({field}) => <FormItem><FormLabel>Content & SEO</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                    <FormField name="budgetInputs.opexOther.eventsAndSponsorships" control={control} render={({field}) => <FormItem><FormLabel>Events</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                    <FormField name="budgetInputs.opexOther.officeRental" control={control} render={({field}) => <FormItem><FormLabel>Office Rental</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                    <FormField name="budgetInputs.opexOther.utilities" control={control} render={({field}) => <FormItem><FormLabel>Utilities</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                    <FormField name="budgetInputs.opexOther.insurance" control={control} render={({field}) => <FormItem><FormLabel>Insurance</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                    <FormField name="budgetInputs.opexOther.legalAndProfessional" control={control} render={({field}) => <FormItem><FormLabel>Legal & Pro Fees</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                    <FormField name="budgetInputs.opexOther.bankCharges" control={control} render={({field}) => <FormItem><FormLabel>Bank Charges</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                    <FormField name="budgetInputs.opexOther.telephone" control={control} render={({field}) => <FormItem><FormLabel>Telephone</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                    <FormField name="budgetInputs.opexOther.travelAndEntertainment" control={control} render={({field}) => <FormItem><FormLabel>Travel</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                    <FormField name="budgetInputs.opexOther.platformCosts" control={control} render={({field}) => <FormItem><FormLabel>Platform Hosting</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                    <FormField name="budgetInputs.opexOther.softwareLicenses" control={control} render={({field}) => <FormItem><FormLabel>Software Licenses</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </div>
                
                <div className="mt-8 flex justify-end">
                    <Button type="submit">
                        <TrendingUp className="mr-2 h-4 w-4"/>
                        Generate Income Statement
                    </Button>
                </div>
            </form>
        </Form>
    );
}

export default function BudgetPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin" /></div>}>
            <BudgetPageComponent />
        </Suspense>
    );
}
