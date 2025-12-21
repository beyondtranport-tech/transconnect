
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, ShoppingBasket } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { placeholderImages } from "@/lib/placeholder-images.json";
import { marketplaceItems } from "@/lib/data";
import { Badge } from "@/components/ui/badge";

const mallHeroImage = placeholderImages.find(p => p.id === 'mall-division');

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
    }).format(price);
};

export default function MallPage() {
    return (
        <div>
            <section className="relative w-full h-80 bg-card">
                {mallHeroImage && (
                    <Image
                        src={mallHeroImage.imageUrl}
                        alt={mallHeroImage.description}
                        fill
                        className="object-cover"
                        priority
                        data-ai-hint={mallHeroImage.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative h-full flex flex-col items-center justify-center text-center text-primary-foreground z-10 p-4">
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">TransConnect Mall</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-3xl">Your one-stop shop for parts, gear, and essentials, with exclusive member pricing.</p>
                </div>
            </section>

            <section id="featured-products" className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">Featured Products</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Hand-picked deals and essential items for your fleet, available at special prices for TransConnect members.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                         {marketplaceItems.slice(0, 4).map(item => (
                            <Card key={item.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
                                <CardHeader className="p-0">
                                    <div className="relative aspect-4/3">
                                        {item.image && (
                                            <Image 
                                                src={item.image.imageUrl}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                                data-ai-hint={item.image.imageHint}
                                            />
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 flex flex-col flex-grow">
                                    <div className="flex-grow">
                                        <Badge variant="secondary" className="mb-2">{item.category}</Badge>
                                        <h3 className="font-bold text-lg">{item.name}</h3>
                                        <p className="text-sm text-muted-foreground mt-1 h-10 truncate">{item.description}</p>
                                    </div>
                                    <div className="flex justify-between items-end mt-4">
                                        <p className="text-xl font-bold text-primary">{formatPrice(item.price)}</p>
                                        <Button size="sm">View Item</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                     <div className="text-center mt-12">
                        <Button size="lg" asChild>
                            <Link href="/marketplace">
                                Explore All Products <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    )
}

    