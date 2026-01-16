
'use client';

import React, { useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, AlertTriangle, Loader2, DollarSign, Users } from 'lucide-react';
import { salesRoadmapLogic, budgetLogic } from './calculations';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'R 0';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(value);
};

const formatNumber = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return '0';
    return value.toLocaleString();
};

function ForecastContent() {
    const { salesInputs, budgetData, settings, targets } = useMemo(() => {
        if (typeof window === 'undefined') return { salesInputs: null, budgetData: null, settings: null, targets: null };
        try {
            const settingsString = localStorage.getItem('accountFinancialSetup_v1');
            const budgetString = localStorage.getItem('accountBudgetAssumptions_v2');
            const salesRoadmapString = localStorage.getItem('accountSalesRoadmapScenarios_v1');
            const targetsString = localStorage.getItem('accountFinancialTargets_v1');

            const settings = settingsString ? JSON.parse(settingsString) : null;
            const budget = budgetString ? JSON.parse(budgetString) : null;
            
            const salesRoadmapData = salesRoadmapString ? JSON.parse(salesRoadmapString) : null;
            const activeScenarioName = salesRoadmapData?.activeScenario || 'Default';
            const salesRoadmap = salesRoadmapData?.scenarios?.[activeScenarioName] || null;

            const targets = targetsString ? JSON.parse(targetsString) : null;

            if (!settings || !budget || !salesRoadmap || !targets) {
                return { salesInputs: null, budgetData: null, settings: null, targets: null };
            }

            return { 
                salesInputs: salesRoadmap,
                budgetData: budget, 
                settings,
                targets,
            };
        } catch (e) {
            console.error("Failed to parse forecast data:", e);
            return { salesInputs: null, budgetData: null, settings: null, targets: null };
        }
    }, []);
    
    const roadmapData = useMemo(() => {
        if (!salesInputs || !settings) return [];
        return salesRoadmapLogic(settings, salesInputs);
    }, [salesInputs, settings]);
    
    const forecastData = useMemo(() => {
        if (roadmapData.length === 0 || !budgetData || !targets) return [];
        return budgetLogic(roadmapData, budgetData, targets);
    }, [roadmapData, budgetData, targets]);

    const yearlyTotals = useMemo(() => {
        const totals: Record<string, any> = {};
        if (!forecastData || forecastData.length === 0) return totals;
        
        forecastData.forEach(row => {
            if (!totals[row.year]) {
                 totals[row.year] = {
                    members: 0,
                    membershipRevenue: 0, connectPlanRevenue: 0, mallRevenue: 0, techRevenue: 0, totalRevenue: 0,
                    memberCommission: 0, isaCommission: 0, totalCogs: 0,
                    grossProfit: 0,
                    opexSalaries: 0, digitalAdvertising: 0, contentCreation: 0, eventsAndSponsorships: 0,
                    officeRental: 0, utilities: 0, insurance: 0, legalAndProfessional: 0, bankCharges: 0,
                    telephone: 0, travelAndEntertainment: 0, platformCosts: 0, softwareLicenses: 0, totalOpex: 0,
                    netProfit: 0
                };
            }
            Object.keys(row).forEach(key => {
                if (key !== 'month' && key !== 'year' && key !== 'members') {
                     totals[row.year][key] += row[key];
                }
            });
            totals[row.year].members = row.members;
        });
        return totals;
    }, [forecastData]);
    
     const grandTotals = useMemo(() => {
        if (!forecastData || forecastData.length === 0) {
        return null;
        }
        const totals = {
            totalRevenue: 0,
            totalCogs: 0,
            totalOpex: 0,
            netProfit: 0,
            finalMemberCount: 0,
        };
        forecastData.forEach((row) => {
            totals.totalRevenue += row.totalRevenue;
            totals.totalCogs += row.totalCogs;
            totals.totalOpex += row.totalOpex;
            totals.netProfit += row.netProfit;
        });
        
        if (forecastData.length > 0) {
            totals.finalMemberCount = forecastData[forecastData.length - 1].members;
        }

        return totals;
    }, [forecastData]);

    const lineItems = [
        { key: 'members', label: 'Members', format: formatNumber, isHeader: true, isBold: true },
        { key: 'revenue', label: 'Revenue', isHeader: true },
        { key: 'membershipRevenue', label: 'Membership Revenue', format: formatCurrency, indent: 1 },
        { key: 'connectPlanRevenue', label: 'Connect Plan Revenue', format: formatCurrency, indent: 1 },
        { key: 'mallRevenue', label: 'Mall Commission Revenue', format: formatCurrency, indent: 1 },
        { key: 'techRevenue', label: 'Tech Services Revenue', format: formatCurrency, indent: 1 },
        { key: 'totalRevenue', label: 'Total Revenue', format: formatCurrency, isBold: true, isPrimary: true },
        { key: 'cogs', label: 'Cost of Goods Sold (COGS)', isHeader: true },
        { key: 'memberCommission', label: 'Member Commission Share', format: formatCurrency, indent: 1 },
        { key: 'isaCommission', label: 'ISA Commission', format: formatCurrency, indent: 1 },
        { key: 'totalCogs', label: 'Total COGS', format: formatCurrency, isBold: true },
        { key: 'grossProfit', label: 'Gross Profit', format: formatCurrency, isBold: true, isPrimary: true },
        { key: 'opex', label: 'Operating Expenses (OPEX)', isHeader: true },
        { key: 'opexSalaries', label: 'Salaries & Wages', format: formatCurrency, indent: 1 },
        { key: 'digitalAdvertising', label: 'Digital Advertising', format: formatCurrency, indent: 1 },
        { key: 'contentCreation', label: 'Content Creation & SEO', format: formatCurrency, indent: 1 },
        { key: 'eventsAndSponsorships', label: 'Events & Sponsorships', format: formatCurrency, indent: 1 },
        { key: 'officeRental', label: 'Office Rental', format: formatCurrency, indent: 1 },
        { key: 'utilities', label: 'Utilities', format: formatCurrency, indent: 1 },
        { key: 'insurance', label: 'Insurance', format: formatCurrency, indent: 1 },
        { key: 'legalAndProfessional', label: 'Legal & Professional Fees', format: formatCurrency, indent: 1 },
        { key: 'bankCharges', label: 'Bank Charges', format: formatCurrency, indent: 1 },
        { key: 'telephone', label: 'Telephone & Communications', format: formatCurrency, indent: 1 },
        { key: 'travelAndEntertainment', label: 'Travel & Entertainment', format: formatCurrency, indent: 1 },
        { key: 'platformCosts', label: 'Cloud Hosting & Infrastructure', format: formatCurrency, indent: 1 },
        { key: 'softwareLicenses', label: 'Software Licenses', format: formatCurrency, indent: 1 },
        { key: 'totalOpex', label: 'Total OPEX', format: formatCurrency, isBold: true },
        { key: 'netProfit', label: 'Net Profit', format: formatCurrency, isBold: true, isPrimary: true, isProfit: true },
    ];

    if (!settings || !salesInputs || !budgetData || !targets || forecastData.length === 0) {
        return (
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader className="text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                    <CardTitle>Incomplete Forecast Data</CardTitle>
                    <CardDescription>
                        It looks like you haven't entered all your forecast assumptions yet. Please complete the setup, targets, sales roadmap, and budget pages first.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-2">
                    <Button asChild>
                        <Link href="/adminaccount?view=financial-setup">Go to Set Up</Link>
                    </Button>
                     <Button asChild variant="outline">
                        <Link href="/adminaccount?view=targets">Go to Targets</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/adminaccount?view=sales-roadmap">Go to Sales Roadmap</Link>
                    </Button>
                     <Button asChild variant="outline">
                        <Link href="/adminaccount?view=budget">Go to Budget Page</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }
    
    const years = [...new Set(forecastData.map(d => d.year))];

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Forecast Summary</CardTitle>
                    <CardDescription>
                        A high-level summary of your financial forecast over the next {settings.forecastMonths} months.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!grandTotals ? (
                        <p>Calculating...</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                             <Card>
                                <CardHeader className="flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">{formatCurrency(grandTotals.totalRevenue)}</p>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">{formatCurrency(grandTotals.totalCogs + grandTotals.totalOpex)}</p>
                                    <p className="text-xs text-muted-foreground">COGS + OPEX</p>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <p className={`text-2xl font-bold ${grandTotals.netProfit < 0 ? 'text-destructive' : 'text-green-600'}`}>{formatCurrency(grandTotals.netProfit)}</p>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Ending Member Count</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">{formatNumber(grandTotals.finalMemberCount)}</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingUp /> Income Statement Forecast</CardTitle>
                <CardDescription>This is a forecast based on the assumptions from the budget page. All figures in ZAR.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="sticky left-0 bg-card z-10 w-[250px]">Line Item</TableHead>
                            {forecastData.map((col) => (
                            <TableHead key={col.month} className="text-right">{col.month}</TableHead>
                            ))}
                            {years.map(year => (
                                <TableHead key={`total-${year}`} className="text-right bg-primary/10 font-bold">Total {year}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {lineItems.map(item => (
                            <TableRow key={item.key} className={item.isHeader ? 'bg-muted/50' : ''}>
                                <TableCell className={`sticky left-0 bg-card z-10 ${item.isBold ? 'font-semibold' : ''} ${item.isPrimary ? 'text-primary' : ''} ${item.indent ? `pl-${item.indent * 4}` : ''}`}>
                                    {item.label}
                                </TableCell>
                                {forecastData.map(col => (
                                    <TableCell key={`${item.key}-${col.month}`} className={`text-right font-mono text-xs ${item.isProfit && col[item.key as keyof typeof col] < 0 ? 'text-destructive' : ''}`}>
                                        {item.format ? item.format(col[item.key as keyof typeof col]) : ''}
                                    </TableCell>
                                ))}
                                {years.map(year => (
                                    <TableCell key={`total-${item.key}-${year}`} className={`text-right bg-primary/10 font-bold font-mono text-sm ${item.isProfit && yearlyTotals[year]?.[item.key] < 0 ? 'text-destructive' : ''}`}>
                                         {item.format && yearlyTotals[year] ? item.format(yearlyTotals[year][item.key]) : ''}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            </Card>
        </div>
    );
}

export default function ForecastPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <ForecastContent />
        </Suspense>
    );
}
