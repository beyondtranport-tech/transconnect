'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function MembersList() {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();

    // Only create the query if the user is authenticated
    const membersCollectionRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return collection(firestore, 'members');
    }, [firestore, user]);
    
    const { data: members, isLoading, error } = useCollection(membersCollectionRef);

    const capitalize = (s: string) => s && s[0].toUpperCase() + s.slice(1);

    // Show a loading state while checking for user authentication
    if (isUserLoading) {
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
    
    // If the backend lock is off, a user might access this page without being logged in.
    // We should not attempt to fetch data in that case.
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
                {isLoading && (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
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
                                <TableHead>Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map(member => (
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
                                        {member.role && (
                                            <Badge variant="outline" className="capitalize">
                                                {member.role}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {member.financierType && (
                                            <Badge variant="default" className="capitalize bg-accent text-accent-foreground">
                                                {capitalize(member.financierType.replace('-', ' '))}
                                            </Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
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
