
import Image from "next/image";
import data from "@/lib/placeholder-images.json";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { CheckCircle, ArrowRight, DollarSign, Handshake, Cpu, Shield, Lock, DatabaseZap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";
import { roles } from "@/lib/roles";

const { placeholderImages } = data;

const aboutHeroImage = placeholderImages.find(p => p.id === 'about-hero');

const values = [
    {
        title: "Cash Flow",
        description: "We break the constraint of locked capital by connecting you with a network of funders who understand the transport industry, turning your assets and contracts into accessible cash.",
        image: placeholderImages.find(p => p.id === 'funding-division'),
        icon: DollarSign,
    },
    {
        title: "Opportunity Flow",
        description: "We break the constraint of isolation by connecting you to a network. Earn passive income by referring members, find new loads with our AI matcher, and discover subcontracting opportunities.",
        image: placeholderImages.find(p => p.id === 'incentives-hero'),
        icon: Handshake,
    },
    {
        title: "Information Flow",
        description: "We break the constraint of inefficiency. Our tech tools streamline your operations, providing data and insights to reduce empty miles and optimize your routes for maximum profitability.",
        image: placeholderImages.find(p => p.id === 'tech-division'),
        icon: Cpu,
    },
    {
        title: "Savings Flow",
        description: "We break the constraint of high costs. By uniting our members, we create collective buying power to negotiate significant discounts on parts, tires, and services you use every day.",
        image: placeholderImages.find(p => p.id === 'mall-division'),
        icon: Shield,
    }
];

const partners = [
  { 
    name: 'SA Auction Online', 
    description: 'Powering our auction mall with a vast inventory of vehicles and assets.', 
    logo: 'https://placehold.co/200x60/14532d/ffffff?text=SA+Auction+Online' 
  },
  { 
    name: 'SATL', 
    description: 'Connecting our members to a national network of freight forwarders and shippers.', 
    logo: 'https://placehold.co/200x60/14532d/ffffff?text=SATL' 
  },
  { 
    name: 'Ludic Financial Services', 
    description: 'Providing specialist insurance solutions for the transport sector.', 
    logo: 'https://placehold.co/200x60/14532d/ffffff?text=Ludic' 
  },
  { 
    name: 'CTS Trailers', 
    description: 'A national trailer manufacturer offering quality assets to our members.', 
    logo: 'https://placehold.co/200x60/14532d/ffffff?text=CTS+Trailers' 
  }
];

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
                <h1 className="text-4xl md:text-5xl font-bold font-headline">About Logistics Flow</h1>
                <p className="mt-4 text-lg md:text-xl max-w-3xl">We are dedicated to revolutionizing the transport industry through connection and innovation.</p>
            </div>
        </section>

        <section className="py-16 md:py-24 bg-background">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold font-headline">Breaking Constraints, Creating Flow</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Your business should flow. But the transport industry is full of constraints that block your progress—from accessing capital to finding work and managing high costs. We identify these blockages and build powerful solutions to restore the natural flow of capital, opportunity, and information, helping your business move forward.
                    </p>
                </div>
            </div>
        </section>
        
        <section className="py-16 md:py-24 bg-card">
            <div className="container mx-auto px-4">
                 <div className="space-y-16">
                    {values.map((value, index) => {
                        const Icon = value.icon;
                        return (
                             <div key={value.title} className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                                <div className={`relative aspect-video rounded-lg overflow-hidden shadow-lg ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                                     {value.image && (
                                        <Image
                                            src={value.image.imageUrl}
                                            alt={value.title}
                                            fill
                                            className="object-cover"
                                            data-ai-hint={value.image.imageHint}
                                        />
                                     )}
                                </div>
                                <div className={index % 2 === 1 ? 'md:order-1' : ''}>
                                    <div className="flex items-center gap-4">
                                         <Icon className="h-10 w-10 text-primary" />
                                        <h3 className="text-3xl font-bold font-headline">{value.title}</h3>
                                    </div>
                                    <p className="mt-4 text-lg text-muted-foreground">
                                        {value.description}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                 </div>
            </div>
        </section>

        <section className="py-16 md:py-24 bg-background">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold font-headline">Who is Logistics Flow for?</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Our ecosystem is designed for every participant in the transport industry. Find your place and start connecting.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {roles.map((role) => {
                        const Icon = role.icon;
                        return (
                             <Link href={`/roles/${role.id}`} key={role.title} className="block group">
                                <Card className="flex flex-col text-center items-center p-6 h-full transition-all group-hover:border-primary group-hover:shadow-lg">
                                    <div className="bg-primary/10 p-4 rounded-full mb-4">
                                        <Icon className="h-8 w-8 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold">{role.title}</h3>
                                    <p className="text-muted-foreground mt-2 flex-grow">{role.description}</p>
                                     <div className="mt-6 font-semibold text-primary flex items-center gap-2">
                                        Learn More <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </Card>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </section>

        <section className="py-16 md:py-24 bg-card">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold font-headline">Our Valued Partners</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Collaboration is at the heart of our ecosystem. We're proud to work with industry leaders who share our vision.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {partners.map((partner) => (
                         <Card key={partner.name} className="flex flex-col items-center justify-center p-6 text-center">
                            <Image src={partner.logo} alt={`${partner.name} logo`} width={150} height={50} className="object-contain mb-4" />
                            <p className="text-muted-foreground text-sm flex-grow">{partner.description}</p>
                        </Card>
                    ))}
                </div>
                 <div className="text-center mt-12">
                    <Button asChild>
                        <Link href="/for-financiers">
                            Become a Partner <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>

        <section className="py-16 md:py-24 bg-background">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold font-headline">Your Security &amp; Data Protection: Our Priority</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        We understand that your business data is sensitive. We are committed to protecting your privacy and securing your information with robust, industry-standard practices.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    <Card>
                        <CardContent className="p-6 text-center">
                            <Lock className="h-10 w-10 text-primary mx-auto mb-4" />
                            <h3 className="text-xl font-semibold">Data Privacy</h3>
                            <p className="mt-2 text-muted-foreground">Your personal and company data is never shared or sold. It is only used to power the services you choose to use within the platform.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 text-center">
                            <DatabaseZap className="h-10 w-10 text-primary mx-auto mb-4" />
                            <h3 className="text-xl font-semibold">Anonymous Contributions</h3>
                            <p className="mt-2 text-muted-foreground">Data you contribute to the community, like fleet details, is always anonymized and aggregated. It is only used to negotiate group discounts and will never be linked back to you.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 text-center">
                            <ShieldCheck className="h-10 w-10 text-primary mx-auto mb-4" />
                            <h3 className="text-xl font-semibold">Secure Platform</h3>
                            <p className="mt-2 text-muted-foreground">Our platform is built on secure, modern infrastructure to protect against unauthorized access and ensure your data remains safe.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

    </div>
  );
}
