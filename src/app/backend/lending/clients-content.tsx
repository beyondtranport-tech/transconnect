'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const clientTabs = [
    { value: "dashboard", label: "Dashboard" },
    { value: "main", label: "Main" },
    { value: "address", label: "Address" },
    { value: "contact", label: "Contact" },
    { value: "owners", label: "Owners" },
    { value: "management", label: "Management" },
    { value: "bank-accounts", label: "Bank Accounts" },
    { value: "assets", label: "Assets" },
    { value: "income", label: "Income" },
];

export default function ClientsContent() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users /> Clients Management
                </CardTitle>
                <CardDescription>
                    Manage your lending clients (debtors).
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="dashboard" className="w-full">
                    <TabsList className="grid w-full grid-cols-9">
                        {clientTabs.map((tab) => (
                             <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                        ))}
                    </TabsList>
                    <TabsContent value="dashboard">
                        <Card className="mt-4">
                            <CardHeader><CardTitle>Dashboard</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Dashboard content will go here.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="main">
                        <Card className="mt-4">
                            <CardHeader><CardTitle>Main Details</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Main client fields will go here.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="address">
                        <Card className="mt-4">
                            <CardHeader><CardTitle>Address Details</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Address fields will go here.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="contact">
                        <Card className="mt-4">
                            <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Contact fields will go here.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="owners">
                        <Card className="mt-4">
                            <CardHeader><CardTitle>Owners / Directors</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Owner fields will go here.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="management">
                        <Card className="mt-4">
                            <CardHeader><CardTitle>Management Team</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Management fields will go here.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                     <TabsContent value="bank-accounts">
                        <Card className="mt-4">
                            <CardHeader><CardTitle>Bank Accounts</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Bank account fields will go here.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                     <TabsContent value="assets">
                        <Card className="mt-4">
                            <CardHeader><CardTitle>Assets</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Asset fields will go here.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                     <TabsContent value="income">
                        <Card className="mt-4">
                            <CardHeader><CardTitle>Income Statement</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Income statement fields will go here.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}