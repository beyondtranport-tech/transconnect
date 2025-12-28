
'use client';

import { useState, useEffect } from 'react';
import { getMembers, getFinanceApplications, getContributions } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Users, FileText, HeartHandshake, DollarSign, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Member {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    createdAt?: string;
}

interface FinanceApplication {
    id: string;
    applicantId: string;
    fundingType: string;
    amountRequested: number;
    status: string;
    createdAt: string;
}

interface Contribution {
    id: string;
    type: string;
    createdAt: string;
}

const formatDate = (isoString: string | undefined) => {
    if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric'});
    } catch (e) {
        return 'Invalid Date';
    }
};

const formatPrice = (price: number) => {
    if (typeof price !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(price);
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
    const [stats, setStats] = useState({ members: 0, applications: 0, contributions: 0 });
    const [recentMembers, setRecentMembers] = useState<Member[]>([]);
    const [recentApplications, setRecentApplications] = useState<FinanceApplication[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadDashboardData() {
            setIsLoading(true);
            setError(null);
            try {
                const [membersResult, applicationsResult, contributionsResult] = await Promise.all([
                    getMembers(),
                    getFinanceApplications(),
                    getContributions()
                ]);

                if (membersResult.success && membersResult.data) {
                    setStats(s => ({ ...s, members: membersResult.data!.length }));
                    setRecentMembers(membersResult.data!.slice(0, 5));
                } else {
                    throw new Error(membersResult.error || 'Failed to load members.');
                }
                
                if (applicationsResult.success && applicationsResult.data) {
                    setStats(s => ({ ...s, applications: applicationsResult.data!.length }));
                    setRecentApplications(applicationsResult.data!.slice(0, 5));
                } else {
                    throw new Error(applicationsResult.error || 'Failed to load applications.');
                }
                
                if (contributionsResult.success && contributionsResult.data) {
                    setStats(s => ({ ...s, contributions: contributionsResult.data!.length }));
                } else {
                     throw new Error(contributionsResult.error || 'Failed to load contributions.');
                }

            } catch (e: any) {
                setError(e.message || 'An unexpected error occurred.');
            } finally {
                setIsLoading(false);
            }
        }

        loadDashboardData();
    }, []);

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
                <p className="text-muted-foreground">A high-level overview of platform activity.</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.members}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Finance Applications</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.applications}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Data Contributions</CardTitle>
                        <HeartHandshake className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.contributions}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Members</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentMembers.map(member => (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <div className="font-medium">{member.firstName} {member.lastName}</div>
                                            <div className="text-xs text-muted-foreground">{member.email}</div>
                                        </TableCell>
                                        <TableCell>{formatDate(member.createdAt)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/backend/wallet/${member.id}`}><ArrowRight className="h-4 w-4" /></Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Recent Finance Applications</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentApplications.map(app => (
                                    <TableRow key={app.id}>
                                        <TableCell>
                                            <div className="font-medium capitalize">{app.fundingType?.replace(/_/g, ' ') || 'N/A'}</div>
                                            <div className="text-xs text-muted-foreground truncate max-w-[100px]">{app.applicantId}</div>
                                        </TableCell>
                                        <TableCell>{formatPrice(app.amountRequested)}</TableCell>
                                        <TableCell>
                                             <Badge variant={statusColors[app.status] || 'secondary'} className="capitalize">
                                                {app.status?.replace(/_/g, ' ') || 'N/A'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
