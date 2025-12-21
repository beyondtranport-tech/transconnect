
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { placeholderImages } from "@/lib/placeholder-images.json";
import { Building2, Search } from "lucide-react";
import Image from "next/image";

const supplierMallImage = placeholderImages.find(p => p.id === 'mall-division');

const featuredSuppliers = [
    { name: "Global Parts Inc.", category: "Engine & Drivetrain" },
    { name: "TireMax Pro", category: "Tires & Wheels" },
    { name: "Advanced Auto Electrical", category: "Electrical & Lighting" },
    { name: "Brake & Clutch Specialists", category: "Brakes & Suspension" },
]

export default function SupplierMallPage() {
    return (
        <div>
            <section className="relative w-full h-80 bg-card">
                {supplierMallImage && (
                    <Image
                        src={supplierMallImage.imageUrl}
                        alt="Supplier Mall"
                        fill
                        className="object-cover"
                        priority
                        data-ai-hint={supplierMallImage.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative h-full flex flex-col items-center justify-center text-center text-primary-foreground z-10 p-4">
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">Supplier Mall</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-3xl">Your direct connection to a network of vetted, high-quality parts and service suppliers.</p>
                </div>
            </section>
            
            <section id="search-suppliers" className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4">
                     <div className="max-w-4xl mx-auto">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Search className="h-6 w-6"/>
                                    Find a Supplier
                                </CardTitle>
                                <CardDescription>Search by name, category, or location to find the right partner for your needs.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input placeholder="Supplier name or keyword..." className="md:col-span-2" />
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Categories" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="parts">Parts</SelectItem>
                                            <SelectItem value="tires">Tires</SelectItem>
                                            <SelectItem value="maintenance">Maintenance</SelectItem>
                                            <SelectItem value="insurance">Insurance</SelectItem>
                                            <SelectItem value="consumables">Consumables</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button className="w-full md:col-span-3">Search Suppliers</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>
            
             <section id="featured-suppliers" className="py-16 md:py-24 bg-card">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">Featured Suppliers</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Top-rated suppliers trusted by the TransConnect community.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                         {featuredSuppliers.map((supplier) => (
                            <Card key={supplier.name}>
                                <CardHeader>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-primary/10 rounded-full">
                                            <Building2 className="h-6 w-6 text-primary"/>
                                        </div>
                                        <CardTitle className="text-lg">{supplier.name}</CardTitle>
                                    </div>
                                    <CardDescription>{supplier.category}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="outline" className="w-full">View Profile</Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}
