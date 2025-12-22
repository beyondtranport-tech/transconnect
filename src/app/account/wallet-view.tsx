
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ClipboardCopy, Banknote } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

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
    const { toast } = useToast();
    const [applications, setApplications] = useState<DocumentData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const memberDocRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'members', user.uid);
    }, [firestore, user]);
    
    const bankDetailsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'platform_config', 'bank_details');
    }, [firestore]);

    const { data: memberData, isLoading: isMemberLoading } = useDoc(memberDocRef);
    const { data: bankDetails, isLoading: isBankDetailsLoading } = useDoc(bankDetailsRef);


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
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({ title: "Copied!", description: `${text} copied to clipboard.`})
        });
    };


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
        <div className="w-full space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Top up your Wallet</CardTitle>
                    <CardDescription>
                        To add funds, make an EFT payment using the details below. Your balance will be updated once payment is confirmed by an administrator.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isBankDetailsLoading && (
                        <div className="flex justify-center items-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    )}
                    {bankDetails && !isBankDetailsLoading && (
                        <div className="space-y-3">
                             {Object.entries(bankDetails).map(([key, value]) => (
                                <div key={key} className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                    <span className="font-mono">{value}</span>
                                </div>
                            ))}
                            {user && (
                                <div className="flex justify-between items-center text-sm pt-3 border-t">
                                    <span className="text-muted-foreground font-semibold">Your Payment Reference</span>
                                     <button onClick={() => copyToClipboard(user.uid)} className="font-mono text-primary hover:underline flex items-center gap-2">
                                        {user.uid}
                                        <ClipboardCopy className="h-4 w-4"/>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                     {!bankDetails && !isBankDetailsLoading && (
                        <div className="py-6 text-center text-muted-foreground">
                            <Banknote className="h-8 w-8 mx-auto mb-2"/>
                            <p>Bank details are not configured yet.</p>
                            <p className="text-xs">Please contact support or check back later.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
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
        </div>
    );
}
