'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


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
                    
                    <TabsContent value="dashboard">
                        <Card className="mt-4">
                            <CardHeader><CardTitle>Dashboard</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Dashboard content for {partnerType.toLowerCase()} will go here.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="main">
                        <Card className="mt-4">
                            <CardHeader><CardTitle>Main Details</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-4 max-w-2xl">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="partner-code">Code</Label>
                                            <Input id="partner-code" placeholder="Partner Code" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="partner-name">Name</Label>
                                            <Input id="partner-name" placeholder="Partner Name" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="partner-facility">Facility #</Label>
                                            <Input id="partner-facility" placeholder="Facility Number" />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="partner-language">Language</Label>
                                            <Select>
                                                <SelectTrigger id="partner-language"><SelectValue placeholder="Select Language" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="en">English</SelectItem>
                                                    <SelectItem value="af">Afrikaans</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="partner-reg">Co Reg. #</Label>
                                            <Input id="partner-reg" placeholder="Company Registration Number" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {partnerTabs.filter(t => t.value !== 'main' && t.value !== 'dashboard').map((tab) => (
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