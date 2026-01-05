
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Users, FileText, HeartHandshake, DollarSign, ArrowRight, UserCheck, Clock, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import BillingRun from './billing-run';

interface Member {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    createdAt?: string;
    companyName?: string;
}

interface FinanceApplication {
    id: string;
    applicantId: string;
    fundingType: string;
    amountRequested: number;
    status: string;
    createdAt: string;
    recordType: 'Quote' | 'Enquiry';
}

async function fetchFromAdminAPI(action: string, payload?: any) {
    const token = await getClientSideAuthToken();
    if (!token) throw new Error("Authentication failed.");
    
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, payload }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for action: ${action}`);
    }
    return result;
}

const formatDate = (isoString: string | undefined, options?: Intl.DateTimeFormatOptions) => {
    if (!isoString) return 'N/A';
    try {
        const defaultOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(isoString).toLocaleDateString('en-ZA', options || defaultOptions);
    } catch (e) {
        return 'Invalid Date';
    }
};

const formatPrice = (price: number) => {
    if (typeof price !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', notation: 'compact' }).format(price);
};

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  pending: 'secondary',
  under_review: 'outline',
  matched: 'default',
  rejected: 'destructive',
  funded: 'default',
  membership_payment: 'default'
};


export default function DashboardContent() {
    const [stats, setStats] = useState({ members: 0, applications: 0, contributions: 0, totalFunded: 0 });
    const [members, setMembers] = useState<Member[]>([]);
    const [applications, setApplications] = useState<FinanceApplication[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const { toast } = useToast();

    const loadDashboardData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [membersResult, contributionsResult, financeResult] = await Promise.all([
                fetchFromAdminAPI('getMembers'),
                fetchFromAdminAPI('getContributions'),
                fetchFromAdminAPI('getFinanceApplications'),
            ]);
            
            const membersData = membersResult.data || [];
            setStats(s => ({ ...s, members: membersData.length }));
            setMembers(membersData);
            
            const contributionsData = contributionsResult.data || [];
            setStats(s => ({ ...s, contributions: contributionsData.length }));

            const financeData = financeResult.data || [];
            const totalFunded = financeData.filter((app: any) => app.status === 'funded').reduce((sum: number, app: any) => sum + (app.amountRequested || 0), 0);
            setStats(s => ({ ...s, applications: financeData.length, totalFunded }));
            setApplications(financeData);

        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);
    
    const memberGrowthData = useMemo(() => {
        if (members.length === 0) return [];
        const monthlyCounts: { [key: string]: number } = {};
        members.forEach(member => {
            if (member.createdAt) {
                const month = formatDate(member.createdAt, { year: 'numeric', month: 'short' });
                monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
            }
        });
        
        const sortedMonths = Object.keys(monthlyCounts).sort((a,b) => new Date(a).getTime() - new Date(b).getTime());
        return sortedMonths.map(month => ({ name: month, NewMembers: monthlyCounts[month] }));

    }, [members]);
    
    const pendingApplications = useMemo(() => {
        const walletFundingTypes = ['wallet_top_up', 'membership_payment'];
        return applications
            .filter(app => (app.status === 'pending' || app.status === 'under_review') && !walletFundingTypes.includes(app.fundingType))
            .slice(0, 5);
    }, [applications]);

    const recentMembers = useMemo(() => {
         return members.slice(0, 5);
    }, [members]);

    const handleDelete = async (applicantId: string, applicationId: string, recordType: 'Quote' | 'Enquiry') => {
        setIsDeleting(applicationId);
        toast({ variant: 'destructive', title: 'Deletion Failed', description: "Delete action not implemented in API." });
        setIsDeleting(null);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (error) {
        return (
             <div className="text-destructive-foreground bg-destructive/90 p-4 rounded-md">
                <h4 className="font-semibold">Error loading dashboard</h4>
                <p className="text-sm">{error}</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">A high-level overview of platform activity and performance.</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Link href="/backend?view=members">
                    <Card className="hover:bg-accent transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.members}</div>
                        </CardContent>
                    </Card>
                </Link>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Value Funded</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(stats.totalFunded)}</div>
                    </CardContent>
                </Card>
                <Link href="/backend?view=divisions-funding">
                    <Card className="hover:bg-accent transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Finance Applications</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.applications}</div>
                        </CardContent>
                    </Card>
                </Link>
                 <Link href="/backend?view=contributions">
                    <Card className="hover:bg-accent transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Data Contributions</CardTitle>
                            <HeartHandshake className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.contributions}</div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            <BillingRun />
            
            <Card>
                <CardHeader>
                    <CardTitle>Member Growth</CardTitle>
                    <CardDescription>New members joining the platform per month.</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={memberGrowthData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <defs>
                                <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                            <Area type="monotone" dataKey="NewMembers" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorMembers)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Actionable Funding Tasks</CardTitle>
                        <CardDescription>Formal funding applications that require your immediate attention.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                             <TableHeader>
                                <TableRow>
                                    <TableHead>Pending Finance Applications ({pendingApplications.length})</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingApplications.length > 0 ? pendingApplications.map(app => (
                                    <TableRow key={app.id}>
                                        <TableCell>
                                            <div className="font-medium capitalize">{app.fundingType?.replace(/_/g, ' ')}</div>
                                            <div className="text-xs text-muted-foreground truncate max-w-[150px]">ID: {app.applicantId}</div>
                                        </TableCell>
                                        <TableCell>{formatPrice(app.amountRequested)}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/backend?view=wallet&memberId=${app.applicantId}`}>Review</Link>
                                            </Button>
                                             <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="icon" disabled={isDeleting === app.id}>
                                                        {isDeleting === app.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently delete this application record. This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(app.applicantId, app.id, app.recordType)} variant="destructive">
                                                            Yes, delete it
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">No pending funding applications.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5" /> Recent Members</CardTitle>
                        <CardDescription>The newest members to join the platform.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Company</TableHead>
                                    <TableHead className="text-right">Wallet</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentMembers.map(member => (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <div className="font-medium">{member.firstName} {member.lastName}</div>
                                            <div className="text-xs text-muted-foreground">{formatDate(member.createdAt)}</div>
                                        </TableCell>
                                        <TableCell>{member.companyName}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/backend?view=wallet&memberId=${member.id}`}><ArrowRight className="h-4 w-4" /></Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                     <CardFooter>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/backend?view=members">View All Members</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
