
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { type ColumnDef } from '@/hooks/use-data-table';


// --- Helper Functions and Data ---
async function fetchFromAdminAPI(token: string, action: string, payload?: any) {
    const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || `API Error for action: ${action}`);
    }
    return result;
}

const resources = [
    { id: 'shop', label: 'Shop Management' },
    { id: 'products', label: 'Shop Products' },
    { id: 'staff', label: 'Staff Management' },
    { id: 'billing', label: 'Billing & Invoices' },
    { id: 'enquiries', label: 'Funding Enquiries' },
    { id: 'quotes', label: 'Funding Quotes' },
    { id: 'wallet', label: 'Member Wallet' },
    { id: 'supplierMall', label: 'Supplier Mall' },
    { id: 'transporterMall', label: 'Transporter Mall' },
    { id: 'financeMall', label: 'Finance Mall' },
    { id: 'loads', label: 'Loads Mall' },
    { id: 'buySellMall', label: 'Buy & Sell Mall' },
    { id: 'distributionMall', label: 'Distribution Mall' },
    { id: 'warehouseMall', label: 'Warehouse Mall' },
    { id: 'repurposeMall', label: 'Repurpose Mall' },
    { id: 'aftermarketMall', label: 'Aftermarket Mall' },
    { id: 'marketplaceDigital', label: 'Marketplace: Digital Marketing' },
    { id: 'marketplaceData', label: 'Marketplace: Data Services' },
    { id: 'marketplaceLogistics', label: 'Marketplace: Logistics Networks' },
    { id: 'marketplaceLoyalty', label: 'Marketplace: Loyalty/Incentives' },
    { id: 'tech', label: 'Tech Division Tools' },
    { id: 'contributions', label: 'Data Contributions' },
    { id: 'permissions', label: 'Permissions Management' },
] as const;


const actions = [
    { id: 'view', label: 'View' },
    { id: 'create', label: 'Create' },
    { id: 'edit', label: 'Edit' },
    { id: 'delete', label: 'Delete' },
] as const;


// --- Zod Schema for the Form ---

const permissionsSchema = z.object({
  // Dynamically create keys for each resource
  ...resources.reduce((acc, resource) => {
    acc[resource.id] = z.array(z.string()).optional();
    return acc;
  }, {} as Record<string, z.ZodOptional<z.ZodArray<z.ZodString, "many">>>),
});

type PermissionsFormValues = z.infer<typeof permissionsSchema>;

// --- Components ---

function PermissionsDialog({ staffMember, onSave }: { staffMember: any, onSave: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    // Utility to parse permissions from 'resource:action' format
    const parsePermissions = (permissions: string[] = []): PermissionsFormValues => {
        const parsed: any = {};
        for (const resource of resources) {
            parsed[resource.id] = [];
        }
        for (const p of permissions) {
            const [actionId, resourceId] = p.split(':');
            if (resourceId && parsed[resourceId] && actions.some(a => a.id === actionId)) {
                parsed[resourceId].push(actionId);
            }
        }
        return parsed;
    };
    
    const form = useForm<PermissionsFormValues>({
        resolver: zodResolver(permissionsSchema),
        defaultValues: parsePermissions(staffMember.permissions),
    });

    const watchedPermissions = form.watch();

    const isAllSelected = useMemo(() => {
        return resources.every(resource =>
            actions.every(action =>
                watchedPermissions[resource.id]?.includes(action.id)
            )
        );
    }, [watchedPermissions]);
    
    const handleSelectAll = (checked: boolean) => {
        const allActionIds = actions.map(a => a.id);
        resources.forEach(resource => {
            form.setValue(resource.id, checked ? allActionIds : []);
        });
    };
    
     useEffect(() => {
        if (isOpen) {
            form.reset(parsePermissions(staffMember.permissions));
        }
    }, [isOpen, staffMember, form]);
    
    const processPermissionsForSave = (data: PermissionsFormValues): string[] => {
        const generatedPermissions: string[] = [];
        for (const resourceId in data) {
            const selectedActions = data[resourceId as keyof typeof data];
            if (selectedActions && selectedActions.length > 0) {
                for (const actionId of selectedActions) {
                    generatedPermissions.push(`${actionId}:${resourceId}`);
                }
            }
        }
        return generatedPermissions;
    };
    
    const onSubmit = async (values: PermissionsFormValues) => {
        setIsLoading(true);
        const finalPermissions = processPermissionsForSave(values);
        
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            const response = await fetch('/api/updateUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: `companies/${staffMember.companyId}/staff/${staffMember.id}`,
                    data: { permissions: finalPermissions }
                }),
            });

            if (!response.ok) throw new Error((await response.json()).error || 'Failed to save permissions.');
            
            toast({ title: 'Permissions Saved!', description: `Permissions for ${staffMember.firstName} have been updated.` });
            onSave();
            setIsOpen(false);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Save Failed', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Edit Permissions for {staffMember.firstName} {staffMember.lastName}</DialogTitle>
                    <DialogDescription>
                        Select the actions this staff member can perform on each resource.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                         <div className="rounded-md border p-4 max-h-[60vh] overflow-y-auto">
                            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-2 sticky top-0 bg-background/95 py-2">
                                 <div className="font-semibold flex items-center gap-2">
                                    <Checkbox
                                        checked={isAllSelected}
                                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                        aria-label="Select all permissions"
                                    />
                                     Resource
                                 </div>
                                 {actions.map(action => <div key={action.id} className="font-semibold text-center">{action.label}</div>)}
                            </div>
                            <Separator className="my-2" />
                            {resources.map((resource) => (
                                <FormField
                                    key={resource.id}
                                    control={form.control}
                                    name={resource.id as any}
                                    render={({ field }) => (
                                    <FormItem className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-2 py-2 border-b last:border-b-0">
                                        <FormLabel className="font-normal pl-8">{resource.label}</FormLabel>
                                        {actions.map(action => (
                                            <FormControl key={action.id} className="flex justify-center">
                                                 <Checkbox
                                                    checked={field.value?.includes(action.id)}
                                                    onCheckedChange={(checked) => {
                                                        return checked
                                                        ? field.onChange([...(field.value || []), action.id])
                                                        : field.onChange((field.value || []).filter((value) => value !== action.id))
                                                    }}
                                                />
                                            </FormControl>
                                        ))}
                                    </FormItem>
                                    )}
                                />
                            ))}
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save Permissions
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function PermissionsContent() {
    const { toast } = useToast();
    const [staff, setStaff] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const forceRefresh = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed");
            
            const [staffRes, companiesRes] = await Promise.all([
                fetchFromAdminAPI(token, 'getStaff'),
                fetchFromAdminAPI(token, 'getMembers')
            ]);

            setStaff(staffRes.data || []);
            setCompanies(companiesRes.data || []);

        } catch (e: any) {
            setError(e.message);
            toast({ variant: 'destructive', title: 'Error Loading Data', description: e.message });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        forceRefresh();
    }, [forceRefresh]);

    const enrichedStaff = useMemo(() => {
        if (!staff || !companies) return [];
        const companyMap = new Map(companies.map(c => [c.id, c.companyName]));
        
        return staff.map(s => ({
            ...s,
            id: `${s.companyId}-${s.id}`, // Create a truly unique key for the table
            companyName: companyMap.get(s.companyId) || 'Unknown Company'
        }));
    }, [staff, companies]);


    const columns: ColumnDef<any>[] = useMemo(() => [
        {
          accessorKey: 'name',
          header: 'Staff Member',
          cell: ({ row }) => (
            <div>
              <p className="font-medium">{row.original.firstName} {row.original.lastName}</p>
              <p className="text-xs text-muted-foreground">{row.original.email}</p>
            </div>
          ),
        },
        {
          accessorKey: 'companyName',
          header: 'Company',
           cell: ({ row }) => <div>{row.original.companyName}</div>,
        },
        {
          accessorKey: 'title',
          header: 'Title',
           cell: ({ row }) => <div>{row.original.title}</div>,
        },
        {
          accessorKey: 'role',
          header: 'Role',
           cell: ({ row }) => <Badge variant="outline" className="capitalize">{row.original.role}</Badge>,
        },
        {
          accessorKey: 'function',
          header: 'Function',
           cell: ({ row }) => <Badge variant="secondary" className="capitalize">{row.original.function}</Badge>,
        },
        {
          accessorKey: 'permissions',
          header: 'Permissions',
          cell: ({ row }) => {
            const perms = row.original.permissions;
            return perms && perms.length > 0 
                ? <Badge>{perms.length} assigned</Badge> 
                : <Badge variant="secondary">None</Badge>;
          }
        },
        {
            id: 'actions',
            header: <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="text-right">
                    <PermissionsDialog staffMember={row.original} onSave={forceRefresh} />
                </div>
            ),
        }
    ], [forceRefresh]);
    

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Lock className="h-6 w-6" />
                    <CardTitle>Staff Permissions</CardTitle>
                </div>
                <CardDescription>
                    Select a staff member to directly manage their permissions for accessing and modifying resources.
                </CardDescription>
            </CardHeader>
            <CardContent>
               {isLoading ? (
                    <div className="flex justify-center items-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
               ) : error ? (
                    <div className="text-destructive text-center py-10">{error}</div>
               ) : (
                    <DataTable columns={columns} data={enrichedStaff} />
               )}
            </CardContent>
        </Card>
    );
}
