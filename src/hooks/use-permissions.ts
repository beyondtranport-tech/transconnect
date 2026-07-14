
'use client';

import { useUser } from '@/firebase';
import { useMemo } from 'react';

export type Action = 'create' | 'view' | 'edit' | 'delete' | 'manage' | 'publish' | 'transact';
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
    'lending-focus' |
    'account' |
    'direct-contacts' |
    'ads';

const permissionHierarchy: { [key in Action]: Action[] } = {
    manage: ['create', 'view', 'edit', 'delete', 'publish', 'transact'],
    transact: ['transact'],
    create: ['create'],
    view: ['view'],
    edit: ['edit'],
    delete: ['delete'],
    publish: ['publish'],
};

/**
 * INTELLIGENCE NODE PERMISSIONS
 */
export function usePermissions() {
    const { user, isUserLoading } = useUser();
    
    const permissions = useMemo(() => {
        const perms = new Set<string>();
        
        if (!user) {
            return perms;
        }

        const isAdmin = user.email === 'mkoton100@gmail.com' || 
                        user.email === 'beyondtransport@gmail.com' ||
                        user.email === 'michael@logisticsflow.co.za' ||
                        user.claims?.admin === true;

        if (isAdmin) {
            perms.add('manage:all');
            return perms;
        }
        
        const membershipId = user.companyData?.membershipId || 'free';
        const isPaidIntelligence = membershipId !== 'free' && membershipId !== 'free_observer';

        if (isPaidIntelligence) {
            perms.add('view:account');
            perms.add('view:wallet');
            perms.add('view:quotes');
            perms.add('create:quotes');
            perms.add('view:enquiries');
            perms.add('create:enquiries');
            perms.add('create:shop');
            perms.add('edit:shop');
            perms.add('publish:shop');
            perms.add('manage:products');
            perms.add('manage:staff');
            perms.add('view:supplierMall');
            perms.add('view:financeMall');
            perms.add('manage:ads'); // Paid members can manage ads
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
