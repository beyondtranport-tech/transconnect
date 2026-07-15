'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import { 
    Loader2, Zap, Play, Pause, RotateCcw, ShieldCheck, Search, Database, 
    AlertTriangle, CheckCircle2, Globe, Mail, Smartphone, Activity, BarChart3, Users, Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

async function performAdminAction(token: string, action: string, payload: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        let message = `Server Error ${response.status}`;
        try {
            const errorJson = JSON.parse(errorText);
            message = errorJson.error || message;
        } catch (e) {}
        throw new Error(message);
    }
    
    return await response.json();
}

const BRIDGE_STORAGE_KEY = 'lf_forensic_bridge_state_v2';

export default function ForensicBridge({ audience }: { audience: string }) {
    const { toast } = useToast();
    const [status, setStatus] = useState<'idle' | 'scanning' | 'running' | 'paused' | 'completed' | 'cooldown'>('idle');
    const [queue, setQueue] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [logs, setLogs] = useState<any[]>([]);
    const [isScanning, setIsScanning] = useState(false);

    const [stats, setStats] = useState({
        domains: 0,
        emails: 0,
        leadership: 0,
        errors: 0
    });

    useEffect(() => {
        const saved = localStorage.getItem(BRIDGE_STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.audience === audience && parsed.queue?.length > 0) {
                    setQueue(parsed.queue);
                    setCurrentIndex(parsed.currentIndex || 0);
                    setStats(parsed.stats || { domains: 0, emails: 0, leadership: 0, errors: 0 });
                    setStatus('paused');
                }
            } catch (e) {
                console.error("Failed to restore bridge state", e);
            }
        }
    }, [audience]);

    useEffect(() => {
        if (queue.length > 0) {
            localStorage.setItem(BRIDGE_STORAGE_KEY, JSON.stringify({
                audience,
                queue,
                currentIndex,
                stats,
                timestamp: Date.now()
            }));
        }
    }, [queue, currentIndex, stats, audience]);

    const progress = useMemo(() => {
        if (queue.length === 0) return 0;
        return (currentIndex / queue.length) * 100;
    }, [currentIndex, queue.length]);

    const handleScanGaps = async () => {
        setIsScanning(true);
        setStatus('scanning');
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            
            let apiType = audience === 'isa' ? 'isa' : (audience === 'finance' ? 'finance' : (audience === 'drivers' ? 'driver' : audience.slice(0, -1)));
            
            const res = await performAdminAction(token, 'searchRegistry', { 
                type: apiType, 
                limit: 500 
            });
            
            const needsEnrichment = (res.data || []).filter((p: any) => 
                !p.website || 
                !p.email || 
                p.email.includes('locked') || 
                !p.marketingManager?.name ||
                p.status === 'new'
            );

            setQueue(needsEnrichment);
            setCurrentIndex(0);
            setLogs([]);
            setStats({ domains: 0, emails: 0, leadership: 0, errors: 0 });
            
            if (needsEnrichment.length === 0) {
                toast({ title: "Registry Fully Bridged", description: "No gapped records found." });
                setStatus('idle');
                localStorage.removeItem(BRIDGE_STORAGE_KEY);
            } else {
                toast({ title: "Analysis Complete", description: `Found ${needsEnrichment.length} records to bridge.` });
                setStatus('paused');
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Scan Failed", description: e.message });
            setStatus('idle');
        } finally {
            setIsScanning(false);
        }
    };

    const handleReset = () => {
        setStatus('idle');
        setQueue([]);
        setCurrentIndex(0);
        setLogs([]);
        setStats({ domains: 0, emails: 0, leadership: 0, errors: 0 });
        localStorage.removeItem(BRIDGE_STORAGE_KEY);
    };

    const startEnrichment = async () => {
        if (status === 'running' || queue.length === 0) return;
        
        setStatus('running');
        let pointer = currentIndex;

        while (pointer < queue.length) {
            let currentStatus: string = 'running';
            setStatus(s => {
                currentStatus = s;
                return s;
            });
            
            if (currentStatus !== 'running') break;

            const record = queue[pointer];
            const name = record.companyName || record.firstName || 'Unknown';
            
            setLogs(prev => [{ id: Date.now(), msg: `[${pointer + 1}/${queue.length}] Investigating ${name}...`, type: 'info' }, ...prev].slice(0, 50));

            try {
                const token = await getClientSideAuthToken();
                if (!token) throw new Error("Session expired.");

                const res = await performAdminAction(token, 'autoEnrichRecord', { 
                    id: record.id, 
                    type: (!record.type || record.type === 'lead') ? 'lead' : record.type 
                });

                if (res.success) {
                    setStats(prev => ({
                        domains: prev.domains + (res.data?.website ? 1 : 0),
                        emails: prev.emails + (res.data?.email ? 1 : 0),
                        leadership: prev.leadership + (res.data?.marketingManager ? 1 : 0),
                        errors: prev.errors
                    }));

                    setLogs(prev => [{ 
                        id: Date.now() + 1, 
                        msg: `Bridge Successful: ${name} verified.`, 
                        type: 'success',
                        data: res.data 
                    }, ...prev].slice(0, 50));
                    
                    // SAFE DELAY: 15s between records to respect Search & AI quotas
                    await new Promise(resolve => setTimeout(resolve, 15000));
                }

            } catch (err: any) {
                const isQuotaError = err.message?.includes('429') || err.message?.includes('QUOTA') || err.message?.includes('exhausted');
                
                if (isQuotaError) {
                    setStatus('cooldown');
                    setLogs(prev => [{ id: Date.now() + 2, msg: `Quota Exhausted. Initiating 65s mandatory sleep...`, type: 'error' }, ...prev].slice(0, 50));
                    toast({ variant: 'destructive', title: "Quota Limit Hit", description: "The bridge is resting for 65 seconds to reset quotas." });
                    await new Promise(resolve => setTimeout(resolve, 65000));
                    setStatus('running');
                    continue; 
                } else {
                    setStats(prev => ({ ...prev, errors: prev.errors + 1 }));
                    setLogs(prev => [{ id: Date.now() + 3, msg: `Bridge Failed for ${name}: ${err.message}`, type: 'error' }, ...prev].slice(0, 50));
                    await new Promise(resolve => setTimeout(resolve, 10000));
                }
            }

            pointer++;
            setCurrentIndex(pointer);

            if (pointer === queue.length) {
                setStatus('completed');
                toast({ title: "Batch Complete", description: "Successfully processed entire queue." });
                localStorage.removeItem(BRIDGE_STORAGE_KEY);
            }
        }
    };

    return (
        <div className="space-y-6 text-left text-foreground">
            <Card className="border-primary/20 bg-slate-900 text-white shadow-2xl">
                <CardHeader>
                    <div className="flex justify-between items-start text-left">
                        <div className="text-left">
                            <CardTitle className="text-2xl font-black font-headline flex items-center gap-3 text-left text-white">
                                <Zap className={cn("h-8 w-8 text-primary", status === 'running' && "animate-pulse")} />
                                Forensic Bridge V4 (Slow & Steady)
                            </CardTitle>
                            <CardDescription className="text-slate-400 mt-1 text-left">
                                Optimized Discovery for {audience} registry. Quota-aware execution.
                            </CardDescription>
                        </div>
                        <div className="flex gap-2 text-left">
                            <Button variant="outline" size="sm" onClick={handleReset} className="border-white/10 text-white hover:bg-white/10">
                                <RotateCcw className="h-4 w-4 mr-2" /> Reset
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8 text-left">
                    {status === 'idle' ? (
                        <div className="py-12 text-center space-y-6 text-left">
                            <div className="bg-white/5 p-8 rounded-full w-fit mx-auto border border-white/10">
                                <Database className="h-16 w-16 text-primary opacity-50" />
                            </div>
                            <div className="space-y-2 text-center text-foreground text-left">
                                <h3 className="text-xl font-bold text-white">Registry Analysis Required</h3>
                                <p className="text-slate-400 max-w-sm mx-auto">Scan the {audience} registry to identifying records missing verified domains and leadership data.</p>
                            </div>
                            <Button size="lg" onClick={handleScanGaps} disabled={isScanning} className="h-14 px-12 font-black uppercase text-xs tracking-widest shadow-lg">
                                {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4" />}
                                Analyze Registry Gaps
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6 text-left">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
                                <Card className="bg-white/5 border-white/10 text-white shadow-none">
                                    <CardContent className="pt-6">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 text-left">Queue</p>
                                        <p className="text-3xl font-black">{currentIndex} <span className="text-xs text-slate-500 font-bold">/ {queue.length}</span></p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white/5 border-white/10 text-white shadow-none">
                                    <CardContent className="pt-6 text-left">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Domains</p>
                                        <p className="text-3xl font-black text-blue-400">{stats.domains}</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white/5 border-white/10 text-white shadow-none">
                                    <CardContent className="pt-6 text-left">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Emails</p>
                                        <p className="text-3xl font-black text-green-400">{stats.emails}</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white/5 border-white/10 text-white shadow-none">
                                    <CardContent className="pt-6 text-left">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Errors</p>
                                        <p className="text-3xl font-black text-destructive">{stats.errors}</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-3 text-left">
                                <div className="flex justify-between items-end px-1 text-left">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pipeline Status: {status.toUpperCase()}</Label>
                                    <span className="text-[10px] font-mono text-primary font-bold">{progress.toFixed(1)}%</span>
                                </div>
                                <Progress value={progress} className="h-3 bg-white/5" />
                            </div>

                            <div className="flex flex-col items-center gap-4 text-left">
                                {status === 'cooldown' && (
                                    <div className="flex items-center gap-2 text-amber-500 animate-pulse text-xs font-bold uppercase tracking-widest">
                                        <Clock className="h-4 w-4" /> Resetting API Quotas (65s)...
                                    </div>
                                )}
                                <div className="flex justify-center gap-4">
                                    {status !== 'running' && status !== 'cooldown' ? (
                                        <Button size="lg" className="h-14 px-12 font-black uppercase text-xs tracking-widest bg-primary hover:bg-primary/90 text-white" onClick={startEnrichment} disabled={status === 'completed'}>
                                            <Play className="mr-2 h-4 w-4" /> {currentIndex > 0 ? 'Resume' : 'Start Bridge'}
                                        </Button>
                                    ) : (
                                        <Button size="lg" variant="outline" className="h-14 px-12 font-black uppercase text-xs tracking-widest border-white/20 text-white" onClick={() => setStatus('paused')}>
                                            <Pause className="mr-2 h-4 w-4" /> Pause
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {(queue.length > 0 || logs.length > 0) && (
                <Card className="text-left shadow-lg border-none bg-white">
                    <CardHeader className="text-left border-b bg-muted/20">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-left text-foreground">
                            <Activity className="h-4 w-4 text-primary" />
                            Live Bridge feed
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 text-left">
                        <ScrollArea className="h-64 text-left">
                            <div className="divide-y text-left">
                                {logs.map(log => (
                                    <div key={log.id} className="p-4 flex items-start gap-3 text-left bg-white hover:bg-slate-50 transition-colors">
                                        {log.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> : 
                                         log.type === 'error' ? <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" /> :
                                         <Loader2 className="h-4 w-4 text-primary animate-spin mt-0.5 shrink-0" />}
                                        <div className="text-left flex-1">
                                            <p className={cn("text-[11px] font-bold leading-tight text-left", log.type === 'error' && "text-destructive")}>{log.msg}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}