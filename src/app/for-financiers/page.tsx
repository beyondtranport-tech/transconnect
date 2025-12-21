
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Filter, Handshake, Target, Loader2, Link as LinkIcon } from "lucide-react";
import Image from "next/image";
import { placeholderImages } from "@/lib/placeholder-images.json";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";


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

const companyDetailsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactEmail: z.string().email("Invalid email address"),
});

type CompanyDetailsFormValues = z.infer<typeof companyDetailsSchema>;


function CompanyDetailsForm({ onNext }: { onNext: () => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<CompanyDetailsFormValues>({
        resolver: zodResolver(companyDetailsSchema),
        defaultValues: {
            companyName: "",
            contactEmail: "",
        },
    });

    const onSubmit = async (values: CompanyDetailsFormValues) => {
        setIsLoading(true);
        console.log("Company Details Submitted:", values);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast({
            title: "Step 1 Complete!",
            description: "Company details saved.",
        });

        setIsLoading(false);
        onNext();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Company Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., ABC Finance (Pty) Ltd" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="contactEmail"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contact Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., partnerships@abcfinance.co.za" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <div className="flex justify-end pt-6">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save & Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </form>
        </Form>
    );
}

export default function ForFinanciersPage() {
    const [activeTab, setActiveTab] = useState("company-details");

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
                     <Button asChild size="lg" className="mt-8">
                        <Link href="#start-onboarding">
                           Start Onboarding
                        </Link>
                    </Button>
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

            <section id="start-onboarding" className="py-16 md:py-24 bg-card scroll-mt-20">
                 <div className="container mx-auto px-4">
                     <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline text-center">Join Our Network</h2>
                        <p className="mt-4 text-lg text-muted-foreground text-center">
                           Complete the following steps to build your financier profile and start receiving matched applications.
                        </p>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-12">
                            <TabsList className="grid w-full grid-cols-5">
                                <TabsTrigger value="company-details">1. Company</TabsTrigger>
                                <TabsTrigger value="lending-criteria" disabled>2. Criteria</TabsTrigger>
                                <TabsTrigger value="products" disabled>3. Products</TabsTrigger>
                                <TabsTrigger value="documents" disabled>4. Documents</TabsTrigger>
                                <TabsTrigger value="review" disabled>5. Review</TabsTrigger>
                            </TabsList>
                            <TabsContent value="company-details">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Company Information</CardTitle>
                                        <CardDescription>
                                            Let's start with the basics. Provide your company's details so we know who you are.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <CompanyDetailsForm onNext={() => setActiveTab("lending-criteria")} />
                                    </CardContent>
                                </Card>
                            </TabsContent>
                             <TabsContent value="lending-criteria">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Lending Criteria</CardTitle>
                                        <CardDescription>
                                           Define your ideal customer profile and lending parameters.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                         <p className="text-muted-foreground">Lending criteria form will be here.</p>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                             <TabsContent value="products">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Finance Products</CardTitle>
                                        <CardDescription>
                                           Detail the specific finance products you offer (e.g., Asset Finance, Working Capital).
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                         <p className="text-muted-foreground">Products form will be here.</p>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                             <TabsContent value="documents">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Required Documents</CardTitle>
                                        <CardDescription>
                                           List the standard documents you require for an application.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                         <p className="text-muted-foreground">Document checklist form will be here.</p>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="review">
                                 <Card>
                                    <CardHeader>
                                        <CardTitle>Review & Submit</CardTitle>
                                        <CardDescription>
                                           Review your completed profile and submit it to join our network.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                         <p className="text-muted-foreground">Profile review will be here.</p>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                     </div>
                 </div>
            </section>
        </div>
    )
}
