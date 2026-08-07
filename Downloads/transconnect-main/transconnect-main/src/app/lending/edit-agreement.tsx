'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
    Loader2, Save, ArrowLeft, ArrowRight, FileSignature, 
    Truck, Building, User, Banknote, Database, Info, Search, 
    CheckCircle2, Scale, UserCheck, Zap, Handshake, ShieldCheck,
    ClipboardCheck, Landmark, Lock, RefreshCcw, Table as TableIcon,
    AlertTriangle, Unlock, Shield, Calendar as CalendarIcon, Percent,
    Maximize2, Eye, X
} from 'lucide-react';
import { getClientSideAuthToken, useFirestore, useMemoFirebase, useCollection, useDoc } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { cn, fetchFromAdminAPI, formatCurrency } from '@/lib/utils';
import { doc, collection, query, where, setDoc, serverTimestamp } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { generateAmortizationSchedule } from './loan-calculations';

// --- SCHEMA ---
const agreementSubSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  assetId: z.string().optional().nullable(),
  type: z.string().min(1, 'Agreement type is required'),
  description: z.string().min(1, 'Description is required'),
  totalAdvanced: z.coerce.number().positive('Amount must be positive'),
  interestRate: z.coerce.number().min(0, "Rate can't be negative"),
  numberOfInstallments: z.coerce.number().int().positive('Term must be a positive integer'),
  creditorId: z.string().optional().nullable(),
  creditorName: z.string().optional().nullable(),
  liabilityAmount: z.coerce.number().min(0).optional(),
  
  // Technical Terms Fields
  isLinked: z.boolean().default(false),
  isArrearInterest: z.boolean().default(false),
  isPaymentInAdvance: z.boolean().default(false),
  firstInstallmentDate: z.string().min(1, 'First installment date is required'),
  residualValue: z.coerce.number().min(0, "Residual value can't be negative").default(0),
  includeBalloonInLastInstallment: z.boolean().default(false),
});

const wizardSchema = z.object({
  agreement: agreementSubSchema,
});

type WizardFormValues = z.infer<typeof wizardSchema>;

// --- REUSABLE SCHEDULE TABLE COMPONENT ---

function ScheduleTable({ fullSchedule, heightClass = "h-96" }: { fullSchedule: any[], heightClass?: string }) {
    return (
        <ScrollArea className={`${heightClass} w-full rounded-xl border bg-white shadow-inner`}>
            <div className="min-w-[1000px] w-full">
                <Table className="w-full text-xs">
                    <TableHeader className="bg-slate-100 sticky top-0 z-10 text-left text-foreground shadow-sm">
                        <TableRow className="border-b border-slate-200">
                            <TableHead className="text-[9px] font-black uppercase text-left whitespace-nowrap px-3 py-3 w-16">Inst. #</TableHead>
                            <TableHead className="text-[9px] font-black uppercase text-left whitespace-nowrap px-3 py-3 w-28">Date</TableHead>
                            <TableHead className="text-[9px] font-black uppercase text-center whitespace-nowrap px-2 py-3 w-16">Billed</TableHead>
                            <TableHead className="text-[9px] font-black uppercase text-right whitespace-nowrap px-3 py-3 w-20">Rate p.a.</TableHead>
                            <TableHead className="text-[9px] font-black uppercase text-right whitespace-nowrap px-3 py-3 min-w-[110px]">Capital</TableHead>
                            <TableHead className="text-[9px] font-black uppercase text-right whitespace-nowrap px-3 py-3 min-w-[110px]">Interest</TableHead>
                            <TableHead className="text-[9px] font-black uppercase text-right whitespace-nowrap px-3 py-3 min-w-[120px]">Instalment</TableHead>
                            <TableHead className="text-[9px] font-black uppercase text-right whitespace-nowrap px-3 py-3 min-w-[120px]">Capital Paid</TableHead>
                            <TableHead className="text-[9px] font-black uppercase text-right whitespace-nowrap px-3 py-3 min-w-[120px]">Interest Paid</TableHead>
                            <TableHead className="text-[9px] font-black uppercase text-right whitespace-nowrap px-3 py-3 min-w-[150px] text-primary">Total Balance Outstanding</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="text-left text-foreground">
                        {fullSchedule.map((row) => {
                            const isRowZero = row.installmentNum === 0;
                            return (
                                <TableRow 
                                    key={row.installmentNum} 
                                    className={cn(
                                        "text-left text-foreground transition-colors border-b border-slate-100",
                                        isRowZero ? "bg-amber-500/10 font-black hover:bg-amber-500/15" : "hover:bg-slate-50/80"
                                    )}
                                >
                                    <TableCell className="font-mono text-xs font-bold px-3 py-2.5">{row.installmentNum}</TableCell>
                                    <TableCell className="font-bold text-xs whitespace-nowrap px-3 py-2.5">{row.date}</TableCell>
                                    <TableCell className="text-center px-2 py-2.5">
                                        {!isRowZero ? (
                                            <Checkbox checked={row.billed} disabled className="mx-auto h-3.5 w-3.5" />
                                        ) : (
                                            <span className="text-[10px] text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right text-xs px-3 py-2.5 whitespace-nowrap">{row.ratePa}%</TableCell>
                                    <TableCell className="text-right text-xs px-3 py-2.5 whitespace-nowrap font-mono">{isRowZero ? '—' : formatCurrency(row.capital)}</TableCell>
                                    <TableCell className="text-right text-xs text-amber-600 px-3 py-2.5 whitespace-nowrap font-mono">{isRowZero ? '—' : formatCurrency(row.interest)}</TableCell>
                                    <TableCell className="text-right text-xs font-bold px-3 py-2.5 whitespace-nowrap font-mono">{isRowZero ? '—' : formatCurrency(row.installment)}</TableCell>
                                    <TableCell className="text-right text-xs text-slate-600 px-3 py-2.5 whitespace-nowrap font-mono">{formatCurrency(row.capitalPaid)}</TableCell>
                                    <TableCell className="text-right text-xs text-slate-600 px-3 py-2.5 whitespace-nowrap font-mono">{formatCurrency(row.interestPaid)}</TableCell>
                                    <TableCell className="text-right text-xs font-mono font-black text-primary whitespace-nowrap px-3 py-2.5">
                                        {formatCurrency(row.totalBalanceOutstanding)}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </ScrollArea>
    );
}

// --- STEP COMPONENTS ---

function StepBorrower({ clients, isLocked }: { clients: any[], isLocked: boolean }) {
    const { control } = useFormContext<WizardFormValues>();
    return (
        <div className="space-y-6 animate-in fade-in duration-500 text-left">
            <h3 className="text-xl font-black font-headline flex items-center gap-2 text-left"><User className="h-6 w-6 text-primary"/> 1. Borrower Identity</h3>
            <fieldset disabled={isLocked} className="space-y-6 text-left">
                <FormField control={control} name="agreement.clientId" render={({ field }) => (
                    <FormItem className="text-left text-foreground">
                        <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest ml-1 text-left">Member Client (Borrower)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl><SelectTrigger className="h-12 border-2 bg-white font-bold text-left text-foreground"><SelectValue placeholder="Choose client..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                {clients.map((c:any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
            </fieldset>
        </div>
    );
}

function StepProtocol({ availableAssets, isLoadingAssets, isLocked, facilityProtocolVisibleFor }: { availableAssets: any[], isLoadingAssets: boolean, isLocked: boolean, facilityProtocolVisibleFor?: string[] }) {
    const { control, watch } = useFormContext<WizardFormValues>();
    const selectedType = watch('agreement.type');

    const showAssetBind = useMemo(() => {
        if (facilityProtocolVisibleFor && facilityProtocolVisibleFor.length > 0) {
            if (selectedType === 'installment-sale-term' && facilityProtocolVisibleFor.includes('Installment Sale')) return true;
            if (selectedType === 'rental-term' && facilityProtocolVisibleFor.includes('Lease / Rental')) return true;
            return false;
        }
        return selectedType === 'installment-sale-term' || selectedType === 'rental-term';
    }, [selectedType, facilityProtocolVisibleFor]);

    return (
        <div className="space-y-10 animate-in fade-in duration-500 text-left text-foreground">
            <h3 className="text-xl font-black font-headline flex items-center gap-2 text-left"><Scale className="h-6 w-6 text-primary"/> 2. Facility Protocol</h3>
            <fieldset disabled={isLocked} className="space-y-10 text-left text-foreground">
                <FormField control={control} name="agreement.type" render={({ field }) => (
                    <FormItem className="text-left text-foreground">
                        <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest ml-1 text-left">Agreement Class</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl><SelectTrigger className="h-12 border-2 bg-white font-black text-left text-foreground"><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="loan-pv-term">Loan / Working Capital</SelectItem>
                                <SelectItem value="installment-sale-term">Installment Sale</SelectItem>
                                <SelectItem value="rental-term">Lease / Rental</SelectItem>
                                <SelectItem value="discounting">Discounting / Factoring</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />

                {showAssetBind && (
                    <div className="p-8 border-2 border-dashed rounded-[2rem] bg-slate-50 space-y-4 text-left animate-in fade-in zoom-in-95 duration-300">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 text-left"><Truck className="h-4 w-4" /> Physical Asset Bind</h4>
                        <FormField control={control} name="agreement.assetId" render={({ field }) => (
                            <FormItem className="text-left text-foreground">
                                <Select onValueChange={field.onChange} value={field.value || ''}>
                                    <FormControl>
                                        <SelectTrigger className="h-14 border-2 bg-white font-bold text-left text-foreground">
                                            <SelectValue placeholder={isLoadingAssets ? "Scanning Register..." : "Select from available assets..."} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {availableAssets?.map((a:any) => (
                                            <SelectItem key={a.id} value={a.id}>{a.year} {a.make} {a.model} - {formatCurrency(a.costOfSale)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                )}
            </fieldset>
        </div>
    );
}

function StepTerms({ isLocked }: { isLocked: boolean }) {
    const { control, watch } = useFormContext<WizardFormValues>();
    const firstDate = watch('agreement.firstInstallmentDate');
    const installments = watch('agreement.numberOfInstallments');

    const calculatedLastInstallmentDate = useMemo(() => {
        if (!firstDate || !installments || installments <= 0) return '—';
        const date = new Date(firstDate);
        if (isNaN(date.getTime())) return '—';
        date.setMonth(date.getMonth() + (Number(installments) - 1));
        return date.toISOString().split('T')[0];
    }, [firstDate, installments]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-left text-foreground">
            <h3 className="text-xl font-black font-headline flex items-center gap-2 text-left"><FileSignature className="h-6 w-6 text-primary"/> 3. Technical Terms</h3>
            <fieldset disabled={isLocked} className="space-y-8 text-left text-foreground">
                <FormField control={control} name="agreement.description" render={({ field }) => (
                    <FormItem className="text-left">
                        <FormLabel className="text-[10px] font-black uppercase text-primary tracking-widest ml-1 text-left text-foreground">Deal Descriptor</FormLabel>
                        <FormControl><Textarea {...field} value={field.value || ''} className="h-20 border-2 bg-white font-bold text-base leading-relaxed" placeholder="Summarize the commercial purpose..." /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <FormField control={control} name="agreement.totalAdvanced" render={({ field }) => (
                        <FormItem className="text-left">
                            <FormLabel className="text-primary font-black uppercase text-[10px] tracking-widest ml-1 text-left">Principal (ZAR)</FormLabel>
                            <FormControl><Input type="number" {...field} className="h-12 border-2 bg-white font-black text-xl text-left" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={control} name="agreement.interestRate" render={({ field }) => (
                        <FormItem className="text-left">
                            <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">Rate (% p.a.)</FormLabel>
                            <FormControl><Input type="number" step="0.01" {...field} className="h-12 border-2 bg-white font-bold text-left" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={control} name="agreement.numberOfInstallments" render={({ field }) => (
                        <FormItem className="text-left">
                            <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">Number of Installments</FormLabel>
                            <FormControl><Input type="number" {...field} className="h-12 border-2 bg-white font-bold text-left" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <FormField control={control} name="agreement.firstInstallmentDate" render={({ field }) => (
                        <FormItem className="text-left">
                            <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">First Installment Date</FormLabel>
                            <FormControl><Input type="date" {...field} value={field.value || ''} className="h-12 border-2 bg-white font-bold text-left" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <div className="space-y-2 text-left">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 text-left">Calculated Last Installment Date</Label>
                        <div className="h-12 border-2 bg-slate-100/80 rounded-md flex items-center px-4 font-bold text-slate-700 text-sm">
                            <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                            {calculatedLastInstallmentDate}
                        </div>
                    </div>

                    <FormField control={control} name="agreement.residualValue" render={({ field }) => (
                        <FormItem className="text-left">
                            <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">Residual Value / Balloon (ZAR)</FormLabel>
                            <FormControl><Input type="number" {...field} className="h-12 border-2 bg-white font-bold text-left" placeholder="0.00" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <div className="p-6 border-2 border-slate-200 rounded-2xl bg-slate-50/50 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary text-left">Interest & Calculation Parameters</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                        <FormField control={control} name="agreement.isLinked" render={({ field }) => (
                            <FormItem className="flex items-center space-x-3 space-y-0 p-3 rounded-xl border bg-slate-100 opacity-60">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled />
                                </FormControl>
                                <div className="space-y-1 text-left">
                                    <FormLabel className="text-xs font-bold text-slate-700 cursor-not-allowed">Linked Rate (Repo + Margin)</FormLabel>
                                    <FormDescription className="text-[10px]">Reference repo rate module (Pending Implementation)</FormDescription>
                                </div>
                            </FormItem>
                        )} />

                        <FormField control={control} name="agreement.isArrearInterest" render={({ field }) => (
                            <FormItem className="flex items-center space-x-3 space-y-0 p-3 rounded-xl border bg-white shadow-sm">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 text-left">
                                    <FormLabel className="text-xs font-bold text-slate-800 cursor-pointer">Arrear Interest</FormLabel>
                                    <FormDescription className="text-[10px]">Calculate interest in arrears for transaction module</FormDescription>
                                </div>
                            </FormItem>
                        )} />

                        <FormField control={control} name="agreement.isPaymentInAdvance" render={({ field }) => (
                            <FormItem className="flex items-center space-x-3 space-y-0 p-3 rounded-xl border bg-white shadow-sm">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 text-left">
                                    <FormLabel className="text-xs font-bold text-slate-800 cursor-pointer">Payments in Advance</FormLabel>
                                    <FormDescription className="text-[10px]">Basis on which installment calculation is computed</FormDescription>
                                </div>
                            </FormItem>
                        )} />

                        <FormField control={control} name="agreement.includeBalloonInLastInstallment" render={({ field }) => (
                            <FormItem className="flex items-center space-x-3 space-y-0 p-3 rounded-xl border bg-white shadow-sm">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 text-left">
                                    <FormLabel className="text-xs font-bold text-slate-800 cursor-pointer">Last Installment Includes Balloon</FormLabel>
                                    <FormDescription className="text-[10px]">Flag if final payment includes residual or leaves for rescheduling</FormDescription>
                                </div>
                            </FormItem>
                        )} />
                    </div>
                </div>
            </fieldset>
        </div>
    );
}

function StepSchedule() {
    const { watch } = useFormContext<WizardFormValues>();
    const principal = watch('agreement.totalAdvanced') || 0;
    const rate = watch('agreement.interestRate') || 0;
    const term = watch('agreement.numberOfInstallments') || 0;
    const firstDateStr = watch('agreement.firstInstallmentDate');

    const baseSchedule = useMemo(() => {
        if (principal <= 0 || term <= 0) return [];
        return generateAmortizationSchedule(principal, rate, term, undefined, false);
    }, [principal, rate, term]);

    const totalInterest = useMemo(() => {
        return baseSchedule.reduce((sum, s) => sum + s.interest, 0);
    }, [baseSchedule]);

    // Total Installments Sum = Sum of all individual payment amounts
    const totalInstallmentSum = useMemo(() => {
        return baseSchedule.reduce((sum, s) => sum + s.payment, 0);
    }, [baseSchedule]);

    const fullSchedule = useMemo(() => {
        if (principal <= 0 || term <= 0) return [];

        const startDate = firstDateStr ? new Date(firstDateStr) : new Date();

        // Row 0 Opening Balance is exactly equal to the total sum of installments
        const rowZero = {
            installmentNum: 0,
            date: 'Contract Start',
            billed: false,
            ratePa: rate,
            capital: 0,
            interest: 0,
            installment: 0,
            capitalPaid: 0,
            interestPaid: 0,
            totalBalanceOutstanding: totalInstallmentSum,
        };

        let cumulativeCapital = 0;
        let cumulativeInterest = 0;

        const scheduleRows = baseSchedule.map((s, idx) => {
            cumulativeCapital += s.principal;
            cumulativeInterest += s.interest;

            const installmentDate = new Date(startDate);
            installmentDate.setMonth(startDate.getMonth() + idx);
            const formattedDate = !isNaN(installmentDate.getTime()) 
                ? installmentDate.toISOString().split('T')[0] 
                : '—';

            // Outstanding balance decrements by paid installments from totalInstallmentSum
            const cumulativePaid = cumulativeCapital + cumulativeInterest;
            const remainingOutstanding = Math.max(0, totalInstallmentSum - cumulativePaid);

            return {
                installmentNum: s.month,
                date: formattedDate,
                billed: false,
                ratePa: rate,
                capital: s.principal,
                interest: s.interest,
                installment: s.payment,
                capitalPaid: cumulativeCapital,
                interestPaid: cumulativeInterest,
                totalBalanceOutstanding: remainingOutstanding,
            };
        });

        return [rowZero, ...scheduleRows];
    }, [baseSchedule, principal, rate, term, totalInstallmentSum, firstDateStr]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 text-left text-foreground">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-xl font-black font-headline flex items-center gap-2 text-left">
                    <TableIcon className="h-6 w-6 text-primary"/> 4. Extended Repayment Schedule
                </h3>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="font-bold border-2 border-primary/20 text-primary hover:bg-primary/5 gap-2">
                            <Maximize2 className="h-4 w-4" /> Fullscreen Schedule View
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] w-full max-h-[90vh] flex flex-col p-6">
                        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
                            <div>
                                <DialogTitle className="text-xl font-black uppercase text-slate-900">Facility Repayment Schedule Audit</DialogTitle>
                                <p className="text-xs text-muted-foreground mt-1">Full breakdown including Row 0 opening debt position.</p>
                            </div>
                        </DialogHeader>
                        <div className="py-4 flex-1 overflow-hidden">
                            <ScheduleTable fullSchedule={fullSchedule} heightClass="h-[68vh]" />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div className="p-5 bg-slate-900 text-white rounded-2xl shadow-lg text-left">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 text-left">Monthly Installment</p>
                    <p className="text-2xl font-black text-primary text-left">{formatCurrency(baseSchedule[0]?.payment || 0)}</p>
                </div>
                <div className="p-5 bg-slate-100 rounded-2xl border-2 border-slate-200 text-left">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1 text-left">Total Interest Yield</p>
                    <p className="text-xl font-bold text-slate-900 text-left">{formatCurrency(totalInterest)}</p>
                </div>
                <div className="p-5 bg-primary/10 rounded-2xl border-2 border-primary/20 text-left">
                    <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1 text-left">Initial Total Debt (Row 0)</p>
                    <p className="text-xl font-black text-primary text-left">{formatCurrency(totalInstallmentSum)}</p>
                </div>
            </div>

            <ScheduleTable fullSchedule={fullSchedule} heightClass="h-[420px]" />
        </div>
    );
}

function StepCollateralSecurity() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-left text-foreground">
            <h3 className="text-xl font-black font-headline flex items-center gap-2 text-left"><Shield className="h-6 w-6 text-amber-500"/> 5. Collateral & Security</h3>
            <div className="p-10 bg-amber-500/5 rounded-[2.5rem] border-2 border-dashed border-amber-500/30 text-center space-y-4">
                <div className="p-4 bg-amber-500/10 rounded-full w-fit mx-auto text-amber-600">
                    <Lock className="h-10 w-10" />
                </div>
                <h4 className="text-lg font-black uppercase text-slate-900">Pending Credit Committee Approval</h4>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    Collateral perfection, guarantees, and asset liens will automatically unlock once this facility is reviewed and authorized by the Credit Committee module.
                </p>
                <Badge variant="outline" className="border-amber-500 text-amber-600 font-bold uppercase tracking-wider text-[10px]">
                    Module Locked
                </Badge>
            </div>
        </div>
    );
}

function StepLiability({ availableAssets, isLocked }: { availableAssets: any[], isLocked: boolean }) {
    const { watch, setValue } = useFormContext<WizardFormValues>();
    const assetId = watch('agreement.assetId');
    const asset = useMemo(() => availableAssets?.find(a => a.id === assetId), [availableAssets, assetId]);

    useEffect(() => {
        if (asset && !isLocked) {
            const creditorName = asset.sourceType === 'dealer' ? asset.sourceDealerName : (asset.sourceType === 'client' ? asset.sourceClientName : 'Internal Stock');
            setValue('agreement.creditorId', asset.sourceDealerId || asset.sourceClientId || 'internal', { shouldDirty: true });
            setValue('agreement.creditorName', creditorName || 'DMS Managed Source', { shouldDirty: true });
            setValue('agreement.liabilityAmount', asset.costOfSale || 0, { shouldDirty: true });
        }
    }, [asset, setValue, isLocked]);

    return (
        <div className="space-y-10 animate-in fade-in duration-500 text-left text-foreground">
            <h3 className="text-xl font-black font-headline flex items-center gap-2 text-left"><Scale className="h-6 w-6 text-primary"/> 6. Financial Lock</h3>
            <div className="bg-primary/5 p-8 rounded-[2.5rem] border-2 border-primary/20 space-y-6 text-left">
                <p className="text-sm text-slate-600 leading-relaxed text-left">Committing this agreement creates an authorized disbursement record. The financial settlement path remains flexible for contingent milestones.</p>
                <Separator className="bg-primary/10" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    <div className="space-y-1 text-left">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 text-left">Recipient Creditor</Label>
                        <p className="text-lg font-bold text-slate-900 border-b-2 pb-1 border-primary/10 text-left">{watch('agreement.creditorName') || 'Resolving from asset...'}</p>
                    </div>
                    <div className="space-y-1 text-left">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 text-left">Authorized Disbursement (ZAR)</Label>
                        <p className="text-3xl font-black text-primary text-left">{formatCurrency(watch('agreement.liabilityAmount'))}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StepCommitmentAudit({ isLocked, onUnlock }: { isLocked: boolean, onUnlock: () => void }) {
    const { watch } = useFormContext<WizardFormValues>();
    const values = watch('agreement');

    return (
        <div className="space-y-8 animate-in zoom-in-95 duration-500 text-left text-foreground">
            <div className="text-center py-10 space-y-6">
                <div className="bg-primary/10 p-6 rounded-full w-fit mx-auto border border-primary/20 text-center">
                    {isLocked ? <Lock className="h-16 w-16 text-amber-500" /> : <ClipboardCheck className="h-16 w-16 text-primary" />}
                </div>
                <div className="space-y-2 text-center text-foreground">
                    <h3 className="text-3xl font-black uppercase text-center">{isLocked ? 'Fiduciary Locked' : 'Audit Ready'}</h3>
                    <p className="text-sm text-muted-foreground max-sm mx-auto leading-relaxed text-center">
                        {isLocked ? 'This node is active. Modification requires administrative override.' : 'Verify technical data integrity before committing this node to the registry.'}
                    </p>
                </div>
                {isLocked && (
                    <Button variant="outline" className="gap-2 font-bold text-amber-600 border-amber-200 hover:bg-amber-50 text-center" onClick={onUnlock}>
                        <Unlock className="h-4 w-4" /> Trigger Administrative Override
                    </Button>
                )}
            </div>

            <Card className="border-2 bg-slate-50/50 text-left text-foreground">
                <CardContent className="p-8 space-y-6 text-left">
                    <div className="grid grid-cols-2 gap-8 text-left text-foreground">
                        <div className="space-y-1 text-left">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground text-left">Agreement Class</Label>
                            <p className="font-bold text-sm capitalize text-left">{values.type?.replace(/-/g, ' ')}</p>
                        </div>
                        <div className="space-y-1 text-right text-left">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground text-right text-left">Authorized Principal</Label>
                            <p className="font-black text-xl text-primary text-right">{formatCurrency(values.totalAdvanced)}</p>
                        </div>
                    </div>
                    <Separator />
                    <div className="space-y-1 text-left">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground text-left">Registry Recipient (Creditor)</Label>
                        <div className="flex items-center gap-2 font-bold text-sm text-left text-foreground">
                            <Building className="h-4 w-4 text-primary" />
                            {values.creditorName}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// --- WIZARD TERMINAL ---

export function AgreementWizard({ agreement, clients, onSave, onBack, facilityProtocolVisibleFor, extraTerminalStep }: any) {
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [isOverridden, setIsOverridden] = useState(false);
    const { toast } = useToast();
    const firestore = useFirestore();

    const isLocked = useMemo(() => {
        return agreement?.status === 'active' && !isOverridden;
    }, [agreement, isOverridden]);

    const methods = useForm<WizardFormValues>({
        resolver: zodResolver(wizardSchema),
        mode: 'onChange',
        defaultValues: agreement ? { agreement } : { 
            agreement: { 
                totalAdvanced: 0, 
                interestRate: 15, 
                numberOfInstallments: 60, 
                status: 'pending',
                isLinked: false,
                isArrearInterest: false,
                isPaymentInAdvance: false,
                firstInstallmentDate: new Date().toISOString().split('T')[0],
                residualValue: 0,
                includeBalloonInLastInstallment: false,
            } 
        }
    });
    
    const assetsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'lendingAssets'), where('status', '==', 'available'));
    }, [firestore]);
    const { data: availableAssets, isLoading: isLoadingAssets } = useCollection(assetsQuery);

    const steps = [
        { id: 'client', title: '1. Borrower Identity', icon: User, fields: ['agreement.clientId'] },
        { id: 'protocol', title: '2. Facility Protocol', icon: Scale, fields: ['agreement.type', 'agreement.assetId'] },
        { id: 'details', title: '3. Technical Terms', icon: FileSignature, fields: ['agreement.description', 'agreement.totalAdvanced', 'agreement.interestRate', 'agreement.numberOfInstallments', 'agreement.firstInstallmentDate', 'agreement.residualValue'] },
        { id: 'schedule', title: '4. Repayment Schedule', icon: TableIcon, fields: [] },
        { id: 'collateral', title: '5. Collateral & Security', icon: Shield, fields: [], disabled: true, badge: 'Pending Approval' },
        { id: 'liability', title: '6. Financial Lock', icon: Banknote, fields: ['agreement.creditorId', 'agreement.liabilityAmount'] },
        { id: 'review', title: '7. Audit Check', icon: ShieldCheck, fields: [] },
    ];

    const isScheduleStep = steps[currentStep].id === 'schedule';

    const isStepValid = (index: number) => {
        if (isLocked) return true;
        const step = steps[index];
        if (step.disabled) return true;
        if (!step.fields || step.fields.length === 0) return true;
        const errors = methods.formState.errors;
        return step.fields.every(field => {
            const parts = field.split('.');
            let err: any = errors;
            for (const p of parts) { err = err?.[p]; }
            return !err;
        });
    };

    const handleUnlock = () => {
        const key = prompt("Enter Administrative Unlock Key:");
        if (key === 'LF-2026-OVERRIDE') {
            setIsOverridden(true);
            toast({ title: "Fiduciary Lock Released", description: "Agreement nodes are now editable." });
        } else {
            toast({ variant: 'destructive', title: "Unauthorized", description: "Invalid unlock key." });
        }
    };

    const onSubmit = async (data: WizardFormValues) => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed.");

            const agreementRes = await fetchFromAdminAPI(token, 'saveLendingAgreement', { 
                agreement: { 
                    ...data.agreement, 
                    status: 'active',
                    isOverridden: isOverridden
                } 
            });

            if (!isLocked || isOverridden) {
                const asset = availableAssets?.find(a => a.id === data.agreement.assetId);
                await fetchFromAdminAPI(token, 'createLendingPayment', {
                    payment: {
                        agreementId: agreementRes.data.id,
                        clientId: data.agreement.clientId,
                        clientName: clients.find((c: any) => c.id === data.agreement.clientId)?.name || 'Borrower',
                        assetId: data.agreement.assetId,
                        assetName: asset ? `${asset.year} ${asset.make} ${asset.model}` : 'Financed Asset',
                        creditorId: data.agreement.creditorId,
                        creditorName: data.agreement.creditorName,
                        amount: data.agreement.liabilityAmount,
                        amountPaid: 0,
                        status: 'pending',
                        createdAt: { _methodName: 'serverTimestamp' }
                    }
                });
            }

            toast({ title: 'Protocol Committed', description: 'Registry node synchronized successfully.' });
            onSave();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Commit Failed', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleNext = async () => {
        const isValid = isLocked ? true : await methods.trigger(steps[currentStep].fields as any);
        if (isValid && currentStep < steps.length - 1) {
            let nextIndex = currentStep + 1;
            if (steps[nextIndex]?.disabled) nextIndex++;
            setCurrentStep(nextIndex);
        }
    };

    return (
        <Card className="max-w-7xl mx-auto shadow-2xl border-none overflow-hidden text-left text-foreground">
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)} onKeyDown={(e) => { if(e.key === 'Enter') e.preventDefault(); }}>
                    <CardHeader className="bg-slate-900 text-white p-8 text-left">
                        <div className="flex justify-between items-center text-left">
                            <div className="text-left text-white">
                                <CardTitle className="text-2xl font-black font-headline uppercase text-white text-left">Agreement Terminal</CardTitle>
                                <CardDescription className="text-slate-400 text-base mt-1 text-white text-left">Phase: {steps[currentStep].title}</CardDescription>
                            </div>
                            <div className="flex gap-3 text-left">
                                {isLocked && <Badge variant="outline" className="h-8 border-amber-500 text-amber-500 gap-1.5 px-4 font-black uppercase tracking-widest text-left"><Lock className="h-3 w-3" /> Fiduciary Locked</Badge>}
                                <Button type="button" variant="ghost" className="text-white hover:text-primary text-left" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Exit Terminal</Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 text-left text-foreground">
                        <div className={cn("grid text-left transition-all duration-300", isScheduleStep ? "grid-cols-1" : "grid-cols-1 md:grid-cols-[280px_1fr]")}>
                            
                            {!isScheduleStep && (
                                <div className="bg-slate-50 border-r p-6 space-y-2 text-left">
                                    {steps.map((step, index) => {
                                        const isCompleted = index < currentStep && isStepValid(index);
                                        const StepIcon = step.icon;
                                        const isDisabled = step.disabled;

                                        return (
                                            <Button 
                                                key={step.id} 
                                                type="button" 
                                                disabled={isDisabled}
                                                variant={currentStep === index ? 'secondary' : 'ghost'} 
                                                className={cn(
                                                    "w-full justify-between h-12 px-4 transition-all text-left", 
                                                    currentStep === index && "bg-white shadow-sm ring-1 ring-primary/20",
                                                    isDisabled && "opacity-60 cursor-not-allowed bg-slate-100"
                                                )} 
                                                onClick={() => { if(!isDisabled && index <= currentStep) setCurrentStep(index); }}
                                            >
                                                <div className="flex items-center gap-3 truncate">
                                                    {isCompleted ? (
                                                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                                    ) : (
                                                        <div className={cn("h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-black shrink-0", currentStep >= index ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                                                            {index + 1}
                                                        </div>
                                                    )}
                                                    <StepIcon className={cn("h-4 w-4 shrink-0", currentStep >= index ? "text-primary" : "text-muted-foreground")} />
                                                    <span className={cn("text-[10px] font-black uppercase tracking-widest text-left truncate", currentStep === index ? "text-primary" : "text-muted-foreground")}>
                                                        {step.title.split('. ')[1]}
                                                    </span>
                                                </div>
                                                {step.badge && (
                                                    <Badge variant="outline" className="text-[8px] font-bold text-amber-600 border-amber-300 px-1.5 py-0 h-4">
                                                        CC
                                                    </Badge>
                                                )}
                                            </Button>
                                        );
                                    })}
                                </div>
                            )}

                            <div className={cn("p-8 md:p-12 space-y-8 bg-white min-h-[580px] text-left", isScheduleStep && "w-full")}>
                                {steps[currentStep].id === 'client' && <StepBorrower clients={clients} isLocked={isLocked} />}
                                {steps[currentStep].id === 'protocol' && <StepProtocol availableAssets={availableAssets || []} isLoadingAssets={isLoadingAssets} isLocked={isLocked} facilityProtocolVisibleFor={facilityProtocolVisibleFor} />}
                                {steps[currentStep].id === 'details' && <StepTerms isLocked={isLocked} />}
                                {steps[currentStep].id === 'schedule' && <StepSchedule />}
                                {steps[currentStep].id === 'collateral' && <StepCollateralSecurity />}
                                {steps[currentStep].id === 'liability' && <StepLiability availableAssets={availableAssets || []} isLocked={isLocked} />}
                                {steps[currentStep].id === 'review' && <StepCommitmentAudit isLocked={isLocked} onUnlock={handleUnlock} />}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t p-8 flex justify-between text-left text-foreground">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                                let prevIndex = currentStep - 1;
                                if (steps[prevIndex]?.disabled) prevIndex--;
                                setCurrentStep(prevIndex);
                            }} 
                            disabled={currentStep === 0 || isLoading} 
                            className="h-12 px-8 font-bold text-left"
                        >
                            Previous Stage
                        </Button>
                        {currentStep < steps.length - 1 ? (
                            <Button type="button" onClick={handleNext} className="h-12 px-12 font-black uppercase text-xs text-white shadow-lg text-left">Continue Protocol <ArrowRight className="ml-2 h-4 w-4"/></Button>
                        ) : (
                            <Button type="submit" disabled={isLoading || (isLocked && !isOverridden)} className="h-14 px-16 bg-primary hover:bg-primary/90 shadow-2xl font-black uppercase tracking-tight text-white text-left">
                                {isLoading ? <Loader2 className="mr-2 animate-spin h-6 w-6" /> : <ShieldCheck className="mr-2 h-6 w-6" />} 
                                Commit & Finalize agreement
                            </Button>
                        )}
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    );
}