
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, Landmark, Calendar, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

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
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Total Facility
                                    </CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">R1,250,000.00</div>
                                    <p className="text-xs text-muted-foreground">
                                        Total credit granted across all agreements.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Outstanding Balance
                                    </CardTitle>
                                    <Landmark className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">R780,123.45</div>
                                    <p className="text-xs text-muted-foreground">
                                        Current principal + interest owed.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Next Payment Due</CardTitle>
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">R35,000.00</div>
                                    <p className="text-xs text-muted-foreground">
                                        on 1 August 2024
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Arrears</CardTitle>
                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-destructive">R12,500.00</div>
                                    <p className="text-xs text-muted-foreground">
                                        12 days overdue
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="mt-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Activity</CardTitle>
                                    <CardDescription>A log of the most recent transactions and events for this client.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">Recent activity will be displayed here.</p>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                    <TabsContent value="main">
                        <Card className="mt-4">
                            <CardHeader><CardTitle>Main Details</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-4 max-w-2xl">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="client-code">Client Code</Label>
                                            <Input id="client-code" placeholder="Client Code" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="client-name">Name</Label>
                                            <Input id="client-name" placeholder="Client Name" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="client-status">Status</Label>
                                            <Select>
                                                <SelectTrigger id="client-status"><SelectValue placeholder="Select Status" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="inactive">Inactive</SelectItem>
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="client-type">Type</Label>
                                            <Select>
                                                <SelectTrigger id="client-type"><SelectValue placeholder="Select Type" /></SelectTrigger>
                                                <SelectContent>
                                                     <SelectItem value="individual">Individual</SelectItem>
                                                    <SelectItem value="company">Company</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="client-category">Category</Label>
                                            <Select>
                                                <SelectTrigger id="client-category"><SelectValue placeholder="Select Category" /></SelectTrigger>
                                                <SelectContent>
                                                     <SelectItem value="transport">Transport</SelectItem>
                                                    <SelectItem value="logistics">Logistics</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="client-language">Language</Label>
                                            <Select>
                                                <SelectTrigger id="client-language"><SelectValue placeholder="Select Language" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="en">English</SelectItem>
                                                    <SelectItem value="af">Afrikaans</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="reg-id">Reg. ID</Label>
                                            <Input id="reg-id" placeholder="Registration ID" />
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 pt-2">
                                        <Checkbox id="vat-registered" />
                                        <label
                                            htmlFor="vat-registered"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Vat registered?
                                        </label>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="address">
                        <Card className="mt-4">
                            <CardHeader><CardTitle>Address Details</CardTitle></CardHeader>
                            <CardContent className="space-y-8">
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Physical Address</h3>
                                    <div className="space-y-4 max-w-2xl">
                                        <div className="space-y-2">
                                            <Label htmlFor="physical-street">Street Address</Label>
                                            <Input id="physical-street" placeholder="e.g., 123 Industrial Rd" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="physical-suburb">Suburb</Label>
                                                <Input id="physical-suburb" placeholder="e.g., Pomona" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="physical-city">City</Label>
                                                <Input id="physical-city" placeholder="e.g., Kempton Park" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="physical-postal">Postal Code</Label>
                                                <Input id="physical-postal" placeholder="e.g., 1619" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Postal Address</h3>
                                    <div className="space-y-4 max-w-2xl">
                                        <div className="space-y-2">
                                            <Label htmlFor="postal-street">Street Address or P.O. Box</Label>
                                            <Input id="postal-street" placeholder="e.g., P.O. Box 12345" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="postal-suburb">Suburb</Label>
                                                <Input id="postal-suburb" placeholder="e.g., Pomona" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="postal-city">City</Label>
                                                <Input id="postal-city" placeholder="e.g., Kempton Park" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="postal-postal">Postal Code</Label>
                                                <Input id="postal-postal" placeholder="e.g., 1619" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
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
    