'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DollarSign, Building, Users, TrendingUp, Lightbulb, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function InvestorOffer() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Investor Pitch</h1>
                <p className="text-lg text-muted-foreground mt-2">An overview of the TransConnect investment opportunity.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Building className="h-6 w-6 text-primary"/>This is us</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">We are a team with 25 years of experience in transport finance, now transforming into a tech-driven service provider for the logistics sector.</p>
                    <ul className="list-disc list-inside space-y-2">
                        <li><strong className="text-foreground">Mission:</strong> To empower and reward transporters by providing access to capital, reducing risk, and creating value through a digital ecosystem.</li>
                        <li><strong className="text-foreground">Vision:</strong> To simplify credit and business operations for the transport industry through collaboration, data, and digital platforms.</li>
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Lightbulb className="h-6 w-6 text-primary"/>This is what we realized</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <p className="text-muted-foreground">The transport sector is fragmented and underserved. Businesses face significant roadblocks:</p>
                    <ul className="list-disc list-inside space-y-2">
                        <li>Traditional banks don't understand their unique business needs and cash flow.</li>
                        <li>Finance solutions are rigid and often fall short of operational requirements.</li>
                        <li>Access to fast, opportunity-seizing capital is extremely limited.</li>
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CheckCircle className="h-6 w-6 text-primary"/>This is what we built</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">An integrated digital ecosystem designed to solve core industry pain points through several interconnected Malls:</p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        <li>
                            <strong className="text-foreground">Integrated Malls:</strong> Our various Malls (e.g., Supplier, Finance, Buy & Sell) create a seamless commercial environment. This integration solves the pain point of fragmentation by bringing procurement, financing, and sales into one place, reducing operational friction.
                        </li>
                        <li>
                            <strong className="text-foreground">Value-Added Marketplace:</strong> The marketplace offers curated third-party products (like RAF Assist and Insurance) at group-negotiated rates, directly addressing the pain point of high operational costs. For members, it's a source of savings; for our partners, it creates a powerful new revenue opportunity through commission sharing.
                        </li>
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6 text-primary"/>Transporters want what we built</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">The platform directly addresses the core pain points of the industry, creating a strong value proposition for members:</p>
                     <ul className="list-disc list-inside space-y-2">
                        <li><strong>Access to Capital:</strong> Our primary draw is funding solutions that traditional lenders won't offer.</li>
                        <li><strong>Cost Reduction:</strong> Group buying power in the Supplier Mall leads to direct savings on parts and consumables.</li>
                        <li><strong>Increased Revenue:</strong> The AI Freight Matcher reduces empty miles, and the Actions Plan creates new revenue streams through referrals.</li>
                        <li><strong>Efficiency:</strong> Digital tools for document management, compliance, and operations save time and reduce administrative burden.</li>
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><DollarSign className="h-6 w-6 text-primary"/>Investment needed</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">We are seeking seed funding to scale operations, accelerate user acquisition through our ISA and Partner programs, and further develop our proprietary technology platform, particularly our AI and data analytics capabilities.</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary"/>Yield on investment</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Revenue is generated through multiple streams, creating a robust and diversified business model. This includes membership fees, commissions from mall transactions, fees for value-added services in the marketplace, and subscriptions to our premium tech tools.</p>
                    <p className="mt-4 text-muted-foreground">We project a significant return on investment driven by network effects and a large, underserved addressable market.</p>
                </CardContent>
            </Card>

        </div>
    );
}
