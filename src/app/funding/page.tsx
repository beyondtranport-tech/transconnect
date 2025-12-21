
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { placeholderImages } from "@/lib/placeholder-images.json";

const fundingHeroImage = placeholderImages.find(p => p.id === 'funding-division');
const fundingTypeImage = placeholderImages.find(p => p.id === 'tech-division');

const methodology = [
    {
        title: "Asset Finance",
        description: "Secure financing for new trucks, trailers, or equipment. We offer competitive rates and flexible terms tailored to the transport industry.",
        cta: "Apply for Asset Finance",
        link: "/join",
    },
    {
        title: "Working Capital",
        description: "Access short-term loans to manage cash flow, cover operational expenses, or seize immediate opportunities without disrupting your capital.",
        cta: "Apply for Working Capital",
        link: "/join",
    },
    {
        title: "Partnership",
        description: "We invest directly in your business, becoming a partner in your growth. This model is for established businesses looking for strategic capital.",
        cta: "Explore Partnership",
        link: "/join",
    }
]

export default function FundingPage() {
    return (
        <div>
            <section className="relative w-full h-80 bg-card">
                {fundingHeroImage && (
                    <Image
                        src={fundingHeroImage.imageUrl}
                        alt={fundingHeroImage.description}
                        fill
                        className="object-cover"
                        priority
                        data-ai-hint={fundingHeroImage.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative h-full flex flex-col items-center justify-center text-center text-primary-foreground z-10 p-4">
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">Start Your Finance Application</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-3xl">Select the type of funding that best suits your needs to begin. Our single application process connects you to a network of ideal lenders.</p>
                </div>
            </section>
            
            <section id="start-journey" className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4">
                     <div className="text-center max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">What Do You Need to Fund?</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Choose the statement that best describes your current need to begin a tailored application process.
                        </p>
                    </div>
                    
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                       {methodology.map((item) => (
                           <Card key={item.title} className="flex flex-col">
                                {fundingTypeImage && (
                                    <div className="relative h-48">
                                         <Image
                                            src={fundingTypeImage.imageUrl}
                                            alt={item.title}
                                            fill
                                            className="object-cover rounded-t-lg"
                                            data-ai-hint={fundingTypeImage.imageHint}
                                        />
                                    </div>
                                )}
                                <CardHeader>
                                    <CardTitle>{item.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-muted-foreground">{item.description}</p>
                                </CardContent>
                                <CardFooter>
                                    <Button asChild className="w-full">
                                        <Link href={item.link}>
                                            {item.cta} <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                           </Card>
                       ))}
                    </div>
                </div>
            </section>
        </div>
    )
}
