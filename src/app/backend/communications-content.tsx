
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, MessageSquare, Send, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, getClientSideAuthToken, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, collectionGroup } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { format as formatDateFns } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface SupportMessage {
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

    // Fetch all support messages and companies
    const messagesQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'supportMessages')) : null, [firestore]);
    const { data: messages, isLoading: areMessagesLoading, forceRefresh } = useCollection<SupportMessage>(messagesQuery);

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
        }, {} as Record<string, { company?: Company; messages: SupportMessage[] }>);
        
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
            if (!a.messages.length || !b.messages.length) return 0;
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
                    senderName: 'Support Team',
                    timestamp: serverTimestamp(),
                    companyId: convo.company.id,
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
                        <p className="font-semibold text-left text-primary">{convo.company?.companyName || 'Unknown Company'}</p>
                         <p className="text-xs text-muted-foreground text-left">
                            {convo.messages.length} message(s) | Last message: {formatDate(convo.messages[convo.messages.length - 1].timestamp)}
                        </p>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="p-4 border rounded-lg bg-muted/50 h-[60vh] flex flex-col">
                        <ScrollArea className="flex-1 w-full pr-4 mb-4">
                             <div className="space-y-4">
                                {convo.messages.map((message: SupportMessage) => {
                                    const isMember = message.senderId === convo.company?.ownerId;
                                    const isAdmin = message.senderId === adminUser?.uid;
                                    const isAI = message.senderId === 'ai-assistant';
                                    const alignment = (isAdmin || isAI) ? "justify-end" : "justify-start";

                                    return (
                                        <div key={message.id} className={cn("flex items-end gap-2", alignment)}>
                                            {!isAdmin && !isAI && (
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-muted">
                                                        {convo.company?.companyName?.charAt(0) || 'M'}
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div className={cn(
                                                "rounded-lg px-3 py-2 max-w-[80%] text-sm", 
                                                isAdmin ? "bg-secondary text-secondary-foreground" :
                                                isAI ? "bg-blue-200 text-blue-900" :
                                                "bg-background border"
                                            )}>
                                                <p className="font-semibold text-xs mb-1">{message.senderName}</p>
                                                <p>{message.text}</p>
                                                <p className="text-xs opacity-70 mt-1 text-right">{formatDate(message.timestamp)}</p>
                                            </div>
                                             {(isAdmin || isAI) && (
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className={isAdmin ? 'bg-secondary' : 'bg-blue-500 text-white'}>
                                                        {isAdmin ? 'S' : <Bot className="h-5 w-5" />}
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}
                                        </div>
                                    );
                                })}
                             </div>
                        </ScrollArea>
                        <div className="mt-auto flex items-center gap-2 pt-4 border-t">
                            <Input 
                                placeholder="Type as Support to reply..." 
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
                    <CardTitle className="flex items-center gap-2"><MessageSquare /> Member Support Inbox</CardTitle>
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
                <CardTitle className="flex items-center gap-2"><MessageSquare /> Member Support Inbox</CardTitle>
                <CardDescription>Review all member support conversations. You can join the discussion by typing in the message box below each conversation.</CardDescription>
            </CardHeader>
            <CardContent>
                {conversations.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {conversations
                            .filter(convo => convo.company)
                            .map((convo) => (
                           <Conversation key={convo.company!.id} convo={convo} />
                        ))}
                    </Accordion>
                ) : (
                    <div className="text-center py-20 border-dashed border-2 rounded-lg">
                        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-xl font-semibold">Inbox Zero!</h3>
                        <p className="mt-2 text-muted-foreground">There are no active support conversations.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
