
'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, MessageSquare, Send, Bot, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, getClientSideAuthToken, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
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

    const companyId = user?.companyId;

    const messagesQuery = useMemoFirebase(() => {
        if (!firestore || !companyId) return null;
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

            // 1. Save user message via proxy API
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

            // 2. Build history for AI (ensure roles match Genkit/Gemini expectations)
            const historyForApi: { role: 'user' | 'model'; content: { text: string; }[] }[] = (messages || [])
                .filter(m => !!m && typeof m === 'object' && m.senderId && m.text)
                .map(msg => {
                    const role: 'user' | 'model' = msg.senderId === user.uid ? 'user' : 'model';
                    return { role, content: [{ text: msg.text }] };
                });

            // 3. Call AI agent
            const aiResult = await supportQuery({ 
                query: userMessageText, 
                history: historyForApi
            });

            // 4. Save AI response
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
                        We encountered a permission error loading your messages.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Your account profile may be initializing. If this persists, please ensure your company profile is complete.
                    </p>
                    <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                        Retry Connection
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-[calc(100vh-10rem)] flex flex-col border-none shadow-none text-left">
            <CardHeader className="px-0 text-left">
                <CardTitle className="flex items-center gap-2 text-left"><MessageSquare /> Support Chat</CardTitle>
                <CardDescription className="text-left">Direct line to our AI assistant and platform support team.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-[0px] p-0 text-left">
                <ScrollArea className="flex-1 pr-4 -mr-4 mb-4" ref={scrollAreaRef as any}>
                    <div className="space-y-4">
                        {isLoading && !messages ? (
                             <div className="flex justify-center items-center h-full py-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                        ) : !companyId && !isUserLoading ? (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Profile Incomplete</AlertTitle>
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
                                            "bg-muted rounded-bl-none"
                                        )}>
                                            <p className="font-bold text-[10px] mb-1 opacity-70 uppercase tracking-widest">{msg.senderName || 'Staff'}</p>
                                            <p className="leading-relaxed">{msg.text}</p>
                                            <p className="text-[10px] opacity-60 mt-1 text-right">{formatDate(msg.timestamp)}</p>
                                        </div>
                                        {isMember && (
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                    {user?.displayName?.charAt(0) || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                );
                            })
                        )}
                         {messages?.length === 0 && !isLoading && (
                            <div className="text-center py-12 space-y-2 opacity-50">
                                <MessageSquare className="h-10 w-10 mx-auto" />
                                <p className="text-sm font-medium">No messages yet. Send a query to start.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <div className="mt-auto flex items-center gap-2 pt-4 border-t">
                    <Input 
                        placeholder={companyId ? "Type your question..." : "Waiting for profile..."}
                        value={inputFieldText}
                        onChange={e => setInputFieldText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !isSending && handleSend()}
                        disabled={isSending || !companyId}
                        className="rounded-full bg-slate-50"
                    />
                    <Button onClick={handleSend} disabled={isSending || !companyId || !inputFieldText.trim()} size="icon" className="rounded-full h-10 w-10 shrink-0">
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
