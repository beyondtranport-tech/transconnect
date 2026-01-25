
'use client';

import { useUser, useFirestore } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import { useMemo } from 'react';
import { useMemoFirebase } from './use-config';

export type Action = 'create' | 'view' | 'edit' | 'delete' | 'manage';
export type Resource = 
    'shop' | 
    'products' | 
    'staff' | 
    'billing' | 
    'enquiries' | 
    'quotes' | 
    'wallet' |
    'supplierMall' |
    'transporterMall' |
    'financeMall' |
    'loadsMall' |
    'buySellMall' |
    'distributionMall' |
    'warehouseMall' |
    'repurposeMall' |
    'aftermarketMall' |
    'marketplaceDigital' |
    'marketplaceData' |
    'marketplaceLogistics' |
    'marketplaceLoyalty' |
    'tech' |
    'contributions' |
    'permissions';

// `manage` implies all other actions
const permissionHierarchy: { [key in Action]: Action[] } = {
    manage: ['create', 'view', 'edit', 'delete'],
    create: ['create'],
    view: ['view'],
    edit: ['edit'],
    delete: ['delete'],
};

export function usePermissions() {
    const { user } = useUser();
    const firestore = useFirestore();

    const isAdmin = user?.email === 'beyondtransport@gmail.com';

    // 1. Get the current user's profile to find their role and companyId
    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userData, isLoading: isUserLoading } = useDoc<{ companyId: string, role: 'owner' | 'staff' }>(userDocRef);

    // 2. If the user is a staff member, get their specific staff document to find permissions
    const staffDocRef = useMemoFirebase(() => {
        if (!firestore || !userData || userData.role !== 'staff' || !user) return null;
        return doc(firestore, `companies/${userData.companyId}/staff`, user.uid);
    }, [firestore, userData, user]);
    const { data: staffData, isLoading: isStaffLoading } = useDoc<{ permissions: string[] }>(staffDocRef);

    const permissions = useMemo(() => {
        if (!userData) return new Set<string>();

        const isOwner = userData.role === 'owner';

        // Grant full permissions if the user is the admin or the company owner.
        if (isAdmin || isOwner) {
            return new Set<string>(['manage:all']);
        }
        
        // Staff members' permissions are loaded from their document for more granular control
        if (userData.role === 'staff' && staffData?.permissions) {
            return new Set<string>(staffData.permissions);
        }

        return new Set<string>();
    }, [userData, staffData, isAdmin]);

    const can = (action: Action, resource: Resource) => {
        if (!userData) return false;

        const requiredPermissions = permissionHierarchy[action];
        
        // Check for wildcard 'manage:all'
        if (permissions.has('manage:all')) return true;

        // Check for resource-specific manage 'manage:shop'
        if (permissions.has(`manage:${resource}`)) return true;
        
        // Check for the specific action:resource permission
        return requiredPermissions.some(perm => permissions.has(`${perm}:${resource}`));
    };
    
    const isLoading = isUserLoading || (userData?.role === 'staff' && isStaffLoading);

    return { can, isLoading, permissions };
}
