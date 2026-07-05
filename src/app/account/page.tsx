
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  LogOut,
  LayoutDashboard,
  User,
  Building,
  Store,
  CreditCard,
  Wallet,
  Gift,
  Activity,
  Handshake,
  TrendingUp,
  Mail,
  Sparkles,
  MessageSquare,
  Truck,
  Heart,
  Zap,
  ShoppingCart,
  Package,
  Award,
  Search,
  Share2,
  Landmark,
  ClipboardList,
  Users,
  ShoppingBag,
  Warehouse,
  Network,
  PackageSearch,
  Building2,
  MapPin,
  Scale
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense, useCallback } from 'react';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
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
import SocialStudio from '@/app/adminaccount/social-studio';
import MarketingStudio from './marketing-studio';
import MyFacilitiesContent from './facilities-content';

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

  if (isUserLoading || !user) {
    return (
      <div className="flex justify-center items-center py-40">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // Role Detection
  const isAssociate = user.declaredPosition === 'associate' || user.role === 'associate';
  const isLender = user.declaredPosition === 'lender' || user.role === 'lender' || user.companyData?.declaredRole === 'lender';
  
  const isSalesActive = ['network', 'performance', 'offer', 'emails', 'lending-desk', 'my-facilities', 'marketplace-deals'].includes(activeView);
  const isConnectActive = ['connect-loyalty', 'connect-rewards', 'connect-actions'].includes(activeView);
  const isSocialActive = activeView.startsWith('social-');

  const renderContent = () => {
    if (activeView.startsWith('mall-')) {
        const mallId = activeView.replace('mall-', '');
        return <MallGate mallId={mallId} />;
    }
    
    switch (activeView) {
      case 'dashboard': return <AccountDashboard />;
      case 'profile': return <ProfileContent />;
      case 'company': return <CompanyContent />;
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
            <div className="bg-primary/10 p-2 rounded-full"><User className="h-6 w-6 text-primary" /></div>
            <h2 className="text-lg font-semibold text-sidebar-foreground">{isAssociate ? 'Partner Area' : 'Member Area'}</h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Dashboard" isActive={activeView === 'dashboard'} onClick={() => navigate('dashboard')}><LayoutDashboard /><span>Dashboard</span></SidebarMenuButton>
              </SidebarMenuItem>
          </SidebarGroup>

          <SidebarGroup>
              <SidebarGroupLabel>Industrial Malls</SidebarGroupLabel>
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
                    <SidebarMenuButton tooltip="Supplier Mall" isActive={activeView === 'mall-supplier'} onClick={() => navigate('mall-supplier')}><Building2 /><span>Supplier Mall</span></SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Finance Mall" isActive={activeView === 'mall-finance'} onClick={() => navigate('mall-finance')}><Landmark /><span>Finance Mall</span></SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Buy & Sell Mall" isActive={activeView === 'mall-buy-sell'} onClick={() => navigate('mall-buy-sell')}><ShoppingCart /><span>Buy & Sell Mall</span></SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="SA Auction Mall" isActive={activeView === 'mall-sa-auction'} onClick={() => navigate('mall-sa-auction')}><Scale /><span>SA Auction Mall</span></SidebarMenuButton>
                  </SidebarMenuItem>
              </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup>
              <SidebarGroupLabel>Account & Settings</SidebarGroupLabel>
              <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Company Profile" isActive={activeView === 'company'} onClick={() => navigate('company')}><Building /><span>Company Profile</span></SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="My Profile" isActive={activeView === 'profile'} onClick={() => navigate('profile')}><User /><span>My Profile</span></SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Company Staff" isActive={activeView === 'staff'} onClick={() => navigate('staff')}><Users /><span>Company Staff</span></SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Wallet & Payouts" isActive={activeView === 'wallet'} onClick={() => navigate('wallet')}><Wallet /><span>Wallet & Payouts</span></SidebarMenuButton>
                  </SidebarMenuItem>
                   <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Search History" isActive={activeView === 'search-history'} onClick={() => navigate('search-history')}><Search /><span>Search History</span></SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Support Chat" isActive={activeView === 'support-chat'} onClick={() => navigate('support-chat')}><MessageSquare /><span>Support Chat</span></SidebarMenuButton>
                  </SidebarMenuItem>
              </SidebarMenu>
          </SidebarGroup>

          {isAssociate && (
            <SidebarGroup>
                <SidebarGroupLabel>Digital Associate Tools</SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Content Studio" isActive={activeView === 'marketing-studio'} onClick={() => navigate('marketing-studio')}><Sparkles /><span>Marketing Studio</span></SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Social Studio" isActive={isSocialActive}><Share2 /><span>Social Studio</span></SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="My Referrals" isActive={activeView === 'network'} onClick={() => navigate('network')}><Handshake /><span>My Referrals</span></SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
          )}
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-3 p-2 rounded-md bg-sidebar-accent">
            <Avatar className="h-10 w-10">
                <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col truncate">
                <span className="text-sm font-medium text-sidebar-foreground truncate text-left">{user?.displayName || 'Member'}</span>
                <span className="text-xs text-sidebar-foreground/70 truncate text-left">{user?.email}</span>
            </div>
            <Button variant="ghost" size="icon" className="ml-auto" onClick={onLogout} title="Sign Out">
                <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="p-4 md:p-8 text-left text-foreground">
            {renderContent()}
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
