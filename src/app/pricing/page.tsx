'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/firebase';

export default function MembershipPage() {
  const { user } = useUser();
  const ctaLink = user ? '/account' : '/join';

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-headline">A New Model for Connection</h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground">
            To build the strongest community, we are making our powerful ecosystem free to join for one year. No subscription fees, just value.
          </p>
        </div>

        <div className="flex justify-center">
            <Card className="w-full max-w-2xl shadow-2xl border-primary border-2">
                 <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold">Free Membership</CardTitle>
                    <CardDescription className="mt-2 text-base">
                        Join for free for one year and gain access to all platform features.
                    </CardDescription>
                     <div className="flex items-baseline justify-center gap-1 pt-4">
                        <span className="text-5xl font-extrabold tracking-tight">R0</span>
                        <span className="text-muted-foreground">/ year</span>
                    </div>
                </CardHeader>
                 <CardContent className="px-8">
                     <p className="text-center text-muted-foreground">
                        Our revenue is generated through small, transparent transaction fees within the ecosystem—so we only succeed when you do.
                     </p>
                    <ul className="mt-8 space-y-4">
                        <li className="flex items-start">
                            <div className="bg-green-100 rounded-full p-1 mr-4">
                               <Check className="h-4 w-4 text-green-700" />
                            </div>
                            <span>Access to all <span className="font-semibold">Malls:</span> Supplier, Transporter, Finance, and more.</span>
                        </li>
                         <li className="flex items-start">
                            <div className="bg-green-100 rounded-full p-1 mr-4">
                               <Check className="h-4 w-4 text-green-700" />
                            </div>
                            <span>Full use of the <span className="font-semibold">Marketplace</span> to buy and sell.</span>
                        </li>
                         <li className="flex items-start">
                            <div className="bg-green-100 rounded-full p-1 mr-4">
                               <Check className="h-4 w-4 text-green-700" />
                            </div>
                            <span>Utilize our <span className="font-semibold">AI-powered Tech</span>, including the Freight Matcher.</span>
                        </li>
                         <li className="flex items-start">
                            <div className="bg-green-100 rounded-full p-1 mr-4">
                               <Check className="h-4 w-4 text-green-700" />
                            </div>
                            <span>Contribute anonymous fleet data to help us negotiate <span className="font-semibold">better deals for everyone</span>.</span>
                        </li>
                    </ul>
                </CardContent>
                <CardFooter className="p-6">
                    <Button asChild className="w-full" size="lg">
                        <Link href={ctaLink}>Join Free for One Year</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </div>
    </div>
  );
}
