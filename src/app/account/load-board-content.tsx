'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Truck, ClipboardList, Handshake, Search, ArrowRight, ShieldCheck, Zap, Globe } from 'lucide-react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, collectionGroup, where } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostLoadWizard } from './loads/post-load-wizard';
import { BrokerAppointmentWizard } from './loads/broker-appointment-wizard';
import { TakeLoadWizard } from './loads/take-load-wizard';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function LoadBoardContent() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [view, setView] = useState<'overview' | 'post-wizard' | 'broker-wizard' | 'take-wizard'>('overview');
    const [selectedLoad, setSelectedLoad] = useState<any | null>(null);

    // 1. Fetch ALL active loads on the platform (The Marketplace)
    const marketplaceQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collectionGroup(firestore, 'loads'),
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc')
        );
    }, [firestore]);
    const { data: marketplaceLoads, isLoading: isMarketLoading } = useCollection(marketplaceQuery);

    // 2. Fetch verified broker agreements for THIS user
    const agreementsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.companyId) return null;
        return query(
            collection(firestore, `companies/${user.companyId}/brokerAgreements`),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, user?.companyId]);
    const { data: agreements, isLoading: areAgreementsLoading } = useCollection(agreementsQuery);

    // 3. Fetch loads posted BY THIS user
    const myLoadsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.companyId) return null;
        return query(
            collection(firestore, `companies/${user.companyId}/loadBoard/loads`),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, user?.companyId]);
    const { data: myLoads, isLoading: areMyLoadsLoading } = useCollection(myLoadsQuery);

    const hasVerifiedAgreement = agreements?.some(a => a.status === 'verified');

    if (isUserLoading || areAgreementsLoading || areMyLoadsLoading || isMarketLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
                <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Initializing Loads Mall...</p>
            </div>
        );
    }

    if (view === 'post-wizard') {
        return <PostLoadWizard agreements={agreements || []} onComplete={() => setView('overview')} />;
    }

    if (view === 'broker-wizard') {
        return <BrokerAppointmentWizard onComplete={() => setView('overview')} />;
    }

    if (view === 'take-wizard' && selectedLoad) {
        return <TakeLoadWizard load={selectedLoad} onComplete={() => setView('overview')} onCancel={() => setView('overview')} />;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-left text-foreground">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="text-left">
                    <h1 className="text-3xl font-black font-headline tracking-tight flex items-center gap-3">
                        <Truck className="h-8 w-8 text-primary" />
                        Loads & Brokerage Mall
                    </h1>
                    <p className="text-muted-foreground mt-1">Capture market capacity or distribute verified freight to our haulier network.</p>
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
                <Card className="bg-amber-50 border-amber-200 shadow-sm">
                    <CardContent className="p-6 flex items-start gap-4">
                        <div className="bg-amber-100 p-2 rounded-lg"><Zap className="h-5 w-5 text-amber-600" /></div>
                        <div className="text-left">
                            <h4 className="font-bold text-amber-900">Brokerage Authorization Required</h4>
                            <p className="text-sm text-amber-800 leading-relaxed mt-1">
                                To post loads to the board and earn commission, you must first upload a signed **Subcontractor Appointment Letter** from your provider.
                            </p>
                            <Button variant="link" onClick={() => setView('broker-wizard')} className="p-0 h-auto text-amber-900 font-bold underline mt-2">
                                Start Authorization Process <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Tabs defaultValue="marketplace" className="w-full">
                <TabsList className="bg-muted/30 p-1 h-auto flex-wrap justify-start border border-muted">
                    <TabsTrigger value="marketplace" className="gap-2 px-6 py-2.5 font-bold uppercase tracking-widest text-[10px]">
                        <Globe className="h-3.5 w-3.5" /> Haulier Marketplace
                    </TabsTrigger>
                    <TabsTrigger value="my-loads" className="gap-2 px-6 py-2.5 font-bold uppercase tracking-widest text-[10px]">
                        <ClipboardList className="h-3.5 w-3.5" /> My Postings
                    </TabsTrigger>
                    <TabsTrigger value="agreements" className="gap-2 px-6 py-2.5 font-bold uppercase tracking-widest text-[10px]">
                        <ShieldCheck className="h-3.5 w-3.5" /> Appointments
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="marketplace" className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-2 px-2">
                        <Badge className="bg-green-600 text-white font-black uppercase text-[8px] tracking-widest">Live</Badge>
                        <span className="text-xs font-bold text-muted-foreground">National Load Board</span>
                    </div>
                    <Card className="border-none shadow-xl bg-white overflow-hidden">
                        <CardContent className="pt-6">
                            {marketplaceLoads && marketplaceLoads.length > 0 ? (
                                <DataTable 
                                    data={marketplaceLoads.filter(l => l.brokerId !== user?.companyId)}
                                    columns={[
                                        { 
                                            header: 'Route & Technicals', 
                                            cell: ({row}) => (
                                                <div className="flex flex-col text-left">
                                                    <div className="font-bold flex items-center gap-2 text-sm">
                                                        {row.original.origin} <ArrowRight className="h-3 w-3 opacity-30" /> {row.original.destination}
                                                    </div>
                                                    <div className="flex gap-1 mt-1">
                                                        {row.original.requiredEquipment?.map((eq: string) => (
                                                            <Badge key={eq} variant="outline" className="text-[8px] h-4 uppercase border-primary/20 text-primary">{eq}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        },
                                        { accessorKey: 'cargoType', header: 'Cargo Class' },
                                        { 
                                            header: 'Haulier Payout', 
                                            cell: ({row}) => (
                                                <div className="flex flex-col text-left">
                                                    <span className="font-black text-lg text-primary">{new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(row.original.haulierPayout)}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Guaranteed via Platform</span>
                                                </div>
                                            )
                                        },
                                        { 
                                            id: 'actions',
                                            header: <div className="text-right">Capture</div>,
                                            cell: ({row}) => (
                                                <div className="text-right">
                                                    <Button size="sm" className="font-black uppercase text-[10px] tracking-widest h-9 px-6 gap-2" onClick={() => { setSelectedLoad(row.original); setView('take-wizard'); }}>
                                                        Accept Load <ArrowRight className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            )
                                        }
                                    ]}
                                />
                            ) : (
                                <div className="py-24 text-center space-y-4">
                                    <Search className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest italic">Scanning the national board for active loads...</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="my-loads" className="mt-8 space-y-6">
                    <Card className="border-none shadow-xl bg-white overflow-hidden">
                        <CardContent className="pt-6">
                            {myLoads && myLoads.length > 0 ? (
                                <DataTable 
                                    data={myLoads}
                                    columns={[
                                        { header: 'Route', cell: ({row}) => <div className="font-bold flex items-center gap-2">{row.original.origin} <ArrowRight className="h-3 w-3 opacity-30" /> {row.original.destination}</div> },
                                        { accessorKey: 'cargoType', header: 'Cargo' },
                                        { header: 'My Broker Earn', cell: ({row}) => <span className="font-bold text-green-700">{new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(row.original.brokerEarn)}</span> },
                                        { header: 'Status', cell: ({row}) => <Badge variant="outline" className="capitalize text-[10px] font-black">{row.original.status}</Badge> }
                                    ]}
                                />
                            ) : (
                                <div className="py-20 text-center text-muted-foreground italic">You haven't posted any loads yet.</div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="agreements" className="mt-8">
                    <Card className="border-none shadow-xl bg-white overflow-hidden">
                        <CardContent className="pt-6">
                            {agreements && agreements.length > 0 ? (
                                <DataTable 
                                    data={agreements}
                                    columns={[
                                        { accessorKey: 'providerName', header: 'Load Provider' },
                                        { header: 'Commission Share', cell: ({row}) => <span className="font-bold">{row.original.commissionRate}%</span> },
                                        { header: 'Status', cell: ({row}) => (
                                            <Badge variant={row.original.status === 'verified' ? 'default' : 'secondary'} className="capitalize text-[10px] font-black">
                                                {row.original.status}
                                            </Badge>
                                        )},
                                        { header: 'Authorization Doc', cell: ({row}) => (
                                            <Button variant="ghost" size="sm" asChild className="h-7 text-[10px] font-black uppercase text-primary">
                                                <a href={row.original.agreementUrl} target="_blank" rel="noopener noreferrer">View Signed Letter</a>
                                            </Button>
                                        )}
                                    ]}
                                />
                            ) : (
                                <div className="py-20 text-center text-muted-foreground italic">No appointment authorizations recorded.</div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
