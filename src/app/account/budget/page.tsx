'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sheet, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';


const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function BudgetPage() {
    const { toast } = useToast();
    const [startMonth, setStartMonth] = useState(new Date().getMonth());
    const [startYear, setStartYear] = useState(new Date().getFullYear());
    const [forecastMonths, setForecastMonths] = useState(36);

    const [membershipFees, setMembershipFees] = useState({ basic: 100, standard: 250, premium: 500 });
    const [membershipsSold, setMembershipsSold] = useState({ basic: 10, standard: 5, premium: 2 });
    
    const [staffAssumptions, setStaffAssumptions] = useState({
        execDirector: { count: 1, salary: 150000 },
        nonExecDirector: { count: 2, salary: 25000 },
        manager: { count: 3, salary: 75000 },
        admin: { count: 4, salary: 35000 },
    });

    const handleMembershipFeeChange = (plan: 'basic' | 'standard' | 'premium', value: string) => {
        setMembershipFees(prev => ({ ...prev, [plan]: Number(value) || 0 }));
    };

    const handleMembershipsSoldChange = (plan: 'basic' | 'standard' | 'premium', value: string) => {
        setMembershipsSold(prev => ({ ...prev, [plan]: Number(value) || 0 }));
    };
    
    const handleStaffChange = (role: keyof typeof staffAssumptions, field: 'count' | 'salary', value: string) => {
        setStaffAssumptions(prev => ({
            ...prev,
            [role]: { ...prev[role], [field]: Number(value) || 0 }
        }));
    };

    const handleSave = (section: string) => {
        toast({
            title: `Assumptions Saved`,
            description: `Your ${section} assumptions have been saved.`,
        });
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Sheet /> Budget Assumptions</CardTitle>
                    <CardDescription>A dynamic tool for setting the assumptions for your financial forecast.</CardDescription>
                </CardHeader>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Forecast Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="start-month">Start Month</Label>
                            <Select value={String(startMonth)} onValueChange={v => setStartMonth(Number(v))}>
                                <SelectTrigger className="w-[180px]" id="start-month"><SelectValue /></SelectTrigger>
                                <SelectContent>{monthNames.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="start-year">Start Year</Label>
                            <Input id="start-year" type="number" value={startYear} onChange={e => setStartYear(Number(e.target.value))} className="w-[180px]" />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="forecast-months">Months to Forecast</Label>
                            <Input id="forecast-months" type="number" value={forecastMonths} onChange={e => setForecastMonths(Number(e.target.value))} className="w-[180px]" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={() => handleSave('Forecast Settings')}>
                            <Save className="mr-2 h-4 w-4" /> Save Settings
                        </Button>
                    </CardFooter>
                </Card>
                 <Card className="lg:col-span-2">
                     <CardHeader>
                        <CardTitle>Staff Assumptions</CardTitle>
                     </CardHeader>
                     <CardContent className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4">
                             <div>
                                <Label>Executive Director Count</Label>
                                <Input type="number" value={staffAssumptions.execDirector.count} onChange={e => handleStaffChange('execDirector', 'count', e.target.value)} />
                            </div>
                             <div>
                                <Label>Executive Director Salary (R)</Label>
                                <Input type="number" value={staffAssumptions.execDirector.salary} onChange={e => handleStaffChange('execDirector', 'salary', e.target.value)} />
                            </div>
                             <div>
                                <Label>Non-Executive Director Count</Label>
                                <Input type="number" value={staffAssumptions.nonExecDirector.count} onChange={e => handleStaffChange('nonExecDirector', 'count', e.target.value)} />
                            </div>
                             <div>
                                <Label>Non-Executive Director Salary (R)</Label>
                                <Input type="number" value={staffAssumptions.nonExecDirector.salary} onChange={e => handleStaffChange('nonExecDirector', 'salary', e.target.value)} />
                            </div>
                            <div>
                                <Label>Manager Count</Label>
                                <Input type="number" value={staffAssumptions.manager.count} onChange={e => handleStaffChange('manager', 'count', e.target.value)} />
                            </div>
                            <div>
                                <Label>Manager Salary (R)</Label>
                                <Input type="number" value={staffAssumptions.manager.salary} onChange={e => handleStaffChange('manager', 'salary', e.target.value)} />
                            </div>
                            <div>
                                <Label>Admin Count</Label>
                                <Input type="number" value={staffAssumptions.admin.count} onChange={e => handleStaffChange('admin', 'count', e.target.value)} />
                            </div>
                            <div>
                                <Label>Admin Salary (R)</Label>
                                <Input type="number" value={staffAssumptions.admin.salary} onChange={e => handleStaffChange('admin', 'salary', e.target.value)} />
                            </div>
                         </div>
                     </CardContent>
                      <CardFooter>
                        <Button onClick={() => handleSave('Staff')}>
                            <Save className="mr-2 h-4 w-4" /> Save Staff Assumptions
                        </Button>
                    </CardFooter>
                </Card>
            </div>
             <Card>
                 <CardHeader>
                    <CardTitle>Membership Assumptions</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="font-medium text-muted-foreground">Monthly Fees</h3>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center justify-between gap-4">
                                <Label>Basic Plan (R)</Label>
                                <Input type="number" value={membershipFees.basic} onChange={e => handleMembershipFeeChange('basic', e.target.value)} className="w-[180px]" />
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <Label>Standard Plan (R)</Label>
                                <Input type="number" value={membershipFees.standard} onChange={e => handleMembershipFeeChange('standard', e.target.value)} className="w-[180px]" />
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <Label>Premium Plan (R)</Label>
                                <Input type="number" value={membershipFees.premium} onChange={e => handleMembershipFeeChange('premium', e.target.value)} className="w-[180px]" />
                            </div>
                        </div>
                    </div>
                     <div className="space-y-4 border-t pt-6">
                        <h3 className="font-medium text-muted-foreground">New Memberships Sold per Month</h3>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center justify-between gap-4">
                                <Label># of Basic Plans</Label>
                                <Input type="number" value={membershipsSold.basic} onChange={e => handleMembershipsSoldChange('basic', e.target.value)} className="w-[180px]" />
                            </div>
                             <div className="flex items-center justify-between gap-4">
                                <Label># of Standard Plans</Label>
                                <Input type="number" value={membershipsSold.standard} onChange={e => handleMembershipsSoldChange('standard', e.target.value)} className="w-[180px]" />
                            </div>
                             <div className="flex items-center justify-between gap-4">
                                <Label># of Premium Plans</Label>
                                <Input type="number" value={membershipsSold.premium} onChange={e => handleMembershipsSoldChange('premium', e.target.value)} className="w-[180px]" />
                            </div>
                        </div>
                    </div>
                 </CardContent>
                 <CardFooter>
                    <Button onClick={() => handleSave('Membership')}>
                        <Save className="mr-2 h-4 w-4" /> Save Membership Assumptions
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
