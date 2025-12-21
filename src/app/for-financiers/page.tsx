
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Filter, Handshake, Target } from "lucide-react";
import Image from "next/image";
import { placeholderImages } from "@/lib/placeholder-images.json";
import Link from "next/link";

const financierHeroImage = placeholderImages.find(p => p.id === 'funding-division');

const benefits = [
    {
        icon: <Target className="h-8 w-8 text-primary" />,
        title: "High-Quality Leads",
        description: "Receive applications from transport businesses that have been pre-screened and matched to your specific lending criteria. Spend less time searching and more time funding."
    },
    {
        icon: <Filter className="h-8 w-8 text-primary" />,
        title: "Reduce Acquisition Costs",
        description: "Our platform acts as your origination channel, significantly lowering the cost and effort required to find qualified, relevant borrowers in the transport sector."
    },
    {
        icon: <Handshake className="h-8 w-8 text-primary" />,
        title: "Streamlined Deal Flow",
        description: "Access a consistent flow of deals complete with the initial data you need to make an informed decision, all through a single, efficient platform."
    }
]

export default function ForFinanciersPage() {
    return (
        <div>
            <section className="relative w-full h-80 bg-card">
                {financierHeroImage && (
                    <Image
                        src={financierHeroImage.imageUrl}
                        alt="Partner with TransConnect"
                        fill
                        className="object-cover"
                        priority
                        data-ai-hint={financierHeroImage.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative h-full flex flex-col items-center justify-center text-center text-primary-foreground z-10 p-4">
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">Partner with TransConnect</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-3xl">Access a targeted stream of qualified finance opportunities from the heart of the transport industry.</p>
                </div>
            </section>

            <section className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">A Smarter Way to Lend</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Stop sifting through unqualified leads. We bring the right borrowers directly to you. By understanding the unique needs of the transport sector, we connect you with businesses that fit your profile.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {benefits.map(benefit => (
                            <Card key={benefit.title} className="text-center">
                                <CardHeader>
                                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                                        {benefit.icon}
                                    </div>
                                    <CardTitle>{benefit.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">{benefit.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            <section id="start-onboarding" className="py-16 md:py-24 bg-card">
                 <div className="container mx-auto px-4 text-center">
                     <div className="max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">Join Our Network in Two Steps</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                           Start by profiling your lending model so we can begin sending the right opportunities your way.
                        </p>

                        <Card className="mt-12 text-left">
                            <CardHeader>
                                <CardTitle>1. Profile Your Business Model</CardTitle>
                                <CardDescription>
                                    This is a placeholder for the financier profiling form. Here, you would define your lending parameters, including products, focus areas, operational regions, and more. This data will power our matching matrix.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="p-8 border-2 border-dashed rounded-lg text-center bg-background">
                                    <p className="text-muted-foreground">Financier Onboarding Form will be here.</p>
                                </div>
                            </CardContent>
                        </Card>
                         <Card className="mt-8 text-left">
                            <CardHeader>
                                <CardTitle>2. Start Receiving Matched Applications</CardTitle>
                                <CardDescription>
                                    Once your profile is active, our platform will automatically notify you of new applications that fit your criteria.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Button size="lg" className="mt-12" asChild>
                            <Link href="#start-onboarding">
                                Start Onboarding <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                     </div>
                 </div>
            </section>
        </div>
    )
}
