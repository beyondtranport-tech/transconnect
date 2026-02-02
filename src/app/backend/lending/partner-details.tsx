
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as React from "react";
import { useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useForm, FormProvider } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';

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
    const formMethods = useForm();
    const { watch, setValue } = formMethods;

    const usePhysicalForPostal = watch('usePhysicalForPostal');
    const physicalStreet = watch('physicalStreet');
    const physicalSuburb = watch('physicalSuburb');
    const physicalCity = watch('physicalCity');
    const physicalPostCode = watch('physicalPostCode');

    useEffect(() => {
        if (usePhysicalForPostal) {
            setValue('postalStreet', physicalStreet || '');
            setValue('postalSuburb', physicalSuburb || '');
            setValue('postalCity', physicalCity || '');
            setValue('postalPostCode', physicalPostCode || '');
        }
    }, [usePhysicalForPostal, physicalStreet, physicalSuburb, physicalCity, physicalPostCode, setValue]);

    return (
        <FormProvider {...formMethods}>
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

                        <TabsContent value="address">
                             <Card className="mt-4">
                                <CardHeader><CardTitle>Address Details</CardTitle></CardHeader>
                                <CardContent className="space-y-8">
                                    <Form {...formMethods}>
                                        <form>
                                            <div>
                                                <h3 className="text-lg font-semibold mb-4">Physical Address</h3>
                                                <div className="space-y-4 max-w-2xl">
                                                    <FormField control={formMethods.control} name="physicalStreet" render={({ field }) => (<FormItem><FormLabel>Street Address</FormLabel><FormControl><Input placeholder="e.g., 123 Industrial Rd" {...field} /></FormControl></FormItem>)} />
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <FormField control={formMethods.control} name="physicalSuburb" render={({ field }) => (<FormItem><FormLabel>Suburb</FormLabel><FormControl><Input placeholder="e.g., Pomona" {...field} /></FormControl></FormItem>)} />
                                                        <FormField control={formMethods.control} name="physicalCity" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="e.g., Kempton Park" {...field} /></FormControl></FormItem>)} />
                                                        <FormField control={formMethods.control} name="physicalPostCode" render={({ field }) => (<FormItem><FormLabel>Post Code</FormLabel><FormControl><Input placeholder="e.g., 1619" {...field} /></FormControl></FormItem>)} />
                                                    </div>
                                                </div>
                                            </div>
                                            <Separator className="my-8" />
                                            <div>
                                                <div className="flex items-center space-x-2 mb-4">
                                                    <FormField
                                                        control={formMethods.control}
                                                        name="usePhysicalForPostal"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value}
                                                                        onCheckedChange={field.onChange}
                                                                    />
                                                                </FormControl>
                                                                <FormLabel>
                                                                    Postal address is the same as physical address
                                                                </FormLabel>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <h3 className="text-lg font-semibold mb-4">Postal Address</h3>
                                                <div className="space-y-4 max-w-2xl">
                                                     <FormField control={formMethods.control} name="postalStreet" render={({ field }) => (<FormItem><FormLabel>Street Address or P.O. Box</FormLabel><FormControl><Input placeholder="e.g., P.O. Box 12345" {...field} /></FormControl></FormItem>)} />
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <FormField control={formMethods.control} name="postalSuburb" render={({ field }) => (<FormItem><FormLabel>Suburb</FormLabel><FormControl><Input placeholder="e.g., Pomona" {...field} /></FormControl></FormItem>)} />
                                                        <FormField control={formMethods.control} name="postalCity" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="e.g., Kempton Park" {...field} /></FormControl></FormItem>)} />
                                                        <FormField control={formMethods.control} name="postalPostCode" render={({ field }) => (<FormItem><FormLabel>Post Code</FormLabel><FormControl><Input placeholder="e.g., 1619" {...field} /></FormControl></FormItem>)} />
                                                    </div>
                                                </div>
                                            </div>
                                        </form>
                                    </Form>
                                </CardContent>
                            </Card>
                        </TabsContent>


                        {partnerTabs.filter(t => t.value !== 'main' && t.value !== 'dashboard' && t.value !== 'address').map((tab) => (
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
        </FormProvider>
    );
}
