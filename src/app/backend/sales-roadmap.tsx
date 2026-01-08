
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Map, Users, Building, Handshake } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React from 'react';

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function SalesRoadmap() {
    // --- INPUTS ---
    const [startMonth, setStartMonth] = useState(new Date().getMonth());
    const [startYear, setStartYear] = useState(new Date().getFullYear());
    const [forecastMonths, setForecastMonths] = useState(36);
    
    const [initialTransporters, setInitialTransporters] = useState(1000);
    const [initialSuppliers, setInitialSuppliers] = useState(500);

    const [numberOfPowerPartners, setNumberOfPowerPartners] = useState(5);
    const [opportunitiesPerPartner, setOpportunitiesPerPartner] = useState(2000);

    const [campaignConversionRate, setCampaignConversionRate] = useState(5); // in percent
    const [campaignDuration, setCampaignDuration] = useState(6); // in months

    const [avgCustomersPerMember, setAvgCustomersPerMember] = useState(10);
    const [customerConversionRate, setCustomerConversionRate] = useState(2); // in percent
    const [customerConversionLag, setCustomerConversionLag] = useState(3); // in months

    // --- CALCULATIONS ---
    const roadmapData = useMemo(() => {
        const data = [];
        let cumulativeMembers = 0;
        const totalPowerPartnerProspects = numberOfPowerPartners * opportunitiesPerPartner;
        let remainingProspects = initialTransporters + initialSuppliers + totalPowerPartnerProspects;

        const campaignMonthlyConversion = Math.floor(remainingProspects / campaignDuration);

        for (let i = 0; i < forecastMonths; i++) {
            const date = new Date(startYear, startMonth + i, 1);
            const month = monthNames[date.getMonth()];
            const year = date.getFullYear();
            
            // 1. New members from initial database campaigns (including power partners)
            const campaignNewMembers = i < campaignDuration ? Math.floor(campaignMonthlyConversion * (campaignConversionRate / 100)) : 0;
            remainingProspects -= i < campaignDuration ? campaignMonthlyConversion : 0;

            // 2. New members from network effect (customers of existing members)
            let networkNewMembers = 0;
            if (i >= customerConversionLag) {
                const membersAtLag = data[i - customerConversionLag]?.cumulativeMembers || 0;
                const potentialNetworkPool = membersAtLag * avgCustomersPerMember;
                networkNewMembers = Math.floor(potentialNetworkPool * (customerConversionRate / 100) / 12); // monthly conversion
            }
            
            const totalNewMembers = campaignNewMembers + networkNewMembers;
            cumulativeMembers += totalNewMembers;

            data.push({
                month: `${month} ${year}`,
                year,
                campaignNewMembers,
                networkNewMembers,
                totalNewMembers,
                cumulativeMembers,
            });
        }
        return data;
    }, [
        startMonth, startYear, forecastMonths, initialTransporters, initialSuppliers,
        numberOfPowerPartners, opportunitiesPerPartner,
        campaignConversionRate, campaignDuration, avgCustomersPerMember,
        customerConversionRate, customerConversionLag
    ]);
    
    const yearlyTotals = useMemo(() => {
        const totals: { [year: number]: { campaign: number, network: number, total: number } } = {};
        roadmapData.forEach(row => {
            if (!totals[row.year]) {
                totals[row.year] = { campaign: 0, network: 0, total: 0 };
            }
            totals[row.year].campaign += row.campaignNewMembers;
            totals[row.year].network += row.networkNewMembers;
            totals[row.year].total += row.totalNewMembers;
        });
        return totals;
    }, [roadmapData]);

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Map /> Sales Roadmap & Forecast</CardTitle>
                    <CardDescription>Model your membership growth over time based on campaigns and network effects.</CardDescription>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* --- INPUTS COLUMN --- */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Building /> 1. Initial Databases</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label># of Transport Companies</Label>
                                <Input type="number" value={initialTransporters} onChange={e => setInitialTransporters(Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label># of Suppliers</Label>
                                <Input type="number" value={initialSuppliers} onChange={e => setInitialSuppliers(Number(e.target.value))} />
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Handshake /> 2. Power Partners</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <Label># of Power Partners</Label>
                                <Input type="number" value={numberOfPowerPartners} onChange={e => setNumberOfPowerPartners(Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Opportunities per Partner ({opportunitiesPerPartner.toLocaleString()})</Label>
                                <Slider value={[opportunitiesPerPartner]} onValueChange={v => setOpportunitiesPerPartner(v[0])} max={10000} step={250} min={2000} />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>3. Campaign Conversion</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Campaign Conversion Rate ({campaignConversionRate}%)</Label>
                                <Slider value={[campaignConversionRate]} onValueChange={v => setCampaignConversionRate(v[0])} max={50} step={0.5} />
                            </div>
                             <div className="space-y-2">
                                <Label>Campaign Duration ({campaignDuration} months)</Label>
                                <Slider value={[campaignDuration]} onValueChange={v => setCampaignDuration(v[0])} max={24} step={1} min={1} />
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>4. Network Effect</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Avg. Customers per Member</Label>
                                <Input type="number" value={avgCustomersPerMember} onChange={e => setAvgCustomersPerMember(Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Customer Conversion Rate ({customerConversionRate}%)</Label>
                                <Slider value={[customerConversionRate]} onValueChange={v => setCustomerConversionRate(v[0])} max={20} step={0.1} />
                            </div>
                             <div className="space-y-2">
                                <Label>Conversion Lag ({customerConversionLag} months)</Label>
                                <Slider value={[customerConversionLag]} onValueChange={v => setCustomerConversionLag(v[0])} max={12} step={1} min={1} />
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>5. Forecast Period</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Month</Label>
                                    <Select value={String(startMonth)} onValueChange={v => setStartMonth(Number(v))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{monthNames.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Start Year</Label>
                                    <Input type="number" value={startYear} onChange={e => setStartYear(Number(e.target.value))} />
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label>Number of Months to Forecast ({forecastMonths})</Label>
                                <Slider value={[forecastMonths]} onValueChange={v => setForecastMonths(v[0])} max={60} step={1} min={6} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
                {/* --- RESULTS COLUMN --- */}
                <div className="lg:col-span-2">
                     <Card>
                        <CardHeader>
                            <CardTitle>Growth Projections</CardTitle>
                            <CardDescription>Month-by-month forecast of new and cumulative members.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg max-h-[1600px] overflow-y-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-muted">
                                        <TableRow>
                                            <TableHead className="w-[120px]">Month</TableHead>
                                            <TableHead className="text-right">Database Signups</TableHead>
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
                                                        <TableCell className="text-right">{row.networkNewMembers.toLocaleString()}</TableCell>
                                                        <TableCell className="text-right font-semibold">{row.totalNewMembers.toLocaleString()}</TableCell>
                                                        <TableCell className="text-right font-bold text-primary">{row.cumulativeMembers.toLocaleString()}</TableCell>
                                                    </TableRow>
                                                    {showYearTotal && (
                                                        <TableRow className="bg-primary/10 font-bold">
                                                            <TableCell>Total {row.year}</TableCell>
                                                            <TableCell className="text-right">{totalRow.campaign.toLocaleString()}</TableCell>
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
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
