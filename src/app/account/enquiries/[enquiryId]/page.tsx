
'use client';

import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, Landmark, FileText, User, Calendar, CircleHelp, HandCoins, Truck, Building, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const formatPrice = (price?: number) => {
    if (typeof price !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(price);
};

const formatDate = (dateValue: any) => {
    if (dateValue && typeof dateValue.toDate === 'function') {
        return new Date(dateValue.toDate()).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    if (typeof dateValue === 'string') {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
             return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
        }
    }
    return 'N/A';
};

const fundingNeedsMap: { [key: string]: string } = {
    'business': 'My Business',
    'equipment': 'To finance equipment',
    'vehicles': 'To finance vehicles',
    'cashflow': 'Support my cashflow',
};

const fundingReasonsMap: { [key: string]: string } = {
    problem: 'I have a problem',
    opportunity: 'I have an opportunity',
};

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  pending: 'secondary',
  under_review: 'outline',
  matched: 'default',
  rejected: 'destructive',
  funded: 'default'
};

function DetailItem({ label, value, icon }: { label: string; value?: string | number | null; icon?: React.ReactNode }) {
    if (!value) return null;
    return (
        <div className="flex flex-col">
            <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2">{icon}{label}</dt>
            <dd className="mt-1 text-md font-semibold">{value}</dd>
        </div>
    );
}

function EnquiryDetail() {
    const params = useParams();
    const router = useRouter();
    const enquiryId = params.enquiryId as string;
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();

    const enquiryRef = useMemoFirebase(() => {
        if (!firestore || !user || !enquiryId) return null;
        return doc(firestore, 'members', user.uid, 'enquiries', enquiryId);
    }, [firestore, user, enquiryId]);

    const { data: enquiry, isLoading, error } = useDoc(enquiryRef);

    if (isLoading || isUserLoading) {
        return (
            <div className="flex justify-center items-center h-full py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (error) {
        return <div className="text-center py-20 text-destructive">Error: {error.message}</div>
    }
    
    if (!enquiry) {
        return (
             <div className="text-center py-20">
                <h2 className="text-2xl font-bold">Enquiry Not Found</h2>
                <p className="text-muted-foreground mt-2">The requested enquiry could not be found.</p>
                <Button onClick={() => router.back()} className="mt-6" variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </div>
        )
    }
    
    const fullAddress = [
        enquiry.supplierStreet,
        enquiry.supplierSuburb,
        enquiry.supplierCity,
        enquiry.supplierPostalCode
    ].filter(Boolean).join(', ');


    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                           <FileText /> Enquiry Details
                        </CardTitle>
                        <CardDescription>
                            Submitted on {formatDate(enquiry.createdAt)}
                        </CardDescription>
                    </div>
                    <Badge variant={statusColors[enquiry.status] || 'secondary'} className="capitalize text-lg">
                        {enquiry.status.replace(/_/g, ' ')}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-bold text-3xl text-primary">{formatPrice(enquiry.amountRequested)}</h3>
                    <p className="text-muted-foreground">Amount Requested</p>
                </div>
                
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                    <DetailItem label="Funding Need" value={fundingNeedsMap[enquiry.fundingNeed] || enquiry.fundingNeed} icon={<Landmark className="h-4 w-4"/>} />
                    <DetailItem label="Funding Reason" value={fundingReasonsMap[enquiry.fundingReason] || enquiry.fundingReason} icon={<CircleHelp className="h-4 w-4"/>} />
                    <div className="md:col-span-2">
                        <DetailItem label="Purpose" value={enquiry.purpose} icon={<HandCoins className="h-4 w-4"/>} />
                    </div>
                </dl>

                {enquiry.fundingNeed === 'vehicles' && enquiry.foundVehicle === 'yes' && (
                    <>
                        <div className="border-t pt-6">
                            <h3 className="font-semibold text-lg flex items-center gap-2"><Truck className="h-5 w-5"/> Vehicle Information</h3>
                            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-4">
                                <DetailItem label="Vehicle Type" value={enquiry.vehicleType} />
                                <DetailItem label="Make" value={enquiry.vehicleMake} />
                                <DetailItem label="Model" value={enquiry.vehicleModel} />
                                <DetailItem label="Year" value={enquiry.vehicleYear} />
                                <DetailItem label="VIN" value={enquiry.vehicleVin} />
                                {enquiry.engineNumber && <DetailItem label="Engine Number" value={enquiry.engineNumber} />}
                            </dl>
                        </div>
                        <div className="border-t pt-6">
                             <h3 className="font-semibold text-lg flex items-center gap-2"><Building className="h-5 w-5"/> Supplier Information</h3>
                             <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-4">
                                <DetailItem label="Supplier Name" value={enquiry.supplierName} />
                                <DetailItem label="Contact Person" value={enquiry.supplierContact} />
                                <DetailItem label="Phone" value={enquiry.supplierPhone} />
                                <DetailItem label="Email" value={enquiry.supplierEmail} />
                                <div className="md:col-span-2">
                                    <DetailItem label="Address" value={fullAddress} />
                                </div>
                            </dl>
                        </div>
                    </>
                )}
            </CardContent>
             <CardFooter className="bg-muted/50 p-4 border-t flex justify-between items-center">
                 <p className="text-sm text-muted-foreground">A funding specialist will be in contact shortly to discuss the next steps.</p>
                 <Button asChild>
                    <Link href={`/funding/apply?enquiryId=${enquiryId}`}>
                        Edit Enquiry
                    </Link>
                 </Button>
            </CardFooter>
        </Card>
    )
}


export default function EnquiryDetailPage() {
    return (
         <div className="container mx-auto px-4 py-16">
            <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
                <EnquiryDetail />
            </Suspense>
        </div>
    )
}
