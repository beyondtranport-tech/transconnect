'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Landmark, FileText, Globe, Zap, ArrowRight, ShieldCheck, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collectionGroup, query, orderBy, limit } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDateSafe, cn } from '@/lib/utils';

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  pending: 'secondary',
  under_review: 'outline',
  matched: 'default',
  rejected: 'destructive',
  funded: 'default',
};

export default function FundingDivisionContent() {
    const firestore = useFirestore();
    const { user } = useUser();

    // Fetch all enquiries across the platform
    const enquiriesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collectionGroup(firestore, 'enquiries'), orderBy('updatedAt', 'desc'), limit(500));
    }, [firestore]);
    
    const { data: allEnquiries, isLoading, error } = useCollection(enquiriesQuery);

    const adminParams = useMemo(() => user?.companyData?.lendingParams, [user]);

    // Differentiate between Direct and Market channels
    const streams = useMemo(() => {
        if (!allEnquiries) return { direct: [], marketMatches: [] };

        const direct = allEnquiries.filter(e => e.originationType === 'direct');
        
        // Market matching logic for the Admin's internal division
        const marketMatches = allEnquiries.filter(e => {
            if (e.originationType !== 'market') return false;
            if (!adminParams) return true; // If admin hasn't set focus, show all market ones as potential

            const { productCriteria = {}, minAnnualTurnover, minYearsInBusiness } = adminParams;
            const criteria = productCriteria[e.fundingNeed];

            if (criteria && !criteria.enabled) return false;
            if (criteria?.minAmount && e.amountRequested < criteria.minAmount) return false;
            if (criteria?.maxAmount && e.amountRequested > criteria.maxAmount) return false;
            
            if (minAnnualTurnover && e.annualTurnover < minAnnualTurnover) return false;
            if (minYearsInBusiness && e.yearsInBusiness < minYearsInBusiness) return false;

            return true;
        });

        return { direct, marketMatches };
    }, [allEnquiries, adminParams]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Synchronizing Capital Pipeline...</p>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive" className="max-w-2xl mx-auto mt-10">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Registry Error</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
            </Alert>
        );
    }

    const renderTable = (data: any[], emptyMsg: string) => (
        <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Submission Date</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Borrower Entity</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Product Category</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Requested Value</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Risk Profile</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 text-right">Pipeline Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length > 0 ? data.map(app => (
                        <TableRow key={app.id} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell className="text-[11px] font-mono text-muted-foreground">
                                {formatDateSafe(app.updatedAt, "dd MMM yyyy, HH:mm")}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col text-left">
                                    <span className="font-bold text-sm">{app.companyLegalName || 'Individual / Sole Prop'}</span>
                                    <span className="text-[9px] text-muted-foreground font-mono uppercase">{app.companyId}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="capitalize text-[10px] font-bold border-primary/20 text-primary">
                                    {app.fundingNeed?.replace(/-/g, ' ')}
                                </Badge>
                            </TableCell>
                            <TableCell className="font-black text-foreground">
                                {formatCurrency(app.amountRequested)}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    <Badge variant={app.hasJudgements ? "destructive" : "secondary"} className="text-[8px] h-3.5 uppercase px-1.5 font-black">
                                        Judgements: {app.hasJudgements ? 'YES' : 'NO'}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground font-bold">{app.yearsInBusiness}y Maturity</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button asChild variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest gap-1.5">
                                    <Link href={`/adminaccount?view=wallet&memberId=${app.companyId}`}>
                                        Open Desk <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic">
                                {emptyMsg}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );

    return (
        <div className="space-y-8 text-left text-foreground">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="text-left">
                    <h1 className="text-3xl font-black font-headline tracking-tight">Funding Division Oversight</h1>
                    <p className="text-muted-foreground">Strategic deal-flow management for In-House and Market-Matched capital.</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="font-bold">
                        <Link href="/lending?view=lending-focus">
                            <Settings className="mr-2 h-4 w-4" /> Manage Investment appetite
                        </Link>
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="direct" className="w-full">
                <TabsList className="bg-muted/30 p-1 h-auto flex-wrap justify-start border border-muted">
                    <TabsTrigger value="direct" className="gap-2 px-6 py-2.5 font-black uppercase tracking-widest text-[10px]">
                        <Landmark className="h-3.5 w-3.5" /> Direct In-House Queue
                        <Badge className="ml-2 bg-primary text-white border-none">{streams.direct.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="market" className="gap-2 px-6 py-2.5 font-black uppercase tracking-widest text-[10px]">
                        <Globe className="h-3.5 w-3.5" /> Market Broadcast Matches
                        <Badge variant="secondary" className="ml-2">{streams.marketMatches.length}</Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="direct" className="mt-8 space-y-4 animate-in fade-in duration-500">
                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-start gap-3 mb-2">
                        <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-primary uppercase tracking-widest">Primary Relationship Channel</p>
                            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                                These enquiries were submitted directly to your funding division. They are not visible to external CRM lenders unless later broadcasted.
                            </p>
                        </div>
                    </div>
                    {renderTable(streams.direct, "No direct applications currently in queue.")}
                </TabsContent>

                <TabsContent value="market" className="mt-8 space-y-4 animate-in fade-in duration-500">
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3 mb-2">
                        <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-blue-900 uppercase tracking-widest">Comparative Intelligence channel</p>
                            <p className="text-xs text-blue-800/70 leading-relaxed mt-1">
                                These deals were originated via the Finance Mall broadcast. They appear here because they fit your **Lending Focus** criteria alongside other potential funders.
                            </p>
                        </div>
                    </div>
                    {renderTable(streams.marketMatches, "No market-originated deals match your current investment appetite.")}
                </TabsContent>
            </Tabs>
        </div>
    );
}
