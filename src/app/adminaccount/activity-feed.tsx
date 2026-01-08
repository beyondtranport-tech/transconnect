
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Activity, User, Building, FileText, ShoppingCart, Users } from 'lucide-react';
import { getClientSideAuthToken, useUser } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

async function fetchFromAdminAPI(token: string, action: string, payload?: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, payload }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for action: ${action}`);
    }
    return result;
}

const getSubjectInfo = (log: any) => {
    const pathSegments = log.collectionPath.split('/');
    if (pathSegments.includes('staff')) {
        return { name: 'Staff Member', href: `/backend?view=staff`, icon: Users };
    }
    if (pathSegments.includes('shops')) {
        return { name: 'Shop Profile', href: `/backend?view=shops`, icon: ShoppingCart };
    }
    if (pathSegments.includes('products')) {
        return { name: 'Product', href: `/backend?view=shops`, icon: ShoppingCart };
    }
    if (log.collectionPath.startsWith('users')) {
        return { name: 'User Profile', href: `/account?view=profile`, icon: User };
    }
    if (log.collectionPath.startsWith('companies')) {
        return { name: 'Company Profile', href: `/account?view=company`, icon: Building };
    }
    
    return { name: 'System Record', href: '#', icon: FileText };
};


export default function ActivityFeed() {
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, isUserLoading } = useUser();

    const loadLogs = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            const result = await fetchFromAdminAPI(token, 'getAuditLogs');
            const sortedLogs = result.data.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setLogs(sortedLogs);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isUserLoading && user) {
            loadLogs();
        }
    }, [isUserLoading, user, loadLogs]);
    
    const formatDate = (isoString?: string) => {
        if (!isoString) return 'N/A';
        try {
            return formatDistanceToNow(new Date(isoString), { addSuffix: true });
        } catch {
            return 'Invalid Date';
        }
    };
    
    const actionConfig: { [key: string]: { color: 'default' | 'destructive' | 'secondary' | 'outline', text: string } } = {
        create: { color: 'default', text: 'created a new' },
        update: { color: 'secondary', text: 'updated the' },
        delete: { color: 'destructive', text: 'deleted a' }
    };

    if (isLoading || isUserLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (error) {
         return (
            <div className="text-destructive-foreground bg-destructive/90 p-4 rounded-md">
                <h4 className="font-semibold">Error Loading Activity Feed</h4>
                <p>{error}</p>
                 <Button onClick={loadLogs} variant="destructive" className="mt-4">Try Again</Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <CardHeader className="px-0">
                <div className="flex items-center gap-2">
                    <Activity className="h-6 w-6" />
                    <CardTitle>Business Activity Feed</CardTitle>
                </div>
                <CardDescription>A real-time overview of actions performed on your business account.</CardDescription>
            </CardHeader>
             {logs.length > 0 ? (
                <div className="space-y-6">
                    {logs.map(log => {
                        const subject = getSubjectInfo(log);
                        const actionInfo = actionConfig[log.action] || { color: 'outline', text: log.action };
                        const SubjectIcon = subject.icon;

                        return (
                            <Card key={log.id} className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className="bg-muted p-2 rounded-full mt-1">
                                        <SubjectIcon className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm">
                                                    <span className="font-semibold text-primary">{log.userName || 'A user'}</span>
                                                    {' '}{actionInfo.text}{' '}
                                                    <span className="font-semibold">{subject.name}</span>
                                                </p>
                                                <p className="text-xs text-muted-foreground">{formatDate(log.timestamp)}</p>
                                            </div>
                                            <Badge variant={actionInfo.color} className="capitalize">{log.action}</Badge>
                                        </div>
                                         <div className="flex items-center gap-2">
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={subject.href}>View Subject</Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-xl font-semibold">No Activity Yet</h3>
                    <p className="mt-2 text-muted-foreground">Recent actions on your business account will appear here.</p>
                </div>
            )}
        </div>
    );
}
