
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBasket, Store, DollarSign, ShieldCheck, Lock, DatabaseZap, Loader2, BarChart, Fuel, TrendingUp } from 'lucide-react';
import data from '@/lib/placeholder-images.json';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import * as gtag from '@/lib/gtag';


const { placeholderImages } = data;

const newHeroImage = placeholderImages.find(p => p.id === "value-integrity");

function ShowcaseButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // TODO: Replace this placeholder with the actual video URL from your Asset Gallery
  // 1. Go to Admin Account > Sales & Marketing > AI Marketing Studio
  // 2. Use the Video Generator to create your desired video.
  // 3. Click "Save to Cloud" and then go to the "Asset Gallery".
  // 4. Copy the URL for your new video and paste it here.
  const videoUrl = "https://storage.googleapis.com/your-bucket/your-video.mp4"; // <-- PASTE URL HERE

  const handleShowcaseClick = () => {
    if (process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID) {
      gtag.event({
        action: 'click_showcase',
        category: 'Homepage',
        label: 'Showcase How Button',
        value: 1
      });
    }
    setIsModalOpen(true);
  };

  return (
    <>
      <Button size="lg" variant="outline" onClick={handleShowcaseClick}>
        Showcase How
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Platform Showcase</DialogTitle>
            <DialogDescription>A video demonstrating how to create your online shop.</DialogDescription>
          </DialogHeader>
          <div className="aspect-video bg-black rounded-md">
            {videoUrl.includes('your-bucket') ? (
                 <div className="flex flex-col items-center justify-center h-full text-center text-white p-4">
                    <h3 className="text-lg font-semibold">Video Not Configured</h3>
                    <p className="text-sm text-gray-400">Please generate a video in the admin panel and update the URL in `src/app/page.tsx`.</p>
                </div>
            ) : (
                <video src={videoUrl} controls autoPlay className="w-full h-full rounded-md" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function Home() {

  const handleCreateShopClick = () => {
    if (process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID) {
      gtag.event({
        action: 'click_create_shop',
        category: 'Homepage',
        label: 'Create Your Shop CTA',
        value: 1
      });
    }
  };

  return (
    <div className="flex flex-col">
      <section className="relative w-full h-[60vh] md:h-[70vh] flex items-center justify-center text-center">
        {newHeroImage && (
          <Image
            src={newHeroImage.imageUrl}
            alt={newHeroImage.description}
            fill
            className="object-cover"
            priority
            data-ai-hint={newHeroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground font-headline tracking-tight">
            Build Your Network, Grow Your Business, Start Earning
          </h1>
           <p className="mt-4 text-lg md:text-xl text-primary-foreground/90 max-w-3xl mx-auto">
            Join a community of Logistics professionals. Contribute your knowledge, unlock collective savings, and create new revenue streams.
          </p>
        </div>
      </section>

       <section className="py-16 md:py-24 bg-card">
          <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-4xl font-bold font-headline">The cornerstone of the offering is the ability to create a unified commercial structure in the form of your Own Online Shop for the Logistics Sector.</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                Launch a professional storefront to market your services, sell your products, and build a trusted profile to unlock funding. Get started for free.
              </p>
              <div className="mt-8 flex justify-center items-center gap-4">
                <Button asChild size="lg" onClick={handleCreateShopClick}>
                    <Link href="/roles">Create Your Shop</Link>
                </Button>
                <ShowcaseButton />
              </div>
          </div>
      </section>

      <section id="how-it-works" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-bold font-headline">A Powerful, Simple Path to Growth</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                    In three simple steps, you can establish your digital presence, open new sales channels, and access the capital you need to expand.
                </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 text-center max-w-6xl mx-auto">
                <Card>
                    <CardHeader className="items-center">
                        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-2">
                           <Store className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle>1. Build Your Digital Branch</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Create a free, basic online shop in minutes. Showcase your business, list your core services, and establish your professional presence in the logistics ecosystem.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="items-center">
                        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-2">
                           <ShoppingBasket className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle>2. Sell Your Goods & Services</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Upgrade to a paid plan to list unlimited products. Whether selling parts, warehouse space, or freight capacity, your shop is your direct sales channel.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="items-center">
                        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-2">
                           <DollarSign className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle>3. Unlock Funding</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Your shop activity and business profile build a trusted operational record. This data-driven approach strengthens your case for accessing our network of funders.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-bold font-headline">What Makes Us Unique: Commerce Meets Capital</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                    We've broken the biggest constraint in transport: the disconnect between your business performance and your access to funding. Your online shop is more than a sales channel—it's the key to unlocking growth capital.
                </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto text-center">
                <Card>
                    <CardHeader className="items-center">
                        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-2">
                            <TrendingUp className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle>Build Your Track Record</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Your shop is a living ledger of your business activity. Every sale and transaction builds a credible, data-driven profile of your operations.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="items-center">
                        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-2">
                           <BarChart className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle>Data-Driven Funding</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">We use your real-world operational data to assess funding applications, allowing funders to see the true health of your business beyond traditional credit scores.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="items-center">
                        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-2">
                           <Fuel className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle>Fuel Your Growth</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">This unique model means your sales success directly unlocks capital. More shop activity leads to better funding opportunities, creating a virtuous cycle of growth.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-bold font-headline">Your Security &amp; Data Protection: Our Priority</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                    We understand that your business data is sensitive. We are committed to protecting your privacy and securing your information with robust, industry-standard practices.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <Card className="bg-card text-center">
                    <CardContent className="p-6">
                        <Lock className="h-10 w-10 text-primary mx-auto mb-4" />
                        <h3 className="text-xl font-semibold">Data Privacy</h3>
                        <p className="mt-2 text-muted-foreground">Your personal and company data is never shared or sold. It is only used to power the services you choose to use within the platform.</p>
                    </CardContent>
                </Card>
                <Card className="bg-card text-center">
                    <CardContent className="p-6">
                        <DatabaseZap className="h-10 w-10 text-primary mx-auto mb-4" />
                        <h3 className="text-xl font-semibold">Anonymous Contributions</h3>
                        <p className="mt-2 text-muted-foreground">Data you contribute to the community, like fleet details, is always anonymized and aggregated. It is only used to negotiate group discounts and will never be linked back to you.</p>
                    </CardContent>
                </Card>
                <Card className="bg-card text-center">
                    <CardContent className="p-6">
                        <ShieldCheck className="h-10 w-10 text-primary mx-auto mb-4" />
                        <h3 className="text-xl font-semibold">Secure Platform</h3>
                        <p className="mt-2 text-muted-foreground">Our platform is built on secure, modern infrastructure to protect against unauthorized access and ensure your data remains safe.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-headline">Ready to Join?</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Become a member today and gain access to a world of opportunities. Benefit from our rewards program, community support, and a full suite of tools to supercharge your business.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/join">Create Your Free Account</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
