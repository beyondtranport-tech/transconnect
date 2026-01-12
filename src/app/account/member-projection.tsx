
'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { AlertTriangle, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SALES_ROADMAP_KEY = 'accountSalesRoadmap_v5';
const SETUP_KEY = 'accountFinancialSetup_v1';

const memberRoleGroups = [
    { role: 'Vendors' }, { role: 'Buyers' }, { role: 'Associates' },
    { role: 'ISA Agents' }, { role: 'Drivers' }, { role: 'Developers' }
];

const memberProjectionLogic = (roadmapInputs: any, setupInputs: any) => {
    if (!roadmapInputs || !roadmapInputs.monthlyAssumptions || !setupInputs) {
        return { data: [], yearlyTotals: {}, grandTotal: {} };
    }

    const data = [];
    const monthlyAssumptions = roadmapInputs.monthlyAssumptions;
    
    // Calculate total initial members from roles that have it
    let cumulativeMembers = memberRoleGroups.reduce((sum, group) => {
        const roleId = `initialMembers${group.role.replace(/\s/g, '')}`;
        return sum + (monthlyAssumptions[roleId]?.[0] || 0);
    }, 0);

    for (let i = 0; i < setupInputs.forecastMonths; i++) {
        const date = new Date(setupInputs.startYear, setupInputs.startMonth + i, 1);
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();

        // 1. Calculate new members from Power Partners (linear growth)
        const powerPartners = monthlyAssumptions.numberOfPowerPartners?.[i] || 0;
        const oppsPerPartner = monthlyAssumptions.opportunitiesPerPartner?.[i] || 0;
        const powerPartnerConversion = (monthlyAssumptions.powerPartnerConversion?.[i] || 0) / 100;
        const powerPartnerNewMembers = Math.round(powerPartners * oppsPerPartner * powerPartnerConversion);

        // 2. Calculate new members from existing member referrals (exponential growth)
        let totalReferralsPerMember = 0;
        let totalConversionRate = 0;
        let activeRoles = 0;
        memberRoleGroups.forEach(group => {
            const roleName = group.role.replace(/\s/g, '');
            const referrals = monthlyAssumptions[`referralsPerMember${roleName}`]?.[i];
            const conversion = monthlyAssumptions[`conversionToMember${roleName}`]?.[i];

            if (typeof referrals === 'number' && typeof conversion === 'number') {
                totalReferralsPerMember += referrals;
                totalConversionRate += conversion;
                activeRoles++;
            }
        });

        const avgReferralsPerMember = activeRoles > 0 ? totalReferralsPerMember / activeRoles : 0;
        const avgConversionRate = activeRoles > 0 ? (totalConversionRate / activeRoles) / 100 : 0;
        
        const referralNewMembers = Math.round(cumulativeMembers * avgReferralsPerMember * avgConversionRate);
        
        // 3. Sum them up
        const totalNewMembers = powerPartnerNewMembers + referralNewMembers;

        cumulativeMembers += totalNewMembers;

        data.push({
            month: `${month} ${year}`,
            year,
            powerPartnerNewMembers,
            referralNewMembers,
            totalNewMembers,
            cumulativeMembers,
        });
    }

    // Calculate Totals
    const yearlyTotals: any = {};
    data.forEach(row => {
        if (!yearlyTotals[row.year]) {
            yearlyTotals[row.year] = { powerPartnerNewMembers: 0, referralNewMembers: 0, totalNewMembers: 0, cumulativeMembers: 0 };
        }
        yearlyTotals[row.year].powerPartnerNewMembers += row.powerPartnerNewMembers;
        yearlyTotals[row.year].referralNewMembers += row.referralNewMembers;
        yearlyTotals[row.year].totalNewMembers += row.totalNewMembers;
        yearlyTotals[row.year].cumulativeMembers = row.cumulativeMembers; // Take the last value of the year
    });

    const grandTotal = {
        powerPartnerNewMembers: data.reduce((sum, row) => sum + row.powerPartnerNewMembers, 0),
        referralNewMembers: data.reduce((sum, row) => sum + row.referralNewMembers, 0),
        totalNewMembers: data.reduce((sum, row) => sum + row.totalNewMembers, 0),
        cumulativeMembers: cumulativeMembers,
    };
    
    return { data, yearlyTotals, grandTotal };
};


export default function MemberProjection() {
    const { roadmapInputs, setupInputs } = useMemo(() => {
        if (typeof window === 'undefined') return { roadmapInputs: null, setupInputs: null };
        try {
            const roadmapData = localStorage.getItem(SALES_ROADMAP_KEY);
            const setupData = localStorage.getItem(SETUP_KEY);
            return {
                roadmapInputs: roadmapData ? JSON.parse(roadmapData) : null,
                setupInputs: setupData ? JSON.parse(setupData) : null,
            };
        } catch (e) {
            console.error("Failed to parse projection data", e);
            return { roadmapInputs: null, setupInputs: null };
        }
    }, []);

    const { data, yearlyTotals, grandTotal } = useMemo(() => {
        return memberProjectionLogic(roadmapInputs, setupInputs);
    }, [roadmapInputs, setupInputs]);
    
    if (!roadmapInputs || !setupInputs) {
        return (
             <Card className="w-full max-w-2xl mx-auto">
                <CardHeader className="text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                    <CardTitle>Incomplete Projection Data</CardTitle>
                    <CardDescription>
                        Please complete the "Set Up" and "Sales Roadmap" pages in the Financials section first.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-2">
                    <Button asChild>
                        <Link href="/account?view=financial-setup">Go to Set Up</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/account?view=sales-roadmap">Go to Sales Roadmap</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users /> Member Growth Projection</CardTitle>
                <CardDescription>Month-by-month forecast of new paying members based on your sales roadmap assumptions.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px] sticky left-0 bg-background z-10">Month</TableHead>
                                <TableHead className="text-right">New Members (Partners)</TableHead>
                                <TableHead className="text-right">New Members (Referrals)</TableHead>
                                <TableHead className="text-right font-bold text-primary">Total New Members</TableHead>
                                <TableHead className="text-right font-bold text-primary">Cumulative Members</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((row) => (
                                <React.Fragment key={row.month}>
                                    <TableRow>
                                        <TableCell className="sticky left-0 bg-background z-10">{row.month}</TableCell>
                                        <TableCell className="text-right">{row.powerPartnerNewMembers.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">{row.referralNewMembers.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-bold text-primary">{row.totalNewMembers.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-bold text-primary">{row.cumulativeMembers.toLocaleString()}</TableCell>
                                    </TableRow>
                                </React.Fragment>
                            ))}
                             <TableRow className="bg-primary/10 font-extrabold text-base">
                                <TableCell className="sticky left-0 bg-primary/10 z-10">Grand Total</TableCell>
                                <TableCell className="text-right text-primary">{grandTotal.powerPartnerNewMembers.toLocaleString()}</TableCell>
                                <TableCell className="text-right text-primary">{grandTotal.referralNewMembers.toLocaleString()}</TableCell>
                                <TableCell className="text-right text-primary">{grandTotal.totalNewMembers.toLocaleString()}</TableCell>
                                <TableCell className="text-right text-primary">{grandTotal.cumulativeMembers.toLocaleString()}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

