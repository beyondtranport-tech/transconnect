
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
import { useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { provinces } from "@/lib/geodata";

// Define the tabs as requested
const partnerTabs = [
    { value: "dashboard", label: "Dashboard" },
    { value: "main", label: "Main" },
    { value: "address", label: "Address" },
    { value: "global-facility", label: "Global Facility" },
    { value: "owners", label: "Owners" },
    { value: "management", label: "Management" },
    { value: "bank-accounts", label: "Bank Accounts" },
    { value: "balance-sheet", label: "Balance Sheet" },
    { value: "income-statement", label: "Income Statement" },
    { value: "sub-facilities", label: "Sub-Facilities" },
];

const positions = ["Director", "CEO", "CFO", "COO", "Manager", "Shareholder", "Member", "Other"];

interface PartnerDetailsProps {
    partnerType: 'Suppliers' | 'Vendors' | 'Associates' | 'Debtors';
}

export default function PartnerDetails({ partnerType }: PartnerDetailsProps) {
    const formMethods = useForm({
        defaultValues: {
            usePhysicalForPostal: false,
            physicalStreet: '',
            physicalSuburb: '',
            physicalCity: '',
            physicalPostCode: '',
            postalStreet: '',
            postalSuburb: '',
            postalCity: '',
            postalPostCode: '',
            facilityNo: '',
            facilityDate: '',
            signatory: '',
            facilityLimit: 0,
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
        }
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
                                             <div className="space-y-2">
                                                <Label htmlFor="partner-reg">Co Reg. #</Label>
                                                <Input id="partner-reg" placeholder="Company Registration Number" />
                                            </div>
                                            <Separator className="my-6" />
                                            <h3 className="text-lg font-semibold">General Contact Information</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField control={control} name="telW" render={({ field }) => ( <FormItem><FormLabel>Tel (w)</FormLabel><FormControl><Input placeholder="Work Telephone" {...field} /></FormControl></FormItem> )} />
                                                <FormField control={control} name="telH" render={({ field }) => ( <FormItem><FormLabel>Tel (h)</FormLabel><FormControl><Input placeholder="Home Telephone" {...field} /></FormControl></FormItem> )} />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField control={control} name="fax" render={({ field }) => ( <FormItem><FormLabel>Fax</FormLabel><FormControl><Input placeholder="Fax Number" {...field} /></FormControl></FormItem> )} />
                                                <FormField control={control} name="cell" render={({ field }) => ( <FormItem><FormLabel>Cell</FormLabel><FormControl><Input placeholder="Mobile Number" {...field} /></FormControl></FormItem> )} />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField control={control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="contact@example.com" {...field} /></FormControl></FormItem> )} />
                                                <FormField control={control} name="url" render={({ field }) => ( <FormItem><FormLabel>URL</FormLabel><FormControl><Input type="url" placeholder="https://example.com" {...field} /></FormControl></FormItem> )} />
                                            </div>
                                            <FormField control={control} name="primaryContact" render={({ field }) => ( <FormItem><FormLabel>Primary Contact Person</FormLabel><FormControl><Input placeholder="Primary Contact Name" {...field} /></FormControl></FormItem> )} />
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
                                                        <FormField control={control} name="physicalStreet" render={({ field }) => (<FormItem><FormLabel>Street Address</FormLabel><FormControl><Input placeholder="e.g., 123 Industrial Rd" {...field} /></FormControl></FormItem>)} />
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <FormField control={control} name="physicalSuburb" render={({ field }) => (<FormItem><FormLabel>Suburb</FormLabel><FormControl><Input placeholder="e.g., Pomona" {...field} /></FormControl></FormItem>)} />
                                                            <FormField control={control} name="physicalCity" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="e.g., Kempton Park" {...field} /></FormControl></FormItem>)} />
                                                            <FormField control={control} name="physicalPostCode" render={({ field }) => (<FormItem><FormLabel>Post Code</FormLabel><FormControl><Input placeholder="e.g., 1619" {...field} /></FormControl></FormItem>)} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <Separator className="my-8" />
                                                <div>
                                                    <div className="flex items-center space-x-2 mb-4">
                                                        <FormField
                                                            control={control}
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
                                                         <FormField control={control} name="postalStreet" render={({ field }) => (<FormItem><FormLabel>Street Address or P.O. Box</FormLabel><FormControl><Input placeholder="e.g., P.O. Box 12345" {...field} /></FormControl></FormItem>)} />
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <FormField control={control} name="postalSuburb" render={({ field }) => (<FormItem><FormLabel>Suburb</FormLabel><FormControl><Input placeholder="e.g., Pomona" {...field} /></FormControl></FormItem>)} />
                                                            <FormField control={control} name="postalCity" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="e.g., Kempton Park" {...field} /></FormControl></FormItem>)} />
                                                            <FormField control={control} name="postalPostCode" render={({ field }) => (<FormItem><FormLabel>Post Code</FormLabel><FormControl><Input placeholder="e.g., 1619" {...field} /></FormControl></FormItem>)} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </form>
                                        </Form>
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
                                                    <FormField control={control} name={`owners.${index}.province`} render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Province</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger><SelectValue placeholder="Select province..." /></SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {provinces.map(p => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )} />
                                                    <FormField control={control} name={`owners.${index}.cell`} render={({ field }) => (<FormItem><FormLabel>Cell</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                                </div>
                                                <Separator />
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                     <FormField control={control} name={`owners.${index}.position`} render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Position</FormLabel>
                                                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger><SelectValue placeholder="Select position..." /></SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {positions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )} />
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
                                                    <FormField control={control} name={`management.${index}.province`} render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Province</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger><SelectValue placeholder="Select province..." /></SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {provinces.map(p => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )} />
                                                    <FormField control={control} name={`management.${index}.cell`} render={({ field }) => (<FormItem><FormLabel>Cell</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                                </div>
                                                <Separator />
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <FormField control={control} name={`management.${index}.position`} render={({ field }) => (
                                                         <FormItem>
                                                            <FormLabel>Position</FormLabel>
                                                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger><SelectValue placeholder="Select position..." /></SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {positions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )} />
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
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle>Bank Account Details</CardTitle>
                                        <Button type="button" variant="outline" size="sm" onClick={() => appendBankAccount({ bank: '', branchCode: '', accountNo: '', branchName: '', bankCode: '', address: '', postCode: '', phone: '', email: '', contact: '' })}>
                                            <PlusCircle className="mr-2 h-4 w-4" /> Add Bank Account
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {bankAccountFields.map((field, index) => (
                                            <div key={field.id} className="p-4 border rounded-lg relative space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <h3 className="font-semibold text-lg">Bank Account #{index + 1}</h3>
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeBankAccount(index)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <FormField control={control} name={`bankAccounts.${index}.bank`} render={({ field }) => (<FormItem><FormLabel>Bank</FormLabel><FormControl><Input {...field} placeholder="Bank Name" /></FormControl></FormItem>)} />
                                                    <FormField control={control} name={`bankAccounts.${index}.branchName`} render={({ field }) => (<FormItem><FormLabel>Branch Name</FormLabel><FormControl><Input {...field} placeholder="Branch Name" /></FormControl></FormItem>)} />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <FormField control={control} name={`bankAccounts.${index}.accountNo`} render={({ field }) => (<FormItem><FormLabel>Account No</FormLabel><FormControl><Input {...field} placeholder="Account Number" /></FormControl></FormItem>)} />
                                                    <FormField control={control} name={`bankAccounts.${index}.branchCode`} render={({ field }) => (<FormItem><FormLabel>Branch Code</FormLabel><FormControl><Input {...field} placeholder="Branch Code" /></FormControl></FormItem>)} />
                                                    <FormField control={control} name={`bankAccounts.${index}.bankCode`} render={({ field }) => (<FormItem><FormLabel>Bank Code</FormLabel><FormControl><Input {...field} placeholder="Bank Code" /></FormControl></FormItem>)} />
                                                </div>
                                                <Separator />
                                                <h4 className="text-md font-medium">Bank Contact (Optional)</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                     <FormField control={control} name={`bankAccounts.${index}.address`} render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} placeholder="Bank Address" /></FormControl></FormItem>)} />
                                                     <FormField control={control} name={`bankAccounts.${index}.postCode`} render={({ field }) => (<FormItem><FormLabel>Post Code</FormLabel><FormControl><Input {...field} placeholder="Post Code" /></FormControl></FormItem>)} />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                     <FormField control={control} name={`bankAccounts.${index}.contact`} render={({ field }) => (<FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input {...field} placeholder="Contact Person" /></FormControl></FormItem>)} />
                                                     <FormField control={control} name={`bankAccounts.${index}.phone`} render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} placeholder="Phone Number" /></FormControl></FormItem>)} />
                                                     <FormField control={control} name={`bankAccounts.${index}.email`} render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" placeholder="Contact Email" /></FormControl></FormItem>)} />
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            
                            <TabsContent value="balance-sheet">
                                <Card className="mt-4">
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle>Statement of Financial Position (Balance Sheet)</CardTitle>
                                        <Button type="button" variant="outline" size="sm" onClick={() => appendBalanceSheet({ statementDate: '', propertyPlantEquipment: 0, intangibleAssets: 0, financialAssets: 0, inventories: 0, tradeReceivables: 0, cashEquivalents: 0, shareCapital: 0, retainedEarnings: 0, longTermBorrowings: 0, leaseLiabilities: 0, tradePayables: 0, shortTermBorrowings: 0, currentTaxPayable: 0 })}>
                                            <PlusCircle className="mr-2 h-4 w-4" /> Add Instance
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {balanceSheetFields.map((field, index) => (
                                            <Card key={field.id} className="p-4 relative">
                                                <div className="flex justify-between items-center mb-4">
                                                    <FormField control={control} name={`balanceSheets.${index}.statementDate`} render={({ field }) => (
                                                        <FormItem className="flex-grow max-w-xs">
                                                            <FormLabel>Statement Date</FormLabel>
                                                            <FormControl><Input type="date" {...field} /></FormControl>
                                                        </FormItem>
                                                    )} />
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeBalanceSheet(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-4">
                                                        <h3 className="font-semibold text-lg border-b pb-2">Assets</h3>
                                                        <h4 className="font-medium text-muted-foreground">Non-Current Assets</h4>
                                                        <div className="space-y-2 pl-4">
                                                            <FormField control={control} name={`balanceSheets.${index}.propertyPlantEquipment`} render={({ field }) => (<FormItem><FormLabel>Property, Plant and Equipment</FormLabel><FormControl><Input type="number" placeholder="R 0.00" {...field} /></FormControl></FormItem>)} />
                                                            <FormField control={control} name={`balanceSheets.${index}.intangibleAssets`} render={({ field }) => (<FormItem><FormLabel>Intangible Assets</FormLabel><FormControl><Input type="number" placeholder="R 0.00" {...field} /></FormControl></FormItem>)} />
                                                            <FormField control={control} name={`balanceSheets.${index}.financialAssets`} render={({ field }) => (<FormItem><FormLabel>Financial Assets</FormLabel><FormControl><Input type="number" placeholder="R 0.00" {...field} /></FormControl></FormItem>)} />
                                                        </div>
                                                        <h4 className="font-medium text-muted-foreground pt-2">Current Assets</h4>
                                                        <div className="space-y-2 pl-4">
                                                             <FormField control={control} name={`balanceSheets.${index}.inventories`} render={({ field }) => (<FormItem><FormLabel>Inventories</FormLabel><FormControl><Input type="number" placeholder="R 0.00" {...field} /></FormControl></FormItem>)} />
                                                            <FormField control={control} name={`balanceSheets.${index}.tradeReceivables`} render={({ field }) => (<FormItem><FormLabel>Trade and Other Receivables</FormLabel><FormControl><Input type="number" placeholder="R 0.00" {...field} /></FormControl></FormItem>)} />
                                                            <FormField control={control} name={`balanceSheets.${index}.cashEquivalents`} render={({ field }) => (<FormItem><FormLabel>Cash and Cash Equivalents</FormLabel><FormControl><Input type="number" placeholder="R 0.00" {...field} /></FormControl></FormItem>)} />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <h3 className="font-semibold text-lg border-b pb-2">Equity and Liabilities</h3>
                                                        <h4 className="font-medium text-muted-foreground">Equity</h4>
                                                        <div className="space-y-2 pl-4">
                                                            <FormField control={control} name={`balanceSheets.${index}.shareCapital`} render={({ field }) => (<FormItem><FormLabel>Share Capital</FormLabel><FormControl><Input type="number" placeholder="R 0.00" {...field} /></FormControl></FormItem>)} />
                                                            <FormField control={control} name={`balanceSheets.${index}.retainedEarnings`} render={({ field }) => (<FormItem><FormLabel>Retained Earnings</FormLabel><FormControl><Input type="number" placeholder="R 0.00" {...field} /></FormControl></FormItem>)} />
                                                        </div>
                                                        <h4 className="font-medium text-muted-foreground pt-2">Non-Current Liabilities</h4>
                                                        <div className="space-y-2 pl-4">
                                                            <FormField control={control} name={`balanceSheets.${index}.longTermBorrowings`} render={({ field }) => (<FormItem><FormLabel>Long-Term Borrowings</FormLabel><FormControl><Input type="number" placeholder="R 0.00" {...field} /></FormControl></FormItem>)} />
                                                            <FormField control={control} name={`balanceSheets.${index}.leaseLiabilities`} render={({ field }) => (<FormItem><FormLabel>Lease Liabilities</FormLabel><FormControl><Input type="number" placeholder="R 0.00" {...field} /></FormControl></FormItem>)} />
                                                        </div>
                                                        <h4 className="font-medium text-muted-foreground pt-2">Current Liabilities</h4>
                                                        <div className="space-y-2 pl-4">
                                                             <FormField control={control} name={`balanceSheets.${index}.tradePayables`} render={({ field }) => (<FormItem><FormLabel>Trade and Other Payables</FormLabel><FormControl><Input type="number" placeholder="R 0.00" {...field} /></FormControl></FormItem>)} />
                                                            <FormField control={control} name={`balanceSheets.${index}.shortTermBorrowings`} render={({ field }) => (<FormItem><FormLabel>Short-Term Borrowings</FormLabel><FormControl><Input type="number" placeholder="R 0.00" {...field} /></FormControl></FormItem>)} />
                                                            <FormField control={control} name={`balanceSheets.${index}.currentTaxPayable`} render={({ field }) => (<FormItem><FormLabel>Current Tax Payable</FormLabel><FormControl><Input type="number" placeholder="R 0.00" {...field} /></FormControl></FormItem>)} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="income-statement">
                                <Card className="mt-4">
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle>Statement of Comprehensive Income (Income Statement)</CardTitle>
                                        <Button type="button" variant="outline" size="sm" onClick={() => appendIncomeStatement({ statementDate: '', revenue: 0, costOfSales: 0, grossProfit: 0, otherIncome: 0, operatingExpenses: 0, operatingProfit: 0, financeCosts: 0, profitBeforeTax: 0, incomeTaxExpense: 0, profitForThePeriod: 0 })}>
                                            <PlusCircle className="mr-2 h-4 w-4" /> Add Instance
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {incomeStatementFields.map((field, index) => (
                                            <Card key={field.id} className="p-4 relative max-w-2xl mx-auto">
                                                <div className="flex justify-between items-center mb-4">
                                                    <FormField control={control} name={`incomeStatements.${index}.statementDate`} render={({ field }) => (
                                                        <FormItem className="flex-grow max-w-xs">
                                                            <FormLabel>Statement Date</FormLabel>
                                                            <FormControl><Input type="date" {...field} /></FormControl>
                                                        </FormItem>
                                                    )} />
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeIncomeStatement(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                </div>
                                                <div className="space-y-4">
                                                    <FormField control={control} name={`incomeStatements.${index}.revenue`} render={({ field }) => (<FormItem><FormLabel>Revenue</FormLabel><FormControl><Input type="number" placeholder="R 0.00" {...field} /></FormControl></FormItem>)} />
                                                    <FormField control={control} name={`incomeStatements.${index}.costOfSales`} render={({ field }) => (<FormItem><FormLabel>Cost of Sales</FormLabel><FormControl><Input type="number" placeholder="R 0.00" {...field} /></FormControl></FormItem>)} />
                                                    <FormField control={control} name={`incomeStatements.${index}.grossProfit`} render={({ field }) => (<FormItem><FormLabel>Gross Profit</FormLabel><FormControl><Input type="number" placeholder="R 0.00" disabled className="font-bold" {...field} /></FormControl></FormItem>)} />
                                                    <Separator />
                                                    <FormField control={control} name={`incomeStatements.${index}.otherIncome`} render={({ field }) => (<FormItem><FormLabel>Other Income</FormLabel><FormControl><Input type="number" placeholder="R 0.00" {...field} /></FormControl></FormItem>)} />
                                                    <FormField control={control} name={`incomeStatements.${index}.operatingExpenses`} render={({ field }) => (<FormItem><FormLabel>Operating Expenses</FormLabel><FormControl><Input type="number" placeholder="R 0.00" {...field} /></FormControl></FormItem>)} />
                                                    <FormField control={control} name={`incomeStatements.${index}.operatingProfit`} render={({ field }) => (<FormItem><FormLabel>Operating Profit</FormLabel><FormControl><Input type="number" placeholder="R 0.00" disabled className="font-bold" {...field} /></FormControl></FormItem>)} />
                                                    <Separator />
                                                    <FormField control={control} name={`incomeStatements.${index}.financeCosts`} render={({ field }) => (<FormItem><FormLabel>Finance Costs</FormLabel><FormControl><Input type="number" placeholder="R 0.00" {...field} /></FormControl></FormItem>)} />
                                                    <FormField control={control} name={`incomeStatements.${index}.profitBeforeTax`} render={({ field }) => (<FormItem><FormLabel>Profit Before Tax</FormLabel><FormControl><Input type="number" placeholder="R 0.00" disabled className="font-bold" {...field} /></FormControl></FormItem>)} />
                                                    <FormField control={control} name={`incomeStatements.${index}.incomeTaxExpense`} render={({ field }) => (<FormItem><FormLabel>Income Tax Expense</FormLabel><FormControl><Input type="number" placeholder="R 0.00" {...field} /></FormControl></FormItem>)} />
                                                    <FormField control={control} name={`incomeStatements.${index}.profitForThePeriod`} render={({ field }) => (<FormItem><FormLabel>Profit for the Period</FormLabel><FormControl><Input type="number" placeholder="R 0.00" disabled className="font-bold text-primary" {...field} /></FormControl></FormItem>)} />
                                                </div>
                                            </Card>
                                        ))}
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
