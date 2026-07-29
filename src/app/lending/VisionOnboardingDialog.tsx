
'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, Zap, ShieldCheck, FileUp, Sparkles, Truck, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { runVisionOnboarding } from '@/ai/flows/vision-onboarding-flow';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function VisionOnboardingDialog({ onExtractionComplete }: { onExtractionComplete: (data: any) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [result, setResult] = useState<any>(null);
    const { toast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleRunVision = async () => {
        if (!preview) return;
        setIsProcessing(true);
        try {
            const output = await runVisionOnboarding({ photoDataUri: preview, docType: 'rc1' });
            setResult(output);
            toast({ title: "Forensic Extraction Complete" });
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Extraction Failed", description: e.message });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApply = () => {
        onExtractionComplete(result.extraction);
        setIsOpen(false);
        setPreview(null);
        setResult(null);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 font-black uppercase text-xs tracking-widest shadow-xl h-12 px-8">
                    <Sparkles className="h-4 w-4" /> AI Document Onboarding
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl text-left text-foreground">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-left font-black">
                        <Camera className="h-6 w-6 text-primary" />
                        Vision-to-Node Gateway
                    </DialogTitle>
                    <DialogDescription className="text-left">
                        Snap a photo of your RC1 certificate to instantly populate your asset data.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4 text-left">
                    {!preview ? (
                        <div className="p-12 border-2 border-dashed rounded-3xl bg-slate-50 flex flex-col items-center justify-center gap-4 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => document.getElementById('vision-up')?.click()}>
                            <div className="bg-white p-4 rounded-full shadow-sm">
                                <FileUp className="h-10 w-10 text-muted-foreground opacity-30" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-bold">Select RC1 Photo</p>
                                <p className="text-xs text-muted-foreground">High-contrast JPEG or PNG recommended.</p>
                            </div>
                            <input type="file" id="vision-up" className="hidden" accept="image/*" onChange={handleFileChange} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start text-left">
                            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border shadow-inner bg-black">
                                <Image src={preview} alt="Document Preview" fill className="object-contain opacity-80" />
                                {isProcessing && (
                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                        <p className="text-[10px] font-black text-white uppercase tracking-widest">Mining Data...</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6 text-left">
                                {result ? (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-500 text-left">
                                        <Badge className="bg-green-100 text-green-700 border-none uppercase text-[8px] h-4">Confidence: {(result.confidence * 100).toFixed(0)}%</Badge>
                                        <div className="space-y-3 p-4 bg-muted/30 rounded-xl text-left">
                                            <div className="text-left"><Label className="text-[9px] uppercase font-black text-muted-foreground">Make/Model</Label><p className="font-bold text-sm">{result.extraction.year} {result.extraction.make} {result.extraction.model}</p></div>
                                            <div className="text-left"><Label className="text-[9px] uppercase font-black text-muted-foreground">VIN</Label><p className="font-mono text-xs">{result.extraction.vin}</p></div>
                                            <div className="text-left"><Label className="text-[9px] uppercase font-black text-muted-foreground">Registered Owner</Label><p className="font-bold text-xs">{result.extraction.ownerName}</p></div>
                                        </div>
                                        <Alert className="bg-primary/5 border-primary/20 py-2">
                                            <CheckCircle2 className="h-4 w-4 text-primary" />
                                            <AlertDescription className="text-[10px] font-medium leading-tight">Data mapped to RC1 standard. Fields are ready to commit.</AlertDescription>
                                        </Alert>
                                    </div>
                                ) : (
                                    <div className="py-20 text-center opacity-30 italic text-left">
                                        <Zap className="h-8 w-8 mx-auto mb-2" />
                                        <p className="text-xs font-black uppercase tracking-widest">Ready to process</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="border-t pt-6 bg-slate-50/50 -mx-6 px-6 -mb-6 pb-6">
                    {preview && !result && (
                        <Button className="w-full h-12 font-bold" onClick={handleRunVision} disabled={isProcessing}>
                             {isProcessing ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Zap className="mr-2 h-4 w-4" />}
                             Execute Forensic Extraction
                        </Button>
                    )}
                    {result && (
                        <div className="flex gap-2 w-full">
                            <Button variant="outline" className="flex-1 h-12" onClick={() => { setPreview(null); setResult(null); }}>Discard</Button>
                            <Button className="flex-[2] h-12 font-bold" onClick={handleApply}>
                                Commit to Profile <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
