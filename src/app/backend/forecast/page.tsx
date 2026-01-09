'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp } from 'lucide-react';
import { salesRoadmapLogic, budgetLogic } from './calculations';

const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return 'R 0';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', notation: 'compact', maximumFractionDigits: 0 }).format(value);
};

const formatNumber = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return '0';
    return value.toLocaleString();
};

const lineItems = [
    { key: 'members', label: 'Members', format: formatNumber, isHeader: true, isBold: true },
    // Revenue
    { key: 'revenue', label: 'Revenue', isHeader: true },
    { key: 'membershipRevenue', label: 'Membership Revenue', format: formatCurrency, indent: 1 },
    { key: 'connectPlanRevenue', label: 'Connect Plan Revenue', format: formatCurrency, indent: 1 },
    { key: 'mallRevenue', label: 'Mall Commission Revenue', format: formatCurrency, indent: 1 },
    { key: 'techRevenue', label: 'Tech Services Revenue', format: formatCurrency, indent: 1 },
    { key: 'totalRevenue', label: 'Total Revenue', format: formatCurrency, isBold: true, isPrimary: true },
    // COGS
    { key: 'cogs', label: 'Cost of Goods Sold (COGS)', isHeader: true },
    { key: 'memberCommission', label: 'Member Commission Share', format: formatCurrency, indent: 1 },
    { key: 'isaCommission', label: 'ISA Commission', format: formatCurrency, indent: 1 },
    { key: 'totalCogs', label: 'Total COGS', format: formatCurrency, isBold: true },
    // Gross Profit
    { key: 'grossProfit', label: 'Gross Profit', format: formatCurrency, isBold: true, isPrimary: true },
    // OPEX
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
    // Net Profit
    { key: 'netProfit', label: 'Net Profit', format: formatCurrency, isBold: true, isPrimary: true, isProfit: true },
];

export default function ForecastPage() {
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
    };
    
    const roadmapData = useMemo(() => salesRoadmapLogic(salesInputs), [salesInputs]);
    const forecastData = useMemo(() => budgetLogic(roadmapData, budgetInputs), [roadmapData, budgetInputs]);

    const financialYears = useMemo(() => {
        const years = [];
        for (let i = 0; i < forecastData.length; i += 12) {
            const yearData = forecastData.slice(i, i + 12);
            if (yearData.length === 0) continue;
            
            const total = yearData.reduce((acc, month) => {
                Object.keys(month).forEach(key => {
                    if (key !== 'month' && key !== 'year' && key !== 'members') {
                        acc[key] = (acc[key] || 0) + month[key as keyof typeof month];
                    }
                });
                return acc;
            }, {} as any);
            total.members = yearData[yearData.length - 1].members;

            years.push({
                yearLabel: `Year ${Math.floor(i / 12) + 1}`,
                months: yearData,
                total: total
            });
        }
        return years;
    }, [forecastData]);

    const grandTotal = useMemo(() => {
        if (!forecastData || forecastData.length === 0) return null;
        
        const total = forecastData.reduce((acc, row) => {
            for (const key in row) {
                if (key !== 'month' && key !== 'year') {
                    if (key !== 'members') {
                         (acc as any)[key] = ((acc as any)[key] || 0) + (row as any)[key];
                    } else {
                        (acc as any)[key] = (row as any)[key]; // Keep last member count
                    }
                }
            }
            return acc;
        }, {} as any);

        return total;

    }, [forecastData]);

    return (
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
                        <TableHead className="text-right bg-primary/20 font-extrabold">Grand Total</TableHead>
                        {financialYears.map((fy) => (
                           <React.Fragment key={fy.yearLabel}>
                               <TableHead className="text-right bg-primary/10 font-bold">{fy.yearLabel} Total</TableHead>
                               {fy.months.map(col => (
                                   <TableHead key={col.month} className="text-right">{col.month}</TableHead>
                               ))}
                           </React.Fragment> 
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {lineItems.map(item => (
                        <TableRow key={item.key} className={item.isHeader ? 'bg-muted/50' : ''}>
                            {/* Line Item Label */}
                            <TableCell className={`sticky left-0 bg-card z-10 ${item.isBold ? 'font-semibold' : ''} ${item.isPrimary ? 'text-primary' : ''} ${item.indent ? `pl-${item.indent * 4}` : ''}`}>
                                {item.label}
                            </TableCell>

                            {/* Grand Total Column */}
                             <TableCell className={`text-right bg-primary/20 font-extrabold font-mono text-base ${item.isProfit && grandTotal?.[item.key] < 0 ? 'text-destructive' : ''}`}>
                                 {item.format && grandTotal ? item.format(grandTotal[item.key]) : ''}
                            </TableCell>

                            {financialYears.map((fy) => (
                                <React.Fragment key={`${fy.yearLabel}-${item.key}`}>
                                    {/* Year Total Column */}
                                    <TableCell className={`text-right bg-primary/10 font-bold font-mono text-sm ${item.isProfit && fy.total[item.key] < 0 ? 'text-destructive' : ''}`}>
                                         {item.format ? item.format(fy.total[item.key]) : ''}
                                    </TableCell>
                                    {/* Monthly Columns for that year */}
                                    {fy.months.map(col => (
                                        <TableCell key={`monthly-cell-${item.key}-${col.month}`} className={`text-right font-mono text-xs ${item.isProfit && col[item.key as keyof typeof col] < 0 ? 'text-destructive' : ''}`}>
                                            {item.format ? item.format(col[item.key as keyof typeof col]) : ''}
                                        </TableCell>
                                    ))}
                                </React.Fragment>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
    );
}
