'use client';

import { Suspense, useMemo, useState, useCallback, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useCollection, getClientSideAuthToken } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { 
    Loader2, User, ArrowLeft, Building, Mail, Phone, Hash, Globe, Banknote, 
    FileSignature, Truck, ShieldCheck, Zap, Sparkles, BarChart3, AlertTriangle, SearchCode, Landmark 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDateSafe, cn } from '@/lib/utils';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { generateScorecard } from '@/ai/flows/lending-scorecard-flow';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

function ForensicAnalysisTab({ client }: { client: any }) {
    const { toast } = useToast();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [scorecard, setScorecard] = useState<any>(null);

    const loadScorecard = useCallback(async () => {
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getLatestScorecard', payload: { clientId: client.id } })
            });
            const result = await res.json();
            if (result.data) setScorecard(result.data);
        } catch (e) {
            console.warn("Failed to load scorecard", e);
        }
    }, [client.id]);

    useEffect(() => { loadScorecard(); }, [loadScorecard]);

    const handleRunAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            const result = await generateScorecard({
                minedData: { notes: client.minedServiceWording || client.notes },
                onboardedData: client,
                creditData: { rating: client.creditRating || 'unknown', turnover: client.annualTurnover }
            });

            const token = await getClientSideAuthToken();
            if (token) {
                await fetch('/api/admin', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'saveDigitalScorecard', payload: { clientId: client.id, scorecard: result } })
                });
            }

            setScorecard(result);
            toast({ title: "Scorecard Generated", description: "The Triple Engine analysis is complete." });
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Analysis Failed", description: e.message });
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-left">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <Card className="bg-purple-50 border-purple-100 text-left">
                    <CardHeader className="pb-2 text-left">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-purple-700 flex items-center gap-2">
                            <SearchCode className="h-4 w-4" /> Mined Silo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-left">
                        <p className="text-xs text-purple-900 leading-relaxed italic">
                            "{client.minedServiceWording ? "Digital footprint extracted via V13.1." : "Silo empty. Run Gap Analysis to populate."}"
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-100 text-left">
                    <CardHeader className="pb-2 text-left text-foreground">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-blue-700 flex items-center gap-2">
                            <Truck className="h-4 w-4" /> Onboarded Silo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-left">
                        <p className="text-xs text-blue-900 leading-relaxed">
                            {client.registrationId ? `Verified identity: ${client.registrationId}` : "Identity documents pending upload."}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-100 text-left">
                    <CardHeader className="pb-2 text-left text-foreground">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-green-700 flex items-center gap-2">
                            <Banknote className="h-4 w-4" /> Credit Silo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-left">
                        <p className="text-xs text-green-900 leading-relaxed uppercase font-bold">
                            Rating: {client.creditRating || 'Pending Analysis'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {!scorecard ? (
                <div className="p-12 border-4 border-dashed rounded-[3rem] bg-white flex flex-col items-center justify-center gap-6 text-center text-foreground">
                    <div className="bg-primary/10 p-6 rounded-full"><Sparkles className="h-12 w-12 text-primary" /></div>
                    <div className="space-y-2 text-center text-foreground">
                        <h3 className="text-2xl font-black uppercase tracking-tight">Generate Digital Scorecard</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">Trigger the Triple Engine to synthesize mined footprint, onboarded assets, and credit metadata.</p>
                    </div>
                    <Button size="lg" className="h-14 px-12 font-black uppercase shadow-xl" onClick={handleRunAnalysis} disabled={isAnalyzing}>
                        {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Zap className="mr-2 h-4 w-4" />}
                        Execute Forensic Synthesis
                    </Button>
                </div>
            ) : (
                <Card className="shadow-2xl border-none overflow-hidden text-left bg-white">
                    <CardHeader className="bg-slate-900 text-white p-8">
                        <div className="flex justify-between items-center text-left text-white">
                            <div className="text-left text-white">
                                <CardTitle className="text-2xl font-black font-headline text-white">Digital Scorecard</CardTitle>
                                <CardDescription className="text-slate-400">Analysis completed {formatDateSafe(scorecard.createdAt, "dd MMM yyyy")}</CardDescription>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Forensic Trust Score</p>
                                <p className={cn("text-4xl font-black", scorecard.trustScore > 70 ? "text-green-500" : "text-amber-500")}>{scorecard.trustScore}%</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8 text-left text-foreground">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
                            <div className="space-y-6 text-left">
                                <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2 text-left">
                                    <ShieldCheck className="h-4 w-4" /> Data Consistency
                                </h4>
                                <div className="space-y-3 text-left">
                                    <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 text-left">
                                        <span className="text-xs font-bold uppercase">Address Alignment</span>
                                        {scorecard.dataConsistencyReport.isAddressMatch ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-destructive" />}
                                    </div>
                                    <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 text-left">
                                        <span className="text-xs font-bold uppercase">Principal Identity</span>
                                        {scorecard.dataConsistencyReport.isPrincipalVerified ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-destructive" />}
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed italic text-left">"{scorecard.dataConsistencyReport.discrepancyNotes}"</p>
                            </div>
                            <div className="space-y-4 text-left">
                                <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2 text-left">
                                    <BarChart3 className="h-4 w-4" /> Final Audit Recommendation
                                </h4>
                                <div className="p-6 bg-slate-950 rounded-2xl text-slate-300 text-sm leading-relaxed shadow-inner border-l-4 border-primary text-left">
                                    {scorecard.recommendation}
                                </div>
                                <div className="pt-2 text-left">
                                    <Badge variant={scorecard.riskLevel === 'low' ? 'default' : 'destructive'} className="uppercase font-black px-4 py-1">
                                        Risk Profile: {scorecard.riskLevel}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t p-6 flex justify-center">
                        <Button variant="outline" className="gap-2 font-bold" onClick={() => setScorecard(null)}>
                            <RotateCcw className="h-4 w-4" /> Re-Run Analysis
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}

function ClientDetailComponent() {
    const params = useParams();
    const clientId = params.clientId as string;
    const firestore = useFirestore();

    const clientRef = useMemoFirebase(() => {
        if (!firestore || !clientId) return null;
        return doc(firestore, `lendingClients/${clientId}`);
    }, [firestore, clientId]);
    const { data: client, isLoading: isLoadingClient, error: clientError } = useDoc(clientRef);
    
    // Fetch related data
    const agreementsQuery = useMemoFirebase(() => firestore && clientId ? query(collection(firestore, `lendingClients/${clientId}/agreements`)) : null, [firestore, clientId]);
    const { data: agreements } = useCollection(agreementsQuery);

    const facilitiesQuery = useMemoFirebase(() => firestore && clientId ? query(collection(firestore, `lendingClients/${clientId}/facilities`)) : null, [firestore, clientId]);
    const { data: facilities } = useCollection(facilitiesQuery);
    
    const assetsQuery = useMemoFirebase(() => firestore && clientId ? query(collection(firestore, 'lendingAssets'), where('clientId', '==', clientId)) : null, [firestore, clientId]);
    const { data: assets } = useCollection(assetsQuery);

    if (isLoadingClient) {
        return <div className="flex justify-center items-center h-full py-20 text-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }
    
    if (clientError) {
        return <div className="text-center py-20 text-destructive font-bold">Error: {clientError.message}</div>;
    }
    
    if (!client) return notFound();

    const agreementsColumns: ColumnDef<any>[] = [
        { accessorKey: 'description', header: 'Agreement Label' },
        { accessorKey: 'status', header: 'Status', cell: ({row}) => <Badge className="capitalize text-[10px] font-black">{row.original.status}</Badge> },
        { accessorKey: 'totalAdvanced', header: 'Value', cell: ({row}) => <span className="font-bold">{formatCurrency(row.original.totalAdvanced)}</span> },
    ];
    
    return (
        <div className="space-y-6 text-left text-foreground">
            <div className="flex justify-between items-start text-left">
                <div className="flex items-center gap-4 text-left">
                    <div className="bg-primary/10 p-3 rounded-xl"><Building className="h-8 w-8 text-primary"/></div>
                    <div className="text-left">
                        <h1 className="text-2xl font-black uppercase tracking-tight">{client.name}</h1>
                        <p className="text-muted-foreground text-sm font-medium">{client.category || 'General Industrial'} • Registry ID: {client.id}</p>
                    </div>
                </div>
                <Button variant="outline" asChild className="font-bold"><Link href="/lending?view=clients"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Registry</Link></Button>
            </div>

            <Tabs defaultValue="analysis" className="w-full text-left">
                <TabsList className="bg-muted/50 p-1 h-auto flex-wrap justify-start">
                    <TabsTrigger value="analysis" className="gap-2 px-6 py-2.5 font-bold uppercase tracking-widest text-[10px]">
                        <ShieldCheck className="h-3.5 w-3.5" /> Forensic Analysis
                    </TabsTrigger>
                    <TabsTrigger value="profile" className="gap-2 px-6 py-2.5 font-bold uppercase tracking-widest text-[10px]">
                        <Building className="h-3.5 w-3.5" /> Registry Node
                    </TabsTrigger>
                    <TabsTrigger value="portfolio" className="gap-2 px-6 py-2.5 font-bold uppercase tracking-widest text-[10px]">
                        <Landmark className="h-3.5 w-3.5" /> Ledger & Payouts
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="analysis" className="mt-8">
                    <ForensicAnalysisTab client={client} />
                </TabsContent>

                <TabsContent value="profile" className="mt-8 space-y-6">
                    <Card className="border-none shadow-xl bg-white text-left">
                        <CardHeader className="bg-slate-50 border-b p-6 text-left">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-left">Stakeholder Intelligence</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                            <div className="flex items-center gap-3 text-left">
                                <div className="bg-muted p-2 rounded-lg text-left"><Mail className="h-4 w-4 text-primary"/></div>
                                <div className="text-left"><p className="text-[10px] font-black uppercase text-muted-foreground">Fiduciary Mail</p><p className="text-sm font-bold text-left">{client.email || 'N/A'}</p></div>
                            </div>
                            <div className="flex items-center gap-3 text-left">
                                <div className="bg-muted p-2 rounded-lg"><Phone className="h-4 w-4 text-primary"/></div>
                                <div className="text-left"><p className="text-[10px] font-black uppercase text-muted-foreground">Direct Line</p><p className="text-sm font-bold text-left">{client.cell || client.phone || 'N/A'}</p></div>
                            </div>
                            <div className="flex items-center gap-3 text-left">
                                <div className="bg-muted p-2 rounded-lg"><Hash className="h-4 w-4 text-primary"/></div>
                                <div className="text-left text-foreground"><p className="text-[10px] font-black uppercase text-muted-foreground">CIPC / Code</p><p className="text-sm font-mono font-bold text-left">{client.registrationId || client.code || 'N/A'}</p></div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="portfolio" className="mt-8 space-y-6 text-left">
                    <Card className="border-none shadow-xl bg-white text-left">
                        <CardHeader className="bg-slate-50 border-b p-6 text-left">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-left">Active Agreements</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 text-left">
                            <DataTable columns={agreementsColumns} data={agreements || []} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function ClientDetailPage() {
    return (
        <div className="bg-slate-50 min-h-screen">
            <Suspense fallback={<div className="flex justify-center items-center py-40"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
                <ClientDetailComponent />
            </Suspense>
        </div>
    );
}
