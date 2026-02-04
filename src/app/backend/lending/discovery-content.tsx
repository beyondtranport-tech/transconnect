
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, User, Building, Store, FileText, Handshake, BrainCircuit, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCollection, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';
    const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short'});
};

function DiscoveryDossier({ companyId }: { companyId: string }) {
    const firestore = useFirestore();

    const companyRef = useMemoFirebase(() => doc(firestore, 'companies', companyId), [firestore, companyId]);
    const { data: company, isLoading: isCompanyLoading } = useDoc(companyRef);

    const ownerRef = useMemoFirebase(() => company?.ownerId ? doc(firestore, 'users', company.ownerId) : null, [firestore, company]);
    const { data: owner, isLoading: isOwnerLoading } = useDoc(ownerRef);
    
    const enquiriesQuery = useMemoFirebase(() => query(collection(firestore, `companies/${companyId}/enquiries`)), [firestore, companyId]);
    const { data: enquiries, isLoading: areEnquiriesLoading } = useCollection(enquiriesQuery);

    const shopRef = useMemoFirebase(() => company?.shopId ? doc(firestore, `companies/${companyId}/shops/${company.shopId}`) : null, [firestore, company]);
    const { data: shop, isLoading: isShopLoading } = useDoc(shopRef);

    const isLoading = isCompanyLoading || isOwnerLoading || areEnquiriesLoading || isShopLoading;

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
                <CardHeader><CardTitle className="flex items-center gap-2"><FileText /> Funding Enquiry History</CardTitle></CardHeader>
                <CardContent>
                    {enquiries && enquiries.length > 0 ? (
                        <ul className="space-y-2">
                            {enquiries.map(enquiry => (
                                <li key={enquiry.id} className="p-3 border rounded-md">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold capitalize">{enquiry.fundingType?.replace(/-/g, ' ')}</p>
                                            <p className="text-sm text-muted-foreground">{formatDate(enquiry.createdAt)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg text-primary">{formatCurrency(enquiry.amountRequested)}</p>
                                            <p className="text-xs text-muted-foreground capitalize">Status: {enquiry.status}</p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-muted-foreground">No funding enquiries found for this member.</p>}
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
