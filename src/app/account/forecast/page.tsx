'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, TrendingUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { salesRoadmapLogic, budgetLogic } from './calculations';

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', notation: 'compact', maximumFractionDigits: 0 }).format(value);
};

export default function ForecastPage() {
    const { toast } = useToast();
    
    // --- STATE FOR INPUTS ---
    const [startMonth, setStartMonth] = useState(new Date().getMonth());
    const [startYear, setStartYear] = useState(new Date().getFullYear());
    const [forecastMonths, setForecastMonths] = useState(36);

    const [membershipFees, setMembershipFees] = useState({ basic: 100, standard: 250, premium: 500 });
    
    const [staffAssumptions, setStaffAssumptions] = useState({
        execDirector: { count: 1, salary: 150000 },
        nonExecDirector: { count: 2, salary: 25000 },
        manager: { count: 3, salary: 75000 },
        admin: { count: 4, salary: 35000 },
    });

    const handleMembershipFeeChange = (plan: 'basic' | 'standard' | 'premium', value: string) => {
        setMembershipFees(prev => ({ ...prev, [plan]: Number(value) || 0 }));
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

    // --- DYNAMIC INPUTS FOR CALCULATIONS ---
    const salesInputs = useMemo(() => ({
        startMonth,
        startYear,
        forecastMonths,
        // Hardcoded values from the previous version, can be replaced with state if needed
        initialTransporters: 1000,
        initialSuppliers: 500,
        numberOfPowerPartners: 5,
        opportunitiesPerPartner: 2000,
        campaignConversionRate: 5,
        campaignDuration: 6,
        avgCustomersPerMember: 10,
        customerConversionRate: 2,
        customerConversionLag: 3,
        numberOfIsas: 10,
        referralsPerIsa: 50,
        isaConversionRate: 10,
    }), [startMonth, startYear, forecastMonths]);
    
    const budgetInputs = useMemo(() => ({
        revenue: {
            membershipFees: (membershipFees.basic + membershipFees.standard + membershipFees.premium) / 3, // Average fee
            connectPlanAdoptionRate: 15, 
            avgConnectPlanFee: 50,
            mallCommissionRate: 2.5, 
            avgMallSpendPerMember: 1000, 
            techServicesAdoptionRate: 10,
            avgTechSpendPerMember: 150
        },
        cogs: { memberCommissionShare: 50, isaCommissionRate: 20 },
        opexSalaries: Object.values(staffAssumptions),
        opexOther: {
            digitalAdvertising: 30000, contentCreation: 15000, eventsAndSponsorships: 10000,
            officeRental: 35000, utilities: 15000, insurance: 5000,
            legalAndProfessional: 10000, bankCharges: 2000, telephone: 8000,
            travelAndEntertainment: 5000, platformCosts: 20000, softwareLicenses: 10000
        }
    }), [staffAssumptions, membershipFees]);
    
    // --- CALCULATIONS ---
    const roadmapData = useMemo(() => salesRoadmapLogic(salesInputs), [salesInputs]);
    const forecastData = useMemo(() => budgetLogic(roadmapData, budgetInputs), [roadmapData, budgetInputs]);
    
    const yearlyTotals = useMemo(() => {
        const totals: Record<string, any> = {};
        forecastData.forEach(row => {
            if (!totals[row.year]) {
                totals[row.year] = {
                    revenue: 0, cogs: 0, grossProfit: 0, opex: 0, netProfit: 0, members: 0
                };
            }
            totals[row.year].revenue += row.revenue;
            totals[row.year].cogs += row.cogs;
            totals[row.year].grossProfit += row.grossProfit;
            totals[row.year].opex += row.opex;
            totals[row.year].netProfit += row.netProfit;
            totals[row.year].members = row.members; // Store last member count for the year
        });
        return totals;
    }, [forecastData]);

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
                        <TableHead className="sticky left-0 bg-card w-[100px]">Month</TableHead>
                        <TableHead className="text-right">Members</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">COGS</TableHead>
                        <TableHead className="text-right text-primary font-semibold">Gross Profit</TableHead>
                        <TableHead className="text-right">OPEX</TableHead>
                        <TableHead className="text-right text-primary font-bold">Net Profit</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {forecastData.map((row, index) => {
                        const showYearTotal = roadmapData.findIndex(r => r.year === row.year) === roadmapData.findLastIndex(r => r.year === row.year);
                        const totalRow = yearlyTotals[row.year];
                        
                        return (
                            <React.Fragment key={index}>
                                <TableRow>
                                    <TableCell className="sticky left-0 bg-card">{row.month}</TableCell>
                                    <TableCell className="text-right font-mono text-xs">{row.members.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(row.revenue)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(row.cogs)}</TableCell>
                                    <TableCell className="text-right font-semibold">{formatCurrency(row.grossProfit)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(row.opex)}</TableCell>
                                    <TableCell className={`text-right font-bold ${row.netProfit < 0 ? 'text-destructive' : 'text-green-600'}`}>
                                        {formatCurrency(row.netProfit)}
                                    </TableCell>
                                </TableRow>
                                {showYearTotal && totalRow && (
                                    <TableRow className="bg-primary/10 font-bold">
                                        <TableCell className="sticky left-0 bg-primary/10">Total {row.year}</TableCell>
                                        <TableCell className="text-right font-mono text-xs">{totalRow.members.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(totalRow.revenue)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(totalRow.cogs)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(totalRow.grossProfit)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(totalRow.opex)}</TableCell>
                                        <TableCell className={`text-right ${totalRow.netProfit < 0 ? 'text-destructive' : 'text-green-700'}`}>
                                            {formatCurrency(totalRow.netProfit)}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        )
                    })}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
