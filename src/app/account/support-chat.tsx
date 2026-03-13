'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
    if (!dateValue) return 'N/A';
    const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
    if (isNaN(date.getTime())) return 'Invalid Date';
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
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [profileError, setProfileError] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const companyId = user?.companyId;

    const messagesQuery = useMemoFirebase(() => {
        if (!firestore || !companyId) return null;
        return query(
            collection(firestore, `companies/${companyId}/supportMessages`),
            orderBy('timestamp', 'asc')
        );
    }, [firestore, companyId]);

    const { data: messages, isLoading: areMessagesLoading, forceRefresh } = useCollection<SupportMessage>(messagesQuery);

    const isLoading = isUserLoading || areMessagesLoading;
    
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = async () => {
        if (!message.trim()) return;
        setProfileError(false);

        if (!user || !companyId) {
            setProfileError(true);
            toast({
                variant: 'destructive',
                title: 'Could not send message',
                description: 'Your user profile or company ID could not be found. Please complete your profile.',
            });
            return;
        }

        setIsSending(true);

        const userMessageText = message;
        setMessage('');

        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            // 1. Save the user's message
            const path = `companies/${companyId}/supportMessages`;
            const userMessageData = {
                text: userMessageText,
                senderId: user.uid,
                senderName: user.displayName || 'Member',
                timestamp: serverTimestamp(),
                readByAdmin: false,
            };
            const userMessageResponse = await fetch('/api/addUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ collectionPath: path, data: userMessageData }),
            });
            if (!userMessageResponse.ok) throw new Error((await userMessageResponse.json()).error || 'Failed to send message.');
            
            forceRefresh(); // Immediately show user's message

            // 2. Call the AI for a response
            const historyForApi: { role: 'user' | 'model'; content: { text: string; }[] }[] = (messages || []).map(msg => {
                const role: 'user' | 'model' = msg.senderId === user.uid ? 'user' : 'model';
                return {
                    role: role,
                    content: [{ text: msg.text }],
                };
            });
            

            const aiResult = await supportQuery({ 
                query: userMessageText, 
                history: historyForApi
            });

            // 3. Save the AI's response
            const aiMessageData = {
                text: aiResult.response,
                senderId: 'ai-assistant',
                senderName: 'AI Assistant',
                timestamp: serverTimestamp(),
                readByAdmin: false,
            };
            const aiMessageResponse = await fetch('/api/addUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ collectionPath: path, data: aiMessageData }),
            });
             if (!aiMessageResponse.ok) throw new Error((await aiMessageResponse.json()).error || 'Failed to save AI response.');
            
            forceRefresh(); // Show AI's message

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Send Failed', description: error.message });
            setMessage(userMessageText); // Restore input if failed
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Card className="h-[calc(100vh-10rem)] flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><MessageSquare /> Support Chat</CardTitle>
                <CardDescription>Have a question? Chat with our AI assistant or a support team member.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
                <ScrollArea className="flex-1 pr-4 -mr-4 mb-4" ref={scrollAreaRef as any}>
                    <div className="space-y-4">
                        {isLoading ? (
                             <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                        ) : profileError ? (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Profile Incomplete</AlertTitle>
                                <AlertDescription>
                                    We couldn't find your company profile. Please complete your user profile to enable support chat.
                                    <Button asChild variant="link" className="p-0 h-auto ml-1">
                                        <Link href="/account?view=profile">Go to My Profile</Link>
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        ) : (
                            messages?.map((msg: any) => {
                                const isMember = msg.senderId === user?.uid;
                                const isAI = msg.senderId === 'ai-assistant';
                                const alignment = isMember ? "justify-end" : "justify-start";

                                return (
                                    <div key={msg.id} className={cn("flex items-end gap-2", alignment)}>
                                        {!isMember && (
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className={isAI ? 'bg-secondary' : 'bg-muted'}>
                                                    {isAI ? <Bot className="h-5 w-5" /> : 'AD'}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div className={cn(
                                            "rounded-lg px-3 py-2 max-w-[80%] text-sm", 
                                            isMember ? "bg-primary text-primary-foreground" : 
                                            isAI ? "bg-secondary text-secondary-foreground" :
                                            "bg-muted"
                                        )}>
                                            <p className="font-semibold text-xs mb-1">{msg.senderName || 'Support'}</p>
                                            <p>{msg.text}</p>
                                            <p className="text-xs opacity-70 mt-1 text-right">{formatDate(msg.timestamp)}</p>
                                        </div>
                                        {isMember && (
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>YOU</AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                );
                            })
                        )}
                         {messages?.length === 0 && !isLoading && !profileError && (
                            <p className="text-center text-sm text-muted-foreground pt-8">No messages yet. Send a message to start a conversation.</p>
                        )}
                    </div>
                </ScrollArea>
                <div className="mt-auto flex items-center gap-2 pt-4 border-t">
                    <Input 
                        placeholder="Type your message..." 
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !isSending && handleSend()}
                        disabled={isSending || isLoading}
                    />
                    <Button onClick={handleSend} disabled={isSending || isLoading || !message.trim()} size="icon">
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
