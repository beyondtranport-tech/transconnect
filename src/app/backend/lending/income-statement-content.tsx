'use client';

import React from 'react';
import { useForm, useFieldArray, FormProvider, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Trash2, TrendingUp, Save } from 'lucide-react';

const IncomeStatementForm = ({ index, remove }: { index: number, remove: (index: number) => void }) => {
    const { register } = useFormContext(); // Use context to register inputs

    return (
        <Card className="relative">
            <CardHeader>
                <CardTitle>Income Statement Entry #{index + 1}</CardTitle>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor={`incomeStatements.${index}.statementDate`}>Statement Date</Label>
                    <Input id={`incomeStatements.${index}.statementDate`} type="date" {...register(`incomeStatements.${index}.statementDate`)} />
                </div>
                <div className="space-y-2">
                    <Label>Revenue</Label><Input type="number" placeholder="0.00" {...register(`incomeStatements.${index}.revenue`)} />
                    <Label>Cost of Sales</Label><Input type="number" placeholder="0.00" {...register(`incomeStatements.${index}.cogs`)} />
                    <p className="flex justify-between font-semibold"><span>Gross Profit</span><span>R 0.00</span></p>
                </div>
                <Separator />
                <div className="space-y-2">
                    <Label>Other Income</Label><Input type="number" placeholder="0.00" {...register(`incomeStatements.${index}.otherIncome`)} />
                    <Label>Operating Expenses</Label><Input type="number" placeholder="0.00" {...register(`incomeStatements.${index}.opex`)} />
                    <p className="flex justify-between font-semibold"><span>Operating Profit</span><span>R 0.00</span></p>
                </div>
                <Separator />
                 <div className="space-y-2">
                    <Label>Finance Costs</Label><Input type="number" placeholder="0.00" {...register(`incomeStatements.${index}.financeCosts`)} />
                    <p className="flex justify-between font-semibold"><span>Profit Before Tax</span><span>R 0.00</span></p>
                </div>
                 <Separator />
                  <div className="space-y-2">
                    <Label>Income Tax Expense</Label><Input type="number" placeholder="0.00" {...register(`incomeStatements.${index}.tax`)} />
                    <p className="flex justify-between font-bold text-lg text-primary border-t pt-2 mt-2"><span>Profit for the Period</span><span>R 0.00</span></p>
                </div>
            </CardContent>
        </Card>
    );
}

export default function IncomeStatementContent() {
    const methods = useForm({
        defaultValues: { incomeStatements: [{}] }
    });
    const { control, handleSubmit } = methods;
    const { fields, append, remove } = useFieldArray({ name: 'incomeStatements', control });

    React.useEffect(() => {
        if (fields.length === 0) {
            append({});
        }
    }, [fields, append]);
    
    const onSubmit = (data: any) => {
      // Placeholder for form submission logic
      console.log('Form data:', data);
    };

    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <CardHeader className="px-0">
                    <CardTitle className="flex items-center gap-2"><TrendingUp /> Client Income Statement</CardTitle>
                    <CardDescription>Capture the client's financial performance from their annual financial statements.</CardDescription>
                </CardHeader>
                <div className="space-y-6">
                    {fields.map((field, index) => (
                        <IncomeStatementForm key={field.id} index={index} remove={remove} />
                    ))}
                </div>
                <div className="flex justify-between items-center mt-6">
                    <Button type="button" variant="outline" onClick={() => append({})}><PlusCircle className="mr-2 h-4 w-4"/>Add Another Year</Button>
                    <Button type="submit"><Save className="mr-2 h-4 w-4" /> Save Financials</Button>
                </div>
            </form>
        </FormProvider>
    );
}
