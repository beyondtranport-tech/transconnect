
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import data from "@/lib/placeholder-images.json";
import { Scale, Search, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as gtag from '@/lib/gtag';

const { placeholderImages } = data;

const saAuctionMallImage = placeholderImages.find(p => p.id === 'sa-auction-mall');

// Placeholder for featured auction items
const featuredAuctions: any[] = [];

export default function SA_AuctionMallPage() {

    const handleAuctionClick = (auctionId: string) => {
        gtag.event({
            action: 'view_auction_item',
            category: 'SA Auction Mall',
            label: auctionId,
            value: 0
        });
    };

    return (
        <div>
            <section className="relative w-full h-80 bg-card">
                {saAuctionMallImage && (
                    <Image
                        src={saAuctionMallImage.imageUrl}
                        alt="SA Auction Mall"
                        fill
                        className="object-cover"
                        priority
                        data-ai-hint={saAuctionMallImage.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative h-full flex flex-col items-center justify-center text-center text-primary-foreground z-10 p-4">
                    <div className="mb-4">
                        <Image src="https://placehold.co/200x60?text=SA+Auction+Online" alt="SA Auction Online Logo" width={200} height={60} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">SA Auction Mall</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-3xl">Exclusive access to live vehicle, equipment, and asset auctions powered by SA Auction Online.</p>
                </div>
            </section>
            
            <section id="search-auctions" className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4">
                     <div className="max-w-4xl mx-auto">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Search className="h-6 w-6"/>
                                    Find an Auction
                                </CardTitle>
                                <CardDescription>Search for live and upcoming auctions for specific assets.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input placeholder="Asset type, make, or model..." className="md:col-span-2" />
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Categories" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="vehicles">Vehicles</SelectItem>
                                            <SelectItem value="equipment">Equipment</SelectItem>
                                            <SelectItem value="salvage">Salvage</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button className="w-full md:col-span-3">Search Auctions</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

             <section id="live-auctions" className="py-16 md:py-24 bg-card">
                <div className="container mx-auto px-4">
                     <div className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">Live Auctions</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Browse assets currently available for bidding.
                        </p>
                    </div>
                    {featuredAuctions.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                           {/* Auction items would be mapped here */}
                        </div>
                    ) : (
                        <div className="text-center py-20 border-2 border-dashed rounded-lg">
                            <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-xl font-semibold">No Live Auctions Currently</h3>
                            <p className="mt-2 text-muted-foreground">Please check back soon for new auction listings from SA Auction Online.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
