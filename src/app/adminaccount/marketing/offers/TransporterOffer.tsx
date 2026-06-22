'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Truck, CheckCircle, ShieldCheck, Zap, Users, BarChart3, Search, Landmark } from "lucide-react";
import React from "react";

/**
 * Enhanced Transporter Offer with Intelligence Focus
 */
export default function TransporterOffer({ partner }: { partner?: any }) {
    const companyName = partner?.companyName || 'your business';
    
    return (
        <div className="space-y-8 text-left text-foreground">
            <div className="text-left">
                <h1 className="text-3xl font-bold font-headline text-left">The Intelligence-Driven Haulier Offer</h1>
                <p className="text-lg text-muted-foreground mt-2 text-left">
                    Break the constraints of empty miles and high operating costs with our unified intelligence ecosystem.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 text-left">
                <Card className="flex flex-col border-primary/20 bg-primary/5 text-left">
                    <CardHeader className="text-left">
                        <CardTitle className="flex items-center gap-3 text-left">
                            <Search className="h-6 w-6 text-primary" />
                            Capacity Matching Intelligence
                        </CardTitle>
                        <CardDescription className="text-left">Maximize vehicle utilization automatically.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-3 text-left">
                        <div className="flex items-start gap-3 text-left">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-1 shrink-0" />
                            <span className="text-sm">Our AI scans the network to find available loads that match your empty leg routes.</span>
                        </div>
                        <div className="flex items-start gap-3 text-left">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-1 shrink-0" />
                            <span className="text-sm">Connect with cargo owners directly, bypassing traditional brokerage middle-men.</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="flex flex-col text-left">
                    <CardHeader className="text-left">
                        <CardTitle className="flex items-center gap-3 text-left">
                            <Landmark className="h-6 w-6 text-primary" />
                            Capital Intelligence
                        </CardTitle>
                        <CardDescription className="text-left">Real data de-risks your business for funding.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-3 text-left">
                        <div className="flex items-start gap-3 text-left">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-1 shrink-0" />
                            <span className="text-sm">Your operational performance on our platform creates a digital track record.</span>
                        </div>
                        <div className="flex items-start gap-3 text-left">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-1 shrink-0" />
                            <span className="text-sm font-bold">Use this "Validated Standing" to unlock asset finance and working capital from our 85+ specialized lenders.</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-2 border-primary text-left">
                <CardHeader className="text-left">
                    <CardTitle className="flex items-center gap-3 text-left">
                        <BarChart3 className="h-6 w-6 text-primary" />
                        Forensic Cost Reduction
                    </CardTitle>
                    <CardDescription className="text-left">Leverage community buying power to slash overheads.</CardDescription>
                </CardHeader>
                <CardContent className="text-left">
                    <p className="text-muted-foreground leading-relaxed text-left">
                        By joining our member syndicate, you tap into pre-negotiated group rates for tires, fuel, and parts. Our Intelligence engine identifies which members use the same equipment, allowing us to negotiate bulk discounts that independent hauliers could never secure alone.
                    </p>
                </CardContent>
                <CardFooter className="bg-slate-50 border-t p-6 text-left">
                    <div className="flex items-center gap-3 text-left">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        <p className="text-sm font-bold text-left">Activate "Intelligence Access" for R100/mo to view the full supplier contact registry.</p>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
