
'use client';

import React, { useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SALES_ROADMAP_KEY = 'backendSalesRoadmap_v1';

const memberProjectionLogic = (inputs: any) => {
    const data = [];
    let cumulativeMembers = 0;
    const totalPowerPartnerProspects = inputs.numberOfPowerPartners * inputs.opportunitiesPerPartner;
    const totalInitialProspects = inputs.initialTransporters + inputs.initialSuppliers + totalPowerPartnerProspects;

    const monthlyProspectsReached = Math.floor(totalInitialProspects / inputs.forecastMonths);

    for (let i = 0; i < inputs.forecastMonths; i++) {
        const date = new Date(inputs.startYear, inputs.startMonth + i, 1);
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        
        const currentCampaignConversionRate = i < inputs.campaignDuration ? inputs.campaignConversionRate / 100 : 0;
        const campaignNewMembers = Math.floor(monthlyProspectsReached * currentCampaignConversionRate);

        let networkNewMembers = 0;
        if (i >= inputs.customerConversionLag) {
            const membersAtLag = data[i - inputs.customerConversionLag]?.cumulativeMembers || 0;
            const potentialNetworkPool = membersAtLag * inputs.avgCustomersPerMember;
            networkNewMembers = Math.floor(potentialNetworkPool * (inputs.customerConversionRate / 100) / 12);
        }
        
        const isaNewMembers = Math.floor(inputs.numberOfIsas * inputs.referralsPerIsa * (inputs.isaConversionRate / 100));

        const totalNewMembers = campaignNewMembers + networkNewMembers + isaNewMembers;
        cumulativeMembers += totalNewMembers;

        data.push({
            month: `${month} ${year}`,
            year,
            campaignNewMembers,
            networkNewMembers,
            isaNewMembers,
            totalNewMembers,
            cumulativeMembers,
        });
    }
    return data;
};

export default function MemberProjection() {
    const inputs = useMemo(() => {
        if (typeof window === 'undefined') return null;
        try {
            const savedData = localStorage.getItem(SALES_ROADMAP_KEY);
            return savedData ? JSON.parse(savedData) : null;
        } catch (e) {
            console.error("Failed to parse sales roadmap data", e);
            return null;
        }
    }, []);

    const roadmapData = useMemo(() => {
        if (!inputs) return [];
        return memberProjectionLogic(inputs);
    }, [inputs]);

    const yearlyTotals = useMemo(() => {
        const totals: { [year: number]: { campaign: number, network: number, isa: number, total: number } } = {};
        roadmapData.forEach(row => {
            if (!totals[row.year]) {
                totals[row.year] = { campaign: 0, network: 0, isa: 0, total: 0 };
            }
            totals[row.year].campaign += row.campaignNewMembers;
            totals[row.year].network += row.networkNewMembers;
            totals[row.year].isa += row.isaNewMembers;
            totals[row.year].total += row.totalNewMembers;
        });
        return totals;
    }, [roadmapData]);
    
    if (!inputs) {
        return (
             <Card className="w-full max-w-2xl mx-auto">
                <CardHeader className="text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                    <CardTitle>No Sales Data Found</CardTitle>
                    <CardDescription>
                        Please go to the Sales Roadmap page to enter your growth assumptions first.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <Button asChild>
                        <Link href="/backend?view=sales-roadmap">Go to Sales Roadmap</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Member Growth Projections</CardTitle>
                <CardDescription>Month-by-month forecast of new and cumulative members based on your sales roadmap assumptions.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                    <Table>
                        <TableHeader className="sticky top-0 bg-muted">
                            <TableRow>
                                <TableHead className="w-[120px]">Month</TableHead>
                                <TableHead className="text-right">Database Signups</TableHead>
                                <TableHead className="text-right">ISA Signups</TableHead>
                                <TableHead className="text-right">Network Signups</TableHead>
                                <TableHead className="text-right">Total New</TableHead>
                                <TableHead className="text-right">Cumulative Members</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roadmapData.map((row) => {
                                const showYearTotal = roadmapData.findIndex(r => r.year === row.year) === roadmapData.findLastIndex(r => r.year === row.year);
                                const totalRow = yearlyTotals[row.year];
                                return (
                                    <React.Fragment key={row.month}>
                                        <TableRow>
                                            <TableCell>{row.month}</TableCell>
                                            <TableCell className="text-right">{row.campaignNewMembers.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">{row.isaNewMembers.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">{row.networkNewMembers.toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-semibold">{row.totalNewMembers.toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-bold text-primary">{row.cumulativeMembers.toLocaleString()}</TableCell>
                                        </TableRow>
                                        {showYearTotal && (
                                            <TableRow className="bg-primary/10 font-bold">
                                                <TableCell>Total {row.year}</TableCell>
                                                <TableCell className="text-right">{totalRow.campaign.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">{totalRow.isa.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">{totalRow.network.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">{totalRow.total.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">{row.cumulativeMembers.toLocaleString()}</TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                )
                            })}
                        </TableBody>
                    </Table>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
