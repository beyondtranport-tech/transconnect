
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Star, UserPlus, Store, Package, Sparkles, Edit, Video, Search, Truck, Building, Users, Handshake, Briefcase, Bot, Code, ShieldCheck, Warehouse, PlusCircle, Gift, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getClientSideAuthToken } from '@/firebase';
import { useConfig } from '@/hooks/use-config';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const iconMap: { [key: string]: React.ElementType } = {
    Star, UserPlus, Store, Package, Search, Sparkles, Edit, Video, Truck, Building, Users, Handshake, Briefcase, Bot, Code, ShieldCheck, Warehouse, Gift
};

const initialActionGroups = [
    {
        groupTitle: 'General Platform Actions',
        actions: [
            { id: 'userSignupPoints', label: 'Sign up for an account', icon: 'UserPlus' },
            { id: 'shopCreationPoints', label: 'Create a Vendor Shop', icon: 'Store' },
            { id: 'productAddPoints', label: 'Add a Product to Shop', icon: 'Package' },
            { id: 'loadBoardCreationPoints', label: 'Create a Load Board', icon: 'Truck' },
        ]
    },
    {
        groupTitle: 'AI Marketing & Content Studio',
        actions: [
            { id: 'seoBoosterPoints', label: 'Use AI SEO Booster', icon: 'Search' },
            { id: 'aiImageGeneratorPoints', label: 'Use AI Image Generator', icon: 'Sparkles' },
            { id: 'imageEnhancerPoints', label: 'Use AI Image Enhancer', icon: 'Edit' },
            { id: 'aiVideoGeneratorPoints', label: 'Use AI Video Generator', icon: 'Video' },
        ]
    },
    {
        groupTitle: 'Data Contributions',
        actions: [
            { id: 'truckContributionPoints', label: 'Contribute Truck Data', icon: 'Truck' },
            { id: 'trailerContributionPoints', label: 'Contribute Trailer Data', icon: 'Warehouse' },
            { id: 'supplierContributionPoints', label: 'Contribute Supplier Data', icon: 'Building' },
            { id: 'debtorContributionPoints', label: 'Contribute Debtor Data', icon: 'Users' },
        ]
    },
    {
        groupTitle: 'Partner & Network Actions',
        actions: [
            { id: 'partnerReferralPoints', label: 'Refer a New Member', icon: 'Handshake' },
            { id: 'associateServiceListingPoints', label: 'Associate Lists a Service', icon: 'Briefcase' },
            { id: 'isaSaleCommissionPoints', label: 'ISA Completes a Sale', icon: 'Bot' },
            { id: 'driverSafetyRecordPoints', label: 'Driver Uploads Safety Record', icon: 'ShieldCheck' },
            { id: 'developerApiIntegrationPoints', label: 'Developer Completes API Integration', icon: 'Code' },
        ]
    }
];

const availableIcons = Object.keys(iconMap);

const addActionSchema = z.object({
    label: z.string().min(3, "Label must be at least 3 characters."),
    group: z.string().min(1, "Please select a group."),
    icon: z.string().min(1, "Please select an icon."),
});
type AddActionFormValues = z.infer<typeof addActionSchema>;

function AddActionDialog({ actionGroups, onActionAdded }: { actionGroups: any[], onActionAdded: (action: any) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const addActionForm = useForm<AddActionFormValues>({
        resolver: zodResolver(addActionSchema),
        defaultValues: { label: '', group: '', icon: '' }
    });

    const existingGroups = useMemo(() => [...new Set(actionGroups.map(g => g.groupTitle))], [actionGroups]);

    const handleAddAction = (values: AddActionFormValues) => {
        const generateId = (label: string) => {
            const camelCase = label.replace(/\s(.)/g, function(a) { return a.toUpperCase(); })
                                 .replace(/\s/g, '')
                                 .replace(/^(.)/, function(b) { return b.toLowerCase(); });
            return `${camelCase.replace(/[^a-zA-Z0-9]/g, '')}Action`; // Use 'Action' instead of 'Points'
        };
        
        const newAction = {
            id: generateId(values.label),
            label: values.label,
            icon: values.icon,
            group: values.group,
        };
        onActionAdded(newAction);
        setIsOpen(false);
        addActionForm.reset();
    };

    return (
         <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add Action</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Loyalty Action</DialogTitle>
                    <DialogDescription>Define a new action that members can perform.</DialogDescription>
                </DialogHeader>
                <Form {...addActionForm}>
                    <form onSubmit={addActionForm.handleSubmit(handleAddAction)} className="space-y-4">
                        <FormField
                            control={addActionForm.control}
                            name="label"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Action Label</FormLabel>
                                    <FormControl><Input {...field} placeholder="e.g., Review a Product" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={addActionForm.control}
                            name="group"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Group</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a group..." /></SelectTrigger></FormControl>
                                        <SelectContent>{existingGroups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={addActionForm.control}
                            name="icon"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Icon</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select an icon..." /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {availableIcons.map(iconName => {
                                                const IconComponent = iconMap[iconName];
                                                return (
                                                    <SelectItem key={iconName} value={iconName}>
                                                        <div className="flex items-center gap-2">
                                                            <IconComponent className="h-4 w-4"/>
                                                            {iconName}
                                                        </div>
                                                    </SelectItem>
                                                )
                                            })}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit">Add Action</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function ActionPlanSettings() {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    
    const { data: configData, isLoading: isConfigLoading, forceRefresh } = useConfig<any>('loyaltyActionDefinitions');

    const [actionGroups, setActionGroups] = useState(initialActionGroups);
    
    useEffect(() => {
        if (configData && configData.actionGroups) {
          setActionGroups(configData.actionGroups);
        }
    }, [configData]);
    
    const handleActionAdded = (newAction: { id: string, label: string, icon: string, group: string }) => {
        setActionGroups(currentGroups => {
            const newGroups = JSON.parse(JSON.stringify(currentGroups));
            const groupIndex = newGroups.findIndex((g: any) => g.groupTitle === newAction.group);
            if (groupIndex !== -1) {
                newGroups[groupIndex].actions.push({ id: newAction.id, label: newAction.label, icon: newAction.icon });
            }
            return newGroups;
        });
    };

    const handleActionDeleted = (groupTitle: string, actionId: string) => {
        setActionGroups(currentGroups => {
            const newGroups = JSON.parse(JSON.stringify(currentGroups));
            const groupIndex = newGroups.findIndex((g: any) => g.groupTitle === groupTitle);
            if (groupIndex !== -1) {
                newGroups[groupIndex].actions = newGroups[groupIndex].actions.filter((a: any) => a.id !== actionId);
            }
            return newGroups;
        });
    };
    
    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            await fetch('/api/updateConfigDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: 'configuration/loyaltyActionDefinitions',
                    data: { actionGroups, updatedAt: { _methodName: 'serverTimestamp' } }
                }),
            });
            
            toast({ title: 'Action Plan Saved!', description: 'Your list of available actions has been updated.' });
            forceRefresh();

        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: e.message });
        } finally {
            setIsSaving(false);
        }
    };


  return (
    <Card className="w-full max-w-4xl">
        <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-4">
                <Star className="h-8 w-8 text-primary"/>
                <div>
                    <CardTitle>Action Plan</CardTitle>
                    <CardDescription>
                       Define the list of actions members can perform. Point values are set in the Loyalty Plan.
                    </CardDescription>
                </div>
            </div>
             <AddActionDialog actionGroups={actionGroups} onActionAdded={handleActionAdded} />
        </CardHeader>
        <CardContent>
            {isConfigLoading ? (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="space-y-8">
                     <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-full">Action</TableHead>
                                    <TableHead className="text-right">Manage</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {actionGroups.map((group) => (
                                    <React.Fragment key={group.groupTitle}>
                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                            <TableCell colSpan={2} className="font-semibold text-primary">{group.groupTitle}</TableCell>
                                        </TableRow>
                                        {group.actions.map((action: any) => {
                                            const IconComponent = iconMap[action.icon] || Star;
                                            return (
                                                <TableRow key={action.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3 font-normal">
                                                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                                                            {action.label}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                         <Button variant="ghost" size="icon" onClick={() => handleActionDeleted(group.groupTitle, action.id)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                     </div>
                    <Button onClick={handleSaveChanges} disabled={isSaving} className="mt-8">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Action List
                    </Button>
                </div>
            )}
        </CardContent>
    </Card>
  );
}
