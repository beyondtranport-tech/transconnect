
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PlusCircle, AlertTriangle } from 'lucide-react';
import { useUser, useFirestore, getClientSideAuthToken, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Placeholder for the actual wizard/management component
function LoadManagement({ loadBoardId, companyId }: { loadBoardId: string, companyId: string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>My Load Board</CardTitle>
                <CardDescription>Manage your posted loads. Load posting wizard coming soon.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Load Board ID: {loadBoardId}</p>
                 <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Post New Load
                </Button>
            </CardContent>
        </Card>
    );
}

export default function LoadBoardContent() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isCreating, setIsCreating] = useState(false);
    const { can, isLoading: arePermissionsLoading } = usePermissions();
    
    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, `users/${user.uid}`);
    }, [firestore, user]);
    const { data: userData, isLoading: isUserDataLoading, forceRefresh: forceRefreshUser } = useDoc(userDocRef);
    
    const companyDocRef = useMemoFirebase(() => {
        if (!firestore || !userData?.companyId) return null;
        return doc(firestore, `companies/${userData.companyId}`);
    }, [firestore, userData?.companyId]);
    const { data: companyData, isLoading: isCompanyLoading, forceRefresh: forceRefreshCompany } = useDoc(companyDocRef);

    const isLoading = isUserLoading || isUserDataLoading || isCompanyLoading || arePermissionsLoading;
    
    const canPostLoad = can('create', 'loads');
    const loadBoardExists = !!companyData?.loadBoardId;

    const handleCreateLoadBoard = async () => {
        setIsCreating(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error('Authentication failed.');

            const response = await fetch('/api/createLoadBoard', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error((await response.json()).error || 'Failed to create load board.');

            toast({ title: 'Load Board Created!', description: "You can now start posting loads." });
            forceRefreshUser();
            forceRefreshCompany();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setIsCreating(false);
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    if (loadBoardExists) {
        return <LoadManagement loadBoardId={companyData.loadBoardId} companyId={companyData.id} />;
    }

    return (
        <Card className="text-center py-10">
            <CardHeader>
                <CardTitle>Create Your Load Board</CardTitle>
                <CardDescription>
                    To post loads to the marketplace, you first need to activate your public load board.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="inline-block">
                                <Button onClick={handleCreateLoadBoard} disabled={isCreating || !canPostLoad}>
                                    {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                                    Create My Load Board
                                </Button>
                            </div>
                        </TooltipTrigger>
                        {!canPostLoad && (
                            <TooltipContent>
                                <p className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Your plan does not include this feature. Please upgrade.</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>
            </CardContent>
        </Card>
    );
}

    