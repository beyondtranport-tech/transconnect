'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Mail, Globe, Zap, AlertTriangle, CheckCircle2, Info, Lock } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

/**
 * ADMIN TECHNICAL GUIDES
 * Provides strategic advice on email deliverability, Workspace setup, and forensic outreach.
 */
export default function AdminGuides() {
    return (
        <div className="space-y-8 text-left text-foreground">
            <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-xl">
                    <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <div className="text-left">
                    <h1 className="text-3xl font-black font-headline">Platform Oversight & Guides</h1>
                    <p className="text-muted-foreground">Technical blueprints for maintaining high-velocity industrial flow.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Email Deliverability Guide */}
                <Card className="lg:col-span-2 shadow-xl border-none">
                    <CardHeader className="bg-slate-900 text-white rounded-t-xl">
                        <div className="flex items-center gap-3">
                            <Mail className="h-6 w-6 text-primary" />
                            <CardTitle className="text-xl font-headline">Bypassing Microsoft Defender</CardTitle>
                        </div>
                        <CardDescription className="text-slate-400">Strategizing for your Google Workspace transition.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg border-l-4 border-primary pl-4">The "Trust Signals" Protocol</h3>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                Switching to Google Workspace prevents Google from blocking you, but Microsoft Defender will still analyze your emails. To ensure your "Digital Handshake" lands in the Inbox, you must configure these three records in your DNS:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                <div className="p-4 bg-muted/30 rounded-xl border border-dashed">
                                    <p className="text-[10px] font-black uppercase text-primary mb-1 tracking-widest">SPF Record</p>
                                    <p className="text-xs font-medium">Authorizes Google to send mail on behalf of your domain.</p>
                                </div>
                                <div className="p-4 bg-muted/30 rounded-xl border border-dashed">
                                    <p className="text-[10px] font-black uppercase text-primary mb-1 tracking-widest">DKIM Key</p>
                                    <p className="text-xs font-medium">Adds a digital signature to every email to prove it wasn't tampered with.</p>
                                </div>
                                <div className="p-4 bg-muted/30 rounded-xl border border-dashed">
                                    <p className="text-[10px] font-black uppercase text-primary mb-1 tracking-widest">DMARC Policy</p>
                                    <p className="text-xs font-medium">Tells receiving servers (like Outlook) how to handle failed checks.</p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <h3 className="font-bold text-lg flex items-center gap-2"><Zap className="h-5 w-5 text-amber-500" /> Outreach Velocity Rules</h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-bold text-foreground">Rotate Your Versions</p>
                                        <p className="text-muted-foreground leading-tight">Use the V1-V5 selector in the Engagement Wizard. Deterministic variance prevents filters from identifying a "bulk pattern".</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-bold text-foreground">Limit Batch Size</p>
                                        <p className="text-muted-foreground leading-tight">Do not send more than 20 handshakes per hour from a single standard seat. Space out your activity to look "human".</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-bold text-foreground">Monitor Open Rates</p>
                                        <p className="text-muted-foreground leading-tight">If your "Read" status badges stop appearing in the Registry, you may be temporarily shadow-banned. Switch to Gmail Web immediately.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* Registry Management Guide */}
                <div className="space-y-6">
                    <Card className="border-none shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <Database className="h-4 w-4 text-primary" />
                                Registry Integrity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-xs leading-relaxed text-muted-foreground">
                            <p>To maintain high-fidelity data, always use the <strong>Duplicate Cleaner</strong> after a large AI import. COLLISION prevention is active, but name variations (e.g. "ABC Ltd" vs "ABC") may still occur.</p>
                            <Badge className="bg-primary/10 text-primary border-none text-[9px] uppercase font-black">Data Shield Active</Badge>
                        </CardContent>
                    </Card>

                    <Alert className="bg-amber-50 border-amber-200">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <div className="ml-2">
                            <AlertTitle className="text-xs font-bold uppercase tracking-widest text-amber-800">Critical Warning</AlertTitle>
                            <AlertDescription className="text-[10px] text-amber-700 leading-tight mt-1">
                                Never use your main business domain for massive automated blasts. If the domain gets blacklisted by Microsoft, your primary business emails will also bounce.
                            </AlertDescription>
                        </div>
                    </Alert>

                    <Card className="bg-primary/5 border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Info className="h-4 w-4 text-primary" />
                                The Handshake Logic
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-[11px] leading-relaxed text-muted-foreground">
                            The Handshake isn't just a consent form; it's a verification gate. A record is only promoted to "Active Participant" once the digital signature is recorded in the POPI ledger.
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
