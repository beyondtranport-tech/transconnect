
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    Loader2, ShoppingCart, Landmark, ArrowLeft, ArrowRight, MessageSquare, 
    FileCheck, ShieldCheck, Scale, FileText, Send, Building, Info, CheckCircle, Banknote, Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateSafe, cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useMemoFirebase, getClientSideAuthToken } from '@/firebase';
import { doc, collection, query, orderBy, serverTimestamp, setDoc } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

const steps = [
    { id: 'negotiation', title: 'Handshake & Price', icon: MessageSquare },
    { id: 'funding', title: 'Financial Lock', icon: Landmark },
    { id: 'legal', title: 'Contract Vault', icon: FileCheck },
    { id: 'fulfillment', title: 'Delivery & Release', icon: CheckCircle },
];

export function SalesTransactionHub({ vehicle, onBack }: { vehicle: any, onBack: () => void }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const [offerAmount, setOfferAmount] = useState(vehicle.price);

    const isSeller = user?.companyId === vehicle.companyId;

    // 1. Establish/Fetch the Sale Handshake
    const saleId = `SALE_${vehicle.id}_${user?.companyId}`;
    const saleRef = useMemoFirebase(() => doc(firestore, 'sales', saleId), [firestore, saleId]);
    const { data: sale, isLoading: isSaleLoading } = useDoc(saleRef);

    // 2. Fetch Messages
    const msgsQuery = useMemoFirebase(() => query(collection(saleRef, 'messages'), orderBy('timestamp', 'asc')), [saleRef]);
    const { data: messages, isLoading: areMsgsLoading } = useCollection(msgsQuery);

    const handleSendMessage = async () => {
        if (!chatMessage.trim()) return;
        try {
            const token = await getClientSideAuthToken();
            await fetch('/api/addUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    collectionPath: `sales/${saleId}/messages`, 
                    data: { text: chatMessage, senderId: user.uid, senderName: user.displayName, timestamp: { _methodName: 'serverTimestamp' } }
                })
            });
            setChatMessage('');
        } catch (e) { toast({ variant: 'destructive', title: "Message Failed" }); }
    };

    const handleAction = async (action: string) => {
        setIsProcessing(true);
        try {
            const token = await getClientSideAuthToken();
            const data: any = { updatedAt: serverTimestamp() };
            
            if (action === 'negotiate') {
                data.agreedPrice = Number(offerAmount);
                data.status = 'negotiating';
                data.buyerId = user.companyId;
                data.sellerId = vehicle.companyId;
                data.vehicleId = vehicle.id;
                data.commissionRate = 2.5; // Platform Standard
            } else if (action === 'accept_commercials') {
                data.status = 'finance_pending';
            } else if (action === 'deliver') {
                data.status = 'concluded';
                data.deliveryDate = serverTimestamp();
            }

            await setDoc(saleRef, data, { merge: true });
            toast({ title: "Workflow Updated" });
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Failed to update workflow" });
        } finally {
            setIsProcessing(false);
        }
    };

    if (isSaleLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>;

    const currentStatus = sale?.status || 'negotiating';

    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-left text-foreground">
            <div className="flex justify-between items-center text-left">
                <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Return to Mall</Button>
                <Badge variant="outline" className="h-7 px-4 border-primary text-primary font-black uppercase text-[10px] tracking-widest">
                    Live Transaction Console
                </Badge>
            </div>

            <Card className="shadow-2xl border-none overflow-hidden text-left">
                <CardHeader className="bg-slate-900 text-white p-8 text-left">
                    <div className="flex justify-between items-start text-left">
                        <div className="text-left">
                            <CardTitle className="text-3xl font-black font-headline text-white">{vehicle.year} {vehicle.make} {vehicle.model}</CardTitle>
                            <CardDescription className="text-slate-400 mt-1">Concluding sale with <strong>{isSeller ? 'Matched Buyer' : 'Verified Seller'}</strong></CardDescription>
                        </div>
                        <div className="text-right text-foreground">
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Valuation (Excl. VAT)</p>
                            <p className="text-3xl font-black text-primary">{formatCurrency(sale?.agreedPrice || vehicle.price)}</p>
                        </div>
                    </div>
                </CardHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] bg-white text-left">
                    <div className="border-r bg-slate-50/50 p-6 space-y-2 text-left">
                        {steps.map((step, i) => (
                            <div key={step.id} className={cn(
                                "flex items-center gap-3 p-3 rounded-xl transition-all",
                                currentStep === i ? "bg-white shadow-md ring-1 ring-primary/20" : "opacity-40"
                            )}>
                                <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", currentStep >= i ? "bg-primary text-white" : "bg-muted")}>
                                    {React.createElement(step.icon, { className: "h-4 w-4" })}
                                </div>
                                <span className="text-xs font-bold uppercase tracking-tight">{step.title}</span>
                            </div>
                        ))}
                    </div>

                    <CardContent className="p-8 space-y-8 text-left text-foreground">
                        {currentStatus === 'negotiating' && (
                            <div className="space-y-6 text-left">
                                <div className="p-6 bg-primary/5 border-2 border-primary/20 rounded-2xl space-y-4 text-left">
                                    <h3 className="font-black text-xl flex items-center gap-2"><Scale className="h-6 w-6 text-primary" /> 1. Commercial Handshake</h3>
                                    <div className="space-y-2 text-left text-foreground">
                                        <Label className="font-bold text-xs">Agreed Sales Price (ZAR)</Label>
                                        <Input type="number" value={offerAmount} onChange={e => setOfferAmount(Number(e.target.value))} className="h-12 text-xl font-black border-2" />
                                        <p className="text-[10px] text-muted-foreground">Platform commission of 2.5% ({formatCurrency(Number(offerAmount) * 0.025)}) will be isolated upon settlement.</p>
                                    </div>
                                    <Button className="w-full h-12 font-bold" onClick={() => handleAction('accept_commercials')}>Accept Commercials & Lock Price</Button>
                                </div>
                            </div>
                        )}

                        {currentStatus === 'finance_pending' && (
                            <div className="space-y-8 text-left text-foreground">
                                <Alert className="bg-amber-50 border-amber-200 text-left">
                                    <Landmark className="h-5 w-5 text-amber-600" />
                                    <AlertTitle className="font-bold text-amber-900 text-left">Funding Activation Required</AlertTitle>
                                    <AlertDescription className="text-xs text-amber-800 leading-relaxed text-left">
                                        Price locked at **{formatCurrency(sale.agreedPrice)}**. Buyer must now finalize payment or trigger an in-house finance enquiry.
                                    </AlertDescription>
                                </Alert>
                                <div className="grid grid-cols-2 gap-4 text-left text-foreground">
                                    <Button variant="outline" className="h-16 flex-col gap-1 text-left" asChild>
                                        <Link href={`/funding/apply?type=vehicles&amount=${sale.agreedPrice}&vehicleId=${vehicle.id}`}>
                                            <span className="font-black text-sm text-left text-foreground">Apply for Finance</span>
                                            <span className="text-[10px] text-muted-foreground text-left">Match with 85+ specialized lenders</span>
                                        </Link>
                                    </Button>
                                    <Button className="h-16 flex-col gap-1 text-left" onClick={() => handleAction('conclude')}>
                                        <span className="font-black text-sm text-left text-foreground">Pay with Wallet</span>
                                        <span className="text-[10px] opacity-80 text-left text-foreground">Immediate settlement</span>
                                    </Button>
                                </div>
                            </div>
                        )}

                        <Separator />

                        <div className="space-y-4 text-left text-foreground">
                            <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 text-left">
                                <MessageSquare className="h-4 w-4 text-primary" />
                                Deal Negotiation Stream
                            </h4>
                            <div className="bg-slate-50 border rounded-2xl p-4 h-64 flex flex-col text-left">
                                <ScrollArea className="flex-1 pr-4 text-left text-foreground">
                                    <div className="space-y-3 text-left text-foreground">
                                        {messages?.map((msg: any) => (
                                            <div key={msg.id} className={cn("flex flex-col text-left", msg.senderId === user.uid ? "items-end" : "items-start")}>
                                                <div className={cn("px-4 py-2 rounded-2xl text-sm shadow-sm", msg.senderId === user.uid ? "bg-primary text-white" : "bg-white border")}>
                                                    <p className="font-black text-[9px] uppercase opacity-70 mb-1">{msg.senderName}</p>
                                                    <p>{msg.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                                <div className="mt-4 flex gap-2 pt-4 border-t text-left text-foreground">
                                    <Input placeholder="Type message..." value={chatMessage} onChange={e => setChatMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} className="bg-white" />
                                    <Button size="icon" onClick={handleSendMessage}><Send className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </div>

                <CardFooter className="bg-slate-50 border-t p-8 flex justify-between items-center text-left text-foreground">
                    <div className="flex gap-4 text-left text-foreground">
                        <Button variant="outline" size="sm" className="gap-2 font-bold"><FileText className="h-4 w-4"/> Draft OTP</Button>
                        <Button variant="outline" size="sm" className="gap-2 font-bold"><ShieldCheck className="h-4 w-4"/> Inspection Log</Button>
                    </div>
                    {currentStatus === 'concluded' && (
                        <Badge className="bg-green-600 text-white font-black uppercase py-2 px-6 rounded-full">Transaction Finalized</Badge>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
