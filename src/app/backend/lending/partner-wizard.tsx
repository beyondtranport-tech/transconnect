
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray, FormProvider, useFormContext, useWatch } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, Loader2, Save, Check, PlusCircle, Trash2, Sheet, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { provinces } from '@/lib/geodata';
import { Label } from '@/components/ui/label';

// --- Zod Schemas ---
const ownerSchema = z.object({
  name: z.string().optional(), idNo: z.string().optional(), address: z.string().optional(),
  suburb: z.string().optional(), city: z.string().optional(), postCode: z.string().optional(),
  province: z.string().optional(), cell: z.string().optional(), position: z.string().optional(),
  qualification: z.string().optional(), since: z.string().optional(), held: z.coerce.number().optional(),
});

const managementSchema = z.object({
    name: z.string().optional(), idNo: z.string().optional(), address: z.string().optional(),
    suburb: z.string().optional(), city: z.string().optional(), postCode: z.string().optional(),
    province: z.string().optional(), cell: z.string().optional(), position: z.string().optional(),
    title: z.string().optional(), qualification: z.string().optional(), since: z.string().optional(),
    description: z.string().optional(),
});

const bankAccountSchema = z.object({
    bank: z.string().optional(), branchCode: z.string().optional(), accountNo: z.string().optional(),
    branchName: z.string().optional(), bankCode: z.string().optional(), address: z.string().optional(),
    postCode: z.string().optional(), phone: z.string().optional(), email: z.string().email().optional().or(z.literal('')),
    contact: z.string().optional(),
});

const balanceSheetEntrySchema = z.object({
  statementDate: z.string().optional(),
  ppe: z.coerce.number().optional(),
  intangibleAssets: z.coerce.number().optional(),
  financialAssets: z.coerce.number().optional(),
  inventories: z.coerce.number().optional(),
  receivables: z.coerce.number().optional(),
  cash: z.coerce.number().optional(),
  shareCapital: z.coerce.number().optional(),
  retainedEarnings: z.coerce.number().optional(),
  longTermDebt: z.coerce.number().optional(),
  leaseLiabilities: z.coerce.number().optional(),
  payables: z.coerce.number().optional(),
  shortTermDebt: z.coerce.number().optional(),
  taxPayable: z.coerce.number().optional(),
});

const incomeStatementEntrySchema = z.object({
  statementDate: z.string().optional(),
  revenue: z.coerce.number().optional(),
  cogs: z.coerce.number().optional(),
  otherIncome: z.coerce.number().optional(),
  opex: z.coerce.number().optional(),
  financeCosts: z.coerce.number().optional(),
  tax: z.coerce.number().optional(),
});

const partnerSchema = z.object({
  name: z.string().min(1, "Partner name is required."),
  globalFacilityLimit: z.coerce.number().min(0).optional(),
  type: z.string().optional(), category: z.string().optional(), language: z.string().optional(),
  regId: z.string().optional(), isVatRegistered: z.boolean().default(false), vatNo: z.string().optional(),
  physicalStreet: z.string().optional(), physicalSuburb: z.string().optional(), physicalCity: z.string().optional(),
  physicalPostCode: z.string().optional(), physicalProvince: z.string().optional(),
  usePhysicalForPostal: z.boolean().default(false),
  postalStreet: z.string().optional(), postalSuburb: z.string().optional(), postalCity: z.string().optional(),
  postalPostCode: z.string().optional(), postalProvince: z.string().optional(),
  telW: z.string().optional(), telH: z.string().optional(), fax: z.string().optional(),
  cell: z.string().optional(), email: z.string().optional(), url: z.string().optional(),
  primaryContact: z.string().optional(),
  owners: z.array(ownerSchema).optional(),
  management: z.array(managementSchema).optional(),
  bankAccounts: z.array(bankAccountSchema).optional(),
  balanceSheets: z.array(balanceSheetEntrySchema).optional(),
  incomeStatements: z.array(incomeStatementEntrySchema).optional(),
});
type PartnerFormValues = z.infer<typeof partnerSchema>;

// --- Step Definitions ---
const steps = [
    { id: 'main', name: 'Main Details', fields: ['name', 'type', 'category', 'language', 'regId', 'vatNo'] },
    { id: 'address', name: 'Address', fields: ['physicalStreet', 'physicalCity', 'physicalPostCode', 'postalStreet', 'postalCity', 'postalPostCode'] },
    { id: 'contact', name: 'Contact Info', fields: ['email', 'cell', 'telW'] },
    { id: 'owners', name: 'Owners & Directors', fields: ['owners'] },
    { id: 'management', name: 'Management', fields: ['management'] },
    { id: 'banking', name: 'Bank Accounts', fields: ['bankAccounts'] },
    { id: 'balance-sheet', name: 'Balance Sheet', fields: ['balanceSheets'] },
    { id: 'income-statement', name: 'Income Statement', fields: ['incomeStatements'] },
    { id: 'review', name: 'Review & Save' },
];

const defaultValues: Partial<PartnerFormValues> = {
  name: '', type: '', category: '', language: '', regId: '',
  isVatRegistered: false, vatNo: '', usePhysicalForPostal: false,
  owners: [], management: [], bankAccounts: [],
  balanceSheets: [], incomeStatements: [],
};

// --- Sub-components for each step ---

const StepMain = () => {
    const { control, watch } = useFormContext();
    const isVatRegistered = watch('isVatRegistered');
    return (
      <div className="space-y-4 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={control} name="name" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="Partner Legal Name" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={control} name="type" render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger></FormControl><SelectContent><SelectItem value="supplier">Supplier</SelectItem><SelectItem value="vendor">Vendor</SelectItem><SelectItem value="associate">Associate</SelectItem></SelectContent></Select></FormItem>)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={control} name="category" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger></FormControl><SelectContent><SelectItem value="transport">Transport</SelectItem><SelectItem value="logistics">Logistics</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></FormItem>)} />
          <FormField control={control} name="regId" render={({ field }) => (<FormItem><FormLabel>Reg. ID</FormLabel><FormControl><Input placeholder="Registration ID" {...field} /></FormControl></FormItem>)} />
        </div>
        <div className="space-y-4">
          <FormField control={control} name="isVatRegistered" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>VAT Registered?</FormLabel></FormItem>)} />
          {isVatRegistered && <FormField control={control} name="vatNo" render={({ field }) => (<FormItem><FormLabel>VAT Number</FormLabel><FormControl><Input placeholder="e.g. 4000123456" {...field} /></FormControl><FormMessage /></FormItem>)} />}
        </div>
      </div>
    );
};

const StepAddress = () => {
    const { control, watch, setValue } = useFormContext();
    const usePhysicalForPostal = watch('usePhysicalForPostal');
    
    // Subscribe to physical address fields
    const physicalAddressWatcher = useWatch({ control, name: ['physicalStreet', 'physicalSuburb', 'physicalCity', 'physicalPostCode', 'physicalProvince'] });

    useEffect(() => {
        if (usePhysicalForPostal) {
            setValue('postalStreet', physicalAddressWatcher[0] || '');
            setValue('postalSuburb', physicalAddressWatcher[1] || '');
            setValue('postalCity', physicalAddressWatcher[2] || '');
            setValue('postalPostCode', physicalAddressWatcher[3] || '');
            setValue('postalProvince', physicalAddressWatcher[4] || '');
        }
    }, [usePhysicalForPostal, physicalAddressWatcher, setValue]);

    const selectedPhysicalProvince = watch('physicalProvince');
    const physicalCities = useMemo(() => {
        if (!selectedPhysicalProvince) return [];
        const province = provinces.find(p => p.name === selectedPhysicalProvince);
        return province ? province.cities : [];
    }, [selectedPhysicalProvince]);

    const selectedPostalProvince = watch('postalProvince');
    const postalCities = useMemo(() => {
        if (!selectedPostalProvince) return [];
        const province = provinces.find(p => p.name === selectedPostalProvince);
        return province ? province.cities : [];
    }, [selectedPostalProvince]);

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-lg font-semibold mb-4">Physical Address</h3>
                <div className="space-y-4 max-w-2xl">
                    <FormField control={control} name="physicalStreet" render={({ field }) => (<FormItem><FormLabel>Street Address</FormLabel><FormControl><Input placeholder="e.g., 123 Industrial Rd" {...field} /></FormControl></FormItem>)} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={control}
                            name="physicalProvince"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Province</FormLabel>
                                    <Select onValueChange={(value) => { field.onChange(value); setValue('physicalCity', ''); }} value={field.value || ''}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select province..." /></SelectTrigger></FormControl>
                                        <SelectContent>{provinces.map(p => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="physicalCity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>City</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ''} disabled={!selectedPhysicalProvince}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select city..." /></SelectTrigger></FormControl>
                                        <SelectContent>{physicalCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={control} name="physicalSuburb" render={({ field }) => (<FormItem><FormLabel>Suburb</FormLabel><FormControl><Input placeholder="e.g., Pomona" {...field} /></FormControl></FormItem>)} />
                        <FormField control={control} name="physicalPostCode" render={({ field }) => (<FormItem><FormLabel>Post Code</FormLabel><FormControl><Input placeholder="e.g., 1619" {...field} /></FormControl></FormItem>)} />
                    </div>
                </div>
            </div>
            <Separator />
            <div>
                 <h3 className="text-lg font-semibold mb-4">Postal Address</h3>
                 <FormField
                    control={control}
                    name="usePhysicalForPostal"
                    render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 mb-4">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <FormLabel>Same as Physical Address</FormLabel>
                        </FormItem>
                    )}
                />
                <div className="space-y-4 max-w-2xl">
                    <FormField control={control} name="postalStreet" render={({ field }) => (<FormItem><FormLabel>Street Address or P.O. Box</FormLabel><FormControl><Input placeholder="e.g., P.O. Box 12345" {...field} disabled={usePhysicalForPostal} /></FormControl></FormItem>)} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={control}
                            name="postalProvince"
                            render={({ field }) => (
                                <FormItem><FormLabel>Province</FormLabel><Select onValueChange={(value) => { field.onChange(value); setValue('postalCity', ''); }} value={field.value || ''} disabled={usePhysicalForPostal}><FormControl><SelectTrigger><SelectValue placeholder="Select province..." /></SelectTrigger></FormControl><SelectContent>{provinces.map(p => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}</SelectContent></Select></FormItem>
                        )} />
                        <FormField
                            control={control}
                            name="postalCity"
                            render={({ field }) => (
                                <FormItem><FormLabel>City</FormLabel><Select onValueChange={field.onChange} value={field.value || ''} disabled={usePhysicalForPostal || !selectedPostalProvince}><FormControl><SelectTrigger><SelectValue placeholder="Select city..." /></SelectTrigger></FormControl><SelectContent>{postalCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></FormItem>
                        )} />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={control} name="postalSuburb" render={({ field }) => (<FormItem><FormLabel>Suburb</FormLabel><FormControl><Input placeholder="e.g., Pomona" {...field} disabled={usePhysicalForPostal} /></FormControl></FormItem>)} />
                        <FormField control={control} name="postalPostCode" render={({ field }) => (<FormItem><FormLabel>Post Code</FormLabel><FormControl><Input placeholder="e.g., 1619" {...field} disabled={usePhysicalForPostal} /></FormControl></FormItem>)} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const StepContact = () => ( <div className="space-y-4 max-w-2xl"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormField control={useFormContext().control} name="telW" render={({ field }) => (<FormItem><FormLabel>Tel (Work)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /><FormField control={useFormContext().control} name="telH" render={({ field }) => (<FormItem><FormLabel>Tel (Home)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormField control={useFormContext().control} name="fax" render={({ field }) => (<FormItem><FormLabel>Fax</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /><FormField control={useFormContext().control} name="cell" render={({ field }) => (<FormItem><FormLabel>Cell</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormField control={useFormContext().control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl></FormItem>)} /><FormField control={useFormContext().control} name="url" render={({ field }) => (<FormItem><FormLabel>Website URL</FormLabel><FormControl><Input type="url" {...field} /></FormControl></FormItem>)} /></div><FormField control={useFormContext().control} name="primaryContact" render={({ field }) => (<FormItem><FormLabel>Primary Contact Person</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /></div>);

const OwnerFormFields = ({ index, remove }: { index: number; remove: (index: number) => void }) => {
    const { control, watch, setValue } = useFormContext();
    
    const provinceValue = watch(`owners.${index}.province`);

    const cities = useMemo(() => {
        if (!provinceValue) return [];
        const province = provinces.find(p => p.name === provinceValue);
        return province ? province.cities : [];
    }, [provinceValue]);

    return (
        <div className="p-4 border rounded-lg relative space-y-4">
            <div className="flex justify-between items-center"><h3 className="font-semibold text-lg">Owner #{index + 1}</h3><Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormField control={control} name={`owners.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /><FormField control={control} name={`owners.${index}.idNo`} render={({ field }) => (<FormItem><FormLabel>ID No</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /></div>
            <FormField control={control} name={`owners.${index}.address`} render={({ field }) => (<FormItem><FormLabel>Street Address</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={control}
                    name={`owners.${index}.province`}
                    render={({ field }) => (
                        <FormItem><FormLabel>Province</FormLabel>
                            <Select onValueChange={(value) => { field.onChange(value); setValue(`owners.${index}.city`, ''); }} value={field.value || ''}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select province..." /></SelectTrigger></FormControl>
                                <SelectContent>{provinces.map(p => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </FormItem>
                )} />
                <FormField
                    control={control}
                    name={`owners.${index}.city`}
                    render={({ field }) => (
                        <FormItem><FormLabel>City</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ''} disabled={!provinceValue}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select city..." /></SelectTrigger></FormControl>
                                <SelectContent>{cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                        </FormItem>
                )} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormField control={control} name={`owners.${index}.suburb`} render={({ field }) => (<FormItem><FormLabel>Suburb</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /><FormField control={control} name={`owners.${index}.postCode`} render={({ field }) => (<FormItem><FormLabel>Post Code</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /></div>
            <FormField control={control} name={`owners.${index}.cell`} render={({ field }) => (<FormItem><FormLabel>Cell</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <FormField control={control} name={`owners.${index}.position`} render={({ field }) => (<FormItem><FormLabel>Position</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={control} name={`owners.${index}.qualification`} render={({ field }) => (<FormItem><FormLabel>Qualification</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={control} name={`owners.${index}.since`} render={({ field }) => (<FormItem><FormLabel>Since</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
                <FormField control={control} name={`owners.${index}.held`} render={({ field }) => (<FormItem><FormLabel>% Held</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
            </div>
        </div>
    );
};

const StepOwners = () => {
    const { control } = useFormContext();
    const { fields, append, remove } = useFieldArray({ control, name: "owners" });
    return (
        <div className="space-y-6">
            <Button type="button" variant="outline" size="sm" onClick={() => append({})}><PlusCircle className="mr-2 h-4 w-4" /> Add Owner</Button>
            {fields.map((field, index) => (
                <OwnerFormFields key={field.id} index={index} remove={remove} />
            ))}
        </div>
    );
};

const ManagementFormFields = ({ index, remove }: { index: number; remove: (index: number) => void }) => {
    const { control, watch, setValue } = useFormContext();
    const provinceValue = watch(`management.${index}.province`);
    const cities = useMemo(() => {
        if (!provinceValue) return [];
        const province = provinces.find(p => p.name === provinceValue);
        return province ? province.cities : [];
    }, [provinceValue]);

    return (
        <div className="p-4 border rounded-lg relative space-y-4">
            <div className="flex justify-between items-center"><h3 className="font-semibold text-lg">Manager #{index + 1}</h3><Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormField control={control} name={`management.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /><FormField control={control} name={`management.${index}.idNo`} render={({ field }) => (<FormItem><FormLabel>ID No</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /></div>
            <FormField control={control} name={`management.${index}.address`} render={({ field }) => (<FormItem><FormLabel>Street Address</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={control} name={`management.${index}.province`} render={({ field }) => (
                    <FormItem><FormLabel>Province</FormLabel><Select onValueChange={(value) => { field.onChange(value); setValue(`management.${index}.city`, ''); }} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder="Select province..." /></SelectTrigger></FormControl><SelectContent>{provinces.map(p => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}</SelectContent></Select></FormItem>
                )} />
                <FormField control={control} name={`management.${index}.city`} render={({ field }) => (
                    <FormItem><FormLabel>City</FormLabel><Select onValueChange={field.onChange} value={field.value || ''} disabled={!provinceValue}><FormControl><SelectTrigger><SelectValue placeholder="Select city..." /></SelectTrigger></FormControl><SelectContent>{cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></FormItem>
                )} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormField control={control} name={`management.${index}.suburb`} render={({ field }) => (<FormItem><FormLabel>Suburb</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /><FormField control={control} name={`management.${index}.postCode`} render={({ field }) => (<FormItem><FormLabel>Post Code</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /></div>
            <FormField control={control} name={`management.${index}.cell`} render={({ field }) => (<FormItem><FormLabel>Cell</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={control} name={`management.${index}.position`} render={({ field }) => (<FormItem><FormLabel>Position</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                 <FormField control={control} name={`management.${index}.title`} render={({ field }) => (
                    <FormItem><FormLabel>Title</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select title" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Mr.">Mr.</SelectItem><SelectItem value="Mrs.">Mrs.</SelectItem><SelectItem value="Ms.">Ms.</SelectItem><SelectItem value="Miss">Miss</SelectItem><SelectItem value="Dr.">Dr.</SelectItem><SelectItem value="Prof.">Prof.</SelectItem></SelectContent></Select></FormItem>
                )} />
                 <FormField control={control} name={`management.${index}.qualification`} render={({ field }) => (<FormItem><FormLabel>Qualification</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                 <FormField control={control} name={`management.${index}.since`} render={({ field }) => (<FormItem><FormLabel>Since</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
                 <FormField control={control} name={`management.${index}.description`} render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Description / Role</FormLabel><FormControl><Textarea {...field} placeholder="e.g., Handles all invoice queries."/></FormControl></FormItem>)} />
            </div>
        </div>
    );
};

const StepManagement = () => {
    const { control } = useFormContext();
    const { fields, append, remove } = useFieldArray({ control, name: "management" });
    return (
        <div className="space-y-6">
            <Button type="button" variant="outline" size="sm" onClick={() => append({})}><PlusCircle className="mr-2 h-4 w-4" /> Add Manager</Button>
            {fields.map((field, index) => (
                <ManagementFormFields key={field.id} index={index} remove={remove} />
            ))}
        </div>
    );
};


const StepBanking = () => {
    const { control } = useFormContext();
    const { fields, append, remove } = useFieldArray({ control, name: "bankAccounts" });
    const newBankAccount = { bank: '', branchCode: '', accountNo: '', branchName: '', bankCode: '', address: '', postCode: '', phone: '', email: '', contact: '' };
    return (
        <div className="space-y-6">
             <Button type="button" variant="outline" size="sm" onClick={() => append(newBankAccount)}><PlusCircle className="mr-2 h-4 w-4" /> Add Bank Account</Button>
            {fields.map((field, index) => (
                 <div key={field.id} className="p-4 border rounded-lg relative space-y-4">
                    <div className="flex justify-between items-center"><h3 className="font-semibold text-lg">Bank Account #{index + 1}</h3><Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><FormField control={control} name={`bankAccounts.${index}.bank`} render={({ field }) => (<FormItem><FormLabel>Bank</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /><FormField control={control} name={`bankAccounts.${index}.accountNo`} render={({ field }) => (<FormItem><FormLabel>Account No</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /><FormField control={control} name={`bankAccounts.${index}.branchCode`} render={({ field }) => (<FormItem><FormLabel>Branch Code</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormField control={control} name={`bankAccounts.${index}.branchName`} render={({ field }) => (<FormItem><FormLabel>Branch Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /><FormField control={control} name={`bankAccounts.${index}.bankCode`} render={({ field }) => (<FormItem><FormLabel>Bank Code</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /></div>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormField control={control} name={`bankAccounts.${index}.address`} render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /><FormField control={control} name={`bankAccounts.${index}.postCode`} render={({ field }) => (<FormItem><FormLabel>Post Code</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /></div>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><FormField control={control} name={`bankAccounts.${index}.phone`} render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /><FormField control={control} name={`bankAccounts.${index}.email`} render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl></FormItem>)} /><FormField control={control} name={`bankAccounts.${index}.contact`} render={({ field }) => (<FormItem><FormLabel>Contact</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /></div>
                </div>
            ))}
        </div>
    )
}

const BalanceSheetEntryForm = ({ index, remove }: { index: number, remove: (index: number) => void }) => {
    const { register } = useFormContext();
    return (
        <Card className="relative">
             <CardHeader><CardTitle>Balance Sheet #{index + 1}</CardTitle><Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button></CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Statement Date</Label><Input type="date" {...register(`balanceSheets.${index}.statementDate`)} /></div>
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                    <div className="space-y-4"><h4 className="font-semibold text-lg text-primary">Assets</h4><div className="pl-4 border-l-2 border-primary/50 space-y-4"><h5 className="font-medium">Non-Current Assets</h5><div className="pl-4 space-y-2 mt-2"><div className="space-y-1"><Label>Property, Plant & Equipment</Label><Input type="number" placeholder="0.00" {...register(`balanceSheets.${index}.ppe`)} /></div><div className="space-y-1"><Label>Intangible Assets</Label><Input type="number" placeholder="0.00" {...register(`balanceSheets.${index}.intangibleAssets`)} /></div><div className="space-y-1"><Label>Financial Assets</Label><Input type="number" placeholder="0.00" {...register(`balanceSheets.${index}.financialAssets`)} /></div></div><h5 className="font-medium">Current Assets</h5><div className="pl-4 space-y-2 mt-2"><div className="space-y-1"><Label>Inventories</Label><Input type="number" placeholder="0.00" {...register(`balanceSheets.${index}.inventories`)} /></div><div className="space-y-1"><Label>Trade & Other Receivables</Label><Input type="number" placeholder="0.00" {...register(`balanceSheets.${index}.receivables`)} /></div><div className="space-y-1"><Label>Cash & Cash Equivalents</Label><Input type="number" placeholder="0.00" {...register(`balanceSheets.${index}.cash`)} /></div></div></div><div className="font-bold text-lg border-t pt-2 mt-4 flex justify-between"><span>Total Assets</span><span>R 0.00</span></div></div>
                    <div className="space-y-4"><h4 className="font-semibold text-lg text-primary">Equity & Liabilities</h4><div className="pl-4 border-l-2 border-primary/50 space-y-4"><h5 className="font-medium">Equity</h5><div className="pl-4 space-y-2 mt-2"><div className="space-y-1"><Label>Share Capital</Label><Input type="number" placeholder="0.00" {...register(`balanceSheets.${index}.shareCapital`)} /></div><div className="space-y-1"><Label>Retained Earnings</Label><Input type="number" placeholder="0.00" {...register(`balanceSheets.${index}.retainedEarnings`)} /></div></div><h5 className="font-medium">Non-Current Liabilities</h5><div className="pl-4 space-y-2 mt-2"><div className="space-y-1"><Label>Long-Term Borrowings</Label><Input type="number" placeholder="0.00" {...register(`balanceSheets.${index}.longTermDebt`)} /></div><div className="space-y-1"><Label>Lease Liabilities</Label><Input type="number" placeholder="0.00" {...register(`balanceSheets.${index}.leaseLiabilities`)} /></div></div><h5 className="font-medium">Current Liabilities</h5><div className="pl-4 space-y-2 mt-2"><div className="space-y-1"><Label>Trade & Other Payables</Label><Input type="number" placeholder="0.00" {...register(`balanceSheets.${index}.payables`)} /></div><div className="space-y-1"><Label>Short-Term Borrowings</Label><Input type="number" placeholder="0.00" {...register(`balanceSheets.${index}.shortTermDebt`)} /></div><div className="space-y-1"><Label>Current Tax Payable</Label><Input type="number" placeholder="0.00" {...register(`balanceSheets.${index}.taxPayable`)} /></div></div></div><div className="font-bold text-lg border-t pt-2 mt-4 flex justify-between"><span>Total Equity & Liabilities</span><span>R 0.00</span></div></div>
                </div>
            </CardContent>
        </Card>
    );
};

const StepBalanceSheet = () => {
    const { control } = useFormContext();
    const { fields, append, remove } = useFieldArray({ name: 'balanceSheets', control });
    return <div className="space-y-6"><Button type="button" variant="outline" size="sm" onClick={() => append({})}><PlusCircle className="mr-2 h-4 w-4" />Add Balance Sheet</Button>{fields.map((field, index) => <BalanceSheetEntryForm key={field.id} index={index} remove={remove} />)}</div>;
};

const IncomeStatementEntryForm = ({ index, remove }: { index: number, remove: (index: number) => void }) => {
    const { register } = useFormContext();
    return (
        <Card className="relative">
            <CardHeader><CardTitle>Income Statement #{index + 1}</CardTitle><Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button></CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Statement Date</Label><Input type="date" {...register(`incomeStatements.${index}.statementDate`)} /></div>
                <div className="space-y-2"><Label>Revenue</Label><Input type="number" placeholder="0.00" {...register(`incomeStatements.${index}.revenue`)} /></div>
                <div className="space-y-2"><Label>Cost of Sales</Label><Input type="number" placeholder="0.00" {...register(`incomeStatements.${index}.cogs`)} /></div>
                <p className="flex justify-between font-semibold"><span>Gross Profit</span><span>R 0.00</span></p>
                <Separator />
                <div className="space-y-2"><Label>Other Income</Label><Input type="number" placeholder="0.00" {...register(`incomeStatements.${index}.otherIncome`)} /></div>
                <div className="space-y-2"><Label>Operating Expenses</Label><Input type="number" placeholder="0.00" {...register(`incomeStatements.${index}.opex`)} /></div>
                <p className="flex justify-between font-semibold"><span>Operating Profit</span><span>R 0.00</span></p>
                <Separator />
                 <div className="space-y-2"><Label>Finance Costs</Label><Input type="number" placeholder="0.00" {...register(`incomeStatements.${index}.financeCosts`)} /></div>
                <p className="flex justify-between font-semibold"><span>Profit Before Tax</span><span>R 0.00</span></p>
                <Separator />
                  <div className="space-y-2"><Label>Income Tax Expense</Label><Input type="number" placeholder="0.00" {...register(`incomeStatements.${index}.tax`)} /></div>
                <p className="flex justify-between font-bold text-lg text-primary border-t pt-2 mt-2"><span>Profit for the Period</span><span>R 0.00</span></p>
            </CardContent>
        </Card>
    );
};

const StepIncomeStatement = () => {
    const { control } = useFormContext();
    const { fields, append, remove } = useFieldArray({ name: 'incomeStatements', control });
    return <div className="space-y-6"><Button type="button" variant="outline" size="sm" onClick={() => append({})}><PlusCircle className="mr-2 h-4 w-4" />Add Income Statement</Button>{fields.map((field, index) => <IncomeStatementEntryForm key={field.id} index={index} remove={remove} />)}</div>;
};


const StepReview = () => {
    const { getValues } = useFormContext();
    return <pre className="whitespace-pre-wrap bg-muted p-4 rounded-md text-xs">{JSON.stringify(getValues(), null, 2)}</pre>;
};

// --- Wizard Component ---
export default function PartnerWizard({ partnerData, partnerType, onBack, onSaveSuccess }: { partnerData?: any; partnerType: string; onBack: () => void; onSaveSuccess: () => void; }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    
    const methods = useForm<PartnerFormValues>({
        resolver: zodResolver(partnerSchema),
        mode: 'onChange',
        defaultValues: partnerData || defaultValues
    });
    
    const handleNext = async () => {
        const currentStepConfig = steps[currentStep];
        if (!currentStepConfig) return;

        let isValid = false;
        if (currentStepConfig.fields) {
            isValid = await methods.trigger(currentStepConfig.fields as (keyof PartnerFormValues)[]);
        } else {
            isValid = true;
        }

        if (isValid && currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            if(!isValid) {
                 toast({ variant: 'destructive', title: 'Validation Error', description: 'Please correct the errors before proceeding.' });
            }
        }
    };
    const handleBack = () => { currentStep > 0 ? setCurrentStep(prev => prev - 1) : onBack(); };
    
    const onSubmit = async (values: PartnerFormValues) => {
        setIsLoading(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            const collectionName = partnerType === 'Debtors' ? 'lendingClients' : 'lendingPartners';
            const action = partnerType === 'Debtors' ? 'saveLendingClient' : 'saveLendingPartner';
            const payloadKey = partnerType === 'Debtors' ? 'client' : 'partner';

            const payload = { [payloadKey]: { id: partnerData?.id, type: partnerType.slice(0, -1).toLowerCase(), ...values } };
            
            const response = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            
            toast({ title: `${partnerType.slice(0, -1)} Saved`, description: `Details for ${values.name} have been saved.` });
            onSaveSuccess();
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error Saving', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    const isStepValid = (stepIndex: number) => {
        if (stepIndex < 0) return true;
        const step = steps[stepIndex];
        return step.fields ? step.fields.every(field => !methods.formState.errors[field as keyof typeof methods.formState.errors]) : true;
    };
    
    const renderStepContent = () => {
        const stepId = steps[currentStep]?.id;
        switch (stepId) {
            case 'main': return <StepMain />;
            case 'address': return <StepAddress />;
            case 'contact': return <StepContact />;
            case 'owners': return <StepOwners />;
            case 'management': return <StepManagement />;
            case 'banking': return <StepBanking />;
            case 'balance-sheet': return <StepBalanceSheet />;
            case 'income-statement': return <StepIncomeStatement />;
            case 'review': return <StepReview />;
            default: return null;
        }
    };

    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
                    <div className="flex flex-col gap-2 border-r pr-4">
                        {steps.map((step, index) => {
                            const isCompleted = index < currentStep && isStepValid(index);
                            return (
                                <Button key={step.id} variant={currentStep === index ? 'default' : 'ghost'} className="justify-start gap-2" onClick={() => setCurrentStep(index)} disabled={index > currentStep && !isStepValid(currentStep - 1)}>
                                    {isCompleted ? <Check className="h-5 w-5 text-green-500" /> : <div className="h-5 w-5" />}
                                    {step.name}
                                </Button>
                            )
                        })}
                    </div>
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">{steps[currentStep].name}</h2>
                        {renderStepContent()}
                        <div className="flex justify-between pt-8 mt-8 border-t">
                            <Button type="button" variant="outline" onClick={handleBack}><ArrowLeft className="mr-2 h-4 w-4" /> {currentStep === 0 ? 'Back to List' : 'Back'}</Button>
                            {currentStep < steps.length - 1 ? (
                                <Button type="button" onClick={handleNext}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
                            ) : (
                                <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>} Save {partnerType.slice(0, -1)}</Button>
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </FormProvider>
    );
}

