
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, getDoc, DocumentData, DocumentReference } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  pending: 'secondary',
  under_review: 'outline',
  matched: 'default',
  rejected: 'destructive',
  funded: 'default',
  membership_payment: 'outline',
};

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(price);
};

export default function WalletView() {
    const firestore = useFirestore();
    const { user } = useUser();
    const [applications, setApplications] = useState<DocumentData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const memberDocRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'members', user.uid);
    }, [firestore, user]);

    const { data: memberData, isLoading: isMemberLoading } = useDoc(memberDocRef);

    useEffect(() => {
        const fetchApplications = async () => {
            if (!memberData || !memberData.financeApplicationIds || !firestore) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);
            
            try {
                const appPromises = memberData.financeApplicationIds.map((appId: string) => {
                    const appRef = doc(firestore, 'financeApplications', appId);
                    return getDoc(appRef);
                });
                
                const appSnapshots = await Promise.all(appPromises);
                const appData = appSnapshots
                    .filter(snap => snap.exists())
                    .map(snap => ({ id: snap.id, ...snap.data() }));

                // Sort applications by createdAt date, descending
                appData.sort((a, b) => {
                    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
                    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
                    return dateB.getTime() - dateA.getTime();
                });
                
                setApplications(appData);
            } catch (e: any) {
                setError(e);
            } finally {
                setIsLoading(false);
            }
        };

        if (!isMemberLoading) {
            fetchApplications();
        }

    }, [memberData, isMemberLoading, firestore]);


    const formatDate = (timestamp: any) => {
        if (timestamp && timestamp.toDate) {
            return format(timestamp.toDate(), "yyyy-MM-dd HH:mm");
        }
        return 'N/A';
    };
    
    const getTransactionType = (app: DocumentData) => {
        if (app.fundingType === 'membership_payment') {
            return 'Membership Payment';
        }
        return app.fundingType.replace(/_/g, ' ');
    }
    
    const getAmount = (app: DocumentData) => {
        if (app.fundingType === 'credit-top-up') {
            return `+ ${formatPrice(app.amountRequested)}`;
        }
        return formatPrice(app.amountRequested);
    }
    
    const getAmountClass = (app: DocumentData) => {
        if (app.fundingType === 'credit-top-up') {
            return 'text-green-600';
        }
        if (app.fundingType === 'membership_payment') {
            return 'text-destructive';
        }
        return '';
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Wallet History</CardTitle>
                <CardDescription>A history of your credit top-up requests and other transactions.</CardDescription>
            </CardHeader>
            <CardContent>
                {(isLoading || isMemberLoading) && (
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
                {!isLoading && !isMemberLoading && applications && (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Transaction Type</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applications.map(app => (
                                    <TableRow key={app.id}>
                                        <TableCell>{formatDate(app.createdAt)}</TableCell>
                                        <TableCell className="capitalize">{getTransactionType(app)}</TableCell>
                                        <TableCell className={`text-right font-mono ${getAmountClass(app)}`}>{getAmount(app)}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={statusColors[app.status] || 'secondary'} className="capitalize">
                                                {app.status.replace(/_/g, ' ')}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
                 {applications && applications.length === 0 && !isLoading && !isMemberLoading && (
                    <p className="text-center text-muted-foreground py-10">You have no wallet transactions yet.</p>
                )}
            </CardContent>
        </Card>
    );
}

