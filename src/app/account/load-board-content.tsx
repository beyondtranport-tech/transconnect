
'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Truck, ClipboardList, Handshake, Search, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostLoadWizard } from './loads/post-load-wizard';
import { BrokerAppointmentWizard } from './loads/broker-appointment-wizard';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function LoadBoardContent() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [view, setView] = useState<'overview' | 'post-wizard' | 'broker-wizard'>('overview');

    // Fetch verified broker agreements
    const agreementsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.companyId) return null;
        return query(
            collection(firestore, `companies/${user.companyId}/brokerAgreements`),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, user?.companyId]);
    const { data: agreements, isLoading: areAgreementsLoading } = useCollection(agreementsQuery);

    // Fetch posted loads
    const loadsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.companyId) return null;
        return query(
            collection(firestore, `companies/${user.companyId}/loadBoard/loads`),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, user?.companyId]);
    const { data: myLoads, isLoading: areLoadsLoading } = useCollection(loadsQuery);

    const hasVerifiedAgreement = agreements?.some(a => a.status === 'verified');

    if (isUserLoading || areAgreementsLoading || areLoadsLoading) {
        return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
    }

    if (view === 'post-wizard') {
        return <PostLoadWizard agreements={agreements || []} onComplete={() => setView('overview')} />;
    }

    if (view === 'broker-wizard') {
        return <BrokerAppointmentWizard onComplete={() => setView('overview')} />;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-left text-foreground">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="text-left">
                    <h1 className="text-3xl font-black font-headline tracking-tight flex items-center gap-3">
                        <Truck className="h-8 w-8 text-primary" />
                        Loads & Brokerage Mall
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage your subcontractor appointments and professional load postings.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setView('broker-wizard')} className="gap-2 font-bold">
                        <Handshake className="h-4 w-4" /> Subcontractor Appointment
                    </Button>
                    <Button onClick={() => setView('post-wizard')} disabled={!hasVerifiedAgreement} className="gap-2 font-bold shadow-lg">
                        <PlusCircle className="h-4 w-4" /> Post New Load
                    </Button>
                </div>
            </div>

            {!hasVerifiedAgreement && (
                <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-6 flex items-start gap-4">
                        <div className="bg-amber-100 p-2 rounded-lg"><Zap className="h-5 w-5 text-amber-600" /></div>
                        <div className="text-left">
                            <h4 className="font-bold text-amber-900">Brokerage Authorization Required</h4>
                            <p className="text-sm text-amber-800 leading-relaxed mt-1">
                                To post loads to the board, you must first upload a signed **Subcontractor Appointment Letter** from your load provider. This allows the platform to verify the source of the work.
                            </p>
                            <Button variant="link" onClick={() => setView('broker-wizard')} className="p-0 h-auto text-amber-900 font-bold underline mt-2">
                                Start Appointment Process <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Tabs defaultValue="my-loads" className="w-full">
                <TabsList className="bg-muted/30 p-1 h-auto flex-wrap justify-start">
                    <TabsTrigger value="my-loads" className="gap-2 px-6 py-2.5 font-bold uppercase tracking-widest text-[10px]">
                        <ClipboardList className="h-3.5 w-3.5" /> My Posted Loads
                    </TabsTrigger>
                    <TabsTrigger value="agreements" className="gap-2 px-6 py-2.5 font-bold uppercase tracking-widest text-[10px]">
                        <ShieldCheck className="h-3.5 w-3.5" /> Appointments
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="my-loads" className="mt-8">
                    <Card className="border-none shadow-xl">
                        <CardContent className="pt-6">
                            {myLoads && myLoads.length > 0 ? (
                                <DataTable 
                                    data={myLoads}
                                    columns={[
                                        { header: 'Route', cell: ({row}) => <div className="font-bold flex items-center gap-2">{row.original.origin} <ArrowRight className="h-3 w-3 opacity-50" /> {row.original.destination}</div> },
                                        { accessorKey: 'cargoType', header: 'Cargo' },
                                        { header: 'Payout', cell: ({row}) => <span className="font-black text-primary">{new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(row.original.haulierPayout)}</span> },
                                        { header: 'Status', cell: ({row}) => <Badge variant="outline" className="capitalize text-[10px] font-black">{row.original.status}</Badge> }
                                    ]}
                                />
                            ) : (
                                <div className="py-20 text-center text-muted-foreground italic">No loads posted yet.</div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="agreements" className="mt-8">
                    <Card className="border-none shadow-xl">
                        <CardContent className="pt-6">
                            {agreements && agreements.length > 0 ? (
                                <DataTable 
                                    data={agreements}
                                    columns={[
                                        { accessorKey: 'providerName', header: 'Load Provider' },
                                        { header: 'Commission', cell: ({row}) => <span className="font-bold">{row.original.commissionRate}%</span> },
                                        { header: 'Status', cell: ({row}) => <Badge variant={row.original.status === 'verified' ? 'default' : 'secondary'} className="capitalize">{row.original.status}</Badge> },
                                        { header: 'Signed Doc', cell: ({row}) => <Button variant="ghost" size="sm" asChild className="h-7 text-[10px] font-black uppercase"><a href={row.original.agreementUrl} target="_blank">View File</a></Button> }
                                    ]}
                                />
                            ) : (
                                <div className="py-20 text-center text-muted-foreground italic">No appointments recorded.</div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
