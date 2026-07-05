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
    'lending-focus' |
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

/**
 * INTELLIGENCE NODE PERMISSIONS
 * Logic refined to handle the specialized industrial membership strategy.
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
                        user.email === 'michael@logisticsflow.co.za';

        // Admins get all permissions
        if (isAdmin) {
            return new Set<string>(['manage:all']);
        }
        
        // Handle staff members first (Explicit Granular Permissions)
        if (user.role === 'staff' && Array.isArray(user.permissions)) {
             user.permissions.forEach((p: string) => perms.add(p));
             return perms;
        }

        // Default Owner Permissions (Internal Management)
        perms.add('view:account');
        perms.add('manage:staff');
        perms.add('edit:staff');
        perms.add('delete:staff');
        perms.add('create:staff');
        perms.add('view:wallet');

        const membershipId = user.companyData?.membershipId || 'free';
        const isPaidIntelligence = membershipId !== 'free';
        const isAssociate = user.declaredPosition === 'associate' || user.role === 'associate';
        const isLender = user.declaredPosition === 'lender' || user.role === 'lender' || user.companyData?.declaredRole === 'lender';

        // 1. FOUNDATION: INTELLIGENCE ACCESS (Applies to all paid nodes)
        if (isPaidIntelligence || isAssociate) {
            perms.add('create:shop');
            perms.add('edit:shop');
            perms.add('publish:shop');
            perms.add('manage:products');
            perms.add('view:quotes');
            perms.add('create:quotes');
            perms.add('view:enquiries');
            perms.add('create:enquiries');
        }

        // 2. SPECIALIZED NODE: LOADS INTELLIGENCE
        if (membershipId === 'loads_intelligence' || membershipId === 'premium') {
            perms.add('create:loads');
            perms.add('manage:loads');
        }

        // 3. SPECIALIZED NODE: BUY & SELL INTELLIGENCE
        if (membershipId === 'buy_sell_intelligence' || membershipId === 'premium') {
            perms.add('manage:buySellMall');
        }

        // 4. ROLE SPECIFIC: DIGITAL ASSOCIATE
        if (isAssociate) {
            perms.add('view:social');
            perms.add('manage:marketing-studio');
            perms.add('manage:social');
        }

        // 5. ROLE SPECIFIC: LENDER
        if (isLender) {
            perms.add('manage:lending-focus');
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
