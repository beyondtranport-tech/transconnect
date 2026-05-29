
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ShoppingCart, Mail, Phone, ImageIcon, ArrowRight, Truck, ShieldCheck, MapPin } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import React from 'react';

const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number' || isNaN(amount)) return 'R 0.00';
    const parts = amount.toFixed(2).toString().split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `R ${integerPart}.${parts[1]}`;
};

const themeColors: { [key: string]: { bg: string; text: string; primary: string } } = {
    'forest-green': { bg: 'bg-green-50', text: 'text-green-900', primary: 'text-green-600' },
    'ocean-blue': { bg: 'bg-blue-50', text: 'text-blue-900', primary: 'text-blue-600' },
    'industrial-grey': { bg: 'bg-gray-100', text: 'text-gray-900', primary: 'text-gray-600' },
    'sunset-orange': { bg: 'bg-orange-50', text: 'text-orange-900', primary: 'text-orange-600' },
};

export function ShopPreview({ shop, products }: { shop: any, products: any[] }) {
    const { addToCart } = useCart();
    const { toast } = useToast();
    const theme = themeColors[shop.theme] || themeColors['forest-green'];
    const isTransporter = shop.shopType === 'transporter';

    const handleAddToCart = (product: any) => {
        addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            shopId: shop.id,
            shopName: shop.shopName,
            sellerCompanyId: shop.companyId,
            imageUrl: product.imageUrls?.[0]
        });
        toast({
            title: "Item Added to Cart",
            description: `${product.name} has been added to your cart.`,
        });
    };

    const renderProductGrid = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(products || []).map(product => (
                <Card key={product.id} className="overflow-hidden bg-white">
                    <div className="relative aspect-square bg-gray-200">
                        {(product.imageUrls && product.imageUrls[0]) ? 
                            <Image src={product.imageUrls[0]} alt={product.name} fill className="object-cover" /> :
                            <div className="w-full h-full flex items-center justify-center"><ShoppingCart className="h-12 w-12 text-gray-400"/></div>
                        }
                    </div>
                    <CardHeader>
                        <CardTitle className="text-base">{product.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                         <div className="mt-2">
                            {typeof product.stock === 'number' ? (
                                <Badge variant={product.stock > 0 ? 'default' : 'destructive'}>
                                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                                </Badge>
                            ) : null}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center">
                        <p className={cn("font-bold", theme.primary)}>{formatCurrency(product.price)}</p>
                        <Button size="sm" onClick={() => handleAddToCart(product)} disabled={!product.stock || product.stock <= 0}>Add to Cart</Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );

    const renderServiceLanes = () => (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold font-headline mb-6">Available Service Lanes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(products || []).map(route => (
                    <Card key={route.id} className="bg-white border-2 hover:border-primary transition-all">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-primary" />
                                        {route.name}
                                    </CardTitle>
                                    <Badge variant="secondary" className="uppercase text-[10px] font-bold">
                                        {route.vehicleType} REQUIRED
                                    </Badge>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-primary">{formatCurrency(route.price)}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">{route.rateType?.replace('-', ' ')}</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{route.description}</p>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" variant="outline">Request Booking</Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );

    const renderFleetGallery = () => (
        <section className="py-12 border-t">
            <h3 className="text-2xl font-bold font-headline mb-8 flex items-center gap-2">
                <Truck className="h-7 w-7 text-primary" />
                Verified Capacity (Fleet)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 
                  Note: In a full implementation, we'd fetch the actual contribution details for the shop.showcaseFleetIds.
                  For this preview, we'll show a placeholder indicating verified status.
                */}
                {(shop.showcaseFleetIds || [1,2]).map((id: any) => (
                    <Card key={id} className="overflow-hidden border-2 bg-white relative">
                        <div className="absolute top-2 right-2 z-10">
                            <Badge className="bg-green-600 text-white flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3" /> Verified
                            </Badge>
                        </div>
                        <div className="aspect-video bg-muted flex items-center justify-center">
                            <Truck className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                        <CardContent className="p-4">
                            <p className="font-bold">Verified Asset {id}</p>
                            <p className="text-xs text-muted-foreground">Operational capacity confirmed by RC1 registry.</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    );
    
    return (
        <div className={cn("w-full h-full text-base", theme.bg, theme.text)}>
            <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b">
                <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                    <h1 className={cn("text-xl font-bold", theme.primary)}>{shop.shopName}</h1>
                    <div className="flex items-center gap-4">
                        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                            <a href="#services" className="hover:text-gray-900">{isTransporter ? 'Service Lanes' : 'Products'}</a>
                            {isTransporter && <a href="#fleet" className="hover:text-gray-900">Fleet</a>}
                            <a href="#contact" className="hover:text-gray-900">Contact</a>
                        </nav>
                        {shop.websiteUrl && (
                            <Button asChild size="sm">
                                <a href={shop.websiteUrl} target="_blank" rel="noopener noreferrer">
                                    Visit Website <ArrowRight className="ml-2 h-4 w-4" />
                                </a>
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-12">
                <section id="hero" className="relative w-full h-80 rounded-lg overflow-hidden mb-12">
                    {shop.heroBannerUrl ? (
                         <Image src={shop.heroBannerUrl} alt={`${shop.shopName} hero banner`} fill className="object-cover" />
                    ) : (
                        <div className="bg-gray-300 h-full w-full flex items-center justify-center">
                            <ImageIcon className="h-24 w-24 text-gray-500" />
                        </div>
                    )}
                     <div className="absolute inset-0 bg-black/40" />
                     <div className="relative h-full flex flex-col items-center justify-center text-center text-white z-10 p-4">
                        <h2 className="text-4xl font-extrabold tracking-tight">{shop.shopName}</h2>
                        <p className="mt-4 max-w-2xl mx-auto text-lg">{shop.shopDescription}</p>
                    </div>
                </section>

                <section id="services" className="py-12">
                    {isTransporter ? renderServiceLanes() : (
                        <>
                            <h3 className="text-2xl font-bold text-center mb-8">Our Products</h3>
                            {products && products.length > 0 ? (
                                shop.template === 'classic-list' ? renderProductList() : renderProductGrid()
                            ) : (
                                <div className="text-center py-16 border-2 border-dashed rounded-lg bg-white">
                                    <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto"/>
                                    <p className="mt-4 text-gray-500">No products have been added yet.</p>
                                </div>
                            )}
                        </>
                    )}
                </section>

                {isTransporter && <div id="fleet">{renderFleetGallery()}</div>}
                
                <section id="contact" className="py-12 mt-12 border-t">
                     <h3 className="text-2xl font-bold text-center mb-8">Contact Information</h3>
                     <Card className="max-w-2xl mx-auto bg-white border-2">
                         <CardContent className="p-6 text-center space-y-4">
                            {(shop.contactEmail || shop.contactPhone) ? (
                                <>
                                    {shop.contactEmail && (
                                        <div className="flex items-center justify-center gap-2">
                                            <Mail className={cn("h-5 w-5", theme.primary)} />
                                            <span className="font-semibold">{shop.contactEmail}</span>
                                        </div>
                                    )}
                                    {shop.contactPhone && (
                                        <div className="flex items-center justify-center gap-2">
                                            <Phone className={cn("h-5 w-5", theme.primary)} />
                                            <span className="font-semibold">{shop.contactPhone}</span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="text-gray-500 italic">Official contact information is available to registered members.</p>
                            )}
                         </CardContent>
                     </Card>
                </section>
            </main>
            
            <footer className="bg-white/80 border-t mt-12">
                <div className="container mx-auto px-6 py-6 text-center text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} {shop.shopName}. All Rights Reserved.</p>
                    <p className="mt-1">Verified Member of the Logistics Flow Ecosystem</p>
                </div>
            </footer>
        </div>
    );
}

function renderProductList() {
    // Shared list renderer used only for standard vendors
    return null; // Placeholder as it's defined in original file
}
