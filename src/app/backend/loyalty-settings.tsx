'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { Loader2, Save, Star, UserPlus, Store, Package, Sparkles, Edit, Video, Search, Truck, Building, Users, Handshake, Briefcase, Bot, Code, ShieldCheck, Warehouse, PlusCircle, Gift, Trash2, MoreVertical, Eye, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { getClientSideAuthToken } from '@/firebase';
import { useConfig } from '@/hooks/use-config';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';


const iconMap: { [key: string]: React.ElementType } = {
    Star, UserPlus, Store, Package, Search, Sparkles, Edit, Video, Truck, Building, Users, Handshake, Briefcase, Bot, Code, ShieldCheck, Warehouse, Gift
};

const initialActionGroups = [
    {
        groupTitle: 'General Platform Actions',
        actions: [
            { id: 'userSignupPoints', label: 'Sign up for an account', icon: 'UserPlus', isActive: true },
            { id: 'shopCreationPoints', label: 'Create a Vendor Shop', icon: 'Store', isActive: true },
            { id: 'productAddPoints', label: 'Add a Product to Shop', icon: 'Package', isActive: true },
            { id: 'loadBoardCreationPoints', label: 'Create a Load Board', icon: 'Truck', isActive: true },
        ]
    },
    {
        groupTitle: 'AI Marketing & Content Studio',
        actions: [
            { id: 'seoBoosterPoints', label: 'Use AI SEO Booster', icon: 'Search', isActive: true },
            { id: 'aiImageGeneratorPoints', label: 'Use AI Image Generator', icon: 'Sparkles', isActive: true },
            { id: 'imageEnhancerPoints', label: 'Use AI Image Enhancer', icon: 'Edit', isActive: true },
            { id: 'aiVideoGeneratorPoints', label: 'Use AI Video Ad Generator', icon: 'Video', isActive: true },
        ]
    },
    {
        groupTitle: 'Data Contributions',
        actions: [
            { id: 'truckContributionPoints', label: 'Contribute Truck Data', icon: 'Truck', isActive: true },
            { id: 'trailerContributionPoints', label: 'Contribute Trailer Data', icon: 'Warehouse', isActive: true },
            { id: 'supplierContributionPoints', label: 'Contribute Supplier Data', icon: 'Building', isActive: true },
            { id: 'debtorContributionPoints', label: 'Contribute Debtor Data', icon: 'Users', isActive: true },
        ]
    },
    {
        groupTitle: 'Partner & Network Actions',
        actions: [
            { id: 'partnerReferralPoints', label: 'Refer a New Member', icon: 'Handshake', isActive: true },
            { id: 'associateServiceListingPoints', label: 'Associate Lists a Service', icon: 'Briefcase', isActive: true },
            { id: 'isaSaleCommissionPoints', label: 'ISA Completes a Sale', icon: 'Bot', isActive: true },
            { id: 'driverSafetyRecordPoints', label: 'Driver Uploads Safety Record', icon: 'ShieldCheck', isActive: true },
            { id: 'developerApiIntegrationPoints', label: 'Developer Completes API Integration', icon: 'Code', isActive: true },
        ]
    }
];

const availableIcons = Object.keys(iconMap);

const actionSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(3, "Label must be at least 3 characters."),
  group: z.string().min(1, "Please select a group."),
  icon: z.string().min(1, "Please select an icon."),
  isActive: z.boolean().default(true),
});
type ActionFormValues = z.infer<typeof actionSchema>;

// Zod schema for the points form
const pointsSchema = z.object({
  points: z.record(z.string(), z.coerce.number().min(0, "Points must be non-negative.").optional()),
});
type PointsFormValues = z.infer<typeof pointsSchema>;


function ActionDialog({ action, actionGroups, onSave }: { action?: any, actionGroups: any[], onSave: (action: any) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    
    const form = useForm<ActionFormValues>({
        resolver: zodResolver(actionSchema),
    });

    const existingGroups = useMemo(() => [...new Set(actionGroups.map(g => g.groupTitle))], [actionGroups]);

    useEffect(() => {
        if(isOpen) {
            if (action) {
                form.reset({
                    id: action.id,
                    label: action.label,
                    group: action.groupTitle,
                    icon: action.icon,
                    isActive: action.isActive,
                });
            } else {
                form.reset({ label: '', group: '', icon: '', isActive: true });
            }
        }
    }, [isOpen, action, form]);


    const handleSave = (values: ActionFormValues) => {
        const generateId = (label: string) => {
            const camelCase = label.replace(/\s(.)/g, function(a) { return a.toUpperCase(); })
                                 .replace(/\s/g, '')
                                 .replace(/^(.)/, function(b) { return b.toLowerCase(); });
            return `${camelCase.replace(/[^a-zA-Z0-9]/g, '')}Points`;
        };
        
        const newAction = {
            id: values.id || generateId(values.label),
            label: values.label,
            icon: values.icon,
            groupTitle: values.group,
            isActive: values.isActive
        };
        onSave(newAction);
        setIsOpen(false);
        form.reset();
    };

    return (
         <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {action ? <DropdownMenuItem onSelect={e=>e.preventDefault()}>Edit</DropdownMenuItem> : <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add Action</Button>}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{action ? 'Edit' : 'Add New'} Loyalty Action</DialogTitle>
                    <DialogDescription>Define a new action that members can perform.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                        <FormField control={form.control} name="label" render={({ field }) => ( <FormItem><FormLabel>Action Label</FormLabel><FormControl><Input {...field} placeholder="e.g., Review a Product" /></FormControl><FormMessage /></FormItem> )} />
                         <FormField control={form.control} name="group" render={({ field }) => ( <FormItem><FormLabel>Group</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a group..." /></SelectTrigger></FormControl><SelectContent>{existingGroups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                         <FormField control={form.control} name="icon" render={({ field }) => ( <FormItem><FormLabel>Icon</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select an icon..." /></SelectTrigger></FormControl><SelectContent> {availableIcons.map(iconName => { const IconComponent = iconMap[iconName]; return ( <SelectItem key={iconName} value={iconName}><div className="flex items-center gap-2"><IconComponent className="h-4 w-4"/>{iconName}</div></SelectItem> ) })} </SelectContent></Select><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="isActive" render={({ field }) => ( <FormItem className="flex items-center space-x-2 pt-2"><FormControl><Switch checked={field.value} onCheckedChange={field.onChange}/></FormControl><FormLabel>Active</FormLabel></FormItem> )} />
                        <DialogFooter><Button type="submit">Save Action</Button></DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function ActionMenu({ action, onEdit, onDelete, onToggleStatus }: { action: any, onEdit: () => void, onDelete: () => void, onToggleStatus: (newStatus: boolean) => void }) {
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    
    return (
        <>
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={onEdit}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                        {action.isActive ? (
                            <DropdownMenuItem onSelect={() => onToggleStatus(false)}><XCircle className="mr-2 h-4 w-4" />Deactivate</DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem onSelect={() => onToggleStatus(true)}><CheckCircle className="mr-2 h-4 w-4" />Activate</DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onSelect={() => setIsDeleteAlertOpen(true)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the action "{action.label}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onDelete} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}


export default function ActionPlanSettings() {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    
    const { data: definitionsConfig, isLoading: isDefLoading, forceRefresh: forceRefreshDefs } = useConfig<any>('loyaltyActionDefinitions');
    const { data: valuesConfig, isLoading: isValuesLoading, forceRefresh: forceRefreshValues } = useConfig<any>('loyaltySettings');

    const [actionGroups, setActionGroups] = useState(initialActionGroups);
    const [editAction, setEditAction] = useState<any | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    
    const form = useForm<PointsFormValues>({
        resolver: zodResolver(pointsSchema),
        defaultValues: { points: {} }
    });

    useEffect(() => {
        if (definitionsConfig?.actionGroups) {
            setActionGroups(definitionsConfig.actionGroups);
        }
    }, [definitionsConfig]);

    useEffect(() => {
        if (valuesConfig) {
            const pointValues = actionGroups.flatMap(g => g.actions).reduce((acc, action) => {
                acc[action.id] = valuesConfig[action.id] ?? 0;
                return acc;
            }, {} as Record<string, number>);
            form.reset({ points: pointValues });
        }
    }, [valuesConfig, actionGroups, form]);
    
    const handleActionSave = useCallback((newActionData: any) => {
        setActionGroups(currentGroups => {
            const newGroups = JSON.parse(JSON.stringify(currentGroups));
            let found = false;
            // Try to update existing action
            for (let group of newGroups) {
                const actionIndex = group.actions.findIndex((a: any) => a.id === newActionData.id);
                if (actionIndex !== -1) {
                    group.actions[actionIndex] = { ...group.actions[actionIndex], ...newActionData };
                    found = true;
                    break;
                }
            }
            // If not found, add it
            if (!found) {
                const groupIndex = newGroups.findIndex((g: any) => g.groupTitle === newActionData.groupTitle);
                if (groupIndex !== -1) {
                    newGroups[groupIndex].actions.push({ id: newActionData.id, label: newActionData.label, icon: newActionData.icon, isActive: newActionData.isActive });
                    form.setValue(`points.${newActionData.id}`, 0);
                } else {
                     // If group doesn't exist, create it (shouldn't happen with the dialog)
                     newGroups.push({ groupTitle: newActionData.groupTitle, actions: [newActionData] });
                }
            }
            return newGroups;
        });
    }, [form]);

    const handleActionDeleted = useCallback((groupTitle: string, actionId: string) => {
        setActionGroups(currentGroups => currentGroups.map(group => {
            if (group.groupTitle === groupTitle) {
                return {
                    ...group,
                    actions: group.actions.filter((a: any) => a.id !== actionId)
                };
            }
            return group;
        }).filter(group => group.actions.length > 0)); 
        
        const currentPoints = form.getValues('points');
        delete currentPoints[actionId];
        form.setValue('points', currentPoints);
    }, [form]);

    const handleToggleStatus = useCallback((groupTitle: string, actionId: string, newStatus: boolean) => {
        setActionGroups(currentGroups => currentGroups.map(group => {
             if (group.groupTitle === groupTitle) {
                return {
                    ...group,
                    actions: group.actions.map((a: any) => a.id === actionId ? { ...a, isActive: newStatus } : a)
                };
            }
            return group;
        }));
    }, []);

    
    const onPointsSubmit = async (data: PointsFormValues) => {
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

            const newSettings = {
                ...valuesConfig, 
                ...data.points,
                updatedAt: { _methodName: 'serverTimestamp' }
            };
            await fetch('/api/updateConfigDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: 'configuration/loyaltySettings',
                    data: newSettings
                }),
            });
            
            toast({ title: 'Settings Saved!', description: 'Actions and their point values have been updated.' });
            forceRefreshDefs();
            forceRefreshValues();

        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: e.message });
        } finally {
            setIsSaving(false);
        }
    };
    
    const isLoading = isDefLoading || isValuesLoading;

    // Flatten the action groups for table rendering
    const allActions = useMemo(() => 
        actionGroups.flatMap(group => 
            group.actions.map(action => ({ ...action, groupTitle: group.groupTitle }))
        ), [actionGroups]);
        
    const openEditDialog = (action: any) => {
        setEditAction(action);
        setIsEditOpen(true);
    };

    return (
        <Card className="w-full max-w-5xl">
            {editAction && <ActionDialog open={isEditOpen} onOpenChange={setIsEditOpen} action={editAction} actionGroups={actionGroups} onSave={handleActionSave} />}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onPointsSubmit)}>
                    <CardHeader className="flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Star className="h-8 w-8 text-primary"/>
                            <div>
                                <CardTitle>Action Plan Settings</CardTitle>
                                <CardDescription>
                                Define actions members can perform and set the loyalty points awarded for each.
                                </CardDescription>
                            </div>
                        </div>
                        <ActionDialog actionGroups={actionGroups} onSave={handleActionSave} />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center items-center py-10">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                             <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[30%]">Action</TableHead>
                                            <TableHead>Group</TableHead>
                                            <TableHead>Icon</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="w-[180px]">Points Awarded</TableHead>
                                            <TableHead className="text-right w-[80px]">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {allActions.map((action: any) => {
                                            const IconComponent = iconMap[action.icon] || Star;
                                            return (
                                                <TableRow key={action.id}>
                                                    <TableCell className="font-medium">{action.label}</TableCell>
                                                    <TableCell><Badge variant="outline">{action.groupTitle}</Badge></TableCell>
                                                    <TableCell><div className="flex items-center gap-2"><IconComponent className="h-4 w-4 text-muted-foreground" /><span className="font-mono text-xs">{action.icon}</span></div></TableCell>
                                                    <TableCell><Badge variant={action.isActive ? 'default' : 'secondary'}>{action.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                                                    <TableCell>
                                                        <FormField
                                                            control={form.control}
                                                            name={`points.${action.id}`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormControl><Input type="number" className="h-8 w-24 text-right" {...field} /></FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <ActionMenu 
                                                          action={action} 
                                                          onEdit={() => openEditDialog(action)}
                                                          onDelete={() => handleActionDeleted(action.groupTitle, action.id)}
                                                          onToggleStatus={(newStatus) => handleToggleStatus(action.groupTitle, action.id, newStatus)}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                             </div>
                        )}
                    </CardContent>
                    <CardFooter>
                         <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save All Settings
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}
