'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Mail, Globe, Zap, AlertTriangle, CheckCircle2, Info, Lock, Server, Terminal } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * ADMIN TECHNICAL GUIDES
 * Provides strategic advice on email deliverability, account blocks, and forensic outreach.
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
                    <p className="text-muted-foreground">Technical blueprints for bypassing blocks and maintaining high-velocity flow.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Outbound Block Solution */}
                <Card className="lg:col-span-2 shadow-xl border-none">
                    <CardHeader className="bg-slate-900 text-white rounded-t-xl">
                        <div className="flex items-center gap-3">
                            <Server className="h-6 w-6 text-primary" />
                            <CardTitle className="text-xl font-headline">Solving Outbound Account Blocks</CardTitle>
                        </div>
                        <CardDescription className="text-slate-400">Moving from Personal Inboxes to Transactional APIs.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg border-l-4 border-primary pl-4 text-foreground">The "Account Lock" Issue</h3>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                If you are using **Outlook Desktop** or a standard **Microsoft 365** business account to send blasts, you will eventually be hit by "Outbound Spam Restrictions." This isn't the recipient blocking you—it's Microsoft stopping you from sending.
                            </p>
                            
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-3">
                                <p className="text-xs font-bold text-amber-900 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" /> 
                                    The Way Forward: Transactional Dispatch
                                </p>
                                <p className="text-[11px] text-amber-800 leading-relaxed">
                                    Instead of clicking "Open Outlook," you must use the **Automated Dispatch** tool. This tool is designed to route emails through a dedicated Transactional API (like SendGrid or AWS SES). These services have a "High Trust Score" and do not have the same sending locks as personal business accounts.
                                </p>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <h3 className="font-bold text-lg flex items-center gap-2 text-foreground"><Zap className="h-5 w-5 text-amber-500" /> Deliverability Protocol</h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-bold text-foreground">Zero-Step Sending</p>
                                        <p className="text-muted-foreground leading-tight">The "Automated Dispatch" button removes the human from the loop. It sends the mail directly from the server, bypassing your local Defender and desktop software.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-bold text-foreground">Content Variance</p>
                                        <p className="text-muted-foreground leading-tight">Always use the **Version Selector (V1-V5)**. Sending identical text in bulk is the fastest way to get your domain (even on SendGrid) flagged as spam.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-bold text-foreground">Google Workspace Web</p>
                                        <p className="text-muted-foreground leading-tight">If you must send manually, use **Gmail Web** in a browser. This avoids local machine triggers from Outlook Desktop that can alert local Defender instances.</p>
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
                            <p>To maintain high-fidelity data, always use the <strong>Duplicate Cleaner</strong>. The "Name + Email" rule ensures you consolidate duplicates while preserving branch variations.</p>
                            <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase">Data Shield Active</Badge>
                        </CardContent>
                    </Card>

                    <Alert className="bg-blue-50 border-blue-200">
                        <Info className="h-5 w-5 text-blue-600" />
                        <div className="ml-2">
                            <AlertTitle className="text-xs font-bold uppercase tracking-widest text-blue-800">API Readiness</AlertTitle>
                            <AlertDescription className="text-[10px] text-blue-700 leading-tight mt-1">
                                We have stabilized the `dispatchEngagement` API. It is now ready to be connected to a production SMTP key (e.g. SendGrid) whenever you are ready to scale.
                            </AlertDescription>
                        </div>
                    </Alert>

                    <Card className="bg-primary/5 border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Terminal className="h-4 w-4 text-primary" />
                                Forensic Tracking
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-[11px] leading-relaxed text-muted-foreground">
                            Every Automated Dispatch includes a hidden 1x1 pixel. When the recipient opens the mail, the CRM updates their status to "Read" automatically in the Oversight Timeline.
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
