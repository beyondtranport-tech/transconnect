'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function FleetContributionsList() {
    const firestore = useFirestore();

    const contributionsCollectionRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'fleetContributions'), orderBy('createdAt', 'desc'));
    }, [firestore]);
    
    const { data: contributions, isLoading, error } = useCollection(contributionsCollectionRef);

    const formatDate = (timestamp: any) => {
        if (timestamp && timestamp.toDate) {
            return format(timestamp.toDate(), "yyyy-MM-dd HH:mm");
        }
        return 'N/A';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Fleet Contributions</CardTitle>
                <CardDescription>A list of all fleet data submitted by members.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                {error && (
                     <div className="text-destructive-foreground bg-destructive/90 p-4 rounded-md">
                        <h4 className="font-semibold">Error loading contributions</h4>
                        <p className="text-sm">{error.message}</p>
                    </div>
                )}
                {contributions && !isLoading && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date Submitted</TableHead>
                                <TableHead>Vehicle Type</TableHead>
                                <TableHead>Registration</TableHead>
                                <TableHead>Capacity</TableHead>
                                <TableHead>Member ID</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contributions.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>{formatDate(item.createdAt)}</TableCell>
                                    <TableCell className="font-medium">{item.vehicleType}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{item.registrationNumber}</Badge>
                                    </TableCell>
                                    <TableCell>{item.capacity}</TableCell>
                                    <TableCell className="font-mono text-xs">{item.userId}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
                 {contributions && contributions.length === 0 && !isLoading && (
                    <p className="text-center text-muted-foreground py-10">No fleet contributions have been submitted yet.</p>
                )}
            </CardContent>
        </Card>
    );
}
