
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, FileText, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getClientSideAuthToken } from '@/firebase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

async function fetchFromAdminAPI(action: string, payload?: any) {
    const token = await getClientSideAuthToken();
    if (!token) throw new Error("Authentication failed.");
    
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
        return { name: 'Staff Member', href: `/backend?view=staff` };
    }
    if (pathSegments.includes('shops')) {
        return { name: 'Shop', href: `/backend?view=shops` };
    }
    if (pathSegments.includes('products')) {
        return { name: 'Product', href: `/backend?view=shops` };
    }
    if (log.collectionPath.startsWith('users')) {
        return { name: 'User Profile', href: `/backend?view=wallet&memberId=${log.companyId}` };
    }
    if (log.collectionPath.startsWith('companies')) {
        return { name: 'Company Profile', href: `/backend?view=wallet&memberId=${log.documentId}` };
    }
    
    return { name: 'System Record', href: '#' };
};


export default function PlatformLogsContent() {
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadLogs = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await fetchFromAdminAPI('getAuditLogs');
            setLogs(result.data || []);
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
            return new Date(isoString).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' });
        } catch {
            return 'Invalid Date';
        }
    };
    
    const actionColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
        create: 'default',
        update: 'secondary',
        delete: 'destructive'
    };

    return (
        <Card>
            <CardHeader>
                 <div className="flex items-center gap-2">
                    <Activity className="h-6 w-6" />
                    <CardTitle>Platform Audit Logs</CardTitle>
                </div>
                <CardDescription>A chronological record of all significant actions performed on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
                 {isLoading ? (
                    <div className="flex justify-center items-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                 ) : error ? (
                    <div className="text-destructive-foreground bg-destructive/90 p-4 rounded-md"><p>{error}</p></div>
                 ) : logs.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Subject</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map(log => {
                                const subject = getSubjectInfo(log);
                                return (
                                <TableRow key={log.id}>
                                    <TableCell className="font-mono text-xs">{formatDate(log.timestamp)}</TableCell>
                                    <TableCell>
                                        <Link href={`/backend?view=wallet&memberId=${log.companyId}`} className="text-primary hover:underline text-xs">{log.userName}</Link>
                                    </TableCell>
                                     <TableCell>
                                        <Link href={`/backend?view=wallet&memberId=${log.companyId}`} className="text-primary hover:underline text-xs">{log.companyName}</Link>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={actionColors[log.action] || 'outline'} className="capitalize">{log.action}</Badge>
                                    </TableCell>
                                     <TableCell>
                                        <Link href={subject.href} className="text-primary hover:underline text-xs">{subject.name}</Link>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                 ) : (
                    <div className="text-center text-muted-foreground py-10">No audit logs found.</div>
                 )}
            </CardContent>
        </Card>
    );
}
