
'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { AlertTriangle, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SALES_ROADMAP_KEY = 'accountSalesRoadmap_v3';
const SETUP_KEY = 'accountFinancialSetup_v1';

const salesRoleGroups = [
    { role: 'Vendors' }, { role: 'Buyers' }, { role: 'Partners' }, { role: 'Associates' },
    { role: 'ISA Agents' }, { role: 'Drivers' }, { role: 'Developers' }
];

const memberProjectionLogic = (roadmapInputs: any, setupInputs: any) => {
    if (!roadmapInputs || !roadmapInputs.monthlyAssumptions || !setupInputs) {
        return { data: [], yearlyTotals: {}, grandTotal: {} };
    }

    const data = [];
    let cumulativeUsers = 0;
    let cumulativeMembers = 0;

    for (let i = 0; i < setupInputs.forecastMonths; i++) {
        const date = new Date(setupInputs.startYear, setupInputs.startMonth + i, 1);
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();

        let monthlyNewUsers = 0;
        let monthlyNewMembers = 0;
        
        salesRoleGroups.forEach(group => {
            const roleId = group.role.charAt(0).toLowerCase() + group.role.slice(1).replace(/\s/g, '');
            const referrals = roadmapInputs.monthlyAssumptions[`referrals${group.role.replace(/\s/g, '')}`]?.[i] || 0;
            const userConversion = (roadmapInputs.monthlyAssumptions[`conversionToUser${group.role.replace(/\s/g, '')}`]?.[i] || 0) / 100;
            const memberConversion = (roadmapInputs.monthlyAssumptions[`conversionToMember${group.role.replace(/\s/g, '')}`]?.[i] || 0) / 100;

            const newUsersFromRole = Math.round(referrals * userConversion);
            const newMembersFromRole = Math.round(newUsersFromRole * memberConversion);
            
            monthlyNewUsers += newUsersFromRole;
            monthlyNewMembers += newMembersFromRole;
        });
        
        cumulativeUsers += monthlyNewUsers;
        cumulativeMembers += monthlyNewMembers;

        data.push({
            month: `${month} ${year}`,
            year,
            newUsers: monthlyNewUsers,
            cumulativeUsers,
            newMembers: monthlyNewMembers,
            cumulativeMembers,
        });
    }

    // Calculate Totals
    const yearlyTotals: any = {};
    data.forEach(row => {
        if (!yearlyTotals[row.year]) {
            yearlyTotals[row.year] = { newUsers: 0, newMembers: 0, cumulativeUsers: 0, cumulativeMembers: 0 };
        }
        yearlyTotals[row.year].newUsers += row.newUsers;
        yearlyTotals[row.year].newMembers += row.newMembers;
        yearlyTotals[row.year].cumulativeUsers = row.cumulativeUsers; // Take the last value of the year
        yearlyTotals[row.year].cumulativeMembers = row.cumulativeMembers; // Take the last value of the year
    });

    const grandTotal = {
        newUsers: data.reduce((sum, row) => sum + row.newUsers, 0),
        newMembers: data.reduce((sum, row) => sum + row.newMembers, 0),
        cumulativeUsers: cumulativeUsers,
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
                <CardDescription>Month-by-month forecast of new users and paying members based on your sales roadmap assumptions.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px] sticky left-0 bg-background z-10">Month</TableHead>
                                <TableHead className="text-right">New Users</TableHead>
                                <TableHead className="text-right">Cumulative Users</TableHead>
                                <TableHead className="text-right font-bold text-primary">New Members</TableHead>
                                <TableHead className="text-right font-bold text-primary">Cumulative Members</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((row) => (
                                <React.Fragment key={row.month}>
                                    <TableRow>
                                        <TableCell className="sticky left-0 bg-background z-10">{row.month}</TableCell>
                                        <TableCell className="text-right">{row.newUsers.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">{row.cumulativeUsers.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-bold text-primary">{row.newMembers.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-bold text-primary">{row.cumulativeMembers.toLocaleString()}</TableCell>
                                    </TableRow>
                                </React.Fragment>
                            ))}
                             <TableRow className="bg-primary/10 font-extrabold text-base">
                                <TableCell className="sticky left-0 bg-primary/10 z-10">Grand Total</TableCell>
                                <TableCell className="text-right">{grandTotal.newUsers.toLocaleString()}</TableCell>
                                <TableCell className="text-right">{grandTotal.cumulativeUsers.toLocaleString()}</TableCell>
                                <TableCell className="text-right text-primary">{grandTotal.newMembers.toLocaleString()}</TableCell>
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
