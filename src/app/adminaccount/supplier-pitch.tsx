'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import * as React from "react";

const supplierCategories = [
    "Accessories", "Anti-Theft Devices", "Auto Electrical", "Batteries", "Brakes", "Cleaning Products",
    "Dealer", "Diesel", "Filters", "Injectors", "Turbo", "Lights", "Mechanical Repairs",
    "Oils & Lubricants", "Parts", "Transport", "Tarpaulins", "Tow In", "Trailer Repairs",
    "Truck Parts", "Truck Repairs", "Tyres"
];

const PitchComponent = ({ category }: { category: string }) => {
    return (
        <div className="text-center py-10">
            <h2 className="text-2xl font-semibold">Engage with {category} Suppliers</h2>
            <p className="mt-2 text-muted-foreground">
                Use our pre-written email templates to start a conversation with potential suppliers in this category.
            </p>
            <Button asChild className="mt-6">
                <Link href={`/adminaccount?view=supplier-emails&type=${encodeURIComponent(category)}`}>
                    View Email Sequence <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
    );
};


export default function SupplierPitch() {
    return (
        <Tabs defaultValue="Tyres" className="w-full">
            <CardHeader>
                <CardTitle>Supplier Pitch Generator</CardTitle>
                <CardDescription>Select a supplier category to view a tailored engagement pitch.</CardDescription>
            </CardHeader>
            <CardContent>
                <TabsList className="h-auto flex-wrap justify-start">
                    {supplierCategories.map(category => (
                        <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
                    ))}
                </TabsList>

                {supplierCategories.map(category => (
                    <TabsContent key={category} value={category} className="mt-6">
                        <PitchComponent category={category} />
                    </TabsContent>
                ))}
            </CardContent>
        </Tabs>
    );
}
