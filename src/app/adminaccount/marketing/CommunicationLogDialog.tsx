
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import { formatDateSafe } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

async function fetchFromAdminAPI(token: string, action: string, payload?: any) {
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

export function CommunicationLogDialog({ partnerId, partnerName }: { partnerId: string, partnerName: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchLogs = useCallback(async () => {
        if (!isOpen || !partnerId) return;
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");
            
            const result = await fetchFromAdminAPI(token, 'getCommunicationLogs', { partnerId });
            
            const sortedLogs = (result.data || []).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setLogs(sortedLogs);
            
        } catch (e: any) {
            setError(e.message);
            toast({ variant: 'destructive', title: 'Error fetching logs', description: e.message });
        } finally {
            setIsLoading(false);
        }
    }, [isOpen, partnerId, toast]);

    useEffect(() => {
        if (isOpen) {
            fetchLogs();
        }
    }, [isOpen, fetchLogs]);
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title="View Communication Log">
                    <MessageSquare className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Communication Log for {partnerName}</DialogTitle>
                    <DialogDescription>A record of all outreach sent to this partner.</DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto space-y-4 py-4 pr-2">
                    {isLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                    ) : error ? (
                         <div className="text-destructive flex items-center gap-2 p-4"><AlertTriangle/>{error}</div>
                    ) : logs.length > 0 ? (
                        logs.map(log => (
                            <Card key={log.id} className="bg-muted/50">
                                <CardContent className="p-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">{log.subject}</p>
                                            <p className="text-sm text-muted-foreground">Type: <span className="font-medium">{log.type}</span></p>
                                        </div>
                                        <p className="text-xs text-muted-foreground whitespace-nowrap">{formatDateSafe(log.timestamp, "dd MMM yyyy, HH:mm")}</p>
                                    </div>
                                     {log.notes && <p className="text-xs text-muted-foreground mt-2 border-t pt-2">Notes: {log.notes}</p>}
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <p className="text-center text-sm text-muted-foreground py-8">No communication logs found for this partner.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
