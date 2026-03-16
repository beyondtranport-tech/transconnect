
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


interface Message {
  id: string;
  path: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: any;
  companyId: string;
  leadId: string;
}

interface Company {
    id: string;
    companyName: string;
    ownerId: string;
}

interface Lead {
    id: string;
    companyName: string;
    contactPerson?: string;
}

const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';
    const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return formatDateFns(date, "dd MMM yyyy, HH:mm");
};

export default function CommunicationsContent() {
    const firestore = useFirestore();
    const { user: adminUser } = useUser();
    const { toast } = useToast();

    // Fetch all necessary data
    const messagesQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'messages')) : null, [firestore]);
    const { data: messages, isLoading: areMessagesLoading, forceRefresh } = useCollection<Message>(messagesQuery);

    const companiesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'companies')) : null, [firestore]);
    const { data: companies, isLoading: areCompaniesLoading } = useCollection<Company>(companiesQuery);

    const leadsQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'leads')) : null, [firestore]);
    const { data: leads, isLoading: areLeadsLoading } = useCollection<Lead>(leadsQuery);

    const isLoading = areMessagesLoading || areCompaniesLoading || areLeadsLoading;

    const conversations = useMemo(() => {
        if (!messages || !companies || !leads) return [];

        const companyMap = new Map(companies.map(c => [c.id, c]));
        const leadMap = new Map(leads.map(l => [l.id, l]));

        const grouped = messages.reduce((acc, message) => {
            const pathSegments = message.path.split('/');
            if(pathSegments.length < 4) return acc;

            const companyId = pathSegments[1];
            const leadId = pathSegments[3];
            
            const conversationId = `${companyId}-${leadId}`;
            
            if (!acc[conversationId]) {
                acc[conversationId] = {
                    company: companyMap.get(companyId),
                    lead: leadMap.get(leadId),
                    messages: [],
                };
            }
            acc[conversationId].messages.push(message);
            return acc;
        }, {} as Record<string, { company?: Company; lead?: Lead; messages: Message[] }>);
        
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
    }, [messages, companies, leads]);

    const Conversation = ({ convo }: { convo: any }) => {
        const [adminInput, setAdminInput] = useState('');
        const [isSending, setIsSending] = useState(false);
        
        const handleAdminSend = async () => {
            if (!adminUser || !adminInput.trim() || !convo.company?.id || !convo.lead?.id) return;
            setIsSending(true);

            try {
                const token = await getClientSideAuthToken();
                if (!token) throw new Error("Authentication failed.");
                
                const path = `companies/${convo.company.id}/leads/${convo.lead.id}/messages`;
                const messageData = {
                    text: adminInput,
                    senderId: adminUser.uid,
                    timestamp: serverTimestamp(),
                    read: false,
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
            <AccordionItem value={convo.company.id + convo.lead.id} key={convo.company.id + convo.lead.id}>
                <AccordionTrigger>
                    <div>
                        <p className="font-semibold text-left">
                            <span className="text-primary">{convo.company?.companyName || 'Unknown Company'}</span> &harr; <span className="text-primary">{convo.lead?.companyName || 'Unknown Lead'}</span>
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
                                    const isAgent = message.senderId === convo.company?.ownerId;
                                    const isAdmin = message.senderId === adminUser?.uid;
                                    const alignment = (isAgent || isAdmin) ? "justify-end" : "justify-start";

                                    return (
                                        <div key={message.id} className={cn("flex items-end gap-2", alignment)}>
                                            {!(isAgent || isAdmin) && (
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-muted">L</AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div className={cn(
                                                "rounded-lg px-3 py-2 max-w-[80%] text-sm", 
                                                isAdmin ? "bg-secondary text-secondary-foreground" :
                                                isAgent ? "bg-primary text-primary-foreground" : 
                                                "bg-background border"
                                            )}>
                                                <p>{message.text}</p>
                                                <p className="text-xs opacity-70 mt-1 text-right">{formatDate(message.timestamp)}</p>
                                            </div>
                                             {(isAgent || isAdmin) && (
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className={isAdmin ? 'bg-secondary' : 'bg-primary'}>
                                                        {isAdmin ? 'AD' : 'AG'}
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
                                placeholder="Type as Admin to join discussion..." 
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
                    <CardTitle className="flex items-center gap-2"><MessageSquare /> Communication Logs</CardTitle>
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
                <CardTitle className="flex items-center gap-2"><MessageSquare /> Communication Logs</CardTitle>
                <CardDescription>Review all chat conversations between agents and their leads. You can join the discussion by typing in the message box below each conversation.</CardDescription>
            </CardHeader>
            <CardContent>
                {conversations.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {conversations
                            .filter(convo => convo.company && convo.lead)
                            .map((convo) => (
                           <Conversation key={convo.company!.id + convo.lead!.id} convo={convo} />
                        ))}
                    </Accordion>
                ) : (
                    <div className="text-center py-20 border-dashed border-2 rounded-lg">
                        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-xl font-semibold">No Conversations Found</h3>
                        <p className="mt-2 text-muted-foreground">No messages have been sent between agents and leads yet.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
