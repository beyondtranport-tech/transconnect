
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { placeholderImages } from "@/lib/placeholder-images.json";
import { Building2, Search, CheckCircle, Star, Sparkles } from "lucide-react";
import Image from "next/image";

const supplierMallImage = placeholderImages.find(p => p.id === 'mall-division');
const supplierProfileImage = placeholderImages.find(p => p.id === 'tech-division');

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
            
            <section id="supplier-showcase" className="py-16 md:py-24 bg-card">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">Your Profile on TransConnect</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            This is what your dedicated profile could look like. Connect directly with thousands of transporters ready to buy.
                        </p>
                    </div>

                    <div className="max-w-6xl mx-auto border rounded-xl overflow-hidden shadow-2xl bg-background">
                        {/* Profile Header */}
                        <div className="relative h-48 md:h-64">
                             {supplierProfileImage && (
                                <Image
                                    src={supplierProfileImage.imageUrl}
                                    alt="Supplier Showcase"
                                    fill
                                    className="object-cover"
                                    data-ai-hint={supplierProfileImage.imageHint}
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            <div className="absolute bottom-0 left-0 p-6">
                                <div className="flex items-center gap-4">
                                    <div className="bg-background p-3 rounded-lg shadow-md">
                                        <Building2 className="h-10 w-10 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-bold text-white font-headline">Global Parts Inc.</h3>
                                        <p className="text-white/90">Engine & Drivetrain Specialists</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Profile Body */}
                        <div className="p-6 md:p-8 grid md:grid-cols-3 gap-8">
                            <div className="md:col-span-2">
                                <h4 className="text-xl font-semibold font-headline">About Us</h4>
                                <p className="mt-2 text-muted-foreground">
                                    With over 20 years of experience, Global Parts Inc. is a leading distributor of OEM and aftermarket parts for heavy-duty trucks. Our mission is to keep your fleet on the road with reliable parts, expert advice, and unbeatable service.
                                </p>

                                <h4 className="mt-8 text-xl font-semibold font-headline">Product Categories</h4>
                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2 p-3 bg-card rounded-md border">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        <span>Engine Components</span>
                                    </div>
                                    <div className="flex items-center gap-2 p-3 bg-card rounded-md border">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        <span>Transmission Parts</span>
                                    </div>
                                    <div className="flex items-center gap-2 p-3 bg-card rounded-md border">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        <span>Axle & Differential</span>
                                    </div>
                                    <div className="flex items-center gap-2 p-3 bg-card rounded-md border">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        <span>Filters & Fluids</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-card p-6 rounded-lg border">
                                <h4 className="text-xl font-semibold font-headline">Contact Details</h4>
                                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                                    <li><strong>Phone:</strong> 011 555 1234</li>
                                    <li><strong>Email:</strong> sales@globalparts.co.za</li>
                                    <li><strong>Address:</strong> 42 Industrial Rd, Johannesburg</li>
                                </ul>
                                 <h4 className="mt-6 text-xl font-semibold font-headline">Member Rating</h4>
                                <div className="flex items-center gap-1 mt-2">
                                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                                    <Star className="h-5 w-5 text-yellow-400/50 fill-yellow-400/50" />
                                    <span className="ml-2 text-sm text-muted-foreground">(4.5/5)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-12">
                        <Button size="lg">
                            <Sparkles className="mr-2 h-5 w-5" />
                            Are you a supplier? Claim Your Profile Today!
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
