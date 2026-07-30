'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Loader2, ClipboardList, CheckCircle, FileText, Send, Landmark, 
    ArrowRight, UserCheck, ShieldCheck, Zap, Info, Search, Building, Clock, Mail, Phone, FileSignature,
    AlertTriangle, RefreshCcw, Lock, Tag, SearchCode, Database, Banknote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getClientSideAuthToken, useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateSafe, cn } from '@/lib/utils';
import { collectionGroup, query, orderBy, limit } from 'firebase/firestore';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

async function performAdminAction(token: string, action: string, payload: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
        cache: 'no-store'
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || `API Error for action: ${action}`);
    return result.data;
}

function OpportunityDetail({ 
    opportunity, 
    onClose, 
    onStatusChange 
}: { 
    opportunity: any, 
    onClose: () => void, 
    onStatusChange: () => void 
}) {
    const { toast } = useToast();
    const [isIssuing, setIsIssuing] = useState(false);
    const [view, setView] = useState<'details' | 'docs' | 'letter'>('details');

    const handleIssueLetter = async () => {
        setIsIssuing(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;

            await performAdminAction(token, 'logCommunication', {
                partnerId: opportunity.id,
                subject: 'Facility Letter Issued',
                notes: `Issued automated facility letter for ${formatCurrency(opportunity.amountRequested)} via Lending Desk.`,
                collection: 'leads'
            });

            toast({ title: "Letter Issued", description: "The borrower has been notified." });
            onStatusChange();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Failed to issue letter" });
        } finally {
            setIsIssuing(false);
        }
    };

    return (
        <Card className="animate-in slide-in-from-right-4 duration-500 border-primary/20 shadow-2xl text-left">
            <CardHeader className="bg-slate-900 text-white rounded-t-lg text-left">
                <div className="flex justify-between items-center text-left">
                    <div className="text-left">
                        <CardTitle className="text-2xl font-black font-headline flex items-center gap-3 text-white text-left">
                            <Landmark className="h-6 w-6 text-primary" />
                            {opportunity.companyLegalName || 'Provisional Borrower'}
                        </CardTitle>
                        <CardDescription className="text-slate-400">Application Reference: {opportunity.id.slice(-6).toUpperCase()}</CardDescription>
                    </div>
                    <Button variant="ghost" className="text-white hover:text-primary" onClick={onClose}>Close</Button>
                </div>
            </CardHeader>
            <div className="flex border-b bg-muted/30 px-6 text-left">
                <Button variant={view === 'details' ? 'secondary' : 'ghost'} className="rounded-none border-b-2 border-transparent h-12" onClick={() => setView('details')}>Forensic Profile</Button>
                <Button variant={view === 'docs' ? 'secondary' : 'ghost'} className="rounded-none border-b-2 border-transparent h-12" onClick={() => setView('docs')}>Documentation</Button>
                <Button variant={view === 'letter' ? 'secondary' : 'ghost'} className="rounded-none border-b-2 border-transparent h-12" onClick={() => setView('letter')}>Facility Letter</Button>
            </div>
            <CardContent className="p-8 space-y-8 text-left">
                {view === 'details' && (
                    <div className="space-y-6 text-left">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                            <div className="space-y-1 text-left">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Requested Capital</Label>
                                <p className="text-3xl font-black text-primary">{formatCurrency(opportunity.amountRequested)}</p>
                                <Badge variant="outline" className="mt-1 capitalize">{opportunity.fundingNeed?.replace(/-/g, ' ') || 'Loan'}</Badge>
                            </div>
                            <div className="space-y-1 text-left">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Annual Turnover</Label>
                                <p className="text-2xl font-bold">{formatCurrency(opportunity.annualTurnover)}</p>
                                <p className="text-[10px] text-muted-foreground font-bold">Years in Business: {opportunity.yearsInBusiness}</p>
                            </div>
                            <div className="space-y-1 text-left">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Risk Disclosure</Label>
                                <div className="flex flex-col gap-1.5 pt-1 text-left">
                                    <Badge variant={opportunity.hasJudgements ? "destructive" : "secondary"} className="w-fit text-[9px] uppercase font-bold">Judgements: {opportunity.hasJudgements ? 'YES' : 'NO'}</Badge>
                                    <Badge variant={opportunity.hasDefaults ? "destructive" : "secondary"} className="w-fit text-[9px] uppercase font-bold">Defaults: {opportunity.hasDefaults ? 'YES' : 'NO'}</Badge>
                                </div>
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-2 text-left">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Purpose of Funds</Label>
                            <p className="text-sm italic leading-relaxed text-muted-foreground text-left">"{opportunity.purpose}"</p>
                        </div>
                    </div>
                )}

                {view === 'docs' && (
                    <div className="py-12 text-center space-y-4">
                        <FileSignature className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                        <div className="space-y-1 text-center">
                            <h4 className="font-bold text-foreground">Verified Document Pack</h4>
                            <p className="text-xs text-muted-foreground max-w-xs mx-auto">Borrower has uploaded verified registration and ID documents.</p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/adminaccount?view=wallet&memberId=${opportunity.companyId}`}>Review Full Profile</Link>
                        </Button>
                    </div>
                )}

                {view === 'letter' && (
                    <div className="space-y-6 text-left">
                        <div className="bg-slate-50 p-6 rounded-xl border border-dashed text-left">
                            <h4 className="font-bold text-sm mb-4 border-b pb-2 flex items-center gap-2"><FileText className="h-4 w-4" /> Facility Letter Template</h4>
                            <div className="space-y-3 font-mono text-[11px] text-muted-foreground text-left">
                                <p>OFFER TO: {opportunity.companyLegalName || 'Applicant'}</p>
                                <p>AMOUNT: {formatCurrency(opportunity.amountRequested)}</p>
                                <p>TERM: {opportunity.preferredTerm || 'TBD'}</p>
                                <p>SUBJECT TO: FICA/KYC Verification and Asset Inspection.</p>
                            </div>
                        </div>
                        <Button className="w-full h-12 font-bold gap-2 text-white" onClick={handleIssueLetter} disabled={isIssuing}>
                            {isIssuing ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4" />}
                            Issue Facility Letter via Registry
                        </Button>
                    </div>
                )}
            </CardContent>
            <CardFooter className="bg-slate-50 border-t p-6 rounded-b-lg flex justify-between">
                <div className="flex gap-2 text-left">
                    <Button variant="outline" size="sm" className="gap-2"><Mail className="h-3.5 w-3.5" /> Message Borrower</Button>
                    <Button variant="outline" size="sm" className="gap-2"><Phone className="h-3.5 w-3.5" /> Direct Line</Button>
                </div>
                <Button className="bg-green-600 hover:bg-green-700 font-bold" onClick={() => toast({ title: "Workflow Concluded", description: "Agreement marked as finalized." })}>Conclude Agreement</Button>
            </CardFooter>
        </Card>
    );
}

export default function LenderDeskContent() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [selectedOpportunity, setSelectedOpportunity] = useState<any | null>(null);

    const isAdmin = user && (
        user.email === 'beyondtransport@gmail.com' || 
        user.email === 'mkoton100@gmail.com' || 
        user.email === 'michael@logisticsflow.co.za'
    );

    const lenderParams = useMemo(() => user?.companyData?.lendingParams, [user]);

    // FETCH ACTIVE ENQUIRIES ACROSS THE PLATFORM
    const enquiriesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collectionGroup(firestore, 'enquiries'), orderBy('updatedAt', 'desc'), limit(500));
    }, [firestore]);
    const { data: allEnquiries, isLoading, forceRefresh } = useCollection(enquiriesQuery);

    const matchedOpportunities = useMemo(() => {
        if (!allEnquiries) return [];
        
        return allEnquiries.filter((enquiry: any) => {
            // 1. Origination Route Check
            if (!isAdmin && enquiry.originationType === 'direct') return false;

            if (!lenderParams) return true;

            const { 
                productCriteria = {}, minAnnualTurnover, minYearsInBusiness, 
                requiresNoJudgements, requiresNoDefaults, requiresNoArrears,
                entityTypes, serviceRegions, assetTypes, industrial_tags = []
            } = lenderParams;

            // 2. Tag Alignment Check
            if (industrial_tags.length > 0) {
                const enquiryTags = enquiry.industrial_tags || [];
                const tagMatch = industrial_tags.some((tag: string) => enquiryTags.includes(tag));
                if (!tagMatch) return false;
            }

            // 3. Global Entity & Risk Checks
            if (minAnnualTurnover && enquiry.annualTurnover < minAnnualTurnover) return false;
            if (minYearsInBusiness && enquiry.yearsInBusiness < minYearsInBusiness) return false;
            if (entityTypes?.length > 0 && !entityTypes.includes(enquiry.entityType)) return false;
            if (requiresNoJudgements && enquiry.hasJudgements) return false;
            if (requiresNoDefaults && enquiry.hasDefaults) return false;
            if (requiresNoArrears && enquiry.hasArrears) return false;

            return true;
        });
    }, [allEnquiries, lenderParams, isAdmin]);

    const columns: ColumnDef<any>[] = [
        {
            header: 'Application Target',
            cell: ({ row }) => (
                <div className="flex flex-col text-left">
                    <span className="font-bold text-foreground text-left">{row.original.companyLegalName || 'Individual Applicant'}</span>
                    <div className="flex items-center gap-1.5 mt-1">
                         <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100 text-[8px] h-3.5 uppercase font-black">
                            <ShieldCheck className="h-2.5 w-2.5 mr-1" /> Forensic Match
                        </Badge>
                        <Badge variant="secondary" className="text-[8px] h-3.5 uppercase font-black bg-slate-100">
                            {row.original.originationType === 'direct' ? 'Direct Path' : 'Market Broadcast'}
                        </Badge>
                    </div>
                </div>
            )
        },
        {
            header: 'Forensic Pillar Audit',
            cell: ({ row }) => {
                const hasMined = !!(row.original.minedServiceWording || row.original.notes);
                const hasOnboarded = (row.original.assets?.length > 0);
                const hasCredit = (row.original.creditRating && row.original.creditRating !== 'unknown');
                
                return (
                    <div className="flex items-center gap-2 text-left">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <div className={cn("p-1.5 rounded-md transition-colors", hasMined ? "bg-purple-100 text-purple-600" : "bg-muted text-muted-foreground/30")}>
                                        <SearchCode className="h-3.5 w-3.5" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="text-[10px] font-bold uppercase tracking-widest">Mined Silo: {hasMined ? 'Verified' : 'Gapped'}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger>
                                    <div className={cn("p-1.5 rounded-md transition-colors", hasOnboarded ? "bg-blue-100 text-blue-600" : "bg-muted text-muted-foreground/30")}>
                                        <Database className="h-3.5 w-3.5" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="text-[10px] font-bold uppercase tracking-widest">Onboarded Silo: {hasOnboarded ? 'Assets Mapped' : 'Gapped'}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger>
                                    <div className={cn("p-1.5 rounded-md transition-colors", hasCredit ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground/30")}>
                                        <Landmark className="h-3.5 w-3.5" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="text-[10px] font-bold uppercase tracking-widest">Credit Silo: {hasCredit ? 'Rating Stamped' : 'Gapped'}</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                );
            }
        },
        {
            header: 'Value',
            cell: ({ row }) => (
                <div className="flex flex-col text-left">
                    <span className="font-black text-primary">{formatCurrency(row.original.amountRequested)}</span>
                    <span className="text-[9px] font-mono text-muted-foreground uppercase">{row.original.preferredTerm}</span>
                </div>
            )
        },
        {
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 capitalize text-[9px] font-black tracking-widest text-left">
                    {row.original.status || 'New Queue Item'}
                </Badge>
            )
        },
        {
            id: 'actions',
            header: <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedOpportunity(row.original)} className="h-8 text-[10px] font-black uppercase tracking-widest gap-1.5">
                        Open Desk <ArrowRight className="h-3 w-3" />
                    </Button>
                </div>
            )
        }
    ];

    if (isUserLoading || isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-left">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Synchronizing Deal Flow...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 text-left text-foreground">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 text-left">
                <div className="text-left">
                    <h1 className="text-3xl font-black font-headline tracking-tight text-left">Lending Desk (CRM)</h1>
                    <p className="text-muted-foreground text-left">Oversight of active origination and matched deal flow.</p>
                </div>
                <Button variant="outline" size="sm" onClick={forceRefresh}>
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Refresh Queue
                </Button>
            </div>

            {selectedOpportunity ? (
                <OpportunityDetail 
                    opportunity={selectedOpportunity} 
                    onClose={() => setSelectedOpportunity(null)} 
                    onStatusChange={forceRefresh}
                />
            ) : (
                <Tabs defaultValue="matches" className="w-full text-left text-foreground">
                    <TabsList className="bg-muted/30 p-1 h-auto flex-wrap justify-start text-left">
                        <TabsTrigger value="matches" className="gap-2 px-6 py-2.5 font-bold uppercase tracking-widest text-[10px]">
                            <Zap className="h-3.5 w-3.5" /> Matched Enquiries
                        </TabsTrigger>
                        <TabsTrigger value="pipeline" className="gap-2 px-6 py-2.5 font-bold uppercase tracking-widest text-[10px]">
                            <ClipboardList className="h-3.5 w-3.5" /> Active Pipeline
                        </TabsTrigger>
                        <TabsTrigger value="concluded" className="gap-2 px-6 py-2.5 font-bold uppercase tracking-widest text-[10px]">
                            <ShieldCheck className="h-3.5 w-3.5" /> Concluded Agreements
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="matches" className="mt-8 text-left">
                        <Card className="border-none shadow-xl text-left">
                            <CardContent className="pt-6 text-left">
                                {matchedOpportunities.length > 0 ? (
                                    <DataTable columns={columns} data={matchedOpportunities} />
                                ) : (
                                    <div className="py-32 text-center space-y-4 text-left">
                                        <div className="bg-muted p-6 rounded-full w-fit mx-auto opacity-20">
                                            <Tag className="h-12 w-12 text-muted-foreground" />
                                        </div>
                                        <div className="text-center text-foreground">
                                            <h3 className="text-xl font-bold">Queue Empty</h3>
                                            <p className="text-muted-foreground max-w-xs mx-auto mt-2">Adjust your **Lending Focus** tags to broaden your deal flow visibility.</p>
                                        </div>
                                        <Button variant="outline" asChild className="mt-4"><Link href="/lending?view=lending-focus">Refine My Focus</Link></Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="pipeline" className="mt-8 text-left">
                        <div className="py-20 text-center border-2 border-dashed rounded-2xl bg-muted/10 text-left">
                            <Clock className="h-10 w-10 mx-auto text-muted-foreground opacity-30" />
                            <p className="text-sm font-bold text-muted-foreground mt-4 text-center">Active deal pipeline will populate after borrower engagement.</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="concluded" className="mt-8 text-left">
                         <div className="py-20 text-center border-2 border-dashed rounded-2xl bg-muted/10 text-left">
                            <ShieldCheck className="h-10 w-10 mx-auto text-muted-foreground opacity-30" />
                            <p className="text-sm font-bold text-muted-foreground mt-4 text-center">Historical agreement archive.</p>
                        </div>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
