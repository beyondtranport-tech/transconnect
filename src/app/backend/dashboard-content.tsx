
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Users, FileText, HeartHandshake, DollarSign, UserCheck, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { useState, useEffect, useCallback } from 'react';

// Moved helper function outside the component to ensure it's stable
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


export default function DashboardContent() {
    const { user, isUserLoading } = useUser();
    const [stats, setStats] = useState({ members: 0, applications: 0, contributions: 0, totalFunded: 0 });
    const [recentMembers, setRecentMembers] = useState<any[]>([]);
    const [pendingApplications, setPendingApplications] = useState<any[]>([]);
    const [memberGrowthData, setMemberGrowthData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadDashboardData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [membersRes, financeRes, contributionsRes] = await Promise.all([
                fetchFromAdminAPI('getMembers').catch(e => ({ error: e, data: [] })),
                fetchFromAdminAPI('getFinanceApplications').catch(e => ({ error: e, data: [] })),
                fetchFromAdminAPI('getContributions').catch(e => ({ error: e, data: [] })),
            ]);
            
            if (membersRes.error || financeRes.error || contributionsRes.error) {
                 throw new Error(membersRes.error?.message || financeRes.error?.message || contributionsRes.error?.message || "An error occurred fetching dashboard data.");
            }

            // Process Stats
            const totalFunded = (financeRes.data || []).filter((app: any) => app.status === 'funded').reduce((sum: number, app: any) => sum + (app.amountRequested || 0), 0);
            setStats({
                members: (membersRes.data || []).length,
                applications: (financeRes.data || []).length,
                contributions: (contributionsRes.data || []).length,
                totalFunded: totalFunded,
            });

            // Process Recent Members
            const sortedMembers = [...(membersRes.data || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setRecentMembers(sortedMembers.slice(0, 5));
            
            // Process Pending Applications
            const pending = (financeRes.data || []).filter((app: any) => app.status === 'pending');
            setPendingApplications(pending.slice(0, 5));
            
            // Process Member Growth
            const growth: { [key: string]: number } = {};
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            (membersRes.data || []).forEach((member: any) => {
                const joinDate = new Date(member.createdAt);
                if (!isNaN(joinDate.getTime())) {
                    const monthKey = `${joinDate.getFullYear()}-${monthNames[joinDate.getMonth()]}`;
                    growth[monthKey] = (growth[monthKey] || 0) + 1;
                }
            });
            const growthData = Object.keys(growth).map(key => ({ name: key.split('-')[1], NewMembers: growth[key] })).slice(-6); // Last 6 months
            setMemberGrowthData(growthData);

        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, []); 

    useEffect(() => {
        if (!isUserLoading && user) {
            loadDashboardData();
        } else if (!isUserLoading && !user) {
            // Handle case where user is not logged in if necessary
            setError("You must be logged in to view the dashboard.");
            setIsLoading(false);
        }
    }, [isUserLoading, user, loadDashboardData]);

    const formatPrice = (price: number) => {
        if (typeof price !== 'number') return 'N/A';
        return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', notation: 'compact' }).format(price);
    };

     const formatDate = (isoString: string | undefined) => {
        if (!isoString) return 'N/A';
        try {
            return new Date(isoString).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
        } catch (e) {
            return 'Invalid Date';
        }
    };


    if (isLoading || isUserLoading) {
        return <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    if (error) {
        return (
            <Card className="bg-destructive/10 border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Error Loading Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>{error}</p>
                    <Button onClick={loadDashboardData} className="mt-4">Try Again</Button>
                </CardContent>
            </Card>
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
                                            <div className="text-sm text-muted-foreground">{formatDate(app.createdAt)}</div>
                                        </TableCell>
                                        <TableCell>{formatPrice(app.amountRequested)}</TableCell>
                                        <TableCell className="text-right">
                                             <Button asChild variant="outline" size="sm">
                                                <Link href={`/backend?view=wallet&memberId=${app.applicantId}`}>View Member</Link>
                                            </Button>
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
                               {recentMembers.length > 0 ? recentMembers.map(member => (
                                   <TableRow key={member.id}>
                                        <TableCell>
                                            <div className="font-medium">{member.firstName} {member.lastName}</div>
                                            <div className="text-sm text-muted-foreground">{member.email}</div>
                                        </TableCell>
                                        <TableCell>{member.companyName}</TableCell>
                                        <TableCell className="text-right font-mono">{formatPrice(member.walletBalance || 0)}</TableCell>
                                   </TableRow>
                               )) : (
                                     <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">No recent members to display.</TableCell>
                                    </TableRow>
                               )}
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
