'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Truck, Warehouse } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const typeConfig = {
    truck: { icon: Truck, color: 'default' as const, label: 'Truck' },
    trailer: { icon: Warehouse, color: 'secondary' as const, label: 'Trailer' },
    supplier: { icon: 'Building', color: 'outline' as const, label: 'Supplier' },
}


export default function ContributionsList() {
    const firestore = useFirestore();

    const contributionsCollectionRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'contributions'), orderBy('createdAt', 'desc'));
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
                <CardTitle>Member Contributions</CardTitle>
                <CardDescription>A list of all data submitted by members.</CardDescription>
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
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Make / Name</TableHead>
                                    <TableHead>Model / Contact</TableHead>
                                    <TableHead>VIN / Items</TableHead>
                                    <TableHead>Member ID</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contributions.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>{formatDate(item.createdAt)}</TableCell>
                                        <TableCell>
                                            <Badge variant={typeConfig[item.type as keyof typeof typeConfig]?.color || 'secondary'} className="capitalize">
                                                {item.type}
                                            </Badge>
                                        </TableCell>
                                        
                                        {/* Polymorphic cells */}
                                        <TableCell>
                                            {item.type === 'truck' || item.type === 'trailer' ? item.data.make : ''}
                                            {item.type === 'supplier' ? item.data.supplierName : ''}
                                        </TableCell>
                                         <TableCell>
                                            {item.type === 'truck' || item.type === 'trailer' ? item.data.model : ''}
                                             {item.type === 'supplier' ? item.data.contactPerson : ''}
                                        </TableCell>
                                         <TableCell className="max-w-[200px] truncate">
                                            {item.type === 'truck' || item.type === 'trailer' ? item.data.vin : ''}
                                            {item.type === 'supplier' ? item.data.itemsPurchased : ''}
                                        </TableCell>

                                        <TableCell className="font-mono text-xs">{item.userId}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
                 {contributions && contributions.length === 0 && !isLoading && (
                    <p className="text-center text-muted-foreground py-10">No contributions have been submitted yet.</p>
                )}
            </CardContent>
        </Card>
    );
}
