'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import { 
    Loader2, Zap, Play, Pause, RotateCcw, ShieldCheck, Search, Database, 
    AlertTriangle, CheckCircle2, Globe, Mail, Smartphone, Activity
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

export default function ForensicBridge({ audience }: { audience: string }) {
    const { toast } = useToast();
    const [status, setStatus] = useState<'idle' | 'scanning' | 'running' | 'paused' | 'completed'>('idle');
    const [queue, setQueue] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [logs, setLogs] = useState<any[]>([]);
    const [isScanning, setIsScanning] = useState(false);

    // Progress math based on completed items
    const progress = useMemo(() => {
        if (queue.length === 0) return 0;
        return (currentIndex / queue.length) * 100;
    }, [currentIndex, queue.length]);

    /**
     * STAGE 1: SCAN FOR GAPS
     * Identifies records missing critical data.
     */
    const handleScanGaps = async () => {
        setIsScanning(true);
        setStatus('scanning');
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            
            let apiType = audience === 'isa' ? 'isa' : (audience === 'finance' ? 'finance' : (audience === 'drivers' ? 'driver' : audience.slice(0, -1)));
            const res = await performAdminAction(token, 'searchRegistry', { type: apiType, limit: 1000 });
            
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
            toast({ title: "Scan Complete", description: `Found ${needsEnrichment.length} records requiring forensic enrichment.` });
            setStatus('paused');
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Scan Failed", description: e.message });
            setStatus('idle');
        } finally {
            setIsScanning(false);
        }
    };

    /**
     * STAGE 2: ROBUST AUTO-PILOT ENRICHMENT
     * Uses a pointer-based loop to prevent state-stale closure issues.
     * Token is refreshed every iteration to prevent expiry errors.
     */
    const startEnrichment = async () => {
        if (status === 'running' || queue.length === 0) return;
        
        setStatus('running');
        
        // Use a local pointer to avoid stale index issues during re-renders
        let pointer = currentIndex;

        while (pointer < queue.length) {
            // Check for pause signal
            let isPaused = false;
            setStatus(current => {
                if (current !== 'running') isPaused = true;
                return current;
            });
            if (isPaused) break;

            const record = queue[pointer];
            const name = record.companyName || record.firstName || 'Unknown';
            
            setLogs(prev => [{ id: Date.now(), msg: `[${pointer + 1}/${queue.length}] Investigating ${name}...`, type: 'info' }, ...prev].slice(0, 50));

            try {
                // REFRESH TOKEN EVERY ITERATION TO PREVENT auth/id-token-expired
                const token = await getClientSideAuthToken();
                if (!token) throw new Error("Could not refresh authentication token.");

                const res = await performAdminAction(token, 'autoEnrichRecord', { 
                    id: record.id, 
                    type: (!record.type || record.type === 'lead') ? 'lead' : record.type 
                });

                if (res.success) {
                    setLogs(prev => [{ 
                        id: Date.now() + 1, 
                        msg: `Bridge Successful: ${name} verified and promoted to Qualified.`, 
                        type: 'success',
                        data: res.data 
                    }, ...prev].slice(0, 50));
                } else {
                    throw new Error(res.error);
                }

                // Small delay to respect rate limits
                await new Promise(resolve => setTimeout(resolve, 1500));

            } catch (err: any) {
                const isTokenError = err.message?.includes('id-token-expired') || err.message?.includes('auth/');
                setLogs(prev => [{ 
                    id: Date.now() + 2, 
                    msg: `Bridge Failed for ${name}: ${err.message}`, 
                    type: 'error' 
                }, ...prev].slice(0, 50));
                
                // If it's a token error, stop the loop and ask for manual resume to be safe
                if (isTokenError) {
                    setStatus('paused');
                    toast({ variant: 'destructive', title: "Auth Session Expired", description: "Loop paused. Please click Resume to refresh credentials and continue." });
                    break;
                }

                // Longer wait after non-auth failure
                await new Promise(resolve => setTimeout(resolve, 3000));
            }

            pointer++;
            setCurrentIndex(pointer);

            if (pointer === queue.length) {
                setStatus('completed');
                toast({ title: "Pipeline Complete", description: `Successfully processed all ${queue.length} records.` });
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
                            <Button variant="outline" size="sm" onClick={() => { setStatus('idle'); setQueue([]); setCurrentIndex(0); setLogs([]); }} className="border-white/10 text-white hover:bg-white/10">
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
                            <div className="space-y-2 text-center">
                                <h3 className="text-xl font-bold">Registry Analysis Required</h3>
                                <p className="text-slate-400 max-w-sm mx-auto">Scan the {audience} registry to identify records missing verified domains and leadership data.</p>
                            </div>
                            <Button size="lg" onClick={handleScanGaps} disabled={isScanning} className="h-14 px-12 font-black uppercase text-xs tracking-widest shadow-lg">
                                {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4" />}
                                Analyze Registry Gaps
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6 text-left">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                                <Card className="bg-white/5 border-white/10 text-white shadow-none">
                                    <CardContent className="pt-6">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Queue Size</p>
                                        <p className="text-3xl font-black">{queue.length}</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white/5 border-white/10 text-white shadow-none">
                                    <CardContent className="pt-6">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Processed</p>
                                        <p className="text-3xl font-black">{currentIndex}</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white/5 border-white/10 text-white shadow-none">
                                    <CardContent className="pt-6">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Status</p>
                                        <Badge className={cn(
                                            "mt-1 uppercase font-black text-[10px]",
                                            status === 'running' ? "bg-green-600 animate-pulse" : "bg-slate-700"
                                        )}>
                                            {status}
                                        </Badge>
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
                                    <Button size="lg" className="h-14 px-12 font-black uppercase text-xs tracking-widest bg-primary" onClick={startEnrichment} disabled={status === 'completed'}>
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
                                                <p className={cn("text-[11px] font-bold leading-tight", log.type === 'error' && "text-destructive")}>{log.msg}</p>
                                                {log.data && (
                                                    <div className="flex gap-2 mt-2 flex-wrap">
                                                        {log.data.website && <Badge variant="outline" className="text-[8px] h-4 border-primary/20 text-primary uppercase font-bold">Domain Verified</Badge>}
                                                        {log.data.email && <Badge variant="outline" className="text-[8px] h-4 border-primary/20 text-primary uppercase font-bold">Email Mapped</Badge>}
                                                        {log.data.contactPerson && <Badge variant="outline" className="text-[8px] h-4 border-primary/20 text-primary uppercase font-bold">CEO Identified</Badge>}
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
                                <ShieldCheck className="h-4 w-4 text-primary" />
                                Pipeline Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-left p-6">
                            <div className="space-y-2 text-left">
                                <h4 className="text-xs font-bold text-foreground">Automation Rules</h4>
                                <ul className="space-y-2 text-[11px] text-muted-foreground text-left">
                                    <li className="flex items-start gap-2"><div className="h-1 w-1 bg-primary rounded-full mt-1.5 shrink-0" /> Real-time domain verification via Google Search.</li>
                                    <li className="flex items-start gap-2"><div className="h-1 w-1 bg-primary rounded-full mt-1.5 shrink-0" /> Sequential processing to maintain data integrity.</li>
                                    <li className="flex items-start gap-2"><div className="h-1 w-1 bg-primary rounded-full mt-1.5 shrink-0" /> Automatic record promotion to <strong>"Qualified"</strong> upon successful bridge.</li>
                                    <li className="flex items-start gap-2"><div className="h-1 w-1 bg-primary rounded-full mt-1.5 shrink-0" /> 1.5s safety throttle to prevent API rate-limiting.</li>
                                </ul>
                            </div>
                            <Separator />
                            <div className="p-4 bg-muted/30 rounded-xl text-left border border-dashed border-muted">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Operational Note</p>
                                <p className="text-[11px] leading-relaxed italic text-foreground">
                                    Enrichment tasks are processed one-by-one to ensure maximum fidelity. If the pipeline pauses, you can resume from exactly where it stopped.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
