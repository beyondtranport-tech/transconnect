
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
    'social' |
    'marketing-studio' |
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
        
        if (!user) {
            return perms;
        }

        const isAdmin = user.email === 'mkoton100@gmail.com' || 
                        user.email === 'beyondtransport@gmail.com' ||
                        user.email === 'michael@logisticsflow.co.za';

        // Admins get all permissions
        if (isAdmin) {
            return new Set<string>(['manage:all']);
        }
        
        // Handle staff members first, as they have explicit, limited permissions
        if (user.role === 'staff' && Array.isArray(user.permissions)) {
             user.permissions.forEach((p: string) => perms.add(p));
             return perms;
        }

        // For everyone else who is logged in, grant default owner permissions.
        perms.add('create:shop');
        perms.add('edit:shop');
        perms.add('manage:products');
        perms.add('view:account');
        perms.add('manage:staff');
        perms.add('edit:staff');
        perms.add('delete:staff');
        perms.add('create:staff');

        // Check for premium status and add permissions accordingly
        const isWctaMember = user.companyData?.referrerId === 'WCTA';
        const isPaidMember = user.companyData?.membershipId && user.companyData.membershipId !== 'free';
        const isAssociate = user.declaredPosition === 'associate' || user.role === 'associate';

        if (isPaidMember || isWctaMember || isAssociate) {
            perms.add('publish:shop');
            perms.add('create:loads');
            perms.add('manage:loads');
            perms.add('view:social');
            perms.add('manage:marketing-studio');
        }
        
        return perms;

    }, [user]);

    const can = (action: Action, resource: Resource) => {
        if (!user) return false;
        
        if (permissions.has('manage:all')) return true;
        if (permissions.has('manage:' + resource)) return true;

        const requiredPermissions = permissionHierarchy[action];
        return requiredPermissions.some(perm => permissions.has(perm + ':' + resource));
    };
    
    return { can, isLoading: isUserLoading, permissions };
}
