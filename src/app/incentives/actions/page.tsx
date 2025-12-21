'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/firebase';
import { ArrowRight, Zap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { placeholderImages } from '@/lib/placeholder-images.json';

const actionsImage = placeholderImages.find(p => p.id === 'tech-division');

export default function ActionsPlanPage() {
    const { user } = useUser();
    const ctaLink = user ? '/account' : '/join';
    
    return (
        <div className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
                <Card className="overflow-hidden">
                     {actionsImage && (
                        <div className="relative w-full h-56 bg-card">
                            <Image
                                src={actionsImage.imageUrl}
                                alt="Actions Plan"
                                fill
                                className="object-cover"
                                data-ai-hint={actionsImage.imageHint}
                            />
                            <div className="absolute inset-0 bg-black/50" />
                        </div>
                     )}
                    <CardHeader className="relative border-b">
                         <div className="flex items-center gap-4">
                            <Zap className="h-12 w-12 text-primary" />
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold font-headline">Actions Plan</h1>
                                <p className="text-lg text-primary font-semibold">R 50/month</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <p className="text-lg text-muted-foreground">
                           The Actions Plan transforms you from a member into a partner. This plan is designed for the proactive transporter who wants to generate new revenue streams by leveraging their network and actively participating in the growth of the TransConnect ecosystem.
                        </p>
                        
                        <div>
                            <h3 className="text-xl font-semibold mb-3">Your Avenues for Earning:</h3>
                            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                                <li><span className="font-semibold text-foreground">Earn Commission on Referrals:</span> Invite other transporters to join TransConnect. When they sign up for a paid membership, you earn a commission.</li>
                                <li><span className="font-semibold text-foreground">Share Supplier Discounts:</span> Share exclusive supplier discounts with your contacts outside of our network. You get paid for every successful referral or purchase made through your unique link.</li>
                                <li><span className="font-semibold text-foreground">Dedicated Earnings Dashboard:</span> Your member account will include a dedicated dashboard to track your referrals, commissions, and total earnings in real-time.</li>
                            </ul>
                        </div>
                        
                        <p className="text-lg text-muted-foreground">
                          If you have a strong network and want to be rewarded for sharing the benefits of TransConnect, the Actions Plan is your tool for growth.
                        </p>
                        
                        <div className="text-center pt-6">
                            <Button asChild size="lg">
                                <Link href={ctaLink}>
                                    Activate Actions Plan <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
