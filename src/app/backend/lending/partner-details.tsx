'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as React from "react";

// Define the tabs as requested
const partnerTabs = [
    { value: "dashboard", label: "Dashboard" },
    { value: "main", label: "Main" },
    { value: "address", label: "Address" },
    { value: "contact", label: "Contact" },
    { value: "global-facility", label: "Global Facility" },
    { value: "owners", label: "Owners" },
    { value: "management", label: "Management" },
    { value: "bank-accounts", label: "Bank Accounts" },
    { value: "assets", label: "Assets" },
    { value: "income", label: "Income" },
];

interface PartnerDetailsProps {
    partnerType: 'Suppliers' | 'Vendors' | 'Associates' | 'Debtors';
}

export default function PartnerDetails({ partnerType }: PartnerDetailsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{partnerType} Management</CardTitle>
                <CardDescription>
                    Manage your {partnerType.toLowerCase()} from this screen.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="dashboard" className="w-full">
                    <TabsList className="grid w-full grid-cols-10">
                        {partnerTabs.map((tab) => (
                            <TabsTrigger key={tab.value} value={tab.value}>
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {partnerTabs.map((tab) => (
                         <TabsContent key={tab.value} value={tab.value}>
                            <Card className="mt-4">
                                <CardHeader>
                                    <CardTitle>{tab.label}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Content for the {tab.label} tab will go here.
                                    </p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
    );
}
