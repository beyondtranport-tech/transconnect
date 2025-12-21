
import { placeholderImages } from "@/lib/placeholder-images.json";
import { Truck, CheckCircle, Star, Sparkles } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

const featuredTransporters = [
    { 
        id: "abc-logistics",
        name: "ABC Logistics", 
        specialty: "Refrigerated Transport",
        rating: 4.8,
        image: placeholderImages.find(p => p.id === 'tech-division'),
        about: "ABC Logistics is a family-owned business with 15 years of experience in temperature-controlled logistics. We specialize in transporting perishable goods across Southern Africa, ensuring your cargo arrives fresh and on time.",
        services: ["Refrigerated LTL & FTL", "Cold Storage Warehousing", "Pharmaceutical Transport", "Real-time Temperature Monitoring"],
        fleetSize: "50+ Trucks",
        routes: "Domestic & Cross-Border (SADC)",
        contactPerson: "John Smith",
    },
    { 
        id: "swift-haulers",
        name: "Swift Haulers", 
        specialty: "Long-Haul & General Freight",
        rating: 4.6,
        image: placeholderImages.find(p => p.id === 'hero-home'),
        about: "Swift Haulers is a leading provider of long-haul transportation services. Our modern fleet and experienced drivers are equipped to handle general freight of all types, ensuring safe and efficient delivery nationwide.",
        services: ["Full Truckload (FTL)", "Less-Than-Truckload (LTL)", "Dedicated Fleet Solutions", "Expedited Services"],
        fleetSize: "120+ Trucks",
        routes: "Nationwide (South Africa)",
        contactPerson: "Jane Doe",
    },
]


export default function TransporterProfilePage({ params }: { params: { transporterId: string } }) {

    const transporter = featuredTransporters.find(s => s.id === params.transporterId);

    if (!transporter) {
        notFound();
    }
    
    return (
        <div className="py-16 md:py-24 bg-background">
             <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto border rounded-xl overflow-hidden shadow-2xl bg-background">
                    {/* Profile Header */}
                    <div className="relative h-48 md:h-64">
                            {transporter.image && (
                            <Image
                                src={transporter.image.imageUrl}
                                alt={transporter.name}
                                fill
                                className="object-cover"
                                data-ai-hint={transporter.image.imageHint}
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-background p-3 rounded-lg shadow-md">
                                    <Truck className="h-10 w-10 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-white font-headline">{transporter.name}</h1>
                                    <p className="text-white/90">{transporter.specialty}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Profile Body */}
                    <div className="p-6 md:p-8 grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-2">
                            <h2 className="text-xl font-semibold font-headline">About Us</h2>
                            <p className="mt-2 text-muted-foreground">
                                {transporter.about}
                            </p>

                            <h3 className="mt-8 text-xl font-semibold font-headline">Our Services</h3>
                            <div className="mt-4 grid grid-cols-2 gap-4">
                                {transporter.services.map(cat => (
                                    <div key={cat} className="flex items-center gap-2 p-3 bg-card rounded-md border">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        <span>{cat}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-card p-6 rounded-lg border">
                            <h3 className="text-xl font-semibold font-headline">Company Details</h3>
                            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                                <li><strong>Fleet Size:</strong> {transporter.fleetSize}</li>
                                <li><strong>Primary Routes:</strong> {transporter.routes}</li>
                                <li><strong>Contact:</strong> {transporter.contactPerson}</li>
                            </ul>
                                <h3 className="mt-6 text-xl font-semibold font-headline">Community Rating</h3>
                            <div className="flex items-center gap-1 mt-2">
                                {[...Array(5)].map((_, i) => (
                                    <Star 
                                        key={i} 
                                        className={`h-5 w-5 ${i < Math.floor(transporter.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-yellow-400/50'}`} 
                                    />
                                ))}
                                <span className="ml-2 text-sm text-muted-foreground">({transporter.rating.toFixed(1)}/5)</span>
                            </div>
                             <Button className="w-full mt-6">Contact Partner</Button>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-16">
                    <Button size="lg" variant="outline">
                        <Sparkles className="mr-2 h-5 w-5" />
                        Want your company featured? Join TransConnect!
                    </Button>
                </div>
             </div>
        </div>
    );
}
