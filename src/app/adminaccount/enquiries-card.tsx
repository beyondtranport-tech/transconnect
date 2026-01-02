
'use client';

import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, FileText, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { collection, query, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { useDoc } from '@/firebase/firestore/use-doc';

const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
};

const formatDate = (dateValue: any) => {
    // Check if it's a Firestore Timestamp object
    if (dateValue && typeof dateValue.toDate === 'function') {
        return format(dateValue.toDate(), "dd MMM yyyy");
    }
    // Check if it's an ISO string (from our serialized API response)
    if (typeof dateValue === 'string') {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
            return format(date, "dd MMM yyyy");
        }
    }
    return 'N/A';
};

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  pending: 'secondary',
  under_review: 'outline',
  matched: 'default',
  rejected: 'destructive',
  funded: 'default'
};

const fundingNeedsMap: { [key: string]: string } = {
    'business': 'My Business',
    'equipment': 'Equipment',
    'vehicles': 'Vehicles',
    'cashflow': 'Cashflow',
    'loan-pv-term': 'Loan (PV) – term',
    'loan-pv-interest-only': 'Loan (PV) - interest only',
    'loan-pv-single-payment': 'Loan (PV) - single payment',
    'loan-fl-term-daily': 'Loan (FL) – term daily',
    'loan-fl-term-weekly': 'Loan (FL) term weekly',
    'loan-fl-term-bi-monthly': 'Loan (FL) term bi-monthly',
    'loan-fl-term-monthly': 'Loan (FL) term monthly',
    'loan-revolving-credit': 'Loan Revolving credit',
    'installment-sale-term': 'Term Agreement',
    'installment-sale-balloon': 'Balloon Payment',
    'rental-term': 'Term Agreement',
    'rental-balloon': 'Balloon (Residual) Agreement',
    'disclosed-confirmed-factoring': 'Disclosed confirmed factoring 75% advance',
    'disclosed-unconfirmed-factoring': 'Disclosed un-confirmed factoring 0% advance',
    'invoice-discounting': 'Invoice discounting 100% advance',
    'rights-discounting': 'Rights discounting',
};

const fundingReasonsMap: { [key: string]: string } = {
    problem: 'Problem',
    opportunity: 'Opportunity',
};

export default function EnquiriesCard() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userData } = useDoc<{ companyId: string }>(userDocRef);

    const enquiriesQuery = useMemoFirebase(() => {
        if (!firestore || !userData?.companyId) return null;
        return query(
            collection(firestore, `companies/${userData.companyId}/enquiries`), 
            orderBy('createdAt', 'desc'),
            limit(10)
        );
    }, [firestore, userData]);

    const { data: enquiries, isLoading, error, forceRefresh } = useCollection(enquiriesQuery);

    const handleDelete = async (enquiryId: string) => {
        if (!firestore || !userData?.companyId) return;
        setIsDeleting(enquiryId);
        try {
            await deleteDoc(doc(firestore, `companies/${userData.companyId}/enquiries`, enquiryId));
            toast({ title: "Enquiry Deleted", description: "The enquiry has been removed." });
            forceRefresh(); // Refresh the list
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Delete Failed", description: e.message });
        } finally {
            setIsDeleting(null);
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                   <FileText className="h-6 w-6" />
                   My Formal Enquiries
                </CardTitle>
                <CardDescription>Begin a formal funding application. Your recent enquiries are shown here.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-6">
                    <Button asChild>
                        <Link href="/funding/apply">Start New Enquiry</Link>
                    </Button>
                </div>
                {isLoading && !enquiries && (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                
                {error && (
                    <div className="text-center py-10 text-destructive">
                        <p>Error loading enquiries: {error.message}</p>
                    </div>
                )}

                {!isLoading && (
                    enquiries && enquiries.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Need</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {enquiries.map((enquiry) => (
                                        <TableRow key={enquiry.id}>
                                            <TableCell className="text-muted-foreground text-xs whitespace-nowrap">{formatDate(enquiry.createdAt)}</TableCell>
                                            <TableCell>
                                                <p className="font-medium capitalize">{fundingNeedsMap[enquiry.fundingNeed] || enquiry.fundingNeed?.replace(/-/g, ' ')}</p>
                                            </TableCell>
                                            <TableCell>
                                                <p className="font-medium capitalize">{fundingReasonsMap[enquiry.fundingReason] || enquiry.fundingReason}</p>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusColors[enquiry.status] || 'secondary'} className="capitalize">
                                                    {enquiry.status.replace(/_/g, ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-semibold whitespace-nowrap">
                                                {formatCurrency(enquiry.amountRequested)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/adminaccount/enquiries/${enquiry.id}`}>View Details</Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/funding/apply?enquiryId=${enquiry.id}`}>Edit</Link>
                                                        </DropdownMenuItem>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem
                                                                    className="text-destructive"
                                                                    onSelect={(e) => e.preventDefault()}
                                                                 >
                                                                    {isDeleting === enquiry.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        This action cannot be undone. This will permanently delete your enquiry.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDelete(enquiry.id)} variant="destructive">
                                                                        Delete
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                         <div className="text-center py-10 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">You have no formal enquiries yet.</p>
                             <p className="text-sm text-muted-foreground mt-1">Click the button above to start your first application.</p>
                        </div>
                    )
                )}
            </CardContent>
        </Card>
    );
}
