
import data from "@/lib/placeholder-images.json";
import { Building2, CheckCircle, Star, Sparkles } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

const { placeholderImages } = data;

// In a real app, this data would be fetched from a database based on params.supplierId
const featuredSuppliers = [
    { 
        id: "global-parts-inc",
        name: "Global Parts Inc.", 
        category: "Engine & Drivetrain",
        rating: 4.5,
        image: placeholderImages.find(p => p.id === 'tech-division'),
        about: "With over 20 years of experience, Global Parts Inc. is a leading distributor of OEM and aftermarket parts for heavy-duty trucks. Our mission is to keep your fleet on the road with reliable parts, expert advice, and unbeatable service.",
        productCategories: ["Engine Components", "Transmission Parts", "Axle & Differential", "Filters & Fluids"],
        phone: "011 555 1234",
        email: "sales@globalparts.co.za",
        address: "42 Industrial Rd, Johannesburg",
    },
    { 
        id: "tiremax-pro",
        name: "TireMax Pro", 
        category: "Tires & Wheels",
        rating: 4.8,
        image: placeholderImages.find(p => p.id === 'product-tires'),
        about: "Your number one source for new and retreaded commercial tires. We offer leading brands and professional fitting services to maximize your uptime and tire lifespan.",
        productCategories: ["Long-Haul Tires", "Regional Tires", "Retread Services", "Wheel Alignment"],
        phone: "011 555 5678",
        email: "contact@tiremax.co.za",
        address: "15 Tire Ave, Johannesburg",
    },
    { 
        id: "advanced-auto-electrical",
        name: "Advanced Auto Electrical", 
        category: "Electrical & Lighting",
        rating: 4.2,
        image: placeholderImages.find(p => p.id === 'tech-home'),
        about: "Specialists in diagnosing and repairing complex electrical systems for modern trucks. From starters and alternators to full wiring harnesses, we've got you covered.",
        productCategories: ["Alternators & Starters", "Lighting & Bulbs", "Batteries & Cables", "ECU Diagnostics"],
        phone: "011 555 9012",
        email: "service@advanced-ae.co.za",
        address: "88 Circuit Lane, Johannesburg",
    },
    { 
        id: "brake-clutch-specialists",
        name: "Brake & Clutch Specialists", 
        category: "Brakes & Suspension",
        rating: 4.6,
        image: placeholderImages.find(p => p.id === 'hero-home'),
        about: "Safety is our priority. We are certified experts in brake, clutch, and suspension systems for all major truck brands, ensuring your vehicles are safe and compliant.",
        productCategories: ["Brake Pads & Drums", "Clutch Kits", "Air Brake Systems", "Suspension Components"],
        phone: "011 555 3456",
        email: "info@bcs.co.za",
        address: "101 Stop Street, Johannesburg",
    },
]


export default function SupplierProfilePage({ params }: { params: { supplierId: string } }) {

    const supplier = featuredSuppliers.find(s => s.id === params.supplierId);

    if (!supplier) {
        notFound();
    }
    
    return (
        <div className="py-16 md:py-24 bg-background">
             <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto border rounded-xl overflow-hidden shadow-2xl bg-background">
                    {/* Profile Header */}
                    <div className="relative h-48 md:h-64">
                            {supplier.image && (
                            <Image
                                src={supplier.image.imageUrl}
                                alt={supplier.name}
                                fill
                                className="object-cover"
                                data-ai-hint={supplier.image.imageHint}
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-background p-3 rounded-lg shadow-md">
                                    <Building2 className="h-10 w-10 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-white font-headline">{supplier.name}</h1>
                                    <p className="text-white/90">{supplier.category}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Profile Body */}
                    <div className="p-6 md:p-8 grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-2">
                            <h2 className="text-xl font-semibold font-headline">About Us</h2>
                            <p className="mt-2 text-muted-foreground">
                                {supplier.about}
                            </p>

                            <h3 className="mt-8 text-xl font-semibold font-headline">Product Categories</h3>
                            <div className="mt-4 grid grid-cols-2 gap-4">
                                {supplier.productCategories.map(cat => (
                                    <div key={cat} className="flex items-center gap-2 p-3 bg-card rounded-md border">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        <span>{cat}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-card p-6 rounded-lg border">
                            <h3 className="text-xl font-semibold font-headline">Contact Details</h3>
                            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                                <li><strong>Phone:</strong> {supplier.phone}</li>
                                <li><strong>Email:</strong> {supplier.email}</li>
                                <li><strong>Address:</strong> {supplier.address}</li>
                            </ul>
                                <h3 className="mt-6 text-xl font-semibold font-headline">Member Rating</h3>
                            <div className="flex items-center gap-1 mt-2">
                                {[...Array(5)].map((_, i) => (
                                    <Star 
                                        key={i} 
                                        className={`h-5 w-5 ${i < Math.floor(supplier.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-yellow-400/50'}`} 
                                    />
                                ))}
                                <span className="ml-2 text-sm text-muted-foreground">({supplier.rating.toFixed(1)}/5)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-16">
                    <Button size="lg">
                        <Sparkles className="mr-2 h-5 w-5" />
                        Are you a supplier? Claim Your Profile Today!
                    </Button>
                </div>
             </div>
        </div>
    );
}
