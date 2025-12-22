
'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Banknote, Edit, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

export default function FinanceApplicationsList() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
    const [creditAmount, setCreditAmount] = useState<number>(0);
    const [isUpdating, setIsUpdating] = useState(false);

    const membersCollectionRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'members'), orderBy('email', 'desc'));
    }, [firestore]);
    
    const { data: members, isLoading, error } = useCollection(membersCollectionRef);

    const handleEdit = (memberId: string, currentBalance: number) => {
        setEditingMemberId(memberId);
        setCreditAmount(currentBalance);
    };

    const handleCancel = () => {
        setEditingMemberId(null);
        setCreditAmount(0);
    };

    const handleUpdate = async (memberId: string) => {
        if (!firestore) return;
        setIsUpdating(true);

        const memberRef = doc(firestore, 'members', memberId);
        const updateData = { rewardPoints: Number(creditAmount) };
        
        try {
            await updateDoc(memberRef, updateData);
            toast({ title: 'Success', description: 'Member credit balance updated.' });
            handleCancel(); 
        } catch (serverError) {
             const permissionError = new FirestorePermissionError({
                path: memberRef.path,
                operation: 'update',
                requestResourceData: updateData,
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: 'Update Failed', description: 'Permission denied.' });
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

    return (
        <Card>
            <CardHeader>
                <CardTitle>Member Credit Management</CardTitle>
                <CardDescription>View members and manually update their wallet balance after confirming EFT payments.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                {error && (
                     <div className="text-destructive-foreground bg-destructive/90 p-4 rounded-md">
                        <h4 className="font-semibold">Error</h4>
                        <p className="text-sm">{error.message}</p>
                    </div>
                )}
                {members && !isLoading && (
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
                                                <span className="font-mono">{member.rewardPoints?.toFixed(2) || '0.00'}</span>
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
                                                <Button size="sm" variant="outline" onClick={() => handleEdit(member.id, member.rewardPoints || 0)}>
                                                    <Edit className="h-4 w-4 mr-2"/>
                                                    Update Credit
                                                </Button>
                                             )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
