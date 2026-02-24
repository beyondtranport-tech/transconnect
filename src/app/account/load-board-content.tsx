
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, AlertTriangle, Truck, Edit, ArrowLeft, Eye } from 'lucide-react';
import { useUser, useFirestore, getClientSideAuthToken, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoadWizard } from './load-wizard';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const statusColors: { [key: string]: 'default' | 'secondary' } = {
    active: 'default',
    inactive: 'secondary',
};

export default function LoadBoardContent() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [view, setView] = useState<'overview' | 'wizard'>('overview');
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
    
    const loadBoardRef = useMemoFirebase(() => {
        if (!firestore || !companyData?.loadBoardId || !userData?.companyId) return null;
        return doc(firestore, `companies/${userData.companyId}/loadBoards/${companyData.loadBoardId}`);
    }, [firestore, companyData?.loadBoardId, userData?.companyId]);
    
    const { data: userLoadBoard, isLoading: isLoadBoardLoading, forceRefresh: forceRefreshLoadBoard } = useDoc(loadBoardRef);

    const loadsQuery = useMemoFirebase(() => {
      if (!firestore || !companyData?.loadBoardId || !userData?.companyId) return null;
      return collection(firestore, `companies/${userData.companyId}/loadBoards/${companyData.loadBoardId}/loads`);
    }, [firestore, companyData?.loadBoardId, userData?.companyId]);
    const { data: loads } = useCollection(loadsQuery);

    useEffect(() => {
        if (searchParams.get('created') === 'true' && companyData?.loadBoardId) {
            setView('wizard');
            router.replace('/account?view=load-board', { scroll: false });
        }
    }, [searchParams, companyData, router]);

    const isLoading = isUserLoading || isUserDataLoading || isCompanyLoading || arePermissionsLoading;

    const forceRefreshAll = useCallback(() => {
        forceRefreshUser();
        forceRefreshCompany();
        if (forceRefreshLoadBoard) {
          forceRefreshLoadBoard();
        }
    }, [forceRefreshUser, forceRefreshCompany, forceRefreshLoadBoard]);

    const handleCreateLoadBoard = async () => {
        if (!user || !userData?.companyId) {
            toast({ variant: 'destructive', title: 'User or company not found.' });
            return;
        }
        setIsCreating(true);

        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error('Authentication token not found.');

            const response = await fetch('/api/createLoadBoard', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error((await response.json()).error || 'Failed to create load board.');

            toast({ title: 'Load Board Created!', description: "You can now start posting loads." });
            await forceRefreshAll();
            router.push('/account?view=load-board&created=true');
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setIsCreating(false);
        }
    };

    const canPostLoad = can('create', 'loads');
    const loadBoardExists = !!companyData?.loadBoardId;
    
    const handleBackToOverview = () => {
        setView('overview');
        forceRefreshAll();
    }
    
    const renderContent = () => {
        if (view === 'wizard' && userLoadBoard) {
            return <LoadWizard loadBoard={userLoadBoard} onUpdate={forceRefreshAll} />;
        }

        if (loadBoardExists) {
            if (isLoadBoardLoading || !userLoadBoard) {
                return <div className="flex justify-center items-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="ml-4">Loading your load board...</p></div>;
            }

            const boardStatus = userLoadBoard.status || 'inactive';

            return (
                 <div className="space-y-6">
                    <div className="p-6 border rounded-lg bg-muted/50">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div>
                                <h3 className="text-xl font-semibold">{userLoadBoard.boardName}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Status:</span>
                                <Badge variant={statusColors[boardStatus] || 'secondary'} className="capitalize text-base">
                                    {boardStatus.replace(/_/g, ' ')}
                                </Badge>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mt-4 pt-4 border-t">
                            <div>
                                <p className="text-sm font-medium">Loads Posted</p>
                                <p className="text-2xl font-bold">{loads?.length || 0}</p>
                            </div>
                            <div className="flex gap-2">
                               {userLoadBoard.status === 'active' && (
                                    <Button asChild variant="outline">
                                        <Link href={`/mall/loads`} target="_blank">
                                            <Eye className="mr-2 h-4 w-4" /> View Live Load Board
                                        </Link>
                                    </Button>
                                )}
                                <Button onClick={() => setView('wizard')}>
                                    <Edit className="mr-2 h-4 w-4" /> Manage Load Board
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="text-center py-20 border-2 border-dashed rounded-lg">
                <Truck className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold">You don't have a load board yet.</h3>
                <p className="mt-2 text-muted-foreground">To post loads to the marketplace, you first need to activate your public load board.</p>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="inline-block mt-4">
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
            </div>
        );
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Truck /> My Load Board</CardTitle>
                        <CardDescription>
                            {loadBoardExists ? `Manage your load board: ${userLoadBoard?.boardName || '...'}` : "Create and manage your public-facing load board."}
                        </CardDescription>
                    </div>
                     {view === 'wizard' && (
                        <Button variant="outline" onClick={handleBackToOverview}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Overview
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                ) : renderContent()}
            </CardContent>
        </Card>
    );
}
