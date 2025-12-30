'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, FileText, Trash2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMemberFinanceApplications, deleteFinanceApplication } from '../../actions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
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

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  pending: 'secondary',
  under_review: 'outline',
  matched: 'default',
  rejected: 'destructive',
  funded: 'default',
  quote: 'outline'
};

const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
};

const formatDate = (isoString: string | undefined) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' });
};


export default function MemberFinanceApps({ memberId }: { memberId: string }) {
    const [applications, setApplications] = useState<any[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchApplications = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        const result = await getMemberFinanceApplications(memberId);
        if (result.success) {
            setApplications(result.data || []);
        } else {
            setError(result.error || 'Failed to load applications.');
        }
        setIsLoading(false);
    }, [memberId]);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    const handleDelete = async (applicationId: string) => {
        setIsDeleting(applicationId);
        const result = await deleteFinanceApplication(memberId, applicationId);
        if (result.success) {
            toast({ title: 'Application Deleted', description: 'The record has been permanently removed.' });
            fetchApplications(); // Refresh the list
        } else {
            toast({ variant: 'destructive', title: 'Deletion Failed', description: result.error });
        }
        setIsDeleting(null);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText /> Finance Applications</CardTitle>
                <CardDescription>
                    A list of all finance applications and quotes for this member. You can delete incorrect records here.
                </CardDescription>
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
                        <p className="text-sm">{error}</p>
                    </div>
                )}
                {!isLoading && applications && (
                    applications.length > 0 ? (
                        <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applications.map(app => (
                                    <TableRow key={app.id}>
                                        <TableCell className="text-xs">{formatDate(app.createdAt)}</TableCell>
                                        <TableCell className="font-medium capitalize">{app.fundingType?.replace(/_/g, ' ')}</TableCell>
                                        <TableCell>{formatCurrency(app.amountRequested)}</TableCell>
                                        <TableCell>
                                            <Badge variant={statusColors[app.status] || 'secondary'} className="capitalize">
                                                {app.status?.replace(/_/g, ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm" disabled={!!isDeleting}>
                                                        {isDeleting === app.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the application record from the member's profile.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(app.id)}>
                                                            Yes, delete it
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </div>
                    ) : (
                         <div className="text-center py-10 text-muted-foreground">
                            <p>No finance applications or quotes found for this member.</p>
                        </div>
                    )
                )}
            </CardContent>
            <CardFooter>
                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                    <ShieldAlert className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <p>
                        This is a powerful administrative tool. Deleting records is permanent and should only be done to correct errors. This action is not reversible.
                    </p>
                </div>
            </CardFooter>
        </Card>
    )
}

    