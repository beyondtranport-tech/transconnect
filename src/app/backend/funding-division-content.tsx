'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Landmark, Globe, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collectionGroup, query, orderBy, limit } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface FundingDivisionContentProps {
    mode?: 'direct' | 'market';
}

export default function FundingDivisionContent({ mode = 'direct' }: FundingDivisionContentProps) {
    const firestore = useFirestore();
    const { user } = useUser();

    // Fetch all enquiries across the platform
    const enquiriesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collectionGroup(firestore, 'enquiries'), orderBy('updatedAt', 'desc'), limit(500));
    }, [firestore]);
    
    const { data: allEnquiries, isLoading, error } = useCollection(enquiriesQuery);

    const adminParams = useMemo(() => user?.companyData?.lendingParams, [user]);

    // Filter based on the requested mode
    const enquiries = useMemo(() => {
        if (!allEnquiries) return [];

        if (mode === 'direct') {
            // Internal Queue: Only deals explicitly sent to your division
            return allEnquiries.filter(e => e.originationType === 'direct');
        } else {
            // Market Channel: Deals broadcasted to the network
            return allEnquiries.filter(e => e.originationType === 'market');
        }
    }, [allEnquiries, mode]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Synchronizing Capital Registry...</p>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive" className="max-w-2xl mx-auto mt-10 text-left">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Registry Error</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
            </Alert>
        );
    }

    const title = mode === 'direct' ? 'Direct In-House Queue' : 'Market Origination Channel';
    const description = mode === 'direct' 
        ? 'Deals submitted exclusively to your team via the Funding Division.' 
        : 'Comparative deal flow broadcasted to the wider CRM network.';
    const Icon = mode === 'direct' ? Landmark : Globe;

    return (
        <div className="space-y-8 text-left text-foreground">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="text-left">
                    <h1 className="text-3xl font-black font-headline tracking-tight flex items-center gap-3">
                        <Icon className="h-8 w-8 text-primary" />
                        {title}
                    </h1>
                    <p className="text-muted-foreground mt-1">{description}</p>
                </div>
            </div>

            <Card className="border-none shadow-xl overflow-hidden bg-white">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Submission Date</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Borrower Entity</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Product Category</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Requested Value</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Risk Profile</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {enquiries.length > 0 ? enquiries.map(app => (
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
                                <TableCell colSpan={6} className="text-center py-32 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2 opacity-30">
                                        <Icon className="h-12 w-12" />
                                        <p className="text-sm font-bold uppercase tracking-widest">Queue Empty</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {mode === 'direct' && (
                <Alert className="bg-primary/5 border-primary/20 p-4 rounded-xl text-left">
                    <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
                    <div className="text-left ml-2">
                        <AlertTitle className="text-xs font-bold uppercase tracking-widest text-primary">Relationship Shield Active</AlertTitle>
                        <AlertDescription className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                            These applications are strictly internal to your funding division and are not shared with the wider CRM network.
                        </AlertDescription>
                    </div>
                </Alert>
            )}
        </div>
    );
}
