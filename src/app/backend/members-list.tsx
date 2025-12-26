
'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, query } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Link from 'next/link';

export default function MembersList() {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();

    const membersCollectionRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'members'));
    }, [firestore, user]);
    
    const { data: members, isLoading, error } = useCollection(membersCollectionRef);

    const capitalize = (s: string) => s && s[0].toUpperCase() + s.slice(1);

    if (isUserLoading || isLoading) {
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
    
    if (!user) {
         return (
             <Card>
                <CardHeader>
                    <CardTitle>Members</CardTitle>
                    <CardDescription>A list of all registered members on the platform.</CardDescription>
                </CardHeader>
                <CardContent className="text-center py-10">
                    <p className="text-muted-foreground">Please log in to view member data.</p>
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
                        <p className="text-sm">{error.message}</p>
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
                                return (
                                <TableRow key={member.id}>
                                    <TableCell className="font-medium">{member.firstName} {member.lastName}</TableCell>
                                    <TableCell>{member.companyName}</TableCell>
                                    <TableCell>{member.email}</TableCell>
                                    <TableCell>{member.phone}</TableCell>
                                    <TableCell>
                                        <Badge variant={member.membershipId === 'free' ? 'secondary' : 'default'} className="capitalize">
                                            {member.membershipId}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {member.email === 'beyondtransport@gmail.com' && <Badge variant="destructive">Admin</Badge>}
                                        {member.email !== 'beyondtransport@gmail.com' && member.role && (
                                            <Badge variant="outline" className="capitalize">
                                                {member.role.replace(/-/g, ' ')}
                                            </Badge>
                                        )}
                                    </TableCell>
                                     <TableCell className="text-right">
                                         {member.email !== 'beyondtransport@gmail.com' && (
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={{
                                                    pathname: `/backend/wallet/${member.id}`,
                                                    query: { 
                                                        firstName: member.firstName,
                                                        lastName: member.lastName,
                                                        email: member.email,
                                                        walletBalance: member.walletBalance,
                                                        createdAt: new Date(member.createdAt?.toDate() || Date.now()).toISOString(),
                                                     }
                                                }}>
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
