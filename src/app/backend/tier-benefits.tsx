
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Gem, ShoppingBasket, Percent, BarChart3, Star } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const tiers = [
    { name: 'Bronze', points: 0, benefits: ['Basic Shop', 'Access to Mall'] },
    { name: 'Silver', points: 1000, benefits: ['Premium Shop Template', 'Featured on Mall Homepage', '5% Fee Discount'] },
    { name: 'Gold', points: 5000, benefits: ['Advanced Shop Analytics', '10% Fee Discount', 'Priority Support'] },
];

export default function TierBenefits() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Award className="h-6 w-6" />
                    Loyalty Plan Benefits
                </CardTitle>
                <CardDescription>Define the features and benefits that are automatically unlocked when a member reaches a new loyalty tier.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-6">
                    This page is under construction. The final version will allow you to dynamically configure the specific benefits (e.g., shop templates, fee discounts, feature access) for each loyalty tier.
                </p>

                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tier</TableHead>
                            <TableHead>Points Required</TableHead>
                            <TableHead>Unlocked Benefits (Examples)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tiers.map(tier => (
                            <TableRow key={tier.name}>
                                <TableCell className="font-semibold">{tier.name}</TableCell>
                                <TableCell>{tier.points.toLocaleString()}</TableCell>
                                <TableCell>
                                    <ul className="list-disc list-inside">
                                        {tier.benefits.map(b => <li key={b}>{b}</li>)}
                                    </ul>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
