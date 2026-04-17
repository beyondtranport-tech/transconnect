
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, PlusCircle } from "lucide-react";
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
                First, add a new supplier lead to the database. Then, use our email templates to start the conversation.
            </p>
            <div className="mt-6 flex justify-center gap-4">
                <Button asChild>
                    <Link href={`/backend?view=leads-database&action=add-member&newRole=Supplier&newNotes=Category: ${encodeURIComponent(category)}`}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Supplier
                    </Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href={`/adminaccount?view=pitch-supplier-emails&type=${encodeURIComponent(category)}`}>
                        View Email Sequence <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </div>
    );
};


export default function SupplierPitch() {
    return (
        <Tabs defaultValue="Tyres" className="w-full">
            <CardHeader>
                <CardTitle>Supplier Pitch Generator</CardTitle>
                <CardDescription>Select a supplier category to add a new lead and view a tailored engagement pitch.</CardDescription>
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
