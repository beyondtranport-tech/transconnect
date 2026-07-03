'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, MessageSquare, Send, Bot, AlertTriangle } from 'lucide-react';
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
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Robust company ID extraction from the enriched user object
    const companyId = useMemo(() => {
        return user?.companyId || user?.companyData?.id || '';
    }, [user]);

    const messagesQuery = useMemoFirebase(() => {
        // Only trigger query if we have both firestore and a valid, non-empty companyId
        if (!firestore || !companyId || companyId === '') return null;
        return query(
            collection(firestore, 'companies', companyId, 'supportMessages'),
            orderBy('timestamp', 'asc')
        );
    }, [firestore, companyId]);

    const { data: messages, isLoading: areMessagesLoading, error: permissionError } = useCollection<SupportMessage>(messagesQuery);

    const isLoading = isUserLoading || areMessagesLoading;
    
    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
            }
        }
    }, [messages]);

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
            const errorMessage = error.message?.includes('429') 
                ? "AI Assistant is busy. Please wait a moment before sending another message."
                : error.message;
            toast({ variant: 'destructive', title: 'Send Failed', description: errorMessage });
            setInputFieldText(userMessageText);
        } finally {
            setIsSending(false);
        }
    };

    if (permissionError) {
        return (
            <Card className="border-destructive bg-destructive/5 text-left">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Access Restricted
                    </CardTitle>
                    <CardDescription>
                        We encountered a permission error loading your support messages.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Your account profile may still be initializing in the industrial brain or you may not have sufficient permissions to view this company's messages. 
                        If this persists, please ensure your company profile is complete and correctly associated with your login.
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/account?view=profile">Complete Profile</Link>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                            Retry Connection
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-[calc(100vh-10rem)] flex flex-col border-none shadow-none text-left">
            <CardHeader className="px-0 text-left">
                <CardTitle className="flex items-center gap-2 text-left text-foreground font-black font-headline"><MessageSquare /> Support Chat</CardTitle>
                <CardDescription className="text-left text-muted-foreground">Direct line to our AI assistant and platform support team.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-[0px] p-0 text-left">
                <ScrollArea className="flex-1 pr-4 -mr-4 mb-4" ref={scrollAreaRef as any}>
                    <div className="space-y-4 pt-2">
                        {isLoading && !messages ? (
                             <div className="flex justify-center items-center h-full py-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                        ) : !companyId && !isUserLoading ? (
                            <Alert variant="destructive" className="border-none bg-destructive/10">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle className="font-bold">Profile Incomplete</AlertTitle>
                                <AlertDescription>
                                    Please complete your company profile to enable secure support chat.
                                    <Button asChild variant="link" className="p-0 h-auto ml-1">
                                        <Link href="/account?view=profile">Go to My Profile</Link>
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
                                            "rounded-2xl px-4 py-2 max-w-[85%] text-sm shadow-sm", 
                                            isMember ? "bg-primary text-primary-foreground rounded-br-none" : 
                                            isAI ? "bg-blue-100 text-blue-900 rounded-bl-none" :
                                            "bg-white border rounded-bl-none"
                                        )}>
                                            <p className="font-bold text-[10px] mb-1 opacity-70 uppercase tracking-widest leading-none">{msg.senderName || 'Staff'}</p>
                                            <p className="leading-relaxed">{msg.text}</p>
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
                         {messages?.length === 0 && !isLoading && (
                            <div className="text-center py-20 border-2 border-dashed rounded-3xl opacity-30">
                                <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                                <p className="text-sm font-bold uppercase tracking-[0.2em]">Secure Channel Active</p>
                                <p className="text-xs mt-2">Your conversation will be logged for professional oversight.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <div className="mt-auto flex items-center gap-2 pt-4 border-t">
                    <input 
                        placeholder={companyId ? "Ask the AI assistant..." : "Initializing profile..."}
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