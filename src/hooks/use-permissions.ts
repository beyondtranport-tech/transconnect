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
    'direct-contacts';

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
 * Logic strictly protects the revenue stream by gating "Transactional Intelligence" 
 * behind specialized Earning Nodes.
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

        if (isAdmin) {
            perms.add('manage:all');
            return perms;
        }
        
        const membershipId = user.companyData?.membershipId || 'free';
        const isPaidIntelligence = membershipId !== 'free' && membershipId !== 'free_observer';

        // 1. FOUNDATION: INTELLIGENCE ACCESS (R100)
        // Grants access to the "Industrial Map" but not the "Transactional Terminal"
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
            
            // Foundational view access to malls
            perms.add('view:supplierMall');
            perms.add('view:financeMall');
        }

        // 2. EARNING NODE: LOADS INTELLIGENCE (R75)
        // Unlocks direct contacts for transporters and load-posting capabilities
        if (membershipId === 'loads_intelligence' || membershipId === 'premium' || user.companyData?.hasLoadsPlan) {
            perms.add('view:direct-contacts'); // High-value forensic data
            perms.add('view:transporterMall');
            perms.add('view:distributionMall');
            perms.add('view:loads');
            perms.add('transact:loads');
            perms.add('create:loads');
            perms.add('manage:loads');
        }

        // 3. EARNING NODE: BUY & SELL INTELLIGENCE (R150)
        // Unlocks dealer contacts and the Handshake Terminal
        if (membershipId === 'buy_sell_intelligence' || membershipId === 'premium' || user.companyData?.hasBuySellPlan) {
            perms.add('view:direct-contacts');
            perms.add('view:buySellMall');
            perms.add('transact:buySellMall');
            perms.add('manage:buySellMall');
        }

        // 4. EARNING NODE: WAREHOUSE INTELLIGENCE (R125)
        // Unlocks operator contacts and the Booking Terminal
        if (membershipId === 'warehouse_intelligence' || membershipId === 'premium' || user.companyData?.hasWarehousePlan) {
            perms.add('view:direct-contacts');
            perms.add('view:warehouseMall');
            perms.add('transact:warehouseMall');
            perms.add('manage:warehouseMall');
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
