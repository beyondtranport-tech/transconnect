
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, User, Building, Store, FileText, Handshake, BrainCircuit, Search, ArrowRight, Activity } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCollection, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, doc, collectionGroup, where, orderBy, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount)
};
const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';
    const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short'});
};

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  pending: 'secondary',
  under_review: 'outline',
  matched: 'default',
  rejected: 'destructive',
  funded: 'default',
  quote: 'outline',
};


function DiscoveryDossier({ companyId }: { companyId: string }) {
    const firestore = useFirestore();

    const companyRef = useMemoFirebase(() => doc(firestore, 'companies', companyId), [firestore, companyId]);
    const { data: company, isLoading: isCompanyLoading } = useDoc(companyRef);

    const ownerRef = useMemoFirebase(() => company?.ownerId ? doc(firestore, 'users', company.ownerId) : null, [firestore, company]);
    const { data: owner, isLoading: isOwnerLoading } = useDoc(ownerRef);
    
    const enquiriesQuery = useMemoFirebase(() => query(collection(firestore, `companies/${companyId}/enquiries`)), [firestore, companyId]);
    const { data: enquiries, isLoading: areEnquiriesLoading } = useCollection(enquiriesQuery);

    const quotesQuery = useMemoFirebase(() => query(collection(firestore, `companies/${companyId}/quotes`)), [firestore, companyId]);
    const { data: quotes, isLoading: areQuotesLoading } = useCollection(quotesQuery);

    const auditLogsQuery = useMemoFirebase(() => {
        if (!firestore || !companyId) return null;
        return query(
            collectionGroup(firestore, 'auditLogs'),
            where('companyId', '==', companyId),
            orderBy('timestamp', 'desc'),
            limit(10)
        );
    }, [firestore, companyId]);
    const { data: auditLogs, isLoading: areLogsLoading } = useCollection(auditLogsQuery);

    const shopRef = useMemoFirebase(() => company?.shopId ? doc(firestore, `companies/${companyId}/shops/${company.shopId}`) : null, [firestore, company]);
    const { data: shop, isLoading: isShopLoading } = useDoc(shopRef);

    const isLoading = isCompanyLoading || isOwnerLoading || areEnquiriesLoading || areQuotesLoading || isShopLoading || areLogsLoading;
    
    const fundingRecords = useMemo(() => {
        if (!quotes && !enquiries) return [];
        const combinedRecords = [
            ...(quotes || []).map((q: any) => ({ ...q, recordType: 'Quote', status: 'quote' })),
            ...(enquiries || []).map((e: any) => ({ ...e, recordType: 'Enquiry' })),
        ];
        combinedRecords.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            if(isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
            return dateB.getTime() - dateA.getTime();
        });
        return combinedRecords;
    }, [quotes, enquiries]);

    if (isLoading) {
        return <div className="flex justify-center items-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }

    if (!company) {
        return <p className="text-muted-foreground">Company data could not be loaded.</p>;
    }
    
    return (
        <div className="space-y-8 mt-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Building /> Company & Owner Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><h4 className="font-semibold">Company Name</h4><p>{company.companyName}</p></div>
                        <div><h4 className="font-semibold">Owner</h4><p>{owner?.firstName} {owner?.lastName}</p></div>
                        <div><h4 className="font-semibold">Email</h4><p>{owner?.email}</p></div>
                        <div><h4 className="font-semibold">Phone</h4><p>{owner?.phone}</p></div>
                        <div><h4 className="font-semibold">Membership</h4><p className="capitalize">{company.membershipId}</p></div>
                        <div><h4 className="font-semibold">Wallet Balance</h4><p>{formatCurrency(company.walletBalance || 0)}</p></div>
                    </div>
                </CardContent>
                 <CardFooter>
                    <Button asChild variant="outline">
                        <Link href={`/backend?view=wallet&memberId=${companyId}`}>Manage Member</Link>
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><FileText /> Funding Records (Quotes & Enquiries)</CardTitle></CardHeader>
                <CardContent>
                    {fundingRecords && fundingRecords.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {fundingRecords.map(rec => (
                                        <TableRow key={`${rec.recordType}-${rec.id}`}>
                                            <TableCell className="text-xs">{formatDate(rec.createdAt)}</TableCell>
                                            <TableCell className="font-medium">{rec.fundingType?.replace(/-/g, ' ')}</TableCell>
                                            <TableCell><Badge variant={statusColors[rec.status] || 'secondary'} className="capitalize">{rec.recordType}</Badge></TableCell>
                                            <TableCell className="text-right font-semibold">{formatCurrency(rec.amountRequested)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : <p className="text-muted-foreground">No funding records found for this member.</p>}
                </CardContent>
            </Card>

             <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Activity /> Platform Activity Log</CardTitle></CardHeader>
                <CardContent>
                     {auditLogs && auditLogs.length > 0 ? (
                        <div className="space-y-2">
                            {auditLogs.map(log => (
                                <div key={log.id} className="flex items-start gap-3 p-2 border-b last:border-b-0">
                                    <div className="w-20 text-xs text-muted-foreground">{formatDate(log.timestamp)}</div>
                                    <div className="flex-1">
                                        <p className="text-sm"><span className="font-semibold">{log.userName || 'System'}</span> performed action: <span className="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{log.action}</span></p>
                                        <p className="text-xs text-muted-foreground">{log.collectionPath}/{log.documentId}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-muted-foreground">No recent activity found for this member.</p>}
                </CardContent>
            </Card>
            
            {shop && (
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Store /> Shop Details</CardTitle></CardHeader>
                    <CardContent>
                         <div><h4 className="font-semibold">Shop Name</h4><p>{shop.shopName}</p></div>
                         <div><h4 className="font-semibold mt-2">Category</h4><p>{shop.category}</p></div>
                         <div><h4 className="font-semibold mt-2">Description</h4><p className="text-sm text-muted-foreground">{shop.shopDescription}</p></div>
                    </CardContent>
                </Card>
            )}

             <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><BrainCircuit /> Credit Bureau (Placeholder)</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Credit check results and data from external bureaus will be displayed here once integrated.</p>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-4 pt-6 border-t">
                <Button variant="secondary">Request More Information</Button>
                <Button>Send to Credit Committee</Button>
            </div>
        </div>
    )
}

export default function DiscoveryContent() {
    const firestore = useFirestore();
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

    const companiesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'companies')) : null, [firestore]);
    const { data: companies, isLoading: areCompaniesLoading } = useCollection(companiesQuery);
    
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Search /> Discovery Module</CardTitle>
                    <CardDescription>
                        A convergence point for all applicant information. Select a member company to compile their Discovery Dossier for credit assessment.
                    </CardDescription>
                </CardHeader>
                 <CardContent>
                    <div className="max-w-md space-y-2">
                        <Label htmlFor="company-select">Select Company to Review</Label>
                        <Select onValueChange={setSelectedCompanyId} value={selectedCompanyId} disabled={areCompaniesLoading}>
                            <SelectTrigger id="company-select">
                                <SelectValue placeholder={areCompaniesLoading ? "Loading companies..." : "Select a company..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {(companies || []).map((company: any) => (
                                    <SelectItem key={company.id} value={company.id}>{company.companyName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {selectedCompanyId && <DiscoveryDossier companyId={selectedCompanyId} />}
        </div>
    );
}
