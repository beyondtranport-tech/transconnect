'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2 } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function AgreementsContent() {
    const firestore = useFirestore();
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);

    // 1. Fetch all clients to populate the client dropdown
    const clientsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'lendingClients'));
    }, [firestore]);
    const { data: clients, isLoading: areClientsLoading } = useCollection<{id: string, name: string}>(clientsQuery);

    // 2. Fetch approved facilities for the selected client
    const facilitiesQuery = useMemoFirebase(() => {
        if (!firestore || !selectedClientId) return null;
        return query(collection(firestore, `lendingClients/${selectedClientId}/facilities`), where('status', '==', 'approved'));
    }, [firestore, selectedClientId]);
    const { data: facilities, isLoading: areFacilitiesLoading } = useCollection<{id: string, productType: string, limit: number}>(facilitiesQuery);

    const handleClientChange = (clientId: string) => {
        setSelectedClientId(clientId);
        setSelectedFacilityId(null); // Reset facility selection when client changes
    };

    const selectedFacility = useMemo(() => {
        if (!selectedFacilityId || !facilities) return null;
        return facilities.find(f => f.id === selectedFacilityId);
    }, [selectedFacilityId, facilities]);

    const formatCurrency = (amount: number) => {
        if (typeof amount !== 'number') return 'N/A';
        return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText /> Agreements Management
                </CardTitle>
                <CardDescription>
                    Create a new lending agreement by selecting a client and one of their approved facilities.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="client-select">Select a Client</Label>
                        <Select onValueChange={handleClientChange} value={selectedClientId || ''} disabled={areClientsLoading}>
                            <SelectTrigger id="client-select">
                                <SelectValue placeholder={areClientsLoading ? "Loading clients..." : "Select a client..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {clients && clients.map(client => (
                                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="facility-select">Select an Approved Facility</Label>
                        <Select onValueChange={setSelectedFacilityId} value={selectedFacilityId || ''} disabled={!selectedClientId || areFacilitiesLoading}>
                            <SelectTrigger id="facility-select">
                                <SelectValue placeholder={
                                    !selectedClientId ? "Select a client first" :
                                    areFacilitiesLoading ? "Loading facilities..." :
                                    "Select a facility..."
                                } />
                            </SelectTrigger>
                            <SelectContent>
                                {facilities && facilities.length > 0 ? (
                                    facilities.map(facility => (
                                        <SelectItem key={facility.id} value={facility.id}>
                                            {facility.productType} - Limit: {formatCurrency(facility.limit)}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="none" disabled>No approved facilities found</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {selectedFacility && (
                    <div className="pt-6 border-t">
                        <h3 className="text-lg font-semibold">
                            Create Agreement for: <span className="text-primary">{selectedFacility.productType}</span>
                        </h3>
                        <div className="mt-4 p-8 border-2 border-dashed rounded-lg text-center">
                            <p className="text-muted-foreground">Fields for this agreement will be displayed here. Please provide your instructions.</p>
                        </div>
                    </div>
                )}

            </CardContent>
        </Card>
    );
}
