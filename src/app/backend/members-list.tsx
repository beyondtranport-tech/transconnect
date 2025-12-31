
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Users, Wallet } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getMembers } from './actions';

interface Member {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    companyName?: string;
    membershipId?: string;
    walletBalance?: number;
    createdAt?: string;
}

const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
};

const formatDate = (isoString: string | undefined) => {
    if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleDateString('en-ZA');
    } catch (e) {
        return 'Invalid Date';
    }
};

export default function MembersList() {
    const [members, setMembers] = useState<Member[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchMembers() {
            setIsLoading(true);
            const result = await getMembers();
            if (result.success && result.data) {
                setMembers(result.data);
            } else {
                setError(result.error || 'Failed to fetch members.');
            }
            setIsLoading(false);
        }

        fetchMembers();
    }, []);

    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Member Roster</CardTitle>
                    <CardDescription>Fetching the list of all members...</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }
    
    if (error) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Member Roster</CardTitle>
                    <CardDescription>Could not load members.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-destructive-foreground bg-destructive/90 p-4 rounded-md">
                        <h4 className="font-semibold">Error loading members</h4>
                        <p className="text-sm">{error}</p>
                    </div>
                </CardContent>
            </Card>
        )
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users /> Member Roster</CardTitle>
                <CardDescription>
                    A list of all registered members on the TransConnect platform.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Membership</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members && members.length > 0 ? members.map(member => (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        <div className="font-medium">{member.firstName || ''} {member.lastName || ''}</div>
                                        <div className="text-sm text-muted-foreground">{member.email || ''}</div>
                                    </TableCell>
                                    <TableCell>{member.companyName}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">{member.membershipId || 'N/A'}</Badge>
                                    </TableCell>
                                    <TableCell>{formatDate(member.createdAt)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button asChild variant="ghost" size="sm">
                                            <Link href={`/backend/wallet/${member.id}`}>
                                                <Wallet className="mr-2 h-4 w-4" />
                                                Wallet
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">No members found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
