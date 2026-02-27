
'use client';

import { useUser } from '@/firebase';
import { useMemo } from 'react';

export type Action = 'create' | 'view' | 'edit' | 'delete' | 'manage' | 'publish';
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
    'loads' |
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
    'permissions' |
    'account';

// `manage` implies all other actions
const permissionHierarchy: { [key in Action]: Action[] } = {
    manage: ['create', 'view', 'edit', 'delete', 'publish'],
    create: ['create'],
    view: ['view'],
    edit: ['edit'],
    delete: ['delete'],
    publish: ['publish'],
};

export function usePermissions() {
    const { user, isUserLoading } = useUser();
    
    const permissions = useMemo(() => {
        const perms = new Set<string>();
        
        // This check is the critical fix. We only need the base user object to start assigning roles.
        if (!user) {
            return perms;
        }

        const isAdmin = user.email === 'mkoton100@gmail.com' || user.email === 'beyondtransport@gmail.com';
        const isOwner = user.role === 'owner';
        
        // Use optional chaining for safety as companyData might not be loaded yet.
        const isWctaMember = user.companyData?.referrerId === 'WCTA';
        const isPaidMember = user.companyData?.membershipId && user.companyData.membershipId !== 'free';

        // Admins get all permissions
        if (isAdmin) {
            return new Set<string>(['manage:all']);
        }

        // --- All Owners ---
        if (isOwner) {
            // Base permissions for ALL owners, including free plan
            perms.add('create:shop'); // Ability to create a draft shop
            perms.add('edit:shop');   // Ability to edit their own shop
            perms.add('manage:products'); // Ability to add/edit products
            perms.add('view:account');
        }

        // --- Premium Permissions ---
        // Grant additional rights to owners who are on a paid plan or are WCTA members.
        if (isOwner && (isPaidMember || isWctaMember)) {
            perms.add('publish:shop');
            perms.add('create:loads');
            perms.add('manage:loads');
            // Add other premium feature permissions here
        }

        // --- Staff Permissions ---
        if (user.role === 'staff' && user.permissions) {
            // Staff permissions are explicitly assigned strings like "view:shop", "edit:products"
             (user.permissions as string[]).forEach(p => perms.add(p));
        }
        
        return perms;

    }, [user]);

    const can = (action: Action, resource: Resource) => {
        if (!user) return false;
        
        if (permissions.has('manage:all')) return true;
        if (permissions.has(`manage:${resource}`)) return true;

        const requiredPermissions = permissionHierarchy[action];
        return requiredPermissions.some(perm => permissions.has(`${perm}:${resource}`));
    };
    
    return { can, isLoading: isUserLoading, permissions };
}
