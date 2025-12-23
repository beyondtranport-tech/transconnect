
'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Trash2, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { deleteUser } from './actions';
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
        return collection(firestore, 'members');
    }, [firestore, user]);
    
    const { data: members, isLoading, error } = useCollection(membersCollectionRef);

    const handleDelete = async (memberId: string, email: string | undefined) => {
        // Prevent admin from deleting themselves
        if (user?.uid === memberId) {
            toast({
                variant: "destructive",
                title: "Action not allowed",
                description: "Administrators cannot delete their own account.",
            });
            return;
        }

        // Call the server action to delete both Auth user and Firestore doc.
        const result = await deleteUser(memberId);

        if (result.success) {
            toast({
                title: "User Deleted",
                description: `The user ${email || memberId} has been permanently removed.`,
            });
        } else {
             toast({
                variant: "destructive",
                title: "Deletion Failed",
                description: result.error || "Could not delete the user due to an unknown error.",
            });
        }
    };

    const capitalize = (s: string) => s && s[0].toUpperCase() + s.slice(1);

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
                                <TableHead className="text-right">Actions</TableHead>
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
                                        {member.admin && <Badge variant="destructive">Admin</Badge>}
                                        {member.role && !member.admin && (
                                            <Badge variant="outline" className="capitalize">
                                                {member.role}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                         <Button asChild variant="outline" size="sm">
                                            <Link href={`/backend/wallet/${member.id}`}>
                                                <Wallet className="h-4 w-4 mr-2" />
                                                Manage Wallet
                                            </Link>
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={user?.uid === member.id}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete the user <span className="font-bold">{member.email}</span> and all associated data from the authentication system and database.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleDelete(member.id, member.email)}
                                                        className="bg-destructive hover:bg-destructive/90"
                                                    >
                                                        Delete User
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
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
