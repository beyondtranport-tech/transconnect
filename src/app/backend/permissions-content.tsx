'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, Edit, RefreshCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getClientSideAuthToken } from '@/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { type ColumnDef } from '@/hooks/use-data-table';
import { DataTable } from '@/components/ui/data-table';


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
    { id: 'manage', label: 'Manage' },
    { id: 'publish', label: 'Publish' },
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

            // Path resolution: platformStaff are root, company staff are nested
            const path = staffMember.type === 'platform' 
                ? `platformStaff/${staffMember.id}`
                : `companies/${staffMember.companyId}/staff/${staffMember.id}`;

            const response = await fetch('/api/updateUserDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: path,
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
            <DialogContent className="sm:max-w-4xl">
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
                                 <div className="font-semibold flex items-center gap-2 text-left">
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
                                    <FormItem className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-2 py-2 border-b last:border-b-0 text-left">
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
    const [platformStaff, setPlatformStaff] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const forceRefresh = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Auth failed");
            
            const [staffRes, platformRes, companiesRes] = await Promise.all([
                fetchFromAdminAPI(token, 'getStaff'),
                fetchFromAdminAPI(token, 'getPlatformStaff'),
                fetchFromAdminAPI(token, 'getMembers')
            ]);

            setStaff(staffRes.data || []);
            setPlatformStaff(platformRes.data || []);
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
        if (!staff || !companies || !platformStaff) return [];
        const companyMap = new Map(companies.map(c => [c.id, c.companyName]));
        
        const mappedCompanyStaff = staff.map(s => ({
            ...s,
            type: 'company',
            uniqueId: `company-${s.companyId}-${s.id}`,
            companyName: companyMap.get(s.companyId) || 'Unknown Company'
        }));

        const mappedPlatformStaff = platformStaff.map(s => ({
            ...s,
            type: 'platform',
            uniqueId: `platform-${s.id}`,
            companyName: 'INTERNAL: Logistics Flow'
        }));

        return [...mappedPlatformStaff, ...mappedCompanyStaff];
    }, [staff, companies, platformStaff]);


    const columns: ColumnDef<any>[] = useMemo(() => [
        {
          accessorKey: 'name',
          header: 'Staff Member',
           cell: ({ row }) => (
            <div className="text-left">
              <p className="font-medium text-left">{row.original.firstName} {row.original.lastName}</p>
              <p className="text-xs text-muted-foreground text-left">{row.original.email}</p>
            </div>
          ),
        },
        {
          accessorKey: 'companyName',
          header: 'Organization / Context',
           cell: ({ row }) => <div className="text-left"><Badge variant={row.original.type === 'platform' ? 'default' : 'outline'}>{row.original.companyName}</Badge></div>,
        },
        {
          accessorKey: 'title',
          header: 'Title',
           cell: ({ row }) => <div className="text-left">{row.original.title || row.original.department || 'N/A'}</div>,
        },
        {
          accessorKey: 'permissions',
          header: 'Capability Matrix',
          cell: ({ row }) => {
            const perms = row.original.permissions;
            return perms && perms.length > 0 
                ? <Badge variant="secondary" className="font-bold">{perms.length} assigned</Badge> 
                : <Badge variant="outline" className="opacity-40">None</Badge>;
          }
        },
        {
            id: 'actions',
            header: <div className="text-right">Audit</div>,
            cell: ({ row }) => (
                <div className="text-right flex justify-end">
                    <PermissionsDialog staffMember={row.original} onSave={forceRefresh} />
                </div>
            ),
        }
    ], [forceRefresh]);
    

    return (
        <div className="space-y-8 text-left text-foreground">
            <div className="flex justify-between items-end text-left">
                <div className="text-left">
                    <h1 className="text-3xl font-black font-headline tracking-tight flex items-center gap-3 text-left">
                        <Lock className="h-8 w-8 text-primary" />
                        Security Matrix
                    </h1>
                    <p className="text-muted-foreground mt-1 text-left">Audit and manage functional authorities for internal team members and member staff.</p>
                </div>
                <Button variant="outline" onClick={forceRefresh} disabled={isLoading} className="gap-2 text-left">
                    <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    Refresh Matrix
                </Button>
            </div>

            <Card className="border-none shadow-xl">
                <CardContent className="pt-6 text-left">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground text-center">Reconstructing Permission State...</p>
                        </div>
                    ) : error ? (
                        <div className="text-destructive text-center py-10">
                            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                            <p className="font-bold">Matrix Load Failed</p>
                            <p className="text-sm text-muted-foreground">{error}</p>
                        </div>
                    ) : (
                        <DataTable columns={columns} data={enrichedStaff} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

