
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
        return { total: [], byRole: {} };
    }

    const monthlyAssumptions = roadmapInputs.monthlyAssumptions;
    const { forecastMonths, startYear, startMonth } = setupInputs;

    let byRoleProjections: { [key: string]: any[] } = {};
    let cumulativeTotal = 0;

    const powerPartnerNewMembersPerMonth = Math.round(
        (Number(monthlyAssumptions.numberOfPowerPartners?.[0]) || 0) *
        (Number(monthlyAssumptions.opportunitiesPerPartner?.[0]) || 0) *
        ((Number(monthlyAssumptions.powerPartnerConversion?.[0]) || 0) / 100)
    );

    memberRoleGroups.forEach(group => {
        const roleKey = group.role;
        byRoleProjections[roleKey] = [];
        const roleKeySanitized = roleKey.replace(/\s/g, '');
        const initialMembers = Number(monthlyAssumptions[`initialMembers${roleKeySanitized}`]) || 0;
        
        let cumulativeForRole = initialMembers;
        for (let i = 0; i < forecastMonths; i++) {
            const date = new Date(startYear, startMonth + i, 1);
            const month = monthNames[date.getMonth()];
            const year = date.getFullYear();

            const referralsPerMember = Number(monthlyAssumptions[`referralsPerMember${roleKeySanitized}`]?.[i]) || 0;
            const conversionToMember = (Number(monthlyAssumptions[`conversionToMember${roleKeySanitized}`]?.[i]) || 0) / 100;
            
            const newMembersThisMonth = Math.round(cumulativeForRole * referralsPerMember * conversionToMember);
            cumulativeForRole += newMembersThisMonth;

            byRoleProjections[roleKey].push({
                month: `${month} ${year}`,
                newMembers: newMembersThisMonth,
                cumulativeMembers: cumulativeForRole,
            });
        }
    });

    let totalProjection: any[] = [];
    const initialTotalMembers = memberRoleGroups.reduce((acc, group) => {
        const roleKey = group.role;
        return acc + (Number(monthlyAssumptions[`initialMembers${roleKey.replace(/\s/g, '')}`]) || 0);
    }, 0);
    
    cumulativeTotal = initialTotalMembers;

    for (let i = 0; i < forecastMonths; i++) {
        const date = new Date(startYear, startMonth + i, 1);
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();

        let newMembersFromRoles = 0;
        memberRoleGroups.forEach(group => {
            const roleKey = group.role;
            const roleKeySanitized = roleKey.replace(/\s/g, '');
            const referralsPerMember = Number(monthlyAssumptions[`referralsPerMember${roleKeySanitized}`]?.[i]) || 0;
            const conversionToMember = (Number(monthlyAssumptions[`conversionToMember${roleKeySanitized}`]?.[i]) || 0) / 100;
            const cumulativeForRole = i > 0 ? byRoleProjections[roleKey][i - 1].cumulativeMembers : (Number(monthlyAssumptions[`initialMembers${roleKeySanitized}`]) || 0);
            
            newMembersFromRoles += Math.round(cumulativeForRole * referralsPerMember * conversionToMember);
        });

        const totalNewThisMonth = newMembersFromRoles + powerPartnerNewMembersPerMonth;
        cumulativeTotal += totalNewThisMonth;
        
        totalProjection.push({
            month: `${month} ${year}`,
            year,
            powerPartnerNewMembers: powerPartnerNewMembersPerMonth,
            referralNewMembers: newMembersFromRoles,
            totalNewMembers: totalNewThisMonth,
            cumulativeMembers: cumulativeTotal,
        });
    }

    return { total: totalProjection, byRole: byRoleProjections };
};


function ProjectionTable({ title, data }: { title: string; data: any[] }) {
    if (!data || data.length === 0) {
        return null;
    }
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users /> {title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px] sticky left-0 bg-background z-10">Month</TableHead>
                                <TableHead className="text-right">New Members</TableHead>
                                <TableHead className="text-right font-bold text-primary">Cumulative Members</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((row) => (
                                <TableRow key={row.month}>
                                    <TableCell className="sticky left-0 bg-background z-10">{row.month}</TableCell>
                                    <TableCell className="text-right">{row.newMembers.toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-bold text-primary">{row.cumulativeMembers.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

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

    const { total, byRole } = useMemo(() => {
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
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users /> Total Member Growth Projection</CardTitle>
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
                                {total.map((row) => (
                                    <TableRow key={row.month}>
                                        <TableCell className="sticky left-0 bg-background z-10">{row.month}</TableCell>
                                        <TableCell className="text-right">{row.powerPartnerNewMembers.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">{row.referralNewMembers.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-bold text-primary">{row.totalNewMembers.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-bold text-primary">{row.cumulativeMembers.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </CardContent>
            </Card>

            <div className="space-y-8">
                {Object.entries(byRole).map(([roleName, data]) => (
                    <ProjectionTable key={roleName} title={`${roleName} Growth Projection`} data={data} />
                ))}
            </div>
        </div>
    );
}
