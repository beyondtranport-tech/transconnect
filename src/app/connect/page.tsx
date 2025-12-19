
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Check, Gift, Heart, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { placeholderImages } from "@/lib/placeholder-images.json";

const connectHeroImage = placeholderImages.find(p => p.id === 'tech-division');

const plans = [
    {
        icon: <Gift className="h-8 w-8 text-primary" />,
        title: "Rewards Plan",
        price: 50,
        description: "Turn every purchase into points and get tangible benefits.",
        features: [
            "Earn points on all Mall purchases",
            "Redeem points for fuel vouchers",
            "Access exclusive member-only products",
        ],
        cta: "Activate Rewards Plan"
    },
    {
        icon: <Heart className="h-8 w-8 text-primary" />,
        title: "Loyalty Plan",
        price: 50,
        description: "Unlock deep discounts from our network of trusted suppliers.",
        features: [
            "Get exclusive pricing on parts & tires",
            "Receive special offers from partners",
            "Priority access to new suppliers",
        ],
        cta: "Activate Loyalty Plan"
    },
    {
        icon: <Zap className="h-8 w-8 text-primary" />,
        title: "Actions Plan",
        price: 50,
        description: "Generate new revenue by sharing the benefits of TransConnect.",
        features: [
            "Earn commission on referrals",
            "Get paid for sharing supplier discounts",
            "Track your earnings in a dedicated dashboard",
        ],
        cta: "Activate Actions Plan"
    },
]

export default function ConnectPage() {
    return (
        <div>
            <section className="relative w-full h-80 bg-card">
                {connectHeroImage && (
                    <Image
                        src={connectHeroImage.imageUrl}
                        alt={connectHeroImage.description}
                        fill
                        className="object-cover"
                        priority
                        data-ai-hint={connectHeroImage.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-black/70" />
                <div className="relative h-full flex flex-col items-center justify-center text-center text-primary-foreground z-10 p-4">
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">Go Beyond Connecting. Start Earning.</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-3xl">Our optional plans turn your network into your most valuable asset. Activate the tools to save on costs and generate new revenue streams.</p>
                </div>
            </section>

            <section id="opportunity-hub" className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">The Opportunity Hub</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Choose one or more plans to unlock the full financial power of the TransConnect ecosystem. Each plan is a tool designed to directly impact your bottom line.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                        {plans.map((plan) => (
                            <Card key={plan.title} className="flex flex-col">
                                <CardHeader className="text-center">
                                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                                        {plan.icon}
                                    </div>
                                    <CardTitle>{plan.title}</CardTitle>
                                     <CardDescription className="flex items-baseline justify-center gap-1 pt-2">
                                        <span className="text-3xl font-extrabold tracking-tight text-foreground">R{plan.price}</span>
                                        <span className="text-muted-foreground">/month</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-center text-muted-foreground mb-6">{plan.description}</p>
                                    <ul className="space-y-3">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-start">
                                                <Check className="h-5 w-5 text-primary mr-3 shrink-0 mt-0.5" />
                                                <span className="text-muted-foreground">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" asChild>
                                        <Link href="/join">{plan.cta}</Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>
             <section className="py-16 md:py-24 bg-card">
                <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl md:text-4xl font-bold font-headline">A Direct Return On Investment</h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                    These are not just features; they are financial tools. Members who activate these plans see significant savings and earnings that far exceed the monthly cost.
                </p>
                <div className="mt-8 max-w-md mx-auto p-6 bg-background rounded-lg shadow-inner">
                    <p className="text-lg font-semibold">Example Scenario:</p>
                    <p className="text-muted-foreground mt-2">A member using the <span className="text-primary font-medium">Loyalty Plan</span> saves an average of <span className="font-bold text-foreground">R1,500 per month</span> on tires and parts alone.</p>
                </div>
                <Button asChild size="lg" className="mt-10">
                    <Link href="/join">Join and Activate Your Plans</Link>
                </Button>
                </div>
            </section>
        </div>
    );
}
