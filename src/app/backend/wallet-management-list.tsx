
'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, writeBatch, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Edit, Check } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

export default function WalletManagementList() {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
    const [creditAmount, setCreditAmount] = useState<number>(0);
    const [isUpdating, setIsUpdating] = useState(false);
    const [originalBalance, setOriginalBalance] = useState<number>(0);

    const membersCollectionRef = useMemoFirebase(() => {
        if (!firestore || !user) return null; // Don't fetch if no user
        return query(collection(firestore, 'members'), orderBy('email', 'desc'));
    }, [firestore, user]);
    
    const { data: members, isLoading, error } = useCollection(membersCollectionRef);

    const handleEdit = (memberId: string, currentBalance: number) => {
        setEditingMemberId(memberId);
        setCreditAmount(currentBalance);
        setOriginalBalance(currentBalance);
    };

    const handleCancel = () => {
        setEditingMemberId(null);
        setCreditAmount(0);
        setOriginalBalance(0);
    };

    const handleUpdate = async (memberId: string) => {
        if (!firestore || !user) return;
        setIsUpdating(true);

        const memberRef = doc(firestore, 'members', memberId);
        const amountDifference = Number(creditAmount) - originalBalance;
        
        if (amountDifference <= 0) {
             toast({ variant: 'destructive', title: 'Invalid Amount', description: 'New balance must be greater than the original balance.' });
             setIsUpdating(false);
             return;
        }

        const financeAppRef = doc(collection(firestore, "financeApplications"));

        const batch = writeBatch(firestore);

        // 1. Update member's wallet balance
        batch.update(memberRef, { walletBalance: Number(creditAmount) });

        // 2. Create a financeApplication record for the credit top-up
        batch.set(financeAppRef, {
            applicantId: memberId,
            status: 'funded', // Automatically approved as it's an admin action
            fundingType: 'credit-top-up',
            amountRequested: amountDifference,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        
        // 3. Add the new application ID to the member's list of applications
        batch.update(memberRef, { financeApplicationIds: arrayUnion(financeAppRef.id) });
        
        try {
            await batch.commit();
            toast({ title: 'Success', description: 'Member wallet balance updated and transaction recorded.' });
            handleCancel(); 
        } catch (serverError) {
             const permissionError = new FirestorePermissionError({
                path: memberRef.path,
                operation: 'update',
                requestResourceData: { walletBalance: Number(creditAmount) },
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: 'Update Failed', description: 'Permission denied. Ensure you have admin privileges.' });
        } finally {
            setIsUpdating(false);
        }
    };

    const formatDate = (timestamp: any) => {
        if (timestamp && timestamp.toDate) {
            return format(timestamp.toDate(), "yyyy-MM-dd HH:mm");
        }
        return 'N/A';
    };
    
    const renderBody = () => {
        if (isUserLoading) {
            return (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            );
        }
        
        if (!user) {
            return (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">Please log in to manage member wallets.</p>
                </div>
            );
        }

        if (isLoading) {
            return (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            );
        }

        if (error) {
             return (
                 <div className="text-destructive-foreground bg-destructive/90 p-4 rounded-md">
                    <h4 className="font-semibold">Error</h4>
                    <p className="text-sm">{error.message}</p>
                </div>
             );
        }

        if (members) {
            return (
                 <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead className="text-right">Wallet Balance (R)</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map(member => (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        <div className="font-medium">{member.firstName} {member.lastName}</div>
                                        <div className="text-sm text-muted-foreground">{member.email}</div>
                                    </TableCell>
                                    <TableCell>{member.companyName}</TableCell>
                                    <TableCell className="text-right">
                                        {editingMemberId === member.id ? (
                                            <Input
                                                type="number"
                                                value={creditAmount}
                                                onChange={(e) => setCreditAmount(Number(e.target.value))}
                                                className="w-32 ml-auto"
                                                disabled={isUpdating}
                                            />
                                        ) : (
                                            <span className="font-mono">{member.walletBalance?.toFixed(2) || '0.00'}</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                            {editingMemberId === member.id ? (
                                            <div className="flex gap-2 justify-end">
                                                <Button size="sm" onClick={() => handleUpdate(member.id)} disabled={isUpdating}>
                                                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4" />}
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={handleCancel} disabled={isUpdating}>Cancel</Button>
                                            </div>
                                            ) : (
                                            <Button size="sm" variant="outline" onClick={() => handleEdit(member.id, member.walletBalance || 0)}>
                                                <Edit className="h-4 w-4 mr-2"/>
                                                Update Wallet
                                            </Button>
                                            )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            );
        }

        return <p className="text-center text-muted-foreground py-10">No members found.</p>;
    }


    return (
        <Card>
            <CardHeader>
                <CardTitle>Member Wallet Management</CardTitle>
                <CardDescription>View members and manually update their wallet balance after confirming EFT payments.</CardDescription>
            </CardHeader>
            <CardContent>
                {renderBody()}
            </CardContent>
        </Card>
    );
}
