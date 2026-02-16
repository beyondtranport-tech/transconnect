'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Api, Code, Handshake, DollarSign, Store, TrendingUp } from 'lucide-react';
import React from 'react';

export default function DeveloperOffer() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">The Developer Partnership Offer</h1>
                <p className="text-lg text-muted-foreground mt-2">Build the future of logistics technology and create a new revenue stream on our platform.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Api className="h-6 w-6 text-primary"/>Access Our Ecosystem via API</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg">Gain programmatic access to the Logistics Flow ecosystem. Our developing API will provide endpoints for:</p>
                    <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
                        <li>Querying member and company data (with user consent).</li>
                        <li>Integrating with the wallet and transaction ledger.</li>
                        <li>Submitting and retrieving data from the various Malls.</li>
                        <li>Interacting with our AI services like the Freight Matcher.</li>
                    </ul>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Store className="h-6 w-6 text-primary"/>A Marketplace for Your Creations</CardTitle>
                        <CardDescription>Monetize your work.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>Don't just build—sell. The Logistics Flow Marketplace is your direct channel to a captive audience of transport businesses looking for solutions.</p>
                        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                            <li>List your custom apps, integrations, or plugins.</li>
                            <li>Set your own pricing model (one-time or subscription).</li>
                            <li>We handle the billing and payouts through our secure wallet system.</li>
                        </ul>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><DollarSign className="h-6 w-6 text-primary"/>Favorable Revenue Share</CardTitle>
                         <CardDescription>A true partnership model.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>We believe in rewarding developers who add value to our platform. We offer a competitive revenue share on all sales made through the Marketplace.</p>
                        <div className="p-4 border rounded-lg bg-background text-center">
                            <p className="text-sm text-muted-foreground">Example Commission</p>
                            <p className="text-3xl font-bold text-primary">70/30 Split</p>
                            <p className="text-xs text-muted-foreground">(You keep 70% of the revenue)</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary"/>What Can You Build?</CardTitle>
                     <CardDescription>The possibilities are vast. Here are some ideas:</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        <li><strong className="text-foreground">Accounting Integrations:</strong> Sync wallet transactions with platforms like Sage, Xero, or QuickBooks.</li>
                        <li><strong className="text-foreground">Custom Analytics Dashboards:</strong> Create niche dashboards for specific operational needs, like fuel consumption analysis or driver performance.</li>
                        <li><strong className="text-foreground">Mobile Apps:</strong> Build specialized apps for drivers to manage their schedules, log expenses, or communicate with dispatch.</li>
                        <li><strong className="text-foreground">Automated Workflows:</strong> Create "Zaps" that connect Logistics Flow data to other services, like sending an SMS when a new load is matched.</li>
                    </ul>
                </CardContent>
                <CardFooter>
                    <p className="text-lg font-semibold">If you can code it, you can sell it on Logistics Flow.</p>
                </CardFooter>
            </Card>
        </div>
    );
}
