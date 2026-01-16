'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DollarSign, Building, Users, TrendingUp, Lightbulb, CheckCircle } from 'lucide-react';

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
                <CardContent>
                    <p className="text-muted-foreground">Placeholder for 'This is us' content. We are a team dedicated to revolutionizing the transport industry in South Africa.</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Lightbulb className="h-6 w-6 text-primary"/>This is what we realized</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Placeholder for 'This is what we realized' content. The transport sector is fragmented, inefficient, and underserved by traditional financial institutions.</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CheckCircle className="h-6 w-6 text-primary"/>This is what we built</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Placeholder for 'This is what we built' content. We built an integrated digital ecosystem with divisions for Funding, a supplier Mall, a value-added Marketplace, and cutting-edge Tech.</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6 text-primary"/>Transporters want what we built</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Placeholder for 'Transporters want what we built' content. There is a clear market need for our solutions, evidenced by early adoption and engagement metrics.</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><DollarSign className="h-6 w-6 text-primary"/>Investment needed</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Placeholder for 'Investment needed' content. We are seeking seed funding to scale our operations, expand our user base, and enhance our technology platform.</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary"/>Yield on investment</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Placeholder for 'Yield on investment' content. We project a significant return on investment driven by multiple recurring revenue streams and a large, addressable market.</p>
                </CardContent>
            </Card>

        </div>
    );
}
