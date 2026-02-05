
'use client';

import React, { useMemo, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { AlertTriangle, Users, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { salesRoadmapLogic } from '../lib/calculations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


// Helper to format numbers with commas
const formatNumber = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return '0';
    return value.toLocaleString();
};

function MemberProjectionComponent() {
    const { roadmapInputs, setupInputs } = useMemo(() => {
        if (typeof window === 'undefined') return { roadmapInputs: null, setupInputs: null };
        try {
            const salesRoadmapData = localStorage.getItem('accountSalesRoadmapScenarios_v1');
            const setupData = localStorage.getItem('accountFinancialSetup_v1');
            
            const activeScenarioName = salesRoadmapData ? JSON.parse(salesRoadmapData).activeScenario : 'Default';
            const scenarios = salesRoadmapData ? JSON.parse(salesRoadmapData).scenarios : null;

            return {
                roadmapInputs: scenarios ? scenarios[activeScenarioName] : null,
                setupInputs: setupData ? JSON.parse(setupData) : null,
            };
        } catch (e) {
            console.error("Failed to parse projection data", e);
            return { roadmapInputs: null, setupInputs: null };
        }
    }, []);

    const { powerPartnerProjection, isaProjection } = useMemo(() => {
        if (!roadmapInputs || !setupInputs) return { powerPartnerProjection: [], isaProjection: [], totalProjection: [] };
        return salesRoadmapLogic(setupInputs, roadmapInputs);
    }, [roadmapInputs, setupInputs]);
    
    // Totals Calculation for Power Partners
    const powerPartnerTotals = useMemo(() => {
        if (!powerPartnerProjection || powerPartnerProjection.length === 0) return null;
        return {
            newOpportunities: powerPartnerProjection.reduce((acc, p) => acc + p.newOpportunities, 0),
            newMembers: powerPartnerProjection.reduce((acc, p) => acc + p.newMembers, 0),
            cumulativeMembers: powerPartnerProjection[powerPartnerProjection.length - 1].cumulativeMembers,
        }
    }, [powerPartnerProjection]);

    // Totals Calculation for ISAs
    const isaTotals = useMemo(() => {
        if (!isaProjection || isaProjection.length === 0) return null;
        return {
            newReferrals: isaProjection.reduce((acc, p) => acc + p.newReferrals, 0),
            newMembers: isaProjection.reduce((acc, p) => acc + p.newMembers, 0),
            cumulativeMembers: isaProjection[isaProjection.length - 1].cumulativeMembers,
        }
    }, [isaProjection]);


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
                <CardContent className="text-center">
                    <Button asChild variant="outline">
                        <Link href="/adminaccount?view=sales-roadmap">Go to Sales Roadmap</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users /> Member Growth Projection</CardTitle>
                    <CardDescription>Month-by-month forecast of new paying members based on your sales roadmap assumptions.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <Tabs defaultValue="power-partners" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="power-partners">Power Partners</TabsTrigger>
                            <TabsTrigger value="isa-agents">ISA Agents</TabsTrigger>
                        </TabsList>
                        <TabsContent value="power-partners" className="mt-4">
                             <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="sticky left-0 bg-card z-10">Month</TableHead>
                                            <TableHead className="text-right"># Partners</TableHead>
                                            <TableHead className="text-right">Opps/Partner/Mo</TableHead>
                                            <TableHead className="text-right">New Opportunities</TableHead>
                                            <TableHead className="text-right">Cumulative Opps</TableHead>
                                            <TableHead className="text-right">Conversion %</TableHead>
                                            <TableHead className="text-right font-bold text-primary">New Members</TableHead>
                                            <TableHead className="text-right font-bold text-primary">Cumulative Members</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {powerPartnerProjection.map((row) => (
                                            <TableRow key={row.month}>
                                                <TableCell className="sticky left-0 bg-card z-10">{row.month}</TableCell>
                                                <TableCell className="text-right">{formatNumber(row.partners)}</TableCell>
                                                <TableCell className="text-right">{formatNumber(row.oppsPerPartner)}</TableCell>
                                                <TableCell className="text-right">{formatNumber(row.newOpportunities)}</TableCell>
                                                <TableCell className="text-right">{formatNumber(row.cumulativeOpportunities)}</TableCell>
                                                <TableCell className="text-right">{row.conversionRate.toFixed(2)}%</TableCell>
                                                <TableCell className="text-right font-bold text-primary">{formatNumber(row.newMembers)}</TableCell>
                                                <TableCell className="text-right font-bold text-primary">{formatNumber(row.cumulativeMembers)}</TableCell>
                                            </TableRow>
                                        ))}
                                         {powerPartnerTotals && (
                                            <TableRow className="bg-muted font-bold">
                                                <TableCell className="sticky left-0 bg-muted z-10">Total</TableCell>
                                                <TableCell colSpan={2}></TableCell>
                                                <TableCell className="text-right">{formatNumber(powerPartnerTotals.newOpportunities)}</TableCell>
                                                <TableCell></TableCell>
                                                <TableCell></TableCell>
                                                <TableCell className="text-right text-primary">{formatNumber(powerPartnerTotals.newMembers)}</TableCell>
                                                <TableCell className="text-right text-primary">{formatNumber(powerPartnerTotals.cumulativeMembers)}</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                        </TabsContent>
                         <TabsContent value="isa-agents" className="mt-4">
                             <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="sticky left-0 bg-card z-10">Month</TableHead>
                                            <TableHead className="text-right"># ISAs</TableHead>
                                            <TableHead className="text-right">Refs/ISA/Mo</TableHead>
                                            <TableHead className="text-right">New Referrals</TableHead>
                                            <TableHead className="text-right">Cumulative Refs</TableHead>
                                            <TableHead className="text-right">Conversion %</TableHead>
                                            <TableHead className="text-right font-bold text-primary">New Members</TableHead>
                                            <TableHead className="text-right font-bold text-primary">Cumulative Members</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isaProjection.map((row) => (
                                            <TableRow key={row.month}>
                                                <TableCell className="sticky left-0 bg-card z-10">{row.month}</TableCell>
                                                <TableCell className="text-right">{formatNumber(row.isas)}</TableCell>
                                                <TableCell className="text-right">{formatNumber(row.referralsPerIsa)}</TableCell>
                                                <TableCell className="text-right">{formatNumber(row.newReferrals)}</TableCell>
                                                <TableCell className="text-right">{formatNumber(row.cumulativeReferrals)}</TableCell>
                                                <TableCell className="text-right">{row.conversionRate.toFixed(2)}%</TableCell>
                                                <TableCell className="text-right font-bold text-primary">{formatNumber(row.newMembers)}</TableCell>
                                                <TableCell className="text-right font-bold text-primary">{formatNumber(row.cumulativeMembers)}</TableCell>
                                            </TableRow>
                                        ))}
                                         {isaTotals && (
                                            <TableRow className="bg-muted font-bold">
                                                <TableCell className="sticky left-0 bg-muted z-10">Total</TableCell>
                                                <TableCell colSpan={2}></TableCell>
                                                <TableCell className="text-right">{formatNumber(isaTotals.newReferrals)}</TableCell>
                                                <TableCell></TableCell>
                                                <TableCell></TableCell>
                                                <TableCell className="text-right text-primary">{formatNumber(isaTotals.newMembers)}</TableCell>
                                                <TableCell className="text-right text-primary">{formatNumber(isaTotals.cumulativeMembers)}</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

export default function MemberProjectionPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin" /></div>}>
            <MemberProjectionComponent />
        </Suspense>
    );
}
