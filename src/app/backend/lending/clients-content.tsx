
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
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import * as React from "react";


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

export default function ClientsContent() {

    const form = useForm({
        defaultValues: {
            owners: [{ name: '', address: '', suburb: '', city: '', province: '', postCode: '', idNo: '', cell: '', position: '', qualification: '', since: '', held: 0 }],
            management: [{ name: '', address: '', suburb: '', city: '', province: '', postCode: '', idNo: '', cell: '', position: '', qualification: '', since: '', held: 0 }],
        }
    });

    const { control } = form;

    const { fields: ownerFields, append: appendOwner, remove: removeOwner } = useFieldArray({
        control,
        name: "owners"
    });

    const { fields: managementFields, append: appendManagement, remove: removeManagement } = useFieldArray({
        control,
        name: "management"
    });

    return (
        <FormProvider {...form}>
            <form>
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
                            <TabsList className="grid w-full grid-cols-10">
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
                                        <CardTitle>Management Team</CardTitle>
                                         <Button type="button" variant="outline" size="sm" onClick={() => appendManagement({ name: '', address: '', suburb: '', city: '', province: '', postCode: '', idNo: '', cell: '', position: '', qualification: '', since: '', held: 0 })}>
                                            <PlusCircle className="mr-2 h-4 w-4" /> Add Manager
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {managementFields.map((field, index) => (
                                            <div key={field.id} className="p-4 border rounded-lg relative space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <h3 className="font-semibold text-lg">Manager #{index + 1}</h3>
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
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                     <FormField control={control} name={`management.${index}.position`} render={({ field }) => (<FormItem><FormLabel>Position</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                                    <FormField control={control} name={`management.${index}.qualification`} render={({ field }) => (<FormItem><FormLabel>Qualification</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                                    <FormField control={control} name={`management.${index}.since`} render={({ field }) => (<FormItem><FormLabel>Since</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                                    <FormField control={control} name={`management.${index}.held`} render={({ field }) => (<FormItem><FormLabel>% Held</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="bank-accounts">
                                <Card className="mt-4">
                                    <CardHeader><CardTitle>Bank Account Details</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="space-y-4 max-w-2xl">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="bank-name">Bank</Label>
                                                    <Input id="bank-name" placeholder="Bank Name" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="branch-name">Branch Name</Label>
                                                    <Input id="branch-name" placeholder="Branch Name" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="account-no">Account No</Label>
                                                    <Input id="account-no" placeholder="Account Number" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="branch-code">Branch Code</Label>
                                                    <Input id="branch-code" placeholder="Branch Code" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="bank-code">Bank Code</Label>
                                                    <Input id="bank-code" placeholder="Bank Code" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="bank-address">Address</Label>
                                                <Input id="bank-address" placeholder="Bank Address" />
                                            </div>
                                            <div className="space-y-2 md:w-1/3">
                                                <Label htmlFor="bank-post-code">Post Code</Label>
                                                <Input id="bank-post-code" placeholder="Post Code" />
                                            </div>
                                            <Separator className="my-6" />
                                            <h4 className="text-md font-medium">Bank Contact Person</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="bank-contact">Contact</Label>
                                                    <Input id="bank-contact" placeholder="Contact Person" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="bank-phone">Phone</Label>
                                                    <Input id="bank-phone" placeholder="Phone Number" />
                                                </div>
                                                <div className="space-y-2 md:col-span-2">
                                                    <Label htmlFor="bank-email">Email</Label>
                                                    <Input id="bank-email" type="email" placeholder="Contact Email" />
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                             <TabsContent value="balance-sheet">
                               <Card className="mt-4">
                                    <CardHeader><CardTitle>Statement of Financial Position (Balance Sheet)</CardTitle></CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <h3 className="font-semibold text-lg border-b pb-2">Assets</h3>
                                                <h4 className="font-medium text-muted-foreground">Non-Current Assets</h4>
                                                <div className="space-y-2 pl-4">
                                                    <Label>Property, Plant and Equipment</Label><Input type="number" placeholder="R 0.00" />
                                                    <Label>Intangible Assets</Label><Input type="number" placeholder="R 0.00" />
                                                    <Label>Financial Assets</Label><Input type="number" placeholder="R 0.00" />
                                                </div>
                                                <h4 className="font-medium text-muted-foreground pt-2">Current Assets</h4>
                                                <div className="space-y-2 pl-4">
                                                    <Label>Inventories</Label><Input type="number" placeholder="R 0.00" />
                                                    <Label>Trade and Other Receivables</Label><Input type="number" placeholder="R 0.00" />
                                                    <Label>Cash and Cash Equivalents</Label><Input type="number" placeholder="R 0.00" />
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <h3 className="font-semibold text-lg border-b pb-2">Equity and Liabilities</h3>
                                                <h4 className="font-medium text-muted-foreground">Equity</h4>
                                                <div className="space-y-2 pl-4">
                                                    <Label>Share Capital</Label><Input type="number" placeholder="R 0.00" />
                                                    <Label>Retained Earnings</Label><Input type="number" placeholder="R 0.00" />
                                                </div>
                                                <h4 className="font-medium text-muted-foreground pt-2">Non-Current Liabilities</h4>
                                                <div className="space-y-2 pl-4">
                                                    <Label>Long-Term Borrowings</Label><Input type="number" placeholder="R 0.00" />
                                                    <Label>Lease Liabilities</Label><Input type="number" placeholder="R 0.00" />
                                                </div>
                                                <h4 className="font-medium text-muted-foreground pt-2">Current Liabilities</h4>
                                                <div className="space-y-2 pl-4">
                                                    <Label>Trade and Other Payables</Label><Input type="number" placeholder="R 0.00" />
                                                    <Label>Short-Term Borrowings</Label><Input type="number" placeholder="R 0.00" />
                                                    <Label>Current Tax Payable</Label><Input type="number" placeholder="R 0.00" />
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="income-statement">
                                <Card className="mt-4">
                                    <CardHeader><CardTitle>Statement of Comprehensive Income (Income Statement)</CardTitle></CardHeader>
                                    <CardContent className="space-y-4 max-w-2xl">
                                        <div className="space-y-2">
                                            <Label>Revenue</Label><Input type="number" placeholder="R 0.00" />
                                            <Label>Cost of Sales</Label><Input type="number" placeholder="R 0.00" />
                                            <Label>Gross Profit</Label><Input type="number" placeholder="R 0.00" disabled className="font-bold" />
                                        </div>
                                        <Separator />
                                        <div className="space-y-2">
                                            <Label>Other Income</Label><Input type="number" placeholder="R 0.00" />
                                            <Label>Operating Expenses</Label><Input type="number" placeholder="R 0.00" />
                                            <Label>Operating Profit</Label><Input type="number" placeholder="R 0.00" disabled className="font-bold" />
                                        </div>
                                        <Separator />
                                        <div className="space-y-2">
                                            <Label>Finance Costs</Label><Input type="number" placeholder="R 0.00" />
                                            <Label>Profit Before Tax</Label><Input type="number" placeholder="R 0.00" disabled className="font-bold" />
                                            <Label>Income Tax Expense</Label><Input type="number" placeholder="R 0.00" />
                                            <Label>Profit for the Period</Label><Input type="number" placeholder="R 0.00" disabled className="font-bold text-primary" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="sub-facilities">
                                <Card className="mt-4">
                                    <CardHeader>
                                        <CardTitle>Sub-Facilities Management</CardTitle>
                                        <CardDescription>Manage sub-facilities associated with this client.</CardDescription>
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
