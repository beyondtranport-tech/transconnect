
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getMembers } from './actions';

// Define the shape of a member object
interface Member {
    id: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    email?: string;
    phone?: string;
    membershipId?: string;
    role?: string;
}

export default function MembersList() {
    const [members, setMembers] = useState<Member[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchMembers() {
            setIsLoading(true);
            try {
                const result = await getMembers();
                if (result.success && result.data) {
                    setMembers(result.data);
                } else {
                    setError(result.error || 'Failed to fetch members.');
                }
            } catch (e: any) {
                setError(e.message || 'An unexpected error occurred.');
            } finally {
                setIsLoading(false);
            }
        }

        fetchMembers();
    }, []);

    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Members</CardTitle>
                    <CardDescription>A list of all registered members on the platform.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Members</CardTitle>
                <CardDescription>A list of all registered members on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
                {error && (
                     <div className="text-destructive-foreground bg-destructive/90 p-4 rounded-md">
                        <h4 className="font-semibold">Error loading members</h4>
                        <p className="text-sm">{error}</p>
                    </div>
                )}
                {members && !isLoading && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Membership</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map(member => {
                                // Defensive check: if member is null or undefined, skip rendering this row.
                                if (!member) {
                                    return null;
                                }

                                // Defensive fallbacks for every single property
                                const firstName = member.firstName || 'N/A';
                                const lastName = member.lastName || '';
                                const companyName = member.companyName || 'N/A';
                                const email = member.email || 'N/A';
                                const phone = member.phone || 'N/A';
                                const membership = member.membershipId || 'free';
                                const roleText = (member.role || 'Member').replace(/-/g, ' ');

                                return (
                                <TableRow key={member.id}>
                                    <TableCell className="font-medium">{firstName} {lastName}</TableCell>
                                    <TableCell>{companyName}</TableCell>
                                    <TableCell>{email}</TableCell>
                                    <TableCell>{phone}</TableCell>
                                    <TableCell>
                                        <Badge variant={membership === 'free' ? 'secondary' : 'default'} className="capitalize">
                                            {membership}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {email === 'beyondtransport@gmail.com' ? (
                                            <Badge variant="destructive">Admin</Badge>
                                        ) : (
                                            <Badge variant="outline" className="capitalize">
                                                {roleText}
                                            </Badge>
                                        )}
                                    </TableCell>
                                     <TableCell className="text-right">
                                         {email !== 'beyondtransport@gmail.com' && (
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={`/backend/wallet/${member.id}`}>
                                                    <Wallet className="mr-2 h-4 w-4" /> Manage Wallet
                                                </Link>
                                            </Button>
                                         )}
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                )}
                 {members && members.length === 0 && !isLoading && (
                    <p className="text-center text-muted-foreground py-10">No members have signed up yet.</p>
                )}
            </CardContent>
        </Card>
    );
}
