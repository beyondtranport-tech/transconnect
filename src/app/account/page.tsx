'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import {
  LogOut,
  LayoutDashboard,
  User,
  Building,
  Store,
  Wallet,
  Activity,
  Handshake,
  Landmark,
  Users,
  Warehouse,
  Network,
  PackageSearch,
  ShoppingCart,
  Search,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Loader2,
  Truck,
  Box,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import React from 'react';
import AIChatWidget from '@/components/ai-chat-widget';

// Component Imports
import AccountDashboard from './dashboard';
import StaffContent from './staff-content';
import ProfileContent from './profile-content';
import CompanyContent from './company-content';
import WalletContent from './wallet-content';
import BillingContent from './billing-content';
import ActivityFeed from './activity-feed';
import NetworkContent from './network-content';
import SupportChatContent from './support-chat';
import LoyaltyPlanPage from '@/app/connect/loyalty/page';
import RewardsPlanPage from '@/app/connect/rewards/page';
import ActionsPlanPage from '@/app/connect/actions/page';
import IntelligenceHistory from './intelligence-history';
import MarketingStudio from './marketing-studio';
import MyFacilitiesContent from './facilities-content';
import ShopContent from './shop-content';

// Mall Gate Components
import { MallGate } from './malls/MallGate';

function AccountPageContent() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') || 'dashboard';
  const [activeView, setActiveView] = useState(initialView);

  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/signin');
    }
  }, [user, isUserLoading, router]);

  const onLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "AC";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const navigate = (view: string) => {
    router.push(`/account?view=${view}`, { scroll: false });
  };

  // Role Detection for Industrial Node Labeling
  const isTransporter = user?.declaredPosition === 'transporter' || user?.companyData?.hasLoadsPlan;
  const isWarehouse = user?.declaredPosition === 'warehouse' || user?.companyData?.hasWarehousePlan;
  const isSupplier = user?.declaredPosition === 'vendor' || user?.companyData?.membershipId === 'intelligence' || user?.companyData?.membershipId === 'premium';

  const nodeLabel = useMemo(() => {
      if (isWarehouse) return "My Warehouse Hub";
      if (isTransporter) return "My Fleet Node";
      if (isSupplier) return "My Supplier Node";
      return "My Industrial Node";
  }, [isWarehouse, isTransporter, isSupplier]);

  const nodeIcon = useMemo(() => {
      if (isWarehouse) return Warehouse;
      if (isTransporter) return Truck;
      return Landmark;
  }, [isWarehouse, isTransporter]);

  if (isUserLoading || !user) {
    return (
      <div className="flex justify-center items-center py-40">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const renderContent = () => {
    if (activeView.startsWith('mall-')) {
        const mallId = activeView.replace('mall-', '');
        return <MallGate mallId={mallId} />;
    }
    
    switch (activeView) {
      case 'dashboard': return <AccountDashboard />;
      case 'profile': return <ProfileContent />;
      case 'company': return <CompanyContent />;
      case 'shop': return <ShopContent />;
      case 'staff': return <StaffContent />;
      case 'wallet': return <WalletContent />;
      case 'billing': return <BillingContent />;
      case 'activity': return <ActivityFeed />;
      case 'support-chat': return <SupportChatContent />;
      case 'network': return <NetworkContent />;
      case 'marketing-studio': return <MarketingStudio />;
      case 'my-facilities': return <MyFacilitiesContent />;
      case 'search-history': return <IntelligenceHistory />;
      case 'connect-loyalty': return <LoyaltyPlanPage />;
      case 'connect-rewards': return <RewardsPlanPage />;
      case 'connect-actions': return <ActionsPlanPage />;
      default: return <AccountDashboard />;
    }
  };

  return (
    <SidebarProvider>
      <AIChatWidget />
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <div className="bg-primary/10 p-2 rounded-full"><Box className="h-6 w-6 text-primary" /></div>
            <h2 className="text-lg font-semibold text-sidebar-foreground">Member Hub</h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Dashboard" isActive={activeView === 'dashboard'} onClick={() => navigate('dashboard')}><LayoutDashboard /><span>Dashboard</span></SidebarMenuButton>
              </SidebarMenuItem>
          </SidebarGroup>

          <SidebarGroup>
              <SidebarGroupLabel>Forensic Malls</SidebarGroupLabel>
              <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Loads Mall" isActive={activeView === 'mall-loads'} onClick={() => navigate('mall-loads')}><PackageSearch /><span>Loads Mall</span></SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Warehouse Mall" isActive={activeView === 'mall-warehouse'} onClick={() => navigate('mall-warehouse')}><Warehouse /><span>Warehouse Mall</span></SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Transport Mall" isActive={activeView === 'mall-transporter'} onClick={() => navigate('mall-transporter')}><Truck /><span>Transport Mall</span></SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Distribution Mall" isActive={activeView === 'mall-distribution'} onClick={() => navigate('mall-distribution')}><Network /><span>Distribution Mall</span></SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Supplier Mall" isActive={activeView === 'mall-supplier'} onClick={() => navigate('mall-supplier')}><Building /><span>Supplier Mall</span></SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Finance Mall" isActive={activeView === 'mall-finance'} onClick={() => navigate('mall-finance')}><Landmark /><span>Finance Mall</span></SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Buy & Sell Mall" isActive={activeView === 'mall-buy-sell'} onClick={() => navigate('mall-buy-sell')}><ShoppingCart /><span>Buy & Sell Mall</span></SidebarMenuButton>
                  </SidebarMenuItem>
              </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup>
              <SidebarGroupLabel>Industrial Node Terminal</SidebarGroupLabel>
              <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip={nodeLabel} isActive={activeView === 'shop'} onClick={() => navigate('shop')}>
                        {React.createElement(nodeIcon)}
                        <span>{nodeLabel}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Company Profile" isActive={activeView === 'company'} onClick={() => navigate('company')}><Building /><span>Company Profile</span></SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="My Profile" isActive={activeView === 'profile'} onClick={() => navigate('profile')}><User /><span>My Profile</span></SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Wallet & Payouts" isActive={activeView === 'wallet'} onClick={() => navigate('wallet')}><Wallet /><span>Wallet & Payouts</span></SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Support Chat" isActive={activeView === 'support-chat'} onClick={() => navigate('support-chat')}><MessageSquare /><span>Support Chat</span></SidebarMenuButton>
                  </SidebarMenuItem>
              </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-3 p-2 rounded-md bg-sidebar-accent">
            <Avatar className="h-10 w-10">
                <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col truncate text-left">
                <span className="text-sm font-medium text-sidebar-foreground truncate">{user?.displayName || 'Member'}</span>
                <span className="text-xs text-sidebar-foreground/70 truncate">{user?.email}</span>
            </div>
            <Button variant="ghost" size="icon" className="ml-auto" onClick={onLogout} title="Sign Out">
                <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="p-4 md:p-8 text-left text-foreground">
            <Suspense fallback={<div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
                {renderContent()}
            </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={
        <div className="flex flex-col justify-center items-center py-40 gap-4">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Initializing Workspace...</p>
        </div>
    }>
      <AccountPageContent />
    </Suspense>
  );
}