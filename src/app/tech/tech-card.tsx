
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface TechCardProps {
    name: string;
    description: string;
    price?: number;
    icon: LucideIcon;
    isPercentage?: boolean;
    per?: string;
    priceKey?: string; // Add this to link to the pricing config
}

const formatPrice = (price: number, isPercentage?: boolean, per?: string) => {
    if (typeof price !== 'number') return 'Contact Us';
    if (price === 0) return 'Free';
    if (isPercentage) return `${price}%`;

    const hasDecimals = price % 1 !== 0;

    const formattedPrice = new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: 2,
    }).format(price);
    
    let suffix = '/mo'; // Default to per month for subscriptions
    if (per) { // If a specific unit is provided (like 'image' or 'use')
        suffix = `/${per}`;
    }

    // For prices that are per-use and less than 1, don't assume per month.
    if(per && price > 0) {
      return `${formattedPrice}/${per}`;
    }

    // For subscription prices (no 'per' unit)
    if (!per) {
      return `${formattedPrice}/mo`;
    }

    return formattedPrice;
};


export default function TechCard({ name, description, price, icon: Icon, isPercentage, per }: TechCardProps) {
    return (
        <Card className="flex flex-col">
            <CardHeader>
                 <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
                <CardDescription>{description}</CardDescription>
            </CardContent>
            <CardFooter className="flex-col items-start pt-4 border-t">
                 <p className="text-2xl font-bold text-primary mb-4">
                    {formatPrice(price, isPercentage, per)}
                </p>
                <Button asChild className="w-full">
                    <Link href="/account">Activate</Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
