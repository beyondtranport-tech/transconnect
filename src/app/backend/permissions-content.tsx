'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Lock, Edit, Trash2, ShieldQuestion } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase, getClientSideAuthToken } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

const resources = [
    { id: 'shop', label: 'Shop Management' },
    { id: 'products', label: 'Products' },
    { id: 'staff', label: 'Staff Management' },
    { id: 'billing', label: 'Billing & Invoices' },
    { id: 'enquiries', label: 'Funding Enquiries' },
    { id: 'quotes', label: 'Funding Quotes' },
    { id: 'wallet', label: 'Member Wallet' },
] as const;

const actions = [
    { id: 'view', label: 'View' },
    { id: 'create', label: 'Create' },
    { id: 'edit', label: 'Edit' },
    { id: 'delete', label: 'Delete' },
] as const;


const roleSchema = z.object({
    id: z.string().min(2, 'ID must be at least 2 characters').regex(/^[a-z_]+$/, 'ID must be lowercase with underscores only'),
    name: z.string().min(3, 'Name is required'),
    description: z.string().optional(),
    permissions: z.array(z.string()).min(1, 'At least one permission must be selected')
});

type RoleFormValues = z.infer<typeof roleSchema>;

function RoleDialog({ role, onSave }: { role?: RoleFormValues, onSave: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<RoleFormValues>({
        resolver: zodResolver(roleSchema),
        defaultValues: role || { id: '', name: '', description: '', permissions: [] },
    });
    
     useEffect(() => {
        if (isOpen) {
            form.reset(role || { id: '', name: '', description: '', permissions: [] });
        }
    }, [isOpen, role, form]);
    
    // Function to transform UI selections into 'resource:action' format
    const processPermissions = (data: any) => {
        const generatedPermissions: string[] = [];
        for (const resource of resources) {
            if (data[resource.id]?.length > 0) {
                for (const action of data[resource.id]) {
                    generatedPermissions.push(`${resource.id}:${action}`);
                }
            }
        }
        return generatedPermissions;
    };
    
    const onSubmit = async (values: any) => {
        setIsLoading(true);
        const finalPermissions = processPermissions(values);
        
        const roleData = {
            id: values.id,
            name: values.name,
            description: values.description,
            permissions: finalPermissions
        };
        
        try {
            const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            const response = await fetch('/api/updateConfigDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: `permissions/roles/${roleData.id}`,
                    data: roleData
                }),
            });

            if (!response.ok) throw new Error((await response.json()).error || 'Failed to save role.');
            
            toast({ title: 'Role Saved!', description: `The role "${roleData.name}" has been saved.` });
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
                 {role ? (
                    <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                 ) : (
                    <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Role</Button>
                 )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{role ? 'Edit' : 'Create New'} Role</DialogTitle>
                    <DialogDescription>
                        Define a role and select the actions and resources it can access.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                             <FormField name="name" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Role Name</FormLabel><FormControl><Input placeholder="e.g., Shop Manager" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField name="id" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Role ID</FormLabel><FormControl><Input placeholder="e.g., shop_manager" {...field} disabled={!!role} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <FormField name="description" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Input placeholder="Briefly describe this role's purpose" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />

                        <Separator />

                        <div>
                            <h3 className="text-lg font-semibold mb-4">Permissions</h3>
                             <div className="rounded-md border p-4">
                                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-2">
                                     <div className="font-semibold">Resource</div>
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
                                            <FormLabel className="font-normal">{resource.label}</FormLabel>
                                            {actions.map(action => (
                                                <FormControl key={action.id} className="flex justify-center">
                                                     <Checkbox
                                                        value={action.id}
                                                        checked={field.value?.includes(action.id)}
                                                        onCheckedChange={(checked) => {
                                                            const currentValues = field.value || [];
                                                            return checked
                                                            ? field.onChange([...currentValues, action.id])
                                                            : field.onChange(currentValues.filter((value: string) => value !== action.id))
                                                        }}
                                                    />
                                                </FormControl>
                                            ))}
                                        </FormItem>
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save Role
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}


export default function PermissionsContent() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const rolesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'permissions/roles')) : null, [firestore]);
    const { data: roles, isLoading, forceRefresh } = useCollection(rolesQuery);

    const handleDelete = async (roleId: string) => {
        if (roleId === 'admin') {
            toast({ variant: 'destructive', title: 'Action Denied', description: 'The default admin role cannot be deleted.'});
            return;
        }
        try {
             const token = await getClientSideAuthToken();
            if (!token) throw new Error("Authentication failed.");

            await fetch('/api/deleteConfigDoc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: `permissions/roles/${roleId}` }),
            });
            toast({ title: "Role Deleted" });
            forceRefresh();
        } catch(e: any) {
            toast({ variant: 'destructive', title: 'Deletion Failed', description: e.message });
        }
    };


    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-6 w-6" />
                        Permissions Management
                    </CardTitle>
                    <CardDescription>
                        Define roles and assign permissions to control access across the platform.
                    </CardDescription>
                </div>
                <RoleDialog onSave={forceRefresh} />
            </CardHeader>
            <CardContent>
               {isLoading ? (
                    <div className="flex justify-center items-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
               ) : roles && roles.length > 0 ? (
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Role Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-center">Permissions Count</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {roles.map(role => (
                                    <TableRow key={role.id}>
                                        <TableCell className="font-semibold">{role.name}</TableCell>
                                        <TableCell>{role.description}</TableCell>
                                        <TableCell className="text-center">{role.permissions?.length || 0}</TableCell>
                                        <TableCell className="text-right space-x-1">
                                            <RoleDialog role={role} onSave={forceRefresh} />
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(role.id)} disabled={role.id === 'admin'}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
               ) : (
                    <div className="text-center py-20 border-2 border-dashed rounded-lg">
                        <ShieldQuestion className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-xl font-semibold">No Roles Defined</h3>
                        <p className="mt-2 text-muted-foreground">Click "Add Role" to create your first permission role.</p>
                    </div>
               )}
            </CardContent>
        </Card>
    );
}