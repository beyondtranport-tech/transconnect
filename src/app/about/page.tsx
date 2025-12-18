import Image from "next/image";
import { placeholderImages } from "@/lib/placeholder-images.json";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

const aboutHeroImage = placeholderImages.find(p => p.id === 'about-hero');

const values = [
    {
        title: "Efficiency",
        description: "We build tools and systems that streamline operations and maximize profitability for our members."
    },
    {
        title: "Community",
        description: "We foster a collaborative environment where transporters can connect, trade, and grow together."
    },
    {
        title: "Innovation",
        description: "We relentlessly pursue technological advancements to solve the industry's most pressing challenges."
    },
    {
        title: "Integrity",
        description: "We operate with transparency and trust, ensuring a secure and reliable ecosystem for all members."
    }
]

export default function AboutPage() {
  return (
    <div>
        <section className="relative w-full h-64 md:h-80 bg-card">
            {aboutHeroImage && (
                <Image
                    src={aboutHeroImage.imageUrl}
                    alt={aboutHeroImage.description}
                    fill
                    className="object-cover"
                    priority
                    data-ai-hint={aboutHeroImage.imageHint}
                />
            )}
            <div className="absolute inset-0 bg-black/60" />
            <div className="relative h-full flex flex-col items-center justify-center text-center text-primary-foreground z-10 p-4">
                <h1 className="text-4xl md:text-5xl font-bold font-headline">About TransConnect</h1>
                <p className="mt-4 text-lg md:text-xl max-w-3xl">We are dedicated to revolutionizing the transport industry through connection and innovation.</p>
            </div>
        </section>

        <section className="py-16 md:py-24">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">Our Mission</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            To empower transporters by providing an integrated ecosystem that breaks down traditional barriers. We strive to offer accessible funding, a vibrant marketplace, and cutting-edge technology that enables businesses of all sizes to thrive. By fostering a connected community, we aim to make the transport industry more efficient, profitable, and sustainable for everyone.
                        </p>
                    </div>
                     <div>
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">Our Vision</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            To be the central nervous system of the transport industry. We envision a future where every transporter, from a single owner-operator to a large fleet, has the tools and resources they need to succeed at their fingertips. A future where logistics are seamless, opportunities are abundant, and the entire industry moves forward, together.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <section className="py-16 md:py-24 bg-card">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold font-headline">Our Core Values</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        The principles that guide every decision we make.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {values.map(value => (
                        <Card key={value.title} className="bg-background">
                            <CardContent className="p-6">
                                <CheckCircle className="h-8 w-8 text-primary mb-4" />
                                <h3 className="text-xl font-bold">{value.title}</h3>
                                <p className="mt-2 text-muted-foreground">{value.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    </div>
  );
}
