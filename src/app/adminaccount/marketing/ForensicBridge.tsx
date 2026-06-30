'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import { 
    Loader2, Zap, Play, Pause, RotateCcw, ShieldCheck, Search, Database, 
    AlertTriangle, CheckCircle2, Globe, Mail, Smartphone, Activity, BarChart3, Users
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
    return await response.json();
}

const BRIDGE_STORAGE_KEY = 'lf_forensic_bridge_state';

export default function ForensicBridge({ audience }: { audience: string }) {
    const { toast } = useToast();
    const [status, setStatus] = useState<'idle' | 'scanning' | 'running' | 'paused' | 'completed'>('idle');
    const [queue, setQueue] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [logs, setLogs] = useState<any[]>([]);
    const [isScanning, setIsScanning] = useState(false);

    // Session Statistics
    const [stats, setStats] = useState({
        domains: 0,
        emails: 0,
        leadership: 0,
        errors: 0
    });

    // Restore state from LocalStorage on mount
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

    // Save state to LocalStorage whenever it changes
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
                limit: 5000 
            });
            
            if (!res.success) throw new Error(res.error);
            
            const needsEnrichment = (res.data || []).filter((p: any) => 
                !p.website || 
                !p.email || 
                p.email.includes('locked') || 
                !p.contactPerson || 
                p.contactPerson === 'Locked' ||
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
                toast({ title: "Analysis Complete", description: `Found ${needsEnrichment.length} records requiring enrichment.` });
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
            // Re-fetch status within loop to check for pause/stop signals
            let currentStatus: string = 'running';
            setStatus(s => {
                currentStatus = s;
                return s;
            });
            
            // This is a tick-based check. Since setStatus is async, we use a bit of a delay or status ref
            // For this UI pattern, we just break if we are no longer 'running'
            if (currentStatus !== 'running' && pointer > currentIndex) break;

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
                        leadership: prev.leadership + (res.data?.contactPerson ? 1 : 0),
                        errors: prev.errors
                    }));

                    setLogs(prev => [{ 
                        id: Date.now() + 1, 
                        msg: `Bridge Successful: ${name} verified and promoted.`, 
                        type: 'success',
                        data: res.data 
                    }, ...prev].slice(0, 50));
                } else {
                    throw new Error(res.error);
                }

                await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (err: any) {
                setStats(prev => ({ ...prev, errors: prev.errors + 1 }));
                setLogs(prev => [{ 
                    id: Date.now() + 2, 
                    msg: `Bridge Failed for ${name}: ${err.message}`, 
                    type: 'error' 
                }, ...prev].slice(0, 50));
                
                if (err.message?.includes('auth/')) {
                    setStatus('paused');
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 3000));
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
                                <Zap className="h-8 w-8 text-primary animate-pulse" />
                                Automated Forensic Bridge
                            </CardTitle>
                            <CardDescription className="text-slate-400 mt-1 text-left">
                                High-velocity automated discovery pipeline for {audience} registry.
                            </CardDescription>
                        </div>
                        <div className="flex gap-2 text-left">
                            <Button variant="outline" size="sm" onClick={handleReset} className="border-white/10 text-white hover:bg-white/10">
                                <RotateCcw className="h-4 w-4 mr-2" /> Reset Session
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
                                <p className="text-slate-400 max-w-sm mx-auto">Scan the {audience} registry to identify records missing verified domains and leadership data.</p>
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
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 text-left">Queue Progress</p>
                                        <p className="text-3xl font-black">{currentIndex} <span className="text-xs text-slate-500 font-bold">/ {queue.length}</span></p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white/5 border-white/10 text-white shadow-none">
                                    <CardContent className="pt-6 text-left">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Domains Verified</p>
                                        <p className="text-3xl font-black text-blue-400">{stats.domains}</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white/5 border-white/10 text-white shadow-none">
                                    <CardContent className="pt-6 text-left">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Emails Mapped</p>
                                        <p className="text-3xl font-black text-green-400">{stats.emails}</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white/5 border-white/10 text-white shadow-none">
                                    <CardContent className="pt-6 text-left">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">CEOs Identified</p>
                                        <p className="text-3xl font-black text-purple-400">{stats.leadership}</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-3 text-left">
                                <div className="flex justify-between items-end px-1 text-left">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pipeline Completion</Label>
                                    <span className="text-[10px] font-mono text-primary font-bold">{progress.toFixed(1)}%</span>
                                </div>
                                <Progress value={progress} className="h-3 bg-white/5" />
                            </div>

                            <div className="flex justify-center gap-4 text-left">
                                {status !== 'running' ? (
                                    <Button size="lg" className="h-14 px-12 font-black uppercase text-xs tracking-widest bg-primary hover:bg-primary/90 text-white" onClick={startEnrichment} disabled={status === 'completed'}>
                                        <Play className="mr-2 h-4 w-4" /> {currentIndex > 0 ? 'Resume Pipeline' : 'Start Auto-Enrichment'}
                                    </Button>
                                ) : (
                                    <Button size="lg" variant="outline" className="h-14 px-12 font-black uppercase text-xs tracking-widest border-white/20 text-white" onClick={() => setStatus('paused')}>
                                        <Pause className="mr-2 h-4 w-4" /> Pause Pipeline
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {(queue.length > 0 || logs.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
                    <Card className="text-left shadow-lg border-none bg-white">
                        <CardHeader className="text-left border-b bg-muted/20">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-left text-foreground">
                                <Activity className="h-4 w-4 text-primary" />
                                Live Intelligence Feed
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 text-left">
                            <ScrollArea className="h-80 text-left">
                                <div className="divide-y text-left">
                                    {logs.map(log => (
                                        <div key={log.id} className="p-4 flex items-start gap-3 text-left bg-white hover:bg-slate-50 transition-colors">
                                            {log.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> : 
                                             log.type === 'error' ? <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" /> :
                                             <Loader2 className="h-4 w-4 text-primary animate-spin mt-0.5 shrink-0" />}
                                            <div className="text-left">
                                                <p className={cn("text-[11px] font-bold leading-tight text-left", log.type === 'error' && "text-destructive")}>{log.msg}</p>
                                                {log.data && (
                                                    <div className="flex gap-2 mt-2 flex-wrap text-left">
                                                        {log.data.website && <Badge variant="outline" className="text-[8px] h-4 border-primary/20 text-primary uppercase font-bold">Domain Secured</Badge>}
                                                        {log.data.email && <Badge variant="outline" className="text-[8px] h-4 border-primary/20 text-primary uppercase font-bold">Email Mapped</Badge>}
                                                        {log.data.contactPerson && <Badge variant="outline" className="text-[8px] h-4 border-primary/20 text-primary uppercase font-bold">Identity Verified</Badge>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {logs.length === 0 && <div className="p-12 text-center text-xs text-muted-foreground italic">Waiting for pipeline execution...</div>}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    <Card className="text-left shadow-lg border-none bg-white">
                        <CardHeader className="text-left border-b bg-muted/20">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-left text-foreground">
                                <BarChart3 className="h-4 w-4 text-primary" />
                                Batch Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-left p-6">
                            <div className="space-y-4 text-left text-foreground">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold flex items-center gap-2 text-foreground"><Globe className="h-4 w-4 text-blue-500"/> Domains Secured</span>
                                    <span className="font-mono font-black">{stats.domains}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold flex items-center gap-2 text-foreground"><Mail className="h-4 w-4 text-green-500"/> Direct E-mails Mapped</span>
                                    <span className="font-mono font-black">{stats.emails}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-foreground">
                                    <span className="font-bold flex items-center gap-2 text-foreground"><Users className="h-4 w-4 text-purple-500"/> Leadership Identified</span>
                                    <span className="font-mono font-black">{stats.leadership}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-t pt-4 text-foreground">
                                    <span className="font-bold flex items-center gap-2 text-destructive"><AlertTriangle className="h-4 w-4"/> Processing Errors</span>
                                    <span className="font-mono font-black text-destructive">{stats.errors}</span>
                                </div>
                            </div>
                            <Separator />
                            <div className="p-4 bg-muted/30 rounded-xl text-left border border-dashed border-muted">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 text-left">Persistence Enabled</p>
                                <p className="text-[11px] leading-relaxed italic text-foreground text-left">
                                    Your progress is saved locally. If you navigate away or refresh, you can resume exactly where you left off.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
