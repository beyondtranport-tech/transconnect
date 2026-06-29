
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Users, TrendingUp, DollarSign, ExternalLink, ShieldCheck, Activity, Search, RefreshCcw, Wallet, CheckCircle2, AlertCircle } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@/hooks/use-data-table';
import { Badge } from '@/components/ui/badge';
import { getClientSideAuthToken } from '@/firebase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import Link from 'next/link';

async function fetchFromAdminAPI(token: string, action: string, payload?: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for action: ${action}`);
    }
    return result.data;
}

export default function AssociateOversight() {
    const [associates, setAssociates] = useState<any[]>([]);
    const [activity, setActivity] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasLoaded, setHasLoaded] = useState(false);
    const { toast } = useToast();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            
            const [membersRes, activityRes] = await Promise.all([
                fetchFromAdminAPI(token, 'getMembers'),
                fetchFromAdminAPI(token, 'getAuditLogs')
            ]);
            
            // Filter only associates
            const associateMembers = (membersRes || []).filter((m: any) => 
                m.declaredRole === 'associate' || m.role === 'associate'
            );
            
            // Filter associate-specific activity (social posts)
            const socialActivity = (activityRes || []).filter((log: any) => 
                log.action?.startsWith('social_')
            );
            
            setAssociates(associateMembers);
            setActivity(socialActivity);
            setHasLoaded(true);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Load Error', description: e.message });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const stats = useMemo(() => {
        const totalEarnings = associates.reduce((sum, a) => sum + (a.walletBalance || 0), 0);
        const availablePayouts = associates.reduce((sum, a) => sum + (a.availableBalance || 0), 0);
        const totalActivity = activity.length;

        return {
            count: associates.length,
            totalEarnings,
            availablePayouts,
            totalActivity
        };
    }, [associates, activity]);

    const columns: ColumnDef<any>[] = [
        {
            header: 'Associate Identity',
            cell: ({ row }) => (
                <div className="flex flex-col text-left">
                    <span className="font-bold text-foreground">{row.original.companyName || `${row.original.firstName} ${row.original.lastName}`}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{row.original.id}</span>
                </div>
            )
        },
        {
            header: 'Network Size',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <span className="font-bold">{row.original.referralCount || 0}</span>
                </div>
            )
        },
        {
            header: 'Earnings Ledger',
            cell: ({ row }) => (
                <div className="flex flex-col text-left">
                    <span className="font-bold text-green-600">{formatCurrency(row.original.availableBalance)}</span>
                    <span className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter">Available for Payout</span>
                </div>
            )
        },
        {
            header: 'Activity Status',
            cell: ({ row }) => {
                const recentPost = activity.find(log => log.companyId === row.original.id);
                return (
                    <div className="flex flex-col text-left">
                        {recentPost ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1.5 py-0.5 px-2">
                                <Activity className="h-3 w-3" />
                                Active {formatDateSafe(recentPost.timestamp, "dd/MM")}
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="opacity-50">Idle</Badge>
                        )}
                    </div>
                );
            }
        },
        {
            id: 'actions',
            header: <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild className="h-8 text-[10px] font-black uppercase">
                        <Link href={`/backend?view=wallet&memberId=${row.original.id}`}>
                            Verify & Pay
                        </Link>
                    </Button>
                </div>
            )
        }
    ];

    if (isLoading && !hasLoaded) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Mapping Associate Performance...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 text-left text-foreground">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="text-left">
                    <h1 className="text-3xl font-black font-headline tracking-tight">Associate Monitoring</h1>
                    <p className="text-muted-foreground">Strategic oversight of creator influence and commission revenue.</p>
                </div>
                <Button variant="outline" onClick={loadData} disabled={isLoading} className="gap-2">
                    <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    Refresh Stats
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2 text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Authorized Associates</p>
                    </CardHeader>
                    <CardContent className="text-left">
                        <div className="text-3xl font-black text-primary">{stats.count}</div>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-100">
                    <CardHeader className="pb-2 text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Accrued Commission</p>
                    </CardHeader>
                    <CardContent className="text-left">
                        <div className="text-3xl font-black text-green-700">{formatCurrency(stats.totalEarnings)}</div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-100">
                    <CardHeader className="pb-2 text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pending Payouts</p>
                    </CardHeader>
                    <CardContent className="text-left">
                        <div className="text-3xl font-black text-amber-700">{formatCurrency(stats.availablePayouts)}</div>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-100">
                    <CardHeader className="pb-2 text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Logged Campaigns</p>
                    </CardHeader>
                    <CardContent className="text-left">
                        <div className="text-3xl font-black text-blue-700">{stats.totalActivity}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 shadow-xl border-none text-left">
                    <CardHeader className="text-left border-b bg-muted/20">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Active Performance Roster
                        </CardTitle>
                        <CardDescription>Live snapshots of Associate earnings and engagement status.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <DataTable columns={columns} data={associates} />
                    </CardContent>
                </Card>

                <div className="space-y-6 text-left">
                    <Card className="shadow-lg border-none text-left">
                        <CardHeader className="text-left">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-left">
                                <Activity className="h-4 w-4 text-primary" />
                                Recent Outreach Logs
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 text-left">
                             <ScrollArea className="h-[400px] border-t">
                                <div className="divide-y text-left">
                                    {activity.map(log => (
                                        <div key={log.id} className="p-4 space-y-2 text-left bg-white hover:bg-slate-50 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2">
                                                    <Badge className="bg-blue-600 text-white border-none uppercase text-[8px] h-4">
                                                        {log.metadata?.platform || 'Social'}
                                                    </Badge>
                                                    <span className="text-xs font-bold">{log.userName}</span>
                                                </div>
                                                <span className="text-[9px] font-mono text-muted-foreground">
                                                    {formatDateSafe(log.timestamp, "dd MMM, HH:mm")}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-tight italic">
                                                {log.details}
                                            </p>
                                            {log.metadata?.liveUrl && (
                                                <a 
                                                    href={log.metadata.liveUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 text-[9px] font-bold text-primary hover:underline"
                                                >
                                                    <ExternalLink className="h-2.5 w-2.5" />
                                                    Inspect Live Post
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                    {activity.length === 0 && (
                                        <div className="p-12 text-center text-muted-foreground opacity-50 space-y-2">
                                            <Activity className="h-8 w-8 mx-auto" />
                                            <p className="text-xs font-bold uppercase tracking-widest">No verified posts yet</p>
                                        </div>
                                    )}
                                </div>
                             </ScrollArea>
                        </CardContent>
                        <CardFooter className="bg-muted/30 p-4 rounded-b-xl border-t">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                    Associate commission is triggered automatically upon successful referral. Use these logs to verify that the social posts align with brand integrity guidelines.
                                </p>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
