'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp } from 'lucide-react';
import { salesRoadmapLogic, budgetLogic } from './calculations';

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', notation: 'compact', maximumFractionDigits: 0 }).format(value);
};

export default function ForecastPage() {
    
    // --- INPUTS ---
    // These would eventually be loaded from a saved state or form, but are hardcoded for now
    const salesInputs = {
        startMonth: new Date().getMonth(),
        startYear: new Date().getFullYear(),
        forecastMonths: 36,
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
    };

    const budgetInputs = {
        revenue: {
            membershipFees: 250, connectPlanAdoptionRate: 15, avgConnectPlanFee: 50,
            mallCommissionRate: 2.5, avgMallSpendPerMember: 1000, techServicesAdoptionRate: 10,
            avgTechSpendPerMember: 150
        },
        cogs: { memberCommissionShare: 50, isaCommissionRate: 20 },
        opexSalaries: [
            { role: 'Executive Directors', count: 2, salary: 150000 },
            { role: 'Non-Executive Directors', count: 3, salary: 25000 },
            { role: 'Developers', count: 4, salary: 80000 },
            { role: 'Sales & Marketing', count: 2, salary: 60000 },
            { role: 'Support Staff', count: 3, salary: 45000 },
        ],
        opexOther: {
            digitalAdvertising: 30000, contentCreation: 15000, eventsAndSponsorships: 10000,
            officeRental: 35000, utilities: 15000, insurance: 5000,
            legalAndProfessional: 10000, bankCharges: 2000, telephone: 8000,
            travelAndEntertainment: 5000, platformCosts: 20000, softwareLicenses: 10000
        }
    };
    
    // --- CALCULATIONS ---
    const roadmapData = salesRoadmapLogic(salesInputs);
    const forecastData = budgetLogic(roadmapData, budgetInputs);
    
     const yearlyTotals = useMemo(() => {
        const totals: Record<string, any> = {};
        forecastData.forEach(row => {
            if (!totals[row.year]) {
                totals[row.year] = {
                    revenue: 0, cogs: 0, grossProfit: 0, opex: 0, netProfit: 0
                };
            }
            totals[row.year].revenue += row.revenue;
            totals[row.year].cogs += row.cogs;
            totals[row.year].grossProfit += row.grossProfit;
            totals[row.year].opex += row.opex;
            totals[row.year].netProfit += row.netProfit;
        });
        return totals;
    }, [forecastData]);


    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp /> Financial Forecast</CardTitle>
                    <CardDescription>A projected income statement based on the Sales Roadmap and Budget assumptions.</CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="border rounded-lg overflow-x-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-muted">
                                <TableRow>
                                    <TableHead className="w-[100px]">Month</TableHead>
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
                                    const showYearTotal = forecastData.findIndex(r => r.year === row.year) === forecastData.findLastIndex(r => r.year === row.year);
                                    const totalRow = yearlyTotals[row.year];
                                    
                                    return (
                                        <>
                                            <TableRow key={index}>
                                                <TableCell>{row.month}</TableCell>
                                                <TableCell className="text-right font-mono text-xs">{row.members.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(row.revenue)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(row.cogs)}</TableCell>
                                                <TableCell className="text-right font-semibold">{formatCurrency(row.grossProfit)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(row.opex)}</TableCell>
                                                <TableCell className={`text-right font-bold ${row.netProfit < 0 ? 'text-destructive' : 'text-green-600'}`}>
                                                    {formatCurrency(row.netProfit)}
                                                </TableCell>
                                            </TableRow>
                                            {showYearTotal && (
                                                <TableRow className="bg-primary/10 font-bold">
                                                    <TableCell>Total {row.year}</TableCell>
                                                    <TableCell className="text-right font-mono text-xs">{row.members.toLocaleString()}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(totalRow.revenue)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(totalRow.cogs)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(totalRow.grossProfit)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(totalRow.opex)}</TableCell>
                                                    <TableCell className={`text-right ${totalRow.netProfit < 0 ? 'text-destructive' : 'text-green-700'}`}>
                                                        {formatCurrency(totalRow.netProfit)}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
