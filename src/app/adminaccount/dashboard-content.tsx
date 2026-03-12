
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Users, FileText, HeartHandshake, DollarSign, UserCheck, Clock, FileSignature } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getClientSideAuthToken, useUser } from '@/firebase';
import { useState, useEffect, useCallback } from 'react';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import { format as formatDateFns } from 'date-fns';

// Centralized helper function for making authenticated API calls
async function fetchFromAdminAPI(token: string, action: string, payload?: any) {
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
    const [stats, setStats] = useState({ members: 0, applications: 0, contributions: 0, totalFunded: 0, pendingAgreements: 0 });
    const [recentMembers, setRecentMembers] = useState<any[]>([]);
    const [pendingApplications, setPendingApplications] = useState<any[]>([]);
    const [pendingAgreements, setPendingAgreements] = useState<any[]>([]);
    const [memberGrowthData, setMemberGrowthData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadDashboardData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed: User token not found.");
            
            const [membersRes, financeRes, contributionsRes, queuesRes] = await Promise.all([
                fetchFromAdminAPI(token, 'getMembers').catch(e => ({ error: e, data: [] })),
                fetchFromAdminAPI(token, 'getFinanceApplications').catch(e => ({ error: e, data: [] })),
                fetchFromAdminAPI(token, 'getContributions').catch(e => ({ error: e, data: [] })),
                fetchFromAdminAPI(token, 'getDashboardQueues').catch(e => ({ error: e, data: { pendingShops: [], proposedAgreements: [] } }))
            ]);
            
            if (membersRes.error || financeRes.error || contributionsRes.error || queuesRes.error) {
                 throw new Error(membersRes.error?.message || financeRes.error?.message || contributionsRes.error?.message || queuesRes.error?.message || "An error occurred fetching dashboard data.");
            }

            // Process Stats
            const totalFunded = (financeRes.data || []).filter((app: any) => app.status === 'funded').reduce((sum: number, app: any) => sum + (app.amountRequested || 0), 0);
            setStats({
                members: (membersRes.data || []).length,
                applications: (financeRes.data || []).length,
                contributions: (contributionsRes.data || []).length,
                totalFunded: totalFunded,
                pendingAgreements: (queuesRes.data.proposedAgreements || []).length
            });

            // Process Recent Members
            const sortedMembers = [...(membersRes.data || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setRecentMembers(sortedMembers.slice(0, 5));
            
            // Process Pending Applications
            const pending = (financeRes.data || []).filter((app: any) => app.status === 'pending');
            setPendingApplications(pending.slice(0, 5));

            // Process Queues
            setPendingAgreements(queuesRes.data.proposedAgreements || []);
            
            // Process Member Growth
            const growth = (membersRes.data || []).reduce((acc: Record<string, { date: Date; members: number }>, member: any) => {
                if (!member.createdAt) return acc;
                const joinDate = new Date(member.createdAt);
                if (isNaN(joinDate.getTime())) return acc;
                
                const monthKey = `${joinDate.getFullYear()}-${String(joinDate.getMonth() + 1).padStart(2, '0')}`;
                
                if (!acc[monthKey]) {
                    acc[monthKey] = { date: new Date(joinDate.getFullYear(), joinDate.getMonth(), 1), members: 0 };
                }
                acc[monthKey].members++;
                return acc;
            }, {} as Record<string, { date: Date; members: number }>);

            const growthData = Object.values(growth)
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .slice(-6) // Show last 6 months for better view
                .map(item => ({
                    name: formatDateFns(item.date, 'MMM yy'),
                    NewMembers: item.members
                }));

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
            setError("You must be logged in as an admin to view the dashboard.");
            setIsLoading(false);
        }
    }, [isUserLoading, user, loadDashboardData]);

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
                <h1 className="text-2xl font-bold">Business Dashboard</h1>
                <p className="text-muted-foreground">A high-level overview of platform activity and performance.</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Link href="/adminaccount?view=members">
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
                        <div className="text-2xl font-bold">{formatCurrency(stats.totalFunded)}</div>
                    </CardContent>
                </Card>
                <Link href="/adminaccount?view=divisions-funding">
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
                 <Link href="/adminaccount?view=contributions">
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
                <Link href="/adminaccount?view=commercial-negotiations">
                    <Card className="hover:bg-accent transition-colors border-amber-500 bg-amber-500/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Negotiations</CardTitle>
                            <FileSignature className="h-4 w-4 text-amber-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-700">{stats.pendingAgreements}</div>
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
                        <CardDescription>Formal funding applications that require immediate attention.</CardDescription>
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
                                            <div className="text-sm text-muted-foreground">{formatDateSafe(app.createdAt, "dd MMM")}</div>
                                        </TableCell>
                                        <TableCell>{formatCurrency(app.amountRequested)}</TableCell>
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
                        <CardTitle className="flex items-center gap-2"><FileSignature className="h-5 w-5" /> Automated Commercial Negotiations</CardTitle>
                        <CardDescription>Proposals from members are automatically negotiated by the AI agent.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Shop</TableHead>
                                    <TableHead>Member's Proposal</TableHead>
                                    <TableHead>Negotiation Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingAgreements.length > 0 ? pendingAgreements.map(agreement => (
                                    <TableRow key={agreement.id}>
                                        <TableCell>
                                            <div className="font-medium">{agreement.shopName}</div>
                                            <div className="text-sm text-muted-foreground">{formatDateSafe(agreement.createdAt, "dd MMM")}</div>
                                        </TableCell>
                                        <TableCell className="font-semibold text-lg text-primary">{agreement.percentage}%</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">Pending AI Action</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                             <Button variant="outline" size="sm" disabled>Intervene</Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                     <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No pending agreements.</TableCell>
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
                                        <TableCell className="text-right font-mono">{formatCurrency(member.walletBalance || 0)}</TableCell>
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
