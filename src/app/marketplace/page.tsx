import Image from "next/image";
import { marketplaceItems } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const categories = ["All", "Vehicles", "Parts", "Electronics", "Consumables", "Accessories"];

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(price);
};

export default function MarketplacePage() {
    return (
        <div className="container mx-auto px-4 py-16">
            <div className="text-center max-w-3xl mx-auto mb-12">
                <h1 className="text-4xl md:text-5xl font-bold font-headline">Marketplace</h1>
                <p className="mt-4 text-lg md:text-xl text-muted-foreground">
                    Buy, sell, and trade within a trusted community of transport professionals.
                </p>
            </div>

            <Tabs defaultValue="All" className="w-full">
                <TabsList className="grid w-full grid-cols-3 md:w-auto md:grid-cols-6 mb-8">
                    {categories.map(category => (
                        <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
                    ))}
                </TabsList>

                {categories.map(category => (
                     <TabsContent key={category} value={category}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {marketplaceItems
                                .filter(item => category === 'All' || item.category === category)
                                .map(item => (
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
                                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                                        </div>
                                        <div className="flex justify-between items-end mt-4">
                                            <p className="text-xl font-bold text-primary">{formatPrice(item.price)}</p>
                                            <Button size="sm">View Item</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                     </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
