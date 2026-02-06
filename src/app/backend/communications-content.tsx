
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MessageSquare, User, Bot } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, collectionGroup } from 'firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  path: string;
  text: string;
  senderId: string;
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
    return date.toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short'});
};

export default function CommunicationsContent() {
    const firestore = useFirestore();

    // Fetch all necessary data
    const messagesQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'messages')) : null, [firestore]);
    const { data: messages, isLoading: areMessagesLoading } = useCollection<Message>(messagesQuery);

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
        
        // Sort messages within each conversation
        Object.values(grouped).forEach(convo => {
            if (convo.messages) {
                 convo.messages.sort((a, b) => {
                    const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(0);
                    const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(0);
                    return dateA.getTime() - dateB.getTime();
                });
            }
        });
        
        return Object.values(grouped);
    }, [messages, companies, leads]);


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
                <CardDescription>Review all chat conversations between agents and their leads. This data can be used for moderation, training, and data mining.</CardDescription>
            </CardHeader>
            <CardContent>
                {conversations.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {conversations.map((convo, index) => (
                            <AccordionItem value={`item-${index}`} key={index}>
                                <AccordionTrigger>
                                    <div>
                                        <p className="font-semibold text-left">
                                            <span className="text-primary">{convo.company?.companyName || 'Unknown Company'}</span> &harr; <span className="text-primary">{convo.lead?.companyName || 'Unknown Lead'}</span>
                                        </p>
                                         <p className="text-xs text-muted-foreground text-left">
                                            {convo.messages.length} message(s)
                                        </p>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="p-4 border rounded-lg bg-muted/50 h-96">
                                        <ScrollArea className="h-full w-full pr-4">
                                             <div className="space-y-4">
                                                {convo.messages.map((message) => (
                                                    <div key={message.id} className={cn("flex items-end gap-2", message.senderId === convo.company?.ownerId ? "justify-end" : "justify-start")}>
                                                        <div className={cn("rounded-lg px-3 py-2 max-w-[80%] text-sm", message.senderId === convo.company?.ownerId ? "bg-primary text-primary-foreground" : "bg-background border")}>
                                                            <p>{message.text}</p>
                                                            <p className="text-xs opacity-70 mt-1 text-right">{formatDate(message.timestamp)}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                             </div>
                                        </ScrollArea>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
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
    )
}
