
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
import { collection, query, orderBy, serverTimestamp, collectionGroup } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { supportQuery } from '@/ai/flows/support-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { format as formatDateFns } from 'date-fns';

interface Message {
  id: string;
  path: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: any;
  companyId: string;
}

interface Company {
    id: string;
    companyName: string;
    ownerId: string;
}

const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';
    const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return formatDateFns(date, "dd MMM yyyy, HH:mm");
};

export default function SupportChatInbox() {
    const firestore = useFirestore();
    const { user: adminUser } = useUser();
    const { toast } = useToast();

    // Fetch all necessary data
    const messagesQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'supportMessages')) : null, [firestore]);
    const { data: messages, isLoading: areMessagesLoading, forceRefresh } = useCollection<Message>(messagesQuery);

    const companiesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'companies')) : null, [firestore]);
    const { data: companies, isLoading: areCompaniesLoading } = useCollection<Company>(companiesQuery);

    const isLoading = areMessagesLoading || areCompaniesLoading;

    const conversations = useMemo(() => {
        if (!messages || !companies) return [];

        const companyMap = new Map(companies.map(c => [c.id, c]));

        const grouped = messages.reduce((acc, message) => {
            const companyId = message.companyId;
            if (!companyId) return acc;
            
            if (!acc[companyId]) {
                acc[companyId] = {
                    company: companyMap.get(companyId),
                    messages: [],
                };
            }
            acc[companyId].messages.push(message);
            return acc;
        }, {} as Record<string, { company?: Company; messages: Message[] }>);
        
        Object.values(grouped).forEach(convo => {
            if (convo.messages) {
                 convo.messages.sort((a, b) => {
                    const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(0);
                    const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(0);
                    return dateA.getTime() - dateB.getTime();
                });
            }
        });
        
        return Object.values(grouped).sort((a,b) => {
            const lastMsgA = a.messages[a.messages.length - 1];
            const lastMsgB = b.messages[b.messages.length - 1];
            const dateA = lastMsgA?.timestamp?.toDate ? lastMsgA.timestamp.toDate() : new Date(0);
            const dateB = lastMsgB?.timestamp?.toDate ? lastMsgB.timestamp.toDate() : new Date(0);
            return dateB.getTime() - dateA.getTime();
        });
    }, [messages, companies]);

    const Conversation = ({ convo }: { convo: any }) => {
        const [adminInput, setAdminInput] = useState('');
        const [isSending, setIsSending] = useState(false);
        
        const handleAdminSend = async () => {
            if (!adminUser || !adminInput.trim() || !convo.company?.id) return;
            setIsSending(true);

            try {
                const token = await getClientSideAuthToken();
                if (!token) throw new Error("Authentication failed.");
                
                const path = `companies/${convo.company.id}/supportMessages`;
                const messageData = {
                    text: adminInput,
                    senderId: adminUser.uid,
                    senderName: 'Admin Support',
                    timestamp: serverTimestamp(),
                    readByAdmin: true,
                };
                
                const response = await fetch('/api/addUserDoc', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ collectionPath: path, data: messageData }),
                });

                if (!response.ok) {
                    const result = await response.json();
                    throw new Error(result.error || 'Failed to send message.');
                }
                
                setAdminInput('');
                forceRefresh();
            } catch (error: any) {
                toast({
                    variant: 'destructive',
                    title: 'Send Failed',
                    description: error.message,
                });
            } finally {
                setIsSending(false);
            }
        };

        return (
            <AccordionItem value={convo.company.id} key={convo.company.id}>
                <AccordionTrigger>
                    <div>
                        <p className="font-semibold text-left">
                            {convo.company?.companyName || 'Unknown Company'}
                        </p>
                         <p className="text-xs text-muted-foreground text-left">
                            {convo.messages.length} message(s) | Last message: {formatDate(convo.messages[convo.messages.length - 1].timestamp)}
                        </p>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="p-4 border rounded-lg bg-muted/50 h-[60vh] flex flex-col">
                        <ScrollArea className="flex-1 w-full pr-4 mb-4">
                             <div className="space-y-4">
                                {convo.messages.map((message: Message) => {
                                    const isThisAdmin = message.senderId === adminUser?.uid;
                                    const isAI = message.senderId === 'ai-assistant';
                                    const isMember = !isThisAdmin && !isAI;
                                    const alignment = (isThisAdmin) ? "justify-end" : "justify-start";

                                    return (
                                        <div key={message.id} className={cn("flex items-end gap-2", alignment)}>
                                            {!isThisAdmin && (
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className={isAI ? 'bg-secondary' : 'bg-muted'}>
                                                        {isAI ? <Bot className="h-5 w-5" /> : 'M'}
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div className={cn(
                                                "rounded-lg px-3 py-2 max-w-[80%] text-sm", 
                                                isThisAdmin ? "bg-primary text-primary-foreground" : 
                                                isAI ? "bg-secondary text-secondary-foreground" :
                                                "bg-background border"
                                            )}>
                                                <p className="font-semibold text-xs mb-1">{message.senderName || 'Member'}</p>
                                                <p>{message.text}</p>
                                                <p className="text-xs opacity-70 mt-1 text-right">{formatDate(message.timestamp)}</p>
                                            </div>
                                             {isThisAdmin && (
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className={'bg-primary text-primary-foreground'}>AD</AvatarFallback>
                                                </Avatar>
                                            )}
                                        </div>
                                    );
                                })}
                             </div>
                        </ScrollArea>
                        <div className="mt-auto flex items-center gap-2 pt-4 border-t">
                            <Input 
                                placeholder={`Reply to ${convo.company.companyName}...`} 
                                value={adminInput}
                                onChange={e => setAdminInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !isSending && handleAdminSend()}
                                disabled={isSending}
                            />
                            <Button onClick={handleAdminSend} disabled={isSending || !adminInput.trim()} size="icon">
                                {isSending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        )
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><MessageSquare /> Support Inbox</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center items-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><MessageSquare /> Support Inbox</CardTitle>
                <CardDescription>Review and respond to all member support requests. The AI assistant will attempt to answer first.</CardDescription>
            </CardHeader>
            <CardContent>
                {conversations.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {conversations.map((convo) => (
                           <Conversation key={convo.company.id} convo={convo} />
                        ))}
                    </Accordion>
                ) : (
                    <div className="text-center py-20 border-dashed border-2 rounded-lg">
                        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-xl font-semibold">Inbox Zero</h3>
                        <p className="mt-2 text-muted-foreground">No support requests from members yet.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
