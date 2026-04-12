
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import * as React from "react";

const transporterCategories = [
    "General Freight",
    "Refrigerated",
    "Flatbed / Heavy Haul",
    "Tanker / Bulk Liquid",
    "Last-Mile Delivery",
    "Cross-Border"
];

const PitchComponent = ({ category }: { category: string }) => {
    return (
        <div className="text-center py-10">
            <h2 className="text-2xl font-semibold">Engage with {category} Transporters</h2>
            <p className="mt-2 text-muted-foreground">
                Use our pre-written email templates to start a conversation with potential members in this category.
            </p>
            <Button asChild className="mt-6">
                <Link href={`/adminaccount?view=pitch-transporter-emails&type=${encodeURIComponent(category)}`}>
                    View Email Sequence <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
    );
};


export default function TransporterPitch() {
    return (
        <Tabs defaultValue="General Freight" className="w-full">
            <CardHeader>
                <CardTitle>Transporter Pitch Generator</CardTitle>
                <CardDescription>Select a transporter category to view a tailored engagement pitch to get them to register as a free member.</CardDescription>
            </CardHeader>
            <CardContent>
                <TabsList className="h-auto flex-wrap justify-start">
                    {transporterCategories.map(category => (
                        <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
                    ))}
                </TabsList>

                {transporterCategories.map(category => (
                    <TabsContent key={category} value={category} className="mt-6">
                        <PitchComponent category={category} />
                    </TabsContent>
                ))}
            </CardContent>
        </Tabs>
    );
}

    