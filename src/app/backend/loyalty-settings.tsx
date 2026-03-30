
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
import { Loader2, Save, Star, UserPlus, Store, Package, Sparkles, Edit, Video, Search, Truck, Building, Users, Handshake, Briefcase, Bot, Code, ShieldCheck, Warehouse, PlusCircle, Gift, Trash2, MoreVertical, Eye, CheckCircle, XCircle, FileText } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { roles as availableRolesList } from '@/lib/roles';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const iconMap: { [key: string]: React.ElementType } = {
    Star, UserPlus, Store, Package, Search, Sparkles, Edit, Video, Truck, Building, Users, Handshake, Briefcase, Bot, Code, ShieldCheck, Warehouse, Gift, FileText
};

const initialActionGroups = [
    {
        groupTitle: 'General Platform Actions',
        actions: [
            { id: 'userSignupPoints', label: 'Sign up for an account', icon: 'UserPlus', isActive: true, roles: ['all'] },
            { id: 'aiVideoGeneratorPoints', label: 'Use AI Video Ad Generator', icon: 'Video', isActive: true, roles: ['all'] },
        ]
    },
    {
        groupTitle: 'Vendor Actions',
        actions: [
            { id: 'shopCreationPoints', label: 'Create a Vendor Shop', icon: 'Store', isActive: true, roles: ['vendor'] },
            { id: 'productAddPoints', label: 'Add a Product to Shop', icon: 'Package', isActive: true, roles: ['vendor'] },
            { id: 'seoBoosterPoints', label: 'Use AI SEO Booster', icon: 'Search', isActive: true, roles: ['vendor'] },
            { id: 'aiImageGeneratorPoints', label: 'Use AI Image Generator', icon: 'Sparkles', isActive: true, roles: ['vendor'] },
            { id: 'imageEnhancerPoints', label: 'Use AI Image Enhancer', icon: 'Edit', isActive: true, roles: ['vendor'] },
            { id: 'supplierContributionPoints', label: 'Contribute Supplier Data', icon: 'Building', isActive: true, roles: ['vendor'] },
        ]
    },
     {
        groupTitle: 'Transporter Actions',
        actions: [
            { id: 'loadBoardCreationPoints', label: 'Create a Load Board', icon: 'Truck', isActive: true, roles: ['transporter'] },
            { id: 'truckContributionPoints', label: 'Contribute Truck Data', icon: 'Truck', isActive: true, roles: ['transporter'] },
            { id: 'trailerContributionPoints', label: 'Contribute Trailer Data', icon: 'Warehouse', isActive: true, roles: ['transporter'] },
            { id: 'uploadRc1', label: 'Upload RC1 Certificate', icon: 'FileText', isActive: true, roles: ['transporter'] },
            { id: 'debtorContributionPoints', label: 'Contribute Debtor Data', icon: 'Users', isActive: true, roles: ['transporter'] },
        ]
    },
    {
        groupTitle: 'Partner & Network Actions',
        actions: [
            { id: 'partnerReferralPoints', label: 'Refer a New Member', icon: 'Handshake', isActive: true, roles: ['all'] },
            { id: 'associateServiceListingPoints', label: 'Associate Lists a Service', icon: 'Briefcase', isActive: true, roles: ['associate'] },
            { id: 'isaSaleCommissionPoints', label: 'ISA Completes a Sale', icon: 'Bot', isActive: true, roles: ['isa-agent'] },
            { id: 'driverSafetyRecordPoints', label: 'Driver Uploads Safety Record', icon: 'ShieldCheck', isActive: true, roles: ['driver'] },
            { id: 'developerApiIntegrationPoints', label: 'Developer Completes API Integration', icon: 'Code', isActive: true, roles: ['developer'] },
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
  roles: z.array(z.string()).optional(),
});
type ActionFormValues = z.infer<typeof actionSchema>;

// Zod schema for the points form
const pointsSchema = z.object({
  points: z.record(z.string(), z.coerce.number().min(0, "Points must be non-negative.").optional()),
});
type PointsFormValues = z.infer<typeof pointsSchema>;


function ActionDialog({ action, actionGroups, onSave, open, onOpenChange }: { 
    action?: any, 
    actionGroups: any[], 
    onSave: (action: any) => void,
    open?: boolean,
    onOpenChange?: (open: boolean) => void 
}) {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const { toast } = useToast();

    const isControlled = open !== undefined && onOpenChange !== undefined;
    const isOpen = isControlled ? open : internalIsOpen;
    const setIsOpen = isControlled ? onOpenChange : setInternalIsOpen;

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
                    roles: action.roles || [],
                });
            } else {
                form.reset({ label: '', group: '', icon: '', isActive: true, roles: [] });
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
            isActive: values.isActive,
            roles: values.roles,
        };
        onSave(newAction);
        setIsOpen(false);
        form.reset();
    };

    const rolesWithAll = [{ id: 'all', title: 'All Roles' }, ...availableRolesList];

    return (
         <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {!isControlled && (
                <DialogTrigger asChild>
                    <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add Action</Button>
                </DialogTrigger>
            )}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{action ? 'Edit' : 'Add New'} Loyalty Action</DialogTitle>
                    <DialogDescription>Define a new action that members can perform.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                        <FormField control={form.control} name="label" render={({ field }) => ( <FormItem><FormLabel>Action Label</FormLabel><FormControl><Input {...field} placeholder="e.g., Review a Product" /></FormControl><FormMessage /></FormItem> )} />
                         <FormField control={form.control} name="group" render={({ field }) => ( <FormItem><FormLabel>Group</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a group..." /></SelectTrigger></FormControl><SelectContent>{existingGroups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                         <FormField control={form.control} name="icon" render={({ field }) => ( <FormItem><FormLabel>Icon</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select an icon..." /></SelectTrigger></FormControl><SelectContent> {availableIcons.map(iconName => { const IconComponent = iconMap[iconName]; return ( <SelectItem key={iconName} value={iconName}><div className="flex items-center gap-2"><IconComponent className="h-4 w-4"/>{iconName}</div></SelectItem> ) })} </SelectContent></Select><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="isActive" render={({ field }) => ( <FormItem className="flex items-center space-x-2 pt-2"><FormControl><Switch checked={field.value} onCheckedChange={field.onChange}/></FormControl><FormLabel>Active</FormLabel></FormItem> )} />
                        <FormField
                            control={form.control}
                            name="roles"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Applicable Roles</FormLabel>
                                    <div className="p-2 border rounded-md grid grid-cols-2 gap-2">
                                        {rolesWithAll.map((role) => (
                                            <FormField
                                                key={role.id}
                                                control={form.control}
                                                name="roles"
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem key={role.id} className="flex flex-row items-center space-x-2 space-y-0">
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(role.id)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([...(field.value || []), role.id])
                                                                            : field.onChange(field.value?.filter((value) => value !== role.id));
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="text-sm font-normal">{role.title}</FormLabel>
                                                        </FormItem>
                                                    );
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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
    const [isAddOpen, setIsAddOpen] = useState(false);
    
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
                    // This is an edit
                    const existingAction = group.actions[actionIndex];
                    group.actions[actionIndex] = { ...existingAction, ...newActionData };
                    found = true;
                    // If group changed, move it
                    if (existingAction.groupTitle !== newActionData.groupTitle) {
                        group.actions.splice(actionIndex, 1);
                        const newGroupIndex = newGroups.findIndex((g:any) => g.groupTitle === newActionData.groupTitle);
                        if (newGroupIndex !== -1) {
                            newGroups[newGroupIndex].actions.push(group.actions[actionIndex]);
                        } else {
                             newGroups.push({ groupTitle: newActionData.groupTitle, actions: [group.actions[actionIndex]] });
                        }
                    }
                    break;
                }
            }
            // If not found, add it
            if (!found) {
                const groupIndex = newGroups.findIndex((g: any) => g.groupTitle === newActionData.groupTitle);
                const actionToAdd = { id: newActionData.id, label: newActionData.label, icon: newActionData.icon, isActive: newActionData.isActive, roles: newActionData.roles };
                if (groupIndex !== -1) {
                    newGroups[groupIndex].actions.push(actionToAdd);
                } else {
                     newGroups.push({ groupTitle: newActionData.groupTitle, actions: [actionToAdd] });
                }
                form.setValue(`points.${newActionData.id}`, 0);
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
        <Card className="w-full max-w-6xl">
            {isAddOpen && <ActionDialog open={isAddOpen} onOpenChange={setIsAddOpen} actionGroups={actionGroups} onSave={handleActionSave} />}
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
                        <Button type="button" variant="outline" onClick={() => setIsAddOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Action
                        </Button>
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
                                            <TableHead>Roles</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="w-[180px]">Points Awarded</TableHead>
                                            <TableHead className="text-right w-[80px]">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {allActions.map((action: any) => {
                                            return (
                                                <TableRow key={action.id}>
                                                    <TableCell className="font-medium flex items-center gap-2">
                                                        {iconMap[action.icon] && React.createElement(iconMap[action.icon], { className: "h-4 w-4 text-muted-foreground" })}
                                                        {action.label}
                                                    </TableCell>
                                                    <TableCell><Badge variant="outline">{action.groupTitle}</Badge></TableCell>
                                                     <TableCell>
                                                        <div className="flex flex-wrap gap-1">
                                                            {(action.roles || []).map((role: string) => (
                                                                <Badge key={role} variant="secondary" className="capitalize">{role}</Badge>
                                                            ))}
                                                        </div>
                                                    </TableCell>
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

```
- src/lib/roles.ts
<content><![CDATA[
import { ShoppingCart, Truck, Handshake, Briefcase, Bot, Users, Code } from "lucide-react";
import * as React from "react";
import data from '@/lib/placeholder-images.json';

const { placeholderImages } = data;

const roleImages = {
    vendor: placeholderImages.find(p => p.id === 'mall-division')!,
    transporter: placeholderImages.find(p => p.id === 'marketplace-division')!,
    partner: placeholderImages.find(p => p.id === 'funding-division')!,
    associate: placeholderImages.find(p => p.id === 'value-integrity')!,
    'isa-agent': placeholderImages.find(p => p.id === 'tech-home')!,
    driver: placeholderImages.find(p => p.id === 'value-community')!,
    developer: placeholderImages.find(p => p.id === 'tech-division')!,
};


export const roles = [
    {
        id: "vendor",
        icon: ShoppingCart,
        title: "Vendors",
        description: "Sell parts, equipment, and services directly to a targeted market of transport professionals.",
        cta: "Become a Vendor",
        longDescription: "As a vendor, you gain direct access to a dedicated marketplace of transport businesses actively seeking parts, equipment, and essential services. Showcase your products, reach qualified buyers, and grow your business by becoming a trusted supplier within the Logistics Flow ecosystem.",
        image: roleImages.vendor
    },
    {
        id: "transporter",
        icon: Truck,
        title: "Transporters",
        description: "Sell transport services. Source parts, services and products to buy from a trusted community network",
        cta: "Become a Transporter",
        longDescription: "As a transporter, you can efficiently source high-quality vehicles, parts, and services from a network of vetted vendors and fellow transporters, while also marketing your own transport services to the community. Leverage our marketplace to find competitive pricing, reliable partners, and new customers, ensuring your fleet stays on the road and operates efficiently.",
        image: roleImages.transporter
    },
    {
        id: "partner",
        icon: Handshake,
        title: "Partners",
        description: "Collaborate with us as a strategic partner to enable growth and provide value-added services.",
        cta: "Become a Partner",
        longDescription: "Strategic partners are the enablers of our ecosystem. Whether you're in finance, insurance, or another value-added service, partnering with Logistics Flow allows you to offer your solutions to a captive audience of transport professionals, creating synergistic growth opportunities.",
        image: roleImages.partner
    },
    {
        id: "affiliate",
        icon: Briefcase,
        title: "Affiliates",
        description: "Join as a professional marketer and earn. Generate opportunities for our ecosystem and earn commission.",
        cta: "Become an Affiliate",
        longDescription: "Affiliates are marketing professionals who drive growth by generating opportunities for the Logistics Flow ecosystem. If you have a knack for digital marketing, content creation, or lead generation, this role is for you. You'll earn commissions for new members you bring in and for the activity they generate, turning your marketing skills into a revenue stream.",
        image: roleImages.associate
    },
    {
        id: "isa-agent",
        icon: Bot,
        title: "ISA Agents",
        description: "Top-performing referrers can achieve ISA status, unlocking higher commission tiers and exclusive bonuses.",
        cta: "Become an ISA Agent",
        longDescription: "The Independent Sales Agent (ISA) program is an elite tier for our most active and successful referrers. By consistently bringing new members and facilitating service sales, you can be invited to the ISA program, which grants access to higher commissions, performance bonuses, and a closer working relationship with the Logistics Flow team. It's the ultimate level for those who want to turn referrals into a significant revenue stream.",
        image: roleImages['isa-agent']
    },
    {
        id: "driver",
        icon: Users,
        title: "Drivers",
        description: "Find job opportunities, access resources, and connect with other professional drivers.",
        cta: "Become a Driver",
        longDescription: "Professional drivers are the backbone of the industry. As a driver member, you can find job opportunities, access training resources, and connect with a community of your peers. Whether you're an owner-operator or looking for your next role, Logistics Flow is your partner on the road.",
        image: roleImages.driver
    },
    {
        id: "developer",
        icon: Code,
        title: "Developers",
        description: "Integrate with our APIs and build innovative applications on top of the Logistics Flow platform.",
        cta: "Become a Developer",
        longDescription: "Innovate with us. As a developer, you can access Logistics Flow's powerful APIs to build new applications and integrations that serve the transport industry. Join our developer community to create the next generation of logistics technology.",
        image: roleImages.developer
    }
]
