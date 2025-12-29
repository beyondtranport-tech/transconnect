
import { divisions } from "@/lib/data";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Cpu, DollarSign, ShoppingBasket, Store } from "lucide-react";
import * as React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const iconComponents: { [key: string]: React.ElementType } = {
    DollarSign,
    ShoppingBasket,
    Store,
    Cpu,
};

export default function DivisionsPage() {
  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-4xl md:text-5xl font-bold font-headline">The TransConnect Ecosystem</h1>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground">
                Four interconnected divisions working together to power your business. Explore a division to see its dashboard.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {divisions.map((division) => {
                const IconComponent = iconComponents[division.icon];
                const href = ['marketplace', 'tech', 'funding', 'mall'].includes(division.id) ? `/${division.id}` : `/divisions#${division.id}`;
                return (
                    <Card key={division.id} className="flex flex-col shadow-lg hover:shadow-primary/20 transition-shadow">
                        <CardHeader className="flex-row items-start gap-4">
                            {IconComponent && <IconComponent className="h-10 w-10 text-primary" />}
                            <div className="flex-1">
                                <CardTitle>{division.title.split(' ')[1]}</CardTitle>
                                <CardDescription className="mt-1">{division.description}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow">
                             {/* Can be used for more details in the future */}
                        </CardContent>
                        <CardFooter>
                            <Button asChild className="w-full">
                                <Link href={href}>
                                    Explore {division.title.split(' ')[1]} <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                )
            })}
        </div>
      </div>
    </div>
  );
}
