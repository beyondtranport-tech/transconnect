
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/firebase';
import { ArrowRight, Gift, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import data from '@/lib/placeholder-images.json';
import { useConfig } from '@/hooks/use-config';

const { placeholderImages } = data;

const rewardsImage = placeholderImages.find(p => p.id === 'mall-division');

const formatPrice = (price: number) => {
    if (typeof price !== 'number' || isNaN(price)) return 'R 0';
    const parts = price.toFixed(0).toString().split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `R ${integerPart}`;
};

export default function RewardsPlanPage() {
    const { user } = useUser();
    const ctaLink = user ? '/account' : '/signin';
    const { data: pricing, isLoading } = useConfig<{ rewardsPlanPrice: number }>('connectPlans');
    
    return (
        <div className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
                <Card className="overflow-hidden">
                     {rewardsImage && (
                        <div className="relative w-full h-56 bg-card">
                            <Image
                                src={rewardsImage.imageUrl}
                                alt="Rewards Plan"
                                fill
                                className="object-cover"
                                data-ai-hint={rewardsImage.imageHint}
                            />
                             <div className="absolute inset-0 bg-black/50" />
                        </div>
                     )}
                    <CardHeader className="relative border-b">
                         <div className="flex items-center gap-4">
                            <Gift className="h-12 w-12 text-primary" />
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold font-headline">Rewards Plan</h1>
                                {isLoading ? (
                                    <Loader2 className="h-6 w-6 animate-spin text-primary mt-2" />
                                ) : (
                                    <p className="text-lg text-primary font-semibold">{formatPrice(pricing?.rewardsPlanPrice || 50)}/month</p>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <p className="text-lg text-muted-foreground">
                            The Rewards Plan is your key to unlocking tangible benefits from being part of the TransConnect community. Supercharge your membership by earning points on everyday purchases within our ecosystem and redeem them for items that directly impact your bottom line.
                        </p>
                        
                        <div>
                            <h3 className="text-xl font-semibold mb-3">How It Works:</h3>
                            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                                <li><span className="font-semibold text-foreground">Earn on Everything:</span> Every time you make a purchase in the TransConnect Mall—from parts to consumables—you accumulate reward points.</li>
                                <li><span className="font-semibold text-foreground">Redeem for Value:</span> Your points are as good as cash. Redeem them for high-value items like fuel vouchers, toll passes, or premium services.</li>
                                <li><span className="font-semibold text-foreground">Exclusive Access:</span> As a Rewards Plan member, you gain access to a curated selection of products and special deals that are not available to other members.</li>
                            </ul>
                        </div>
                        
                        <p className="text-lg text-muted-foreground">
                           This plan is designed for the active transporter who wants to get more value from their regular business spending. It's not just a plan; it's a financial tool to help you save and succeed.
                        </p>
                        
                        <div className="text-center pt-6">
                            <Button asChild size="lg">
                                <Link href={ctaLink}>
                                    Activate Rewards Plan <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
