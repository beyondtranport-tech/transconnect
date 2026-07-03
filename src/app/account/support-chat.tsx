'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, MessageSquare, Send, Bot, AlertTriangle, RefreshCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, getClientSideAuthToken, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { supportQuery } from '@/ai/flows/support-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { format as formatDateFns } from 'date-fns';

const formatDate = (dateValue: any) => {
    if (!dateValue) return 'Sending...';
    const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
    if (isNaN(date.getTime())) return 'Just now';
    return formatDateFns(date, "dd MMM yyyy, HH:mm");
};

interface SupportMessage {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    timestamp: any;
}

export default function SupportChatContent() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [inputFieldText, setInputFieldText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Engineering Note: UID fallback removed to prevent premature "invalid path" queries 
    // which trigger hard permission blocks in the rules engine.
    const companyId = useMemo(() => {
        if (!user) return '';
        const id = user.companyId || user.companyData?.id || '';
        return (id && id !== user.uid) ? id : '';
    }, [user]);

    const messagesQuery = useMemoFirebase(() => {
        if (!firestore || !companyId) return null;
        return query(
            collection(firestore, 'companies', companyId, 'supportMessages'),
            orderBy('timestamp', 'asc')
        );
    }, [firestore, companyId]);

    // Localized error handling: Intercepting the error state to prevent global layout crash.
    const { data: messages, isLoading: areMessagesLoading, error: permissionError, forceRefresh } = useCollection<SupportMessage>(messagesQuery);

    const isLoading = isUserLoading || areMessagesLoading || isRetrying;
    
    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
            }
        }
    }, [messages]);

    const handleRetry = () => {
        setIsRetrying(true);
        forceRefresh();
        setTimeout(() => setIsRetrying(false), 1500);
    };

    const handleSend = async () => {
        if (!inputFieldText.trim() || !user || !companyId) return;

        setIsSending(true);
        const userMessageText = inputFieldText;
        setInputFieldText('');

        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            const path = `companies/${companyId}/supportMessages`;
            const userMessageData = {
                text: userMessageText,
                senderId: user.uid,
                senderName: user.displayName || 'Member',
                timestamp: { _methodName: 'serverTimestamp' },
                readByAdmin: false,
                companyId: companyId,
            };
            
            await fetch('/api/addUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ collectionPath: path, data: userMessageData }),
            });

            const historyForApi: { role: 'user' | 'model'; content: { text: string; }[] }[] = (messages || [])
                .filter(m => !!m && typeof m === 'object' && m.senderId && m.text)
                .map(msg => {
                    const role: 'user' | 'model' = msg.senderId === user.uid ? 'user' : 'model';
                    return { role, content: [{ text: msg.text }] };
                });

            const aiResult = await supportQuery({ 
                query: userMessageText, 
                history: historyForApi
            });

            const aiMessageData = {
                text: aiResult.response,
                senderId: 'ai-assistant',
                senderName: 'AI Assistant',
                timestamp: { _methodName: 'serverTimestamp' },
                readByAdmin: false,
                companyId: companyId,
            };

            await fetch('/api/addUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ collectionPath: path, data: aiMessageData }),
            });

        } catch (error: any) {
            console.error("Support chat error:", error);
            toast({ variant: 'destructive', title: 'Send Failed', description: error.message });
            setInputFieldText(userMessageText);
        } finally {
            setIsSending(false);
        }
    };

    // LOCAL PERMISSION UI: Prevents the global error boundary from triggering
    if (permissionError) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] p-4 text-center animate-in fade-in duration-500">
                <Card className="border-destructive bg-destructive/5 max-w-md w-full shadow-lg">
                    <CardHeader>
                        <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4" />
                        <CardTitle className="text-destructive font-black uppercase text-xl">Identity Verifying</CardTitle>
                        <CardDescription>Our industrial brain is synchronizing your profile.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-left">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Your member node is being established in the registry. This handshake typically completes in a few moments as the rules engine updates.
                        </p>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <Button onClick={handleRetry} className="w-full gap-2 font-bold" disabled={isRetrying}>
                            {isRetrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                            Retry Connection
                        </Button>
                        <Button variant="ghost" asChild className="text-xs font-bold uppercase tracking-widest">
                            <Link href="/account">Return to Dashboard</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <Card className="h-[calc(100vh-10rem)] flex flex-col border-none shadow-none text-left">
            <CardHeader className="px-0 text-left">
                <CardTitle className="flex items-center gap-2 text-foreground font-black font-headline text-left"><MessageSquare /> Support Chat</CardTitle>
                <CardDescription className="text-muted-foreground text-left">Direct line to our AI assistant and support team.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-[0px] p-0 text-left">
                <ScrollArea className="flex-1 pr-4 -mr-4 mb-4" ref={scrollAreaRef as any}>
                    <div className="space-y-4 pt-2 text-left">
                        {isLoading && !messages ? (
                             <div className="flex justify-center items-center h-full py-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                        ) : !companyId && !isUserLoading ? (
                            <Alert variant="destructive" className="border-none bg-destructive/10 text-left">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle className="font-bold text-left">Node Uninitialized</AlertTitle>
                                <AlertDescription className="text-left">
                                    Please complete your profile details to authorize this communication channel.
                                    <Button asChild variant="link" className="p-0 h-auto ml-1">
                                        <Link href="/account?view=profile">Edit Profile</Link>
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        ) : (
                            messages?.filter(msg => !!msg && typeof msg === 'object' && msg.id).map((msg: any) => {
                                const isMember = msg.senderId === user?.uid;
                                const isAI = msg.senderId === 'ai-assistant';
                                const alignment = isMember ? "justify-end" : "justify-start";

                                return (
                                    <div key={msg.id} className={cn("flex items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300", alignment)}>
                                        {!isMember && (
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className={isAI ? 'bg-secondary' : 'bg-muted'}>
                                                    {isAI ? <Bot className="h-5 w-5" /> : 'AD'}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div className={cn(
                                            "rounded-2xl px-4 py-2 max-w-[85%] text-sm shadow-sm text-left", 
                                            isMember ? "bg-primary text-primary-foreground rounded-br-none" : 
                                            isAI ? "bg-blue-100 text-blue-900 rounded-bl-none" :
                                            "bg-white border rounded-bl-none"
                                        )}>
                                            <p className="font-black text-[10px] mb-1 opacity-70 uppercase tracking-widest leading-none text-left">{msg.senderName || 'Staff'}</p>
                                            <p className="leading-relaxed text-left">{msg.text}</p>
                                            <p className="text-[9px] opacity-40 mt-1 text-right">{formatDate(msg.timestamp)}</p>
                                        </div>
                                        {isMember && (
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                                    {user?.displayName?.charAt(0) || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
                <div className="mt-auto flex items-center gap-2 pt-4 border-t text-left">
                    <input 
                        placeholder={companyId ? "Ask a question..." : "Node initializing..."}
                        value={inputFieldText}
                        onChange={e => setInputFieldText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !isSending && handleSend()}
                        disabled={isSending || !companyId}
                        className="flex h-12 w-full rounded-full border border-input bg-slate-100 px-6 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
                    />
                    <Button onClick={handleSend} disabled={isSending || !companyId || !inputFieldText.trim()} size="icon" className="rounded-full h-12 w-12 shrink-0 shadow-lg">
                        {isSending ? <Loader2 className="h-5 w-5 animate-spin"/> : <Send className="h-5 w-5" />}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}