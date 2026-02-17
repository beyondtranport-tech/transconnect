'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, PlusCircle, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import * as React from "react";
import { useEffect, useMemo } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { provinces } from "@/lib/geodata";


const clientTabs = [
    { value: "dashboard", label: "Dashboard" },
    { value: "main", label: "Main" },
    { value: "address", label: "Address" },
    { value: "contact", label: "Contact" },
    { value: "owners", label: "Owners" },
    { value: "management", label: "Management" },
    { value: "bank-accounts", label: "Bank Accounts" },
    { value: "balance-sheet", label: "Balance Sheet" },
    { value: "income-statement", label: "Income Statement" },
    { value: "sub-facilities", label: "Sub-Facilities" },
];

export default function PartnerDetails({ partnerType }: { partnerType: 'Suppliers' | 'Vendors' | 'Associates' | 'Debtors' }) {

    const defaultValues = useMemo(() => ({
        usePhysicalForPostal: false,
        physicalStreet: '',
        physicalSuburb: '',
        physicalCity: '',
        physicalPostCode: '',
        postalStreet: '',
        postalSuburb: '',
        postalCity: '',
        postalPostCode: '',
        telW: '',
        telH: '',
        fax: '',
        cell: '',
        email: '',
        url: '',
        primaryContact: '',
        owners: [{ name: '', address: '', suburb: '', city: '', province: '', postCode: '', idNo: '', cell: '', position: '', qualification: '', since: '', held: 0 }],
        management: [{ name: '', address: '', suburb: '', city: '', province: '', postCode: '', idNo: '', cell: '', position: '', qualification: '', since: '', held: 0, title: '', description: '' }],
        bankAccounts: [{ bank: '', branchCode: '', accountNo: '', branchName: '', bankCode: '', address: '', postCode: '', phone: '', email: '', contact: '' }],
        balanceSheets: [{ statementDate: '', propertyPlantEquipment: 0, intangibleAssets: 0, financialAssets: 0, inventories: 0, tradeReceivables: 0, cashEquivalents: 0, shareCapital: 0, retainedEarnings: 0, longTermBorrowings: 0, leaseLiabilities: 0, tradePayables: 0, shortTermBorrowings: 0, currentTaxPayable: 0 }],
        incomeStatements: [{ statementDate: '', revenue: 0, costOfSales: 0, grossProfit: 0, otherIncome: 0, operatingExpenses: 0, operatingProfit: 0, financeCosts: 0, profitBeforeTax: 0, incomeTaxExpense: 0, profitForThePeriod: 0 }],
    }), []);

    const formMethods = useForm({
        defaultValues
    });

    const { control, watch, setValue } = formMethods;

    const { fields: ownerFields, append: appendOwner, remove: removeOwner } = useFieldArray({
        control,
        name: "owners"
    });

    const { fields: managementFields, append: appendManagement, remove: removeManagement } = useFieldArray({
        control,
        name: "management"
    });
    
    const { fields: bankAccountFields, append: appendBankAccount, remove: removeBankAccount } = useFieldArray({
        control,
        name: "bankAccounts"
    });

    const { fields: balanceSheetFields, append: appendBalanceSheet, remove: removeBalanceSheet } = useFieldArray({
        control,
        name: "balanceSheets"
    });

    const { fields: incomeStatementFields, append: appendIncomeStatement, remove: removeIncomeStatement } = useFieldArray({
        control,
        name: "incomeStatements"
    });
    
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
            <form>
                <Card>
                    <CardHeader>
                        <CardTitle>{partnerType} Management</CardTitle>
                        <CardDescription>
                            Manage your {partnerType.toLowerCase()} from this screen.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="dashboard" className="w-full">
                            <TabsList className="flex flex-wrap h-auto">
                                {clientTabs.map((tab) => (
                                    <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                                ))}
                            </TabsList>
                            <TabsContent value="dashboard">
                                {/* Dashboard content remains as is */}
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
                                            <Separator className="my-6" />
                                            <div>
                                                <h3 className="text-lg font-semibold">Financial Limits</h3>
                                                <div className="space-y-2 mt-4 max-w-sm">
                                                    <Label htmlFor="global-facility-limit">Global Facility Limit</Label>
                                                    <Input id="global-facility-limit" type="number" placeholder="e.g., 1000000" />
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2 pt-4">
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
                                        <div className="space-y-4 max-w-2xl">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="tel-w">Tel (w)</Label>
                                                    <Input id="tel-w" placeholder="Work Telephone" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="tel-h">Tel (h)</Label>
                                                    <Input id="tel-h" placeholder="Home Telephone" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="fax">Fax</Label>
                                                    <Input id="fax" placeholder="Fax Number" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="cell">Cell</Label>
                                                    <Input id="cell" placeholder="Mobile Number" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="email">Email</Label>
                                                    <Input id="email" type="email" placeholder="client@example.com" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="url">URL</Label>
                                                    <Input id="url" type="url" placeholder="https://example.com" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="contact-person">Contact Person</Label>
                                                <Input id="contact-person" placeholder="Primary Contact Name" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="owners">
                                <Card className="mt-4">
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle>Owners / Directors</CardTitle>
                                        <Button type="button" variant="outline" size="sm" onClick={() => appendOwner({ name: '', address: '', suburb: '', city: '', province: '', postCode: '', idNo: '', cell: '', position: '', qualification: '', since: '', held: 0 })}>
                                            <PlusCircle className="mr-2 h-4 w-4" /> Add Owner
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {ownerFields.map((field, index) => (
                                            <div key={field.id} className="p-4 border rounded-lg relative space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <h3 className="font-semibold text-lg">Owner #{index + 1}</h3>
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeOwner(index)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <FormField control={control} name={`owners.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                                    <FormField control={control} name={`owners.${index}.idNo`} render={({ field }) => (<FormItem><FormLabel>ID No</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                                </div>
                                                <FormField control={control} name={`owners.${index}.address`} render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <FormField control={control} name={`owners.${index}.suburb`} render={({ field }) => (<FormItem><FormLabel>Suburb</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                                    <FormField control={control} name={`owners.${index}.city`} render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                                    <FormField control={control} name={`owners.${index}.postCode`} render={({ field }) => (<FormItem><FormLabel>Post Code</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <FormField control={control} name={`owners.${index}.province`} render={({ field }) => (<FormItem><FormLabel>Province</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                                    <FormField control={control} name={`owners.${index}.cell`} render={({ field }) => (<FormItem><FormLabel>Cell</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                                </div>
                                                <Separator />
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                     <FormField control={control} name={`owners.${index}.position`} render={({ field }) => (<FormItem><FormLabel>Position</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                                    <FormField control={control} name={`owners.${index}.qualification`} render={({ field }) => (<FormItem><FormLabel>Qualification</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                                    <FormField control={control} name={`owners.${index}.since`} render={({ field }) => (<FormItem><FormLabel>Since</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                                    <FormField control={control} name={`owners.${index}.held`} render={({ field }) => (<FormItem><FormLabel>% Held</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                             <TabsContent value="management">
                                <Card className="mt-4">
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle>Management & Key Personnel</CardTitle>
                                         <Button type="button" variant="outline" size="sm" onClick={() => appendManagement({ name: '', address: '', suburb: '', city: '', province: '', postCode: '', idNo: '', cell: '', position: '', qualification: '', since: '', held: 0, title: '', description: '' })}>
                                            <PlusCircle className="mr-2 h-4 w-4" /> Add Person
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {managementFields.map((field, index) => (
                                            <div key={field.id} className="p-4 border rounded-lg relative space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <h3 className="font-semibold text-lg">Person #{index + 1}</h3>
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeManagement(index)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <FormField control={control} name={`management.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                                    <FormField control={control} name={`management.${index}.idNo`} render={({ field }) => (<FormItem><FormLabel>ID No</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                                </div>
                                                <FormField control={control} name={`management.${index}.address`} render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <FormField control={control} name={`management.${index}.suburb`} render={({ field }) => (<FormItem><FormLabel>Suburb</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                                    <FormField control={control} name={`management.${index}.city`} render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                                    <FormField control={control} name={`management.${index}.postCode`} render={({ field }) => (<FormItem><FormLabel>Post Code</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                                </div>
                                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <FormField control={control} name={`management.${index}.province`} render={({ field }) => (<FormItem><FormLabel>Province</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                                    <FormField control={control} name={`management.${index}.cell`} render={({ field }) => (<FormItem><FormLabel>Cell</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                                </div>
                                                <Separator />
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <FormField control={control} name={`management.${index}.position`} render={({ field }) => (<FormItem><FormLabel>Position</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                                     <FormField control={control} name={`management.${index}.title`} render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Title</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger><SelectValue placeholder="Select title" /></SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="Mr.">Mr.</SelectItem>
                                                                    <SelectItem value="Mrs.">Mrs.</SelectItem>
                                                                    <SelectItem value="Ms.">Ms.</SelectItem>
                                                                    <SelectItem value="Miss">Miss</SelectItem>
                                                                    <SelectItem value="Dr.">Dr.</SelectItem>
                                                                    <SelectItem value="Prof.">Prof.</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )} />
                                                     <FormField control={control} name={`management.${index}.qualification`} render={({ field }) => (<FormItem><FormLabel>Qualification</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                                </div>
                                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                                                     <FormField control={control} name={`management.${index}.since`} render={({ field }) => (<FormItem><FormLabel>Since</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                                     <FormField control={control} name={`management.${index}.description`} render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Description / Role</FormLabel><FormControl><Textarea {...field} placeholder="e.g., Handles all invoice queries."/></FormControl></FormItem>)} />
                                                 </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            
                             <TabsContent value="global-facility">
                                <Card className="mt-4">
                                    <CardHeader>
                                        <CardTitle>Global Facility</CardTitle>
                                        <CardDescription>
                                            Define the overall facility limit and details for this partner.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4 max-w-2xl">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField control={control} name="facilityNo" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Facility No:</FormLabel>
                                                        <FormControl><Input placeholder="Facility Number" {...field} /></FormControl>
                                                    </FormItem>
                                                )} />
                                                <FormField control={control} name="facilityDate" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Facility Date:</FormLabel>
                                                        <FormControl><Input type="date" {...field} /></FormControl>
                                                    </FormItem>
                                                )} />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField control={control} name="signatory" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Signatory:</FormLabel>
                                                        <FormControl><Input placeholder="Name of signatory" {...field} /></FormControl>
                                                    </FormItem>
                                                )} />
                                                <FormField control={control} name="facilityLimit" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Facility Limit:</FormLabel>
                                                        <FormControl><Input type="number" placeholder="R 0.00" {...field} /></FormControl>
                                                    </FormItem>
                                                )} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                             <TabsContent value="bank-accounts">
                                <Card className="mt-4">
                                    <CardHeader><CardTitle>Bank Account Details</CardTitle></CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground">Bank account form will go here.</p>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                             <TabsContent value="balance-sheet">
                                <Card className="mt-4">
                                    <CardHeader><CardTitle>Balance Sheet</CardTitle></CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground">Balance sheet form will go here.</p>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="income-statement">
                                <Card className="mt-4">
                                    <CardHeader><CardTitle>Income Statement</CardTitle></CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground">Income statement form will go here.</p>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                             <TabsContent value="sub-facilities">
                                <Card className="mt-4">
                                    <CardHeader>
                                        <CardTitle>Sub-Facilities Management</CardTitle>
                                        <CardDescription>Manage sub-facilities associated with this partner.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Tabs defaultValue="facilities" className="w-full">
                                            <TabsList>
                                                <TabsTrigger value="facilities">Facilities</TabsTrigger>
                                                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                                                <TabsTrigger value="main">Main</TabsTrigger>
                                                <TabsTrigger value="statements">Statements</TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="facilities">
                                                <Card className="mt-4">
                                                    <CardHeader><CardTitle>Facilities List</CardTitle></CardHeader>
                                                    <CardContent>
                                                        <p className="text-muted-foreground">A list of sub-facilities will be displayed here.</p>
                                                    </CardContent>
                                                </Card>
                                            </TabsContent>
                                            <TabsContent value="dashboard">
                                                 <Card className="mt-4">
                                                    <CardHeader><CardTitle>Sub-Facilities Dashboard</CardTitle></CardHeader>
                                                    <CardContent>
                                                        <p className="text-muted-foreground">Dashboard content for sub-facilities will go here.</p>
                                                    </CardContent>
                                                </Card>
                                            </TabsContent>
                                            <TabsContent value="main">
                                                 <Card className="mt-4">
                                                    <CardHeader><CardTitle>Main Sub-Facility Details</CardTitle></CardHeader>
                                                    <CardContent>
                                                        <p className="text-muted-foreground">Main details for sub-facilities will go here.</p>
                                                    </CardContent>
                                                </Card>
                                            </TabsContent>
                                            <TabsContent value="statements">
                                                 <Card className="mt-4">
                                                    <CardHeader><CardTitle>Sub-Facility Statements</CardTitle></CardHeader>
                                                    <CardContent>
                                                        <p className="text-muted-foreground">Statements for sub-facilities will go here.</p>
                                                    </CardContent>
                                                </Card>
                                            </TabsContent>
                                        </Tabs>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </form>
        </FormProvider>
    );
}
