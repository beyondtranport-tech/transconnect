
import Image from "next/image";
import { placeholderImages } from "@/lib/placeholder-images.json";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowRight, ShoppingCart, Truck, Handshake, Briefcase, Bot, Code, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

const aboutHeroImage = placeholderImages.find(p => p.id === 'about-hero');
const valuesImage = placeholderImages.find(p => p.id === 'tech-division');

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

const roles = [
    {
        icon: ShoppingCart,
        title: "Vendors",
        description: "Sell parts, equipment, and services directly to a targeted market of transport professionals.",
        cta: "Become a Vendor",
        href: "/join?role=vendor",
    },
    {
        icon: Truck,
        title: "Buyers",
        description: "Find vehicles, source parts, and secure transport services from a trusted community network.",
        cta: "Become a Buyer",
        href: "/join?role=buyer",
    },
    {
        icon: Handshake,
        title: "Partners",
        description: "Collaborate with us as a strategic partner to enable growth and provide value-added services.",
        cta: "Become a Partner",
        href: "/join?role=partner",
    },
    {
        icon: Briefcase,
        title: "Associates",
        description: "Join as a professional offering specialized services like accounting, legal, or consulting.",
        cta: "Become an Associate",
        href: "/join?role=associate",
    },
    {
        icon: Bot,
        title: "ISA Agents",
        description: "Leverage our platform to connect buyers and sellers and earn commissions as an Independent Sales Agent.",
        cta: "Become an ISA Agent",
        href: "/join?role=isa-agent",
    },
    {
        icon: Users,
        title: "Drivers",
        description: "Find job opportunities, access resources, and connect with other professional drivers.",
        cta: "Become a Driver",
        href: "/join?role=driver",
    },
    {
        icon: Code,
        title: "Developers",
        description: "Integrate with our APIs and build innovative applications on top of the TransConnect platform.",
        cta: "Become a Developer",
        href: "/join?role=developer",
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
        
        <section className="py-16 md:py-24 bg-background">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold font-headline">Who is TransConnect For?</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Our ecosystem is designed for every participant in the transport industry. Find your place and start connecting.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {roles.map((role) => {
                        const Icon = role.icon;
                        return (
                            <Card key={role.title} className="flex flex-col text-center items-center p-6">
                                <div className="bg-primary/10 p-4 rounded-full mb-4">
                                    <Icon className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold">{role.title}</h3>
                                <p className="text-muted-foreground mt-2 flex-grow">{role.description}</p>
                                <Button asChild className="mt-6 w-full" variant="outline">
                                    <Link href={role.href}>
                                        {role.cta}
                                    </Link>
                                </Button>
                            </Card>
                        )
                    })}
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
                 <div className="space-y-16">
                    {values.map((value, index) => (
                         <div key={value.title} className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                            <div className={`relative aspect-video rounded-lg overflow-hidden shadow-lg ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                                 {valuesImage && (
                                    <Image
                                        src={valuesImage.imageUrl}
                                        alt={value.title}
                                        fill
                                        className="object-cover"
                                        data-ai-hint={valuesImage.imageHint}
                                    />
                                 )}
                            </div>
                            <div className={index % 2 === 1 ? 'md:order-1' : ''}>
                                <div className="flex items-center gap-4">
                                     <CheckCircle className="h-10 w-10 text-primary" />
                                    <h3 className="text-3xl font-bold font-headline">{value.title}</h3>
                                </div>
                                <p className="mt-4 text-lg text-muted-foreground">
                                    {value.description}
                                </p>
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
        </section>
    </div>
  );
}
