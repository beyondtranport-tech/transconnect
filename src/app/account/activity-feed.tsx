
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Activity, User, Building, FileText, ShoppingCart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { handleGetAuditLogs } from './actions'; // Import the new server action

const getSubjectInfo = (log: any) => {
    const pathSegments = log.collectionPath.split('/');
    if (pathSegments.includes('staff')) {
        return { name: 'Staff Member', href: `/account?view=staff`, icon: Users };
    }
    if (pathSegments.includes('shops')) {
        return { name: 'Shop Profile', href: `/account?view=shop`, icon: ShoppingCart };
    }
    if (pathSegments.includes('products')) {
        return { name: 'Product', href: `/account?view=shop`, icon: ShoppingCart };
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

    const loadLogs = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // The server action now handles authentication and data fetching
            const result = await handleGetAuditLogs();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch audit logs.');
            }
            
            // The data returned is already filtered for the current user's company
            const sortedLogs = result.data.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setLogs(sortedLogs);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);
    
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

    if (isLoading) {
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
        <Card>
            <CardHeader className="px-6 pt-6">
                <div className="flex items-center gap-2">
                    <Activity className="h-6 w-6" />
                    <CardTitle>My Company's Activity Feed</CardTitle>
                </div>
                <CardDescription>A real-time overview of actions performed on your business account.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
             {logs.length > 0 ? (
                <div className="space-y-4">
                    {logs.map(log => {
                        const subject = getSubjectInfo(log);
                        const actionInfo = actionConfig[log.action] || { color: 'outline', text: log.action };
                        const SubjectIcon = subject.icon;

                        return (
                            <Card key={log.id} className="p-4 bg-background">
                                <div className="flex items-start gap-4">
                                    <div className="bg-muted p-2 rounded-full mt-1">
                                        <SubjectIcon className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm">
                                                    <span className="font-semibold text-primary">{log.userName || 'A user'}</span>
                                                    {' '}{actionInfo.text}{' '}
                                                    <Link href={subject.href} className="font-semibold hover:underline">{subject.name}</Link>
                                                </p>
                                                <p className="text-xs text-muted-foreground">{formatDate(log.timestamp)}</p>
                                            </div>
                                            <Badge variant={actionInfo.color} className="capitalize">{log.action}</Badge>
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
            </CardContent>
        </Card>
    );
}
