
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Store, Banknote, Handshake } from "lucide-react";
import Link from 'next/link';

export default function SupplierOffer() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">The Supplier Partnership Offer</h1>
                <p className="text-lg text-muted-foreground mt-2">
                    Turn your business into a digital-first sales channel. Join Logistics Flow to connect with a captive audience of transport operators and grow your revenue.
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <Store className="h-6 w-6 text-primary" />
                            Direct Market Access
                        </CardTitle>
                        <CardDescription>Your Digital Storefront in the Supplier Mall.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <ul className="list-none space-y-3 text-muted-foreground">
                            <li className="flex items-start">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                                <span>Create a professional online shop to showcase your full product catalog.</span>
                            </li>
                             <li className="flex items-start">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                                <span>Reach hundreds of qualified transport operators actively looking for your products.</span>
                            </li>
                            <li className="flex items-start">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                                <span>Receive quote requests and manage orders directly through the platform.</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <Banknote className="h-6 w-6 text-primary" />
                            Embedded Finance
                        </CardTitle>
                        <CardDescription>Never lose a sale due to customer cash flow issues.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                         <ul className="list-none space-y-3 text-muted-foreground">
                            <li className="flex items-start">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                                <span>Our members can get instant credit at checkout to purchase from your store.</span>
                            </li>
                             <li className="flex items-start">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                                <span>You get paid upfront; we handle the financing and risk for the buyer.</span>
                            </li>
                             <li className="flex items-start">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                                <span>Significantly increase your sales volume and average order value.</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
                
                 <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <Handshake className="h-6 w-6 text-primary" />
                            Network Partnership
                        </CardTitle>
                        <CardDescription>Monetize your existing client relationships.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                       <ul className="list-none space-y-3 text-muted-foreground">
                             <li className="flex items-start">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                                <span>Onboard your existing clients to Logistics Flow for their own operational needs.</span>
                            </li>
                             <li className="flex items-start">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                                <span>Earn a recurring commission on their membership and transaction fees across the entire platform.</span>
                            </li>
                             <li className="flex items-start">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                                <span>Turn your customer list into a new, passive revenue stream.</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>

            <Card className="mt-12 bg-primary/5 border-primary/20">
                <CardHeader className="items-center text-center">
                    <CardTitle className="text-2xl">Ready to Grow Your Business?</CardTitle>
                     <CardDescription>
                        Join the Supplier Mall to expand your market reach and unlock new revenue opportunities.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <Button asChild size="lg">
                        <Link href="/account?view=shop">
                            Create Your Supplier Shop <ArrowRight className="ml-2 h-4 w-4"/>
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
