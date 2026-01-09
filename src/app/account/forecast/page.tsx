
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, TrendingUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ForecastPage() {
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

    const forecastPeriod = useMemo(() => {
        const period = [];
        for (let i = 0; i < forecastMonths; i++) {
            const date = new Date(startYear, startMonth + i, 1);
            period.push({
                month: monthNames[date.getMonth()],
                year: date.getFullYear(),
            });
        }
        return period;
    }, [startMonth, startYear, forecastMonths]);

    const yearlyTotalsColumns = useMemo(() => {
        const years = [...new Set(forecastPeriod.map(p => p.year))];
        return years;
    }, [forecastPeriod]);
    
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
            description: `Your ${section} assumptions have been saved. The forecast has been updated.`,
        });
    }

    const renderTableRows = (count: number) => {
        return Array(count).fill(0).map((_, i) => <TableCell key={i} className="text-right">0.00</TableCell>);
    }

    return (
    <>
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp /> Financial Forecast</CardTitle>
            <CardDescription>A dynamic tool for setting assumptions and viewing your financial forecast.</CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle>Forecast Settings</CardTitle></CardHeader>
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
            <CardHeader><CardTitle>Staff Assumptions</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4">
                <div><Label>Executive Director Count</Label><Input type="number" value={staffAssumptions.execDirector.count} onChange={e => handleStaffChange('execDirector', 'count', e.target.value)} /></div>
                <div><Label>Executive Director Salary (R)</Label><Input type="number" value={staffAssumptions.execDirector.salary} onChange={e => handleStaffChange('execDirector', 'salary', e.target.value)} /></div>
                <div><Label>Non-Executive Director Count</Label><Input type="number" value={staffAssumptions.nonExecDirector.count} onChange={e => handleStaffChange('nonExecDirector', 'count', e.target.value)} /></div>
                <div><Label>Non-Executive Director Salary (R)</Label><Input type="number" value={staffAssumptions.nonExecDirector.salary} onChange={e => handleStaffChange('nonExecDirector', 'salary', e.target.value)} /></div>
                <div><Label>Manager Count</Label><Input type="number" value={staffAssumptions.manager.count} onChange={e => handleStaffChange('manager', 'count', e.target.value)} /></div>
                <div><Label>Manager Salary (R)</Label><Input type="number" value={staffAssumptions.manager.salary} onChange={e => handleStaffChange('manager', 'salary', e.target.value)} /></div>
                <div><Label>Admin Count</Label><Input type="number" value={staffAssumptions.admin.count} onChange={e => handleStaffChange('admin', 'count', e.target.value)} /></div>
                <div><Label>Admin Salary (R)</Label><Input type="number" value={staffAssumptions.admin.salary} onChange={e => handleStaffChange('admin', 'salary', e.target.value)} /></div>
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
          <CardHeader><CardTitle>Membership Assumptions</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium text-muted-foreground">Monthly Fees</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between gap-4"><Label>Basic Plan (R)</Label><Input type="number" value={membershipFees.basic} onChange={e => handleMembershipFeeChange('basic', e.target.value)} className="w-[180px]" /></div>
                <div className="flex items-center justify-between gap-4"><Label>Standard Plan (R)</Label><Input type="number" value={membershipFees.standard} onChange={e => handleMembershipFeeChange('standard', e.target.value)} className="w-[180px]" /></div>
                <div className="flex items-center justify-between gap-4"><Label>Premium Plan (R)</Label><Input type="number" value={membershipFees.premium} onChange={e => handleMembershipFeeChange('premium', e.target.value)} className="w-[180px]" /></div>
              </div>
            </div>
            <div className="space-y-4 border-t pt-6">
              <h3 className="font-medium text-muted-foreground">New Memberships Sold per Month</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between gap-4"><Label># of Basic Plans</Label><Input type="number" value={membershipsSold.basic} onChange={e => handleMembershipsSoldChange('basic', e.target.value)} className="w-[180px]" /></div>
                <div className="flex items-center justify-between gap-4"><Label># of Standard Plans</Label><Input type="number" value={membershipsSold.standard} onChange={e => handleMembershipsSoldChange('standard', e.target.value)} className="w-[180px]" /></div>
                <div className="flex items-center justify-between gap-4"><Label># of Premium Plans</Label><Input type="number" value={membershipsSold.premium} onChange={e => handleMembershipsSoldChange('premium', e.target.value)} className="w-[180px]" /></div>
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

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Income Statement</CardTitle>
            <CardDescription>This is a forecast based on the assumptions set in the cards above.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-card w-[250px] min-w-[250px]">Description</TableHead>
                  {forecastPeriod.map((p, i) => <TableHead key={i} className="text-center min-w-[120px]">{p.month} {p.year}</TableHead>)}
                  {yearlyTotalsColumns.map(year => <TableHead key={`total-${year}`} className="text-right font-bold min-w-[150px]">Total {year}</TableHead>)}
                  <TableHead className="text-right font-bold min-w-[150px]">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="font-bold bg-muted/50"><TableCell className="sticky left-0 bg-muted/50">Revenue</TableCell><TableCell colSpan={forecastMonths + yearlyTotalsColumns.length + 1}></TableCell></TableRow>
                <TableRow><TableCell className="sticky left-0 bg-card pl-8">Membership Fees</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                <TableRow><TableCell className="sticky left-0 bg-card pl-8">Mall Commission Revenue</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                <TableRow><TableCell className="sticky left-0 bg-card pl-8">Marketplace Fees</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                <TableRow><TableCell className="sticky left-0 bg-card pl-8">Connect Plan Revenue</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                <TableRow><TableCell className="sticky left-0 bg-card pl-8">Tech Services Revenue</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                <TableRow className="font-semibold border-t-2 border-foreground"><TableCell className="sticky left-0 bg-card">Total Revenue</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                <TableRow className="font-bold bg-muted/50"><TableCell className="sticky left-0 bg-muted/50">Cost of Revenue</TableCell><TableCell colSpan={forecastMonths + yearlyTotalsColumns.length + 1}></TableCell></TableRow>
                <TableRow><TableCell className="sticky left-0 bg-card pl-8">Member Commission Share</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                <TableRow><TableCell className="sticky left-0 bg-card pl-8">ISA Commission</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                <TableRow className="font-semibold"><TableCell className="sticky left-0 bg-card">Total Cost of Revenue</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                <TableRow className="font-bold text-lg border-y-2 border-foreground bg-primary/10"><TableCell className="sticky left-0 bg-primary/10">Gross Profit</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                <TableRow className="font-bold bg-muted/50"><TableCell className="sticky left-0 bg-muted/50">Operating Expenses (OPEX)</TableCell><TableCell colSpan={forecastMonths + yearlyTotalsColumns.length + 1}></TableCell></TableRow>
                <TableRow><TableCell className="sticky left-0 bg-card pl-8 font-semibold">Salaries & Wages</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                <TableRow><TableCell className="sticky left-0 bg-card pl-12">Sales & Marketing</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                <TableRow><TableCell className="sticky left-0 bg-card pl-8 font-semibold">General & Administrative</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                <TableRow><TableCell className="sticky left-0 bg-card pl-12">Rent</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                <TableRow><TableCell className="sticky left-0 bg-card pl-12">Utilities</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                <TableRow><TableCell className="sticky left-0 bg-card pl-12">Insurance</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                <TableRow><TableCell className="sticky left-0 bg-card pl-8 font-semibold">Technology & R&D</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                <TableRow className="font-semibold"><TableCell className="sticky left-0 bg-card">Total Operating Expenses</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                <TableRow className="font-bold border-t-2 border-foreground"><TableCell className="sticky left-0 bg-card">Operating Income (EBITDA)</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                <TableRow><TableCell className="sticky left-0 bg-card pl-8">Depreciation & Amortization</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                <TableRow className="font-semibold"><TableCell className="sticky left-0 bg-card">Earnings Before Interest & Tax (EBIT)</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                <TableRow><TableCell className="sticky left-0 bg-card pl-8">Interest Expense</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                <TableRow className="font-semibold"><TableCell className="sticky left-0 bg-card">Earnings Before Tax (EBT)</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                <TableRow><TableCell className="sticky left-0 bg-card pl-8">Income Tax Expense</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
                <TableRow className="font-bold text-lg border-y-2 border-foreground bg-primary/10"><TableCell className="sticky left-0 bg-primary/10">Net Income</TableCell>{renderTableRows(forecastMonths + yearlyTotalsColumns.length + 1)}</TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
