'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, CheckCircle, ShieldCheck, Zap, Users, BarChart3 } from "lucide-react";
import React from "react";

/**
 * Tailored Transporter Offer
 * Dynamically adjusts based on the single-word industry tag.
 */
export default function TransporterOffer({ partner }: { partner?: any }) {
    const companyName = partner?.companyName || 'your business';
    const industryTag = partner?.entryType || 'General';
    
    const isForwarder = industryTag === 'Forwarder';
    const isDistribution = industryTag === 'Distribution';

    // 1. Logic for Freight Forwarders
    if (isForwarder) {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold font-headline">The Forwarder Empowerment Offer</h1>
                    <p className="text-lg text-muted-foreground mt-2">
                        Logistics Flow is your digital operational backbone for appointing and managing hauliers.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <Card className="flex flex-col border-primary/20 bg-primary/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <Users className="h-6 w-6 text-primary" />
                                Vetted Capacity Access
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-3">
                            <li className="flex items-start">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                                <span className="text-sm">Access a database of verified hauliers with pre-vetted compliance documents.</span>
                            </li>
                            <li className="flex items-start">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                                <span className="text-sm">Reduce the risk of 'ghost' transporters and document fraud.</span>
                            </li>
                        </CardContent>
                    </Card>

                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <Zap className="h-6 w-6 text-primary" />
                                Digital Appointment Flow
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-3">
                            <li className="flex items-start">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                                <span className="text-sm">Digitalize your subcontracting process to eliminate manual phone calls and emails.</span>
                            </li>
                            <li className="flex items-start">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                                <span className="text-sm">Manage BOLs and PODs on a secure digital ledger for instant proof-of-delivery.</span>
                            </li>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <ShieldCheck className="h-6 w-6 text-primary" />
                            Monetize Your Subcontractor Base
                        </CardTitle>
                        <CardDescription>How {companyName} earns from the hauliers you appoint.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-muted-foreground">
                        <p>When you onboard your regular hauliers to Logistics Flow, you not only improve their efficiency but also create a new revenue stream for your business. You earn a recurring commission on their membership fees and a share of the platform revenue whenever they use our Malls for tires, parts, or finance.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // 2. Logic for Standard Hauliers / Trucking Companies
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">The Haulier Profitability Offer</h1>
                <p className="text-lg text-muted-foreground mt-2">
                    Break the constraints of high operating costs and wasted capacity with our unified haulier tools.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <Card className="flex flex-col border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <BarChart3 className="h-6 w-6 text-primary" />
                            Cost Reduction Engine
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-3">
                        <li className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                            <span className="text-sm">Leverage community buying power for deep discounts on tires, fuel, and engine parts.</span>
                        </li>
                        <li className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                            <span className="text-sm">Access specialized insurance products tailored for the trucking sector.</span>
                        </li>
                    </CardContent>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <Truck className="h-6 w-6 text-primary" />
                            AI Load Matching
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-3">
                        <li className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                            <span className="text-sm">Our AI scans the network to find available loads that match your empty legs.</span>
                        </li>
                        <li className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                            <span className="text-sm">Maximize vehicle utilization and eliminate deadhead miles.</span>
                        </li>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Users className="h-6 w-6 text-primary" />
                        A pathway to Funding
                    </CardTitle>
                    <CardDescription>Real data leads to real capital for {companyName}.</CardDescription>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                    <p>By operating on our platform, you build a digital track record of performance. We use this data to de-risk your business for our funding partners, helping you secure asset finance and working capital that traditional banks might decline.</p>
                </CardContent>
            </Card>
        </div>
    );
}
