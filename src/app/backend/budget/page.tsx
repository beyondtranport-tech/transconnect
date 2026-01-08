
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sheet, DollarSign, Users, ShoppingCart, Percent } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';

const revenueItems = [
    { id: 'membershipFees', name: 'Avg. Membership Fee per Member', default: 250 },
    { id: 'connectPlanAdoptionRate', name: 'Connect Plan Adoption Rate (%)', default: 15 },
    { id: 'avgConnectPlanFee', name: 'Avg. Connect Plan Fee', default: 50 },
    { id: 'mallCommissionRate', name: 'Avg. Mall Commission Rate (%)', default: 2.5 },
    { id: 'avgMallSpendPerMember', name: 'Avg. Mall Spend per Member', default: 1000 },
    { id: 'techServicesAdoptionRate', name: 'Tech Services Adoption Rate (%)', default: 10 },
    { id: 'avgTechSpendPerMember', name: 'Avg. Tech Spend per Member', default: 150 },
];

const cogsItems = [
    { id: 'memberCommissionShare', name: 'Member Commission Share (%)', default: 50 },
    { id: 'isaCommissionRate', name: 'ISA Commission Rate (%)', default: 20 },
];

const opexRoles = [
    { role: 'Executive Directors', count: 2, salary: 150000 },
    { role: 'Non-Executive Directors', count: 3, salary: 25000 },
    { role: 'Developers', count: 4, salary: 80000 },
    { role: 'Sales & Marketing', count: 2, salary: 60000 },
    { role: 'Support Staff', count: 3, salary: 45000 },
];

const opexOtherItems = [
    { id: 'marketingSpend', name: 'Monthly Marketing Spend', default: 50000 },
    { id: 'platformCosts', name: 'Monthly Platform & Infra Costs', default: 20000 },
    { id: 'officeRental', name: 'Office Rental & Utilities', default: 35000 },
    { id: 'otherGAndA', name: 'Other General & Admin', default: 15000 },
];

export default function BudgetPage() {
    
    const { register, control, handleSubmit } = useForm({
        defaultValues: {
            revenue: revenueItems.reduce((acc, item) => ({ ...acc, [item.id]: item.default }), {}),
            cogs: cogsItems.reduce((acc, item) => ({ ...acc, [item.id]: item.default }), {}),
            opexSalaries: opexRoles,
            opexOther: opexOtherItems.reduce((acc, item) => ({ ...acc, [item.id]: item.default }), {}),
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "opexSalaries"
    });
    
    const onSubmit = (data: any) => {
        console.log(data);
        // This is where you would save the budget data
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Sheet /> Budget &amp; Forecast Assumptions</CardTitle>
                    <CardDescription>Enter the core financial variables for your business. These inputs will drive the forecast.</CardDescription>
                </CardHeader>
            </Card>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Revenue Section */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign /> Revenue Assumptions</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {revenueItems.map(item => (
                            <div key={item.id} className="space-y-2">
                                <Label htmlFor={item.id}>{item.name}</Label>
                                <Input id={item.id} type="number" {...register(`revenue.${item.id}` as const)} />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* COGS Section */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Percent /> Cost of Sales Assumptions</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {cogsItems.map(item => (
                            <div key={item.id} className="space-y-2">
                                <Label htmlFor={item.id}>{item.name}</Label>
                                <Input id={item.id} type="number" {...register(`cogs.${item.id}` as const)} />
                            </div>
                        ))}
                    </CardContent>
                </Card>
                
                {/* OPEX Section */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Users /> Operating Expenses (OPEX)</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="font-semibold mb-2">Salaries</h3>
                            <div className="space-y-4">
                                {fields.map((item, index) => (
                                    <div key={item.id} className="grid grid-cols-3 gap-4 items-center">
                                        <Input placeholder="Role" {...register(`opexSalaries.${index}.role`)} />
                                        <Input type="number" placeholder="Count" {...register(`opexSalaries.${index}.count`)} />
                                        <Input type="number" placeholder="Avg. Monthly Salary" {...register(`opexSalaries.${index}.salary`)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                         <div>
                            <h3 className="font-semibold mb-2">Other Monthly Expenses</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {opexOtherItems.map(item => (
                                    <div key={item.id} className="space-y-2">
                                        <Label htmlFor={item.id}>{item.name}</Label>
                                        <Input id={item.id} type="number" {...register(`opexOther.${item.id}` as const)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit">Save Budget</Button>
                </div>
            </form>
        </div>
    );
}
