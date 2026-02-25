
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users, FileText, Briefcase, Landmark, Handshake, Database, ShieldCheck, FileCheck, FileSignature, Wrench } from 'lucide-react';
import Link from 'next/link';

const kpis = [
  { title: "Clients", value: "125", icon: Users, view: "clients" },
  { title: "Active Agreements", value: "150", icon: FileText, view: "agreements" },
  { title: "Total Assets Financed", value: "180", icon: Briefcase, view: "assets" },
  { title: "Total Loan Book", value: "R 75.2M", icon: Landmark, view: "" },
];

const queues = [
  { title: "New Applications", value: "8", icon: FileSignature, description: "Applications in discovery/scoring.", view: "discovery" },
  { title: "Agreements to Finalize", value: "4", icon: FileCheck, description: "Awaiting final checks and payout.", view: "agreements" },
  { title: "Asset Verifications", value: "12", icon: Wrench, description: "Assets pending physical verification.", view: "assets" },
  { title: "Security Registrations", value: "6", icon: ShieldCheck, description: "Collateral awaiting legal registration.", view: "security" },
];

export default function LendingDashboardContent() {
    return (
         <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">DMS Dashboard</h1>
                <p className="text-muted-foreground">High-level overview of the Debtor Management System.</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {kpis.map(kpi => (
                    <Card key={kpi.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                            <kpi.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{kpi.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Action Queues</CardTitle>
                        <CardDescription>Items requiring immediate attention from the credit committee.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {queues.map(queue => (
                             <Card key={queue.title} className="p-4 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                     <queue.icon className="h-6 w-6 text-primary" />
                                    <div>
                                        <p className="font-semibold">{queue.title}</p>
                                        <p className="text-xs text-muted-foreground">{queue.description}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold">{queue.value}</p>
                                     <Button asChild variant="link" size="sm" className="p-0 h-auto">
                                        <Link href={`/lending?view=${queue.view}`}>View</Link>
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest system and user actions.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center py-20 text-muted-foreground">
                        <p>Activity feed will be displayed here.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
