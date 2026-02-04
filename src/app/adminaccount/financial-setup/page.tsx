
'use client';

import React, { useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Settings, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SETUP_KEY = 'accountFinancialSetup_v1';

const defaultValues = {
    startMonth: new Date().getMonth(),
    startYear: new Date().getFullYear(),
    forecastMonths: 36,
};

export default function FinancialSetupPage() {
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm({
        defaultValues: useCallback(() => {
            if (typeof window === 'undefined') return defaultValues;
            const saved = localStorage.getItem(SETUP_KEY);
            return saved ? JSON.parse(saved) : defaultValues;
        }, [])()
    });

    const { control, handleSubmit, watch } = form;

    const onSubmit = (data: any) => {
        localStorage.setItem(SETUP_KEY, JSON.stringify(data));
        toast({
            title: "Settings Saved",
            description: "Your financial forecast settings have been saved locally.",
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-lg">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Settings /> Financial Forecast Set Up</CardTitle>
                        <CardDescription>Define the core parameters for your financial projections. These settings will apply to all financial reports.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                            control={control}
                            name="startMonth"
                            render={({ field }) => (
                                <FormItem>
                                    <Label>Start Month</Label>
                                    <Select onValueChange={v => field.onChange(Number(v))} defaultValue={String(field.value)}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>{monthNames.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="startYear"
                            render={({ field }) => (
                                <FormItem>
                                    <Label>Start Year</Label>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="forecastMonths"
                            render={({ field }) => (
                                <FormItem>
                                    <Label>Months to Forecast</Label>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
                
                <div className="flex justify-end">
                    <Button type="submit">
                        <Save className="mr-2 h-4 w-4"/>
                        Save Settings
                    </Button>
                </div>
            </form>
        </Form>
    );
}
