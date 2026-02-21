
'use client';

import { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Link as LinkIcon, PlusCircle, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

// Dummy data as the backend doesn't save assets yet
const dummyAssets = [
    { id: 'ASSET-001', description: '2022 Scania R560', clientId: 'sample-client-1' },
    { id: 'ASSET-002', description: 'Henred Fruehauf Tautliner', clientId: 'sample-client-1' },
    { id: 'ASSET-003', description: 'CAT 320D Excavator', clientId: 'another-client-ltd' },
];

export default function AssetsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();

    const clientId = searchParams.get('clientId');
    const agreementId = searchParams.get('agreementId');

    const assetsForClient = useMemo(() => {
        if (!clientId) return dummyAssets; // Show all if no client is specified
        return dummyAssets.filter(asset => asset.clientId === clientId);
    }, [clientId]);
    
    const handleLinkAsset = (assetId: string) => {
        if (!agreementId) return;

        // In a real application, this would be an API call to update the Firestore document
        console.log(`Linking asset ${assetId} to agreement ${agreementId}`);

        toast({
            title: "Asset Linked",
            description: `Asset ${assetId} has been successfully linked to agreement ${agreementId}.`
        });

        // Navigate back to the client list or agreement list
        router.push(`/lending?view=agreements`);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-start">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Truck /> Asset Register
                    </CardTitle>
                    {clientId && agreementId ? (
                        <CardDescription>
                            Select an asset below to link it to agreement <span className="font-mono text-foreground">{agreementId}</span>.
                        </CardDescription>
                    ) : (
                         <CardDescription>
                            Manage all financed assets. You can add new assets or view existing ones.
                        </CardDescription>
                    )}
                </div>
                 <div className="flex items-center gap-2">
                    {agreementId && (
                        <Button variant="outline" onClick={() => router.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
                        </Button>
                    )}
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Asset
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Asset ID</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assetsForClient.length > 0 ? (
                                assetsForClient.map(asset => (
                                    <TableRow key={asset.id}>
                                        <TableCell className="font-mono">{asset.id}</TableCell>
                                        <TableCell>{asset.description}</TableCell>
                                        <TableCell>{asset.clientId}</TableCell>
                                        <TableCell className="text-right">
                                            {agreementId ? (
                                                <Button size="sm" onClick={() => handleLinkAsset(asset.id)}>
                                                    <LinkIcon className="mr-2 h-4 w-4" /> Link to Agreement
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="sm">View Details</Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No assets found for this client.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
