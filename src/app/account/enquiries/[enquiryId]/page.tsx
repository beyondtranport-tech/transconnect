
'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, FileText, Calendar, DollarSign, Target, HelpCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
};

const formatDate = (dateValue: any) => {
    if (dateValue && typeof dateValue.toDate === 'function') {
        return format(dateValue.toDate(), "dd MMMM yyyy 'at' HH:mm");
    }
    if (typeof dateValue === 'string') {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
            return format(date, "dd MMMM yyyy 'at' HH:mm");
        }
    }
    return 'N/A';
};

const statusConfig = {
  pending: { label: 'Pending Submission', color: 'secondary', icon: <HelpCircle className="h-4 w-4 mr-2" /> },
  under_review: { label: 'Under Review', color: 'outline', icon: <Target className="h-4 w-4 mr-2" /> },
  matched: { label: 'Matched with a Funder', color: 'default', icon: <FileText className="h-4 w-4 mr-2" /> },
  rejected: { label: 'Rejected', color: 'destructive', icon: <AlertCircle className="h-4 w-4 mr-2" /> },
  funded: { label: 'Funded', color: 'default', icon: <DollarSign className="h-4 w-4 mr-2" /> },
};


function EnquiryDetail() {
    const params = useParams();
    const enquiryId = params.enquiryId as string;
    const firestore = useFirestore();

    // The path should be constructed dynamically based on the current user's ID
    // but the useDoc hook handles fetching user-specific data via a secure API route
    // so we can construct the conceptual path here.
    const enquiryRef = useMemoFirebase(() => {
        if (!firestore || !enquiryId) return null;
        // This path is conceptual for the hook; the API enforces security.
        // We'll assume the hook knows how to get the user's ID.
        // This will be handled by passing the full path to the API.
        // A better hook would take the collection and doc ID separately.
        // For now, we'll assume the API can parse `members/me/enquiries/{enquiryId}`
        return doc(firestore, `enquiries/${enquiryId}`); // This is conceptually wrong, but illustrates the goal
    }, [firestore, enquiryId]);

    // A better approach would be to build the path in a useEffect after user is loaded.
    // Let's create a new memoized ref for the correct path.
    const { user } = useUser();
    const correctEnquiryRef = useMemoFirebase(() => {
        if (!firestore || !user || !enquiryId) return null;
        return doc(firestore, `members/${user.uid}/enquiries/${enquiryId}`);
    }, [firestore, user, enquiryId]);

    const { data: enquiry, isLoading, error } = useDoc(correctEnquiryRef);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (error) {
        return (
            <Card className="m-4">
                <CardHeader><CardTitle className="text-destructive">Error</CardTitle></CardHeader>
                <CardContent>
                    <p>Could not load enquiry details.</p>
                    <p className="text-xs text-muted-foreground mt-2">{error.message}</p>
                </CardContent>
            </Card>
        );
    }

    if (!enquiry) {
        return (
            <Card className="m-4">
                <CardHeader><CardTitle>Enquiry Not Found</CardTitle></CardHeader>
                <CardContent>
                    <p>The enquiry you are looking for does not exist or you do not have permission to view it.</p>
                </CardContent>
            </Card>
        );
    }
    
    const currentStatus = statusConfig[enquiry.status as keyof typeof statusConfig] || statusConfig.pending;


    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                            <FileText />
                            Enquiry Details
                        </CardTitle>
                        <CardDescription className="mt-1">
                            ID: <span className="font-mono">{enquiry.id}</span>
                        </CardDescription>
                    </div>
                     <Badge variant={currentStatus.color} className="capitalize flex items-center text-sm px-4 py-2">
                        {currentStatus.icon}
                        {currentStatus.label}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-1">
                        <p className="text-muted-foreground">Date Submitted</p>
                        <p className="font-semibold flex items-center gap-2"><Calendar className="h-4 w-4" /> {formatDate(enquiry.createdAt)}</p>
                    </div>
                     <div className="space-y-1">
                        <p className="text-muted-foreground">Amount Requested</p>
                        <p className="font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4" /> {formatCurrency(enquiry.amountRequested)}</p>
                    </div>
                </div>
                 <div className="space-y-1">
                    <p className="text-muted-foreground">Funding Need</p>
                    <p className="font-semibold capitalize">{enquiry.fundingType?.replace(/-/g, ' ')}</p>
                </div>
                 <div className="space-y-1">
                    <p className="text-muted-foreground">Purpose of Funding</p>
                    <p className="p-4 bg-muted/50 rounded-md border">{enquiry.purpose}</p>
                </div>

            </CardContent>
            <CardFooter>
                <Button asChild variant="outline">
                    <Link href="/account?view=dashboard">Back to Dashboard</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function EnquiryDetailPage() {
    return (
        <div className="container mx-auto px-4 py-16">
            <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
                <EnquiryDetail />
            </Suspense>
        </div>
    )
}
