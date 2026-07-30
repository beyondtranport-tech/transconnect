'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Wrench, Zap, RefreshCcw, FileText, Banknote, ShieldAlert, Loader2, Info, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function UtilitiesContent() {
    const { toast } = useToast();
    const [isRunning, setIsRunning] = useState<string | null>(null);

    const handleRunUtility = async (id: string, label: string) => {
        setIsRunning(id);
        try {
            // Simulated delay for prototype
            await new Promise(res => setTimeout(res, 1500));
            toast({ title: "Utility Complete", description: `${label} task has been successfully processed.` });
        } catch (e) {
            toast({ variant: 'destructive', title: "Process Error" });
        } finally {
            setIsRunning(null);
        }
    };

    const tools = [
        { id: 'prime_update', label: 'Prime Rate Syncer', icon: Banknote, desc: 'Recalculate all active interest-linked schedules based on latest Prime Rate policy.' },
        { id: 'arrear_interest', label: 'Raise Arrear Interest', icon: Zap, desc: 'Batch process all overdue accounts and apply compound penalty interest.' },
        { id: 'mass_statements', label: 'Mass Statement Dispatch', icon: FileText, desc: 'Generate and email monthly statements to all active debtors.' },
        { id: 'install_raise', label: 'Raise Installments', icon: Clock, desc: 'Manually trigger the monthly installment raising cycle for the current period.' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-left text-foreground">
            <div className="text-left">
                <h1 className="text-3xl font-black font-headline tracking-tight flex items-center gap-3 text-left">
                    <Wrench className="h-8 w-8 text-primary" />
                    Global Lending Utilities
                </h1>
                <p className="text-muted-foreground mt-1">Operational maintenance tools for high-velocity ledger management.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left text-foreground">
                {tools.map((tool) => (
                    <Card key={tool.id} className="border-none shadow-xl bg-white hover:shadow-2xl transition-all group text-left">
                        <CardHeader className="p-8 pb-4 text-left">
                            <div className="bg-primary/10 p-3 rounded-xl w-fit group-hover:bg-primary group-hover:text-white transition-colors">
                                <tool.icon className="h-6 w-6" />
                            </div>
                            <CardTitle className="text-xl font-bold mt-4">{tool.label}</CardTitle>
                            <CardDescription className="text-sm leading-relaxed mt-2 text-left">{tool.desc}</CardDescription>
                        </CardHeader>
                        <CardFooter className="p-8 pt-0 text-left">
                            <Button 
                                className="w-full h-11 font-bold gap-2 text-white" 
                                onClick={() => handleRunUtility(tool.id, tool.label)}
                                disabled={!!isRunning}
                            >
                                {isRunning === tool.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                                {isRunning === tool.id ? 'Processing...' : `Execute ${tool.label}`}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <Card className="bg-slate-900 text-white border-none shadow-2xl p-10 rounded-[2.5rem] relative overflow-hidden text-left">
                <div className="absolute top-0 right-0 p-12 opacity-5"><ShieldAlert className="h-40 w-40" /></div>
                <div className="relative z-10 space-y-6 text-left text-white">
                    <div className="flex items-center gap-4 text-left text-white">
                        <div className="p-3 bg-primary/20 rounded-2xl"><Info className="h-8 w-8 text-primary" /></div>
                        <h3 className="text-2xl font-black uppercase tracking-tight text-left">Administrative Safety Protocol</h3>
                    </div>
                    <p className="text-slate-400 text-lg leading-relaxed max-w-4xl text-left">
                        Execution of Global Utilities is permanent and impacts all financial ledgers across the ecosystem. Ensure a **Full Database Backup** has been performed before initiating mass recalculations or interest cycles.
                    </p>
                    <div className="flex gap-4 pt-4 text-left text-white">
                        <Badge className="bg-white/10 text-white border-none px-4 py-1 font-bold uppercase tracking-widest text-[10px]">Registry Audit Ready</Badge>
                        <Badge className="bg-white/10 text-white border-none px-4 py-1 font-bold uppercase tracking-widest text-[10px]">Fiduciary Shield Active</Badge>
                    </div>
                </div>
            </Card>
        </div>
    );
}
