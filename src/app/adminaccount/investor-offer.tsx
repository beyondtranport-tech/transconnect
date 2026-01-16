
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DollarSign, Building, Users, TrendingUp, Lightbulb, CheckCircle, Handshake } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(value);

export default function InvestorOffer() {
    // Revenue Projections
    const targetMembers = 1000;
    const monthlyFee = 500 + 100; // Membership + Subscription
    const annualFeeRevenue = targetMembers * monthlyFee * 12;
    const annualTransactionalRevenue = targetMembers * 100 * 12; // Estimate
    const annualDiscountRevenue = targetMembers * 200 * 12; // Estimate
    const totalAnnualRevenue = annualFeeRevenue + annualTransactionalRevenue + annualDiscountRevenue;

    // Expense Projections
    const annualSalaries = 1860000;
    const annualPlatformCosts = 60000;
    const annualOpex = 396000;
    const totalAnnualExpenses = annualSalaries + annualPlatformCosts + annualOpex;
    
    const netPosition = totalAnnualRevenue - totalAnnualExpenses;
    
    const investmentAsk = 500000;


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
                     <ul className="list-disc list-inside space-y-4 text-muted-foreground">
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
                    <CardTitle className="flex items-center gap-2"><Handshake className="h-6 w-6 text-primary"/>Our Path to 1,000 Members</CardTitle>
                     <CardDescription>Our growth strategy is rooted in strategic partnerships with key industry players.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">We have established a powerful acquisition funnel through pending partnership agreements with major networks:</p>
                    <ul className="list-disc list-inside space-y-2 text-foreground">
                        <li><strong className="font-semibold">SA Auction Online:</strong> Access to a database of 40,000 transport companies.</li>
                        <li><strong className="font-semibold">SATL:</strong> Access to a network of freight forwarders and relationships with shippers.</li>
                        <li><strong className="font-semibold">Ludic Financial Services:</strong> Partnership with a specialist insurer provides a captive audience in need of our services.</li>
                        <li><strong className="font-semibold">CTS Trailers:</strong> Collaboration with a national manufacturer to reach new asset buyers at the point of sale.</li>
                    </ul>
                    <p className="font-semibold pt-2 border-t">These partnerships provide a clear and achievable path to reaching our target of 1,000 members within the first year.</p>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary"/>High-Level 1-Year Financial Model</CardTitle>
                        <CardDescription>Based on a target of {targetMembers.toLocaleString()} paying members.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-foreground mb-2">Projected Annual Revenue Streams</h4>
                            <ul className="space-y-1 list-disc list-inside text-muted-foreground text-sm">
                                <li><strong>Membership & Subscription Fees:</strong> {formatCurrency(annualFeeRevenue)}</li>
                                <li><strong>Transactional Revenue (Estimate):</strong> {formatCurrency(annualTransactionalRevenue)}</li>
                                <li><strong>Discount Retention Share (Estimate):</strong> {formatCurrency(annualDiscountRevenue)}</li>
                            </ul>
                            <p className="text-right font-bold text-base mt-2 pr-2">Total Projected Revenue: {formatCurrency(totalAnnualRevenue)}</p>
                        </div>
                        <div className="border-t pt-4">
                            <h4 className="font-semibold text-foreground mb-2">Projected Annual Expenses</h4>
                            <ul className="space-y-1 list-disc list-inside text-muted-foreground text-sm">
                                <li><strong>Salaries & Wages (Core Team):</strong> {formatCurrency(annualSalaries)}</li>
                                <li><strong>Platform & Tech Costs:</strong> {formatCurrency(annualPlatformCosts)}</li>
                                <li><strong>Operational Overheads:</strong> {formatCurrency(annualOpex)}</li>
                            </ul>
                            <p className="text-right font-bold text-base mt-2 pr-2">Total Projected Expenses: {formatCurrency(totalAnnualExpenses)}</p>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/50 p-3 border-t">
                        <p className="text-lg font-bold text-green-600 w-full text-right">Projected Net Position (Year 1): {formatCurrency(netPosition)}</p>
                    </CardFooter>
                </Card>
                <div className="space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><DollarSign className="h-6 w-6 text-primary"/>Investment Needed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold text-primary">{formatCurrency(investmentAsk)}</p>
                            <p className="text-muted-foreground mt-2">Seed funding to scale operations, accelerate user acquisition through our ISA and Partner programs, and further develop our technology platform.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

        </div>
    );
}
