
'use client';

import React from 'react';
import { useForm, useFieldArray, FormProvider, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Trash2, Sheet, Save } from 'lucide-react';

const BalanceSheetForm = ({ index, remove }: { index: number, remove: (index: number) => void }) => {
    const { register } = useFormContext(); // Using context to register inputs

    return (
        <Card className="relative">
            <CardHeader>
                <CardTitle>Balance Sheet Entry #{index + 1}</CardTitle>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor={`balanceSheets.${index}.statementDate`}>Statement Date</Label>
                    <Input id={`balanceSheets.${index}.statementDate`} type="date" {...register(`balanceSheets.${index}.statementDate`)} />
                </div>
                <Separator />
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                    {/* Assets */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-lg text-primary">Assets</h4>
                        <div className="pl-4 border-l-2 border-primary/50 space-y-4">
                            <div>
                                <h5 className="font-medium">Non-Current Assets</h5>
                                <div className="pl-4 space-y-2 mt-2">
                                    <div className="space-y-1"><Label>Property, Plant & Equipment</Label><Input type="number" placeholder="0.00" {...register(`balanceSheets.${index}.ppe`)} /></div>
                                    <div className="space-y-1"><Label>Intangible Assets</Label><Input type="number" placeholder="0.00" {...register(`balanceSheets.${index}.intangibleAssets`)} /></div>
                                    <div className="space-y-1"><Label>Financial Assets</Label><Input type="number" placeholder="0.00" {...register(`balanceSheets.${index}.financialAssets`)} /></div>
                                </div>
                            </div>
                             <div>
                                <h5 className="font-medium">Current Assets</h5>
                                <div className="pl-4 space-y-2 mt-2">
                                    <div className="space-y-1"><Label>Inventories</Label><Input type="number" placeholder="0.00" {...register(`balanceSheets.${index}.inventories`)} /></div>
                                    <div className="space-y-1"><Label>Trade & Other Receivables</Label><Input type="number" placeholder="0.00" {...register(`balanceSheets.${index}.receivables`)} /></div>
                                    <div className="space-y-1"><Label>Cash & Cash Equivalents</Label><Input type="number" placeholder="0.00" {...register(`balanceSheets.${index}.cash`)} /></div>
                                </div>
                            </div>
                        </div>
                         <div className="font-bold text-lg border-t pt-2 mt-4 flex justify-between">
                            <span>Total Assets</span>
                            <span>R 0.00</span>
                        </div>
                    </div>
                    {/* Equity & Liabilities */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-lg text-primary">Equity & Liabilities</h4>
                         <div className="pl-4 border-l-2 border-primary/50 space-y-4">
                            <div>
                                <h5 className="font-medium">Equity</h5>
                                <div className="pl-4 space-y-2 mt-2">
                                    <div className="space-y-1"><Label>Share Capital</Label><Input type="number" placeholder="0.00" {...register(`balanceSheets.${index}.shareCapital`)} /></div>
                                    <div className="space-y-1"><Label>Retained Earnings</Label><Input type="number" placeholder="0.00" {...register(`balanceSheets.${index}.retainedEarnings`)} /></div>
                                </div>
                            </div>
                             <div>
                                <h5 className="font-medium">Non-Current Liabilities</h5>
                                 <div className="pl-4 space-y-2 mt-2">
                                    <div className="space-y-1"><Label>Long-Term Borrowings</Label><Input type="number" placeholder="0.00" {...register(`balanceSheets.${index}.longTermDebt`)} /></div>
                                    <div className="space-y-1"><Label>Lease Liabilities</Label><Input type="number" placeholder="0.00" {...register(`balanceSheets.${index}.leaseLiabilities`)} /></div>
                                </div>
                            </div>
                             <div>
                                <h5 className="font-medium">Current Liabilities</h5>
                                 <div className="pl-4 space-y-2 mt-2">
                                    <div className="space-y-1"><Label>Trade & Other Payables</Label><Input type="number" placeholder="0.00" {...register(`balanceSheets.${index}.payables`)} /></div>
                                    <div className="space-y-1"><Label>Short-Term Borrowings</Label><Input type="number" placeholder="0.00" {...register(`balanceSheets.${index}.shortTermDebt`)} /></div>
                                    <div className="space-y-1"><Label>Current Tax Payable</Label><Input type="number" placeholder="0.00" {...register(`balanceSheets.${index}.taxPayable`)} /></div>
                                </div>
                            </div>
                        </div>
                         <div className="font-bold text-lg border-t pt-2 mt-4 flex justify-between">
                            <span>Total Equity & Liabilities</span>
                            <span>R 0.00</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function BalanceSheetContent() {
    const methods = useForm({
      defaultValues: { balanceSheets: [{}] }
    });
    const { control, handleSubmit } = methods;
    const { fields, append, remove } = useFieldArray({ name: 'balanceSheets', control });

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
                    <CardTitle className="flex items-center gap-2"><Sheet /> Client Balance Sheet</CardTitle>
                    <CardDescription>Capture the client's financial position from their annual financial statements.</CardDescription>
                </CardHeader>
                <div className="space-y-6">
                    {fields.map((field, index) => (
                        <BalanceSheetForm key={field.id} index={index} remove={remove} />
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
