'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, ClipboardList, CheckCircle, Circle, Clock, Activity, AlertTriangle, Eye, Globe, BookOpen } from 'lucide-react';
import { getClientSideAuthToken, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, orderBy, serverTimestamp, limit } from 'firebase/firestore';
import { formatDateSafe } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

async function performAdminAction(token: string, action: string, payload: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for action: ${action}`);
    }
    return result;
}

export function PartnerOversightDialog({ partner, onUpdate }: { partner: any, onUpdate: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoadingStaff, setIsLoadingStaff] = useState(false);
    const [staff, setStaff] = useState<any[]>([]);
    const { toast } = useToast();
    const firestore = useFirestore();

    const isLead = !partner.type || partner.type === 'lead';
    const parentCollection = isLead ? 'leads' : 'partners';

    const logsQuery = useMemoFirebase(() => {
        if (!firestore || !partner?.id || !isOpen) return null;
        return query(
            collection(firestore, parentCollection, partner.id, 'communications'), 
            orderBy('timestamp', 'desc'),
            limit(50)
        );
    }, [firestore, partner?.id, isOpen, parentCollection]);
    const { data: logs, isLoading: isLoadingLogs, error: logsError } = useCollection(logsQuery);

    const tasksQuery = useMemoFirebase(() => {
        if (!firestore || !partner?.id || !isOpen) return null;
        return query(
            collection(firestore, parentCollection, partner.id, 'tasks'), 
            orderBy('createdAt', 'desc'),
            limit(50)
        );
    }, [firestore, partner?.id, isOpen, parentCollection]);
    const { data: tasks, isLoading: isLoadingTasks, error: tasksError, forceRefresh: refreshTasks } = useCollection(tasksQuery);

    const timeline = useMemo(() => {
        const events: any[] = [];
        if (isOpen && !isLoadingLogs && !isLoadingTasks) {
            (logs || []).forEach(log => {
                if (log && (log.timestamp || log.date)) {
                    events.push({ ...log, type: 'log', date: log.timestamp || log.date });
                }
            });
            (tasks || []).forEach(task => {
                if (task && (task.createdAt || task.date)) {
                    events.push({ ...task, type: 'task', date: task.createdAt || task.date });
                }
            });
            
            if (partner.lastOpenedAt) {
                events.push({
                    id: 'pixel-open',
                    type: 'tracking',
                    subject: 'Email Open Tracked',
                    notes: 'The recipient has opened an engagement email containing a tracking pixel.',
                    date: partner.lastOpenedAt
                });
            }
        }
        
        return events.sort((a, b) => {
            const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
            const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
            return dateB.getTime() - dateA.getTime();
        });
    }, [logs, tasks, isOpen, isLoadingLogs, isLoadingTasks, partner.lastOpenedAt]);

    const fetchStaff = useCallback(async () => {
        if (!isOpen) return;
        setIsLoadingStaff(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            const res = await performAdminAction(token, 'getPlatformStaff', {});
            setStaff(res.data || []);
        } catch (e) {
            console.error("Staff fetch failed", e);
        } finally {
            setIsLoadingStaff(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) fetchStaff();
    }, [isOpen, fetchStaff]);

    const handleAssign = async (staffId: string) => {
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed");
            
            await fetch('/api/updateUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: `${parentCollection}/${partner.id}`,
                    data: { assigneeId: staffId === 'none' ? null : staffId, updatedAt: serverTimestamp() }
                })
            });
            
            toast({ title: "Record Allocated", description: "Successfully updated assignee." });
            onUpdate();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Assignment Failed", description: e.message });
        }
    };

    const toggleTask = async (task: any) => {
        try {
            const token = await getClientSideAuthToken();
            if (!token) return;
            await fetch('/api/updateUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: `${parentCollection}/${partner.id}/tasks/${task.id}`,
                    data: { status: task.status === 'pending' ? 'completed' : 'pending', updatedAt: serverTimestamp() }
                })
            });
            refreshTasks();
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Update Failed", description: e.message });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button variant="ghost" size="icon" title="Oversight & Activity">
                    <Clock className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
                <DialogHeader className="p-6 border-b bg-muted/30">
                    <div className="flex justify-between items-start">
                        <div className="text-left">
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                <Clock className="h-6 w-6 text-primary" />
                                Oversight: {partner.companyName || `${partner.firstName} ${partner.lastName}`}
                            </DialogTitle>
                            <DialogDescription className="mt-1">Full engagement history and technical profile.</DialogDescription>
                        </div>
                        <div className="space-y-2 text-right">
                             <Label className="text-xs font-bold uppercase text-muted-foreground">Allocated Staff</Label>
                             <Select value={partner.assigneeId || 'none'} onValueChange={handleAssign}>
                                <SelectTrigger className="w-[200px] h-9">
                                    <SelectValue placeholder="Unallocated" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Unallocated</SelectItem>
                                    {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}
                                </SelectContent>
                             </Select>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50 text-left">
                    {/* Technical Profile Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-primary"/>
                            Forensic & Technical Profile
                        </h3>
                        <Card className="shadow-none bg-white">
                            <CardContent className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest text-left">Official Website</p>
                                        {partner.website ? (
                                            <a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-primary hover:underline flex items-center gap-1.5">
                                                <Globe className="h-3.5 w-3.5" />
                                                {partner.website}
                                            </a>
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic text-left">No website URL recorded.</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest text-left">Mined Service Summary</p>
                                        <p className="text-sm leading-relaxed text-foreground text-left">
                                            {partner.notes || "No technical service wording has been mined for this record yet."}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Activity className="h-4 w-4"/>
                            Relationship Timeline
                        </h3>
                        
                        {(isLoadingLogs || isLoadingTasks) ? (
                            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
                        ) : (logsError || tasksError) ? (
                            <Card className="border-destructive bg-destructive/10">
                                <CardContent className="p-6 flex items-center gap-3 text-destructive">
                                    <AlertTriangle className="h-6 w-6" />
                                    <div>
                                        <p className="font-bold">Access Issue</p>
                                        <p className="text-sm">Ensure your admin rules permit sub-collection listing.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : timeline.length > 0 ? (
                            <div className="relative space-y-4 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-muted">
                                {timeline.map((event, idx) => (
                                    <div key={event.id || idx} className="relative pl-10">
                                        <div className={cn(
                                            "absolute left-2 top-1.5 h-4 w-4 rounded-full border-2 border-background z-10",
                                            event.type === 'task' ? (event.status === 'completed' ? "bg-green-500" : "bg-amber-500") : 
                                            event.type === 'tracking' ? "bg-blue-600" : "bg-primary"
                                        )} />
                                        <Card className="shadow-none">
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-1 text-left">
                                                        <div className="flex items-center gap-2 text-left">
                                                            {event.type === 'task' ? <ClipboardList className="h-3.5 w-3.5 text-amber-600" /> : 
                                                             event.type === 'tracking' ? <Eye className="h-3.5 w-3.5 text-blue-600" /> :
                                                             <MessageSquare className="h-3.5 w-3.5 text-primary" />}
                                                            <span className="font-bold text-sm text-left">{event.subject || event.title}</span>
                                                            <Badge variant="outline" className="text-[10px] h-4 uppercase">{event.type}</Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground text-left">{event.notes || event.description || 'No details.'}</p>
                                                    </div>
                                                    <div className="text-right space-y-1">
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{formatDateSafe(event.date, "dd MMM yyyy, HH:mm")}</p>
                                                        {event.type === 'task' && (
                                                            <Button 
                                                                size="sm" 
                                                                variant="ghost" 
                                                                className={cn("h-7 px-2 text-xs", event.status === 'completed' ? "text-green-600" : "text-amber-600")}
                                                                onClick={() => toggleTask(event)}
                                                            >
                                                                {event.status === 'completed' ? <CheckCircle className="mr-1 h-3 w-3"/> : <Circle className="mr-1 h-3 w-3"/>}
                                                                {event.status === 'completed' ? 'Done' : 'Mark Done'}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-20" />
                                <p className="text-sm text-muted-foreground">No activity recorded for this entity.</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-4 border-t bg-muted/10 flex justify-end px-6">
                    <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>Close Oversight</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
