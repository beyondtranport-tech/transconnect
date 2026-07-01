'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  Users,
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
import FleetContent from './fleet-content';
import NeedsContent from './needs-content';
import SupplierProductContent from './supplier-product-content';
import HumanCapitalContent from './human-capital-content';
import ShopContent from './shop-content';
import LoadBoardContent from './load-board-content';
import WalletContent from './wallet-content';
import BillingContent from './billing-content';
import RewardsContent from './rewards';
import ActivityFeed from './activity-feed';
import NetworkContent from './network-content';
import PerformanceContent from './performance-content';
import NetworkOffer from './network-offer';
import NetworkEmails from './network-emails';
import SupportChatContent from './support-chat';
import LoyaltyPlanPage from '@/app/connect/loyalty/page';
import RewardsPlanPage from '@/app/connect/rewards/page';
import ActionsPlanPage from '@/app/connect/actions/page';
import IntelligenceHistory from './intelligence-history';
import SocialStudio from '@/app/adminaccount/social-studio';
import MarketingStudio from './marketing-studio';
import LendingParametersContent from './lending-parameters-content';

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

  const renderContent = useCallback(() => {
    if (activeView.startsWith('social-')) {
        const platform = activeView.split('-')[1] as any;
        return <SocialStudio platform={platform} />;
    }
    switch (activeView) {
      case 'profile': return <ProfileContent />;
      case 'company': return <CompanyContent />;
      case 'fleet': return <FleetContent />;
      case 'needs': return <NeedsContent />;
      case 'product-portfolio': return <SupplierProductContent />;
      case 'professional-profile': return <HumanCapitalContent />;
      case 'staff': return <StaffContent />;
      case 'shop': return <ShopContent />;
      case 'lending-parameters': return <LendingParametersContent />;
      case 'load-board': return <LoadBoardContent />;
      case 'wallet': return <WalletContent />;
      case 'billing': return <BillingContent />;
      case 'rewards': return <RewardsContent />;
      case 'activity': return <ActivityFeed />;
      case 'support-chat': return <SupportChatContent />;
      case 'network': return <NetworkContent />;
      case 'performance': return <PerformanceContent />;
      case 'offer': return <NetworkOffer />;
      case 'emails': return <NetworkEmails />;
      case 'connect-loyalty': return <LoyaltyPlanPage />;
      case 'connect-rewards': return <RewardsPlanPage />;
      case 'connect-actions': return <ActionsPlanPage />;
      case 'search-history': return <IntelligenceHistory />;
      case 'marketing-studio': return <MarketingStudio />;
      case 'dashboard':
      default:
        return <AccountDashboard />;
    }
  }, [activeView]);

  if (isUserLoading || !user) {
    return (
      <div className="flex justify-center items-center py-40">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const isTransporter = user.declaredPosition === 'transporter' || user.companyData?.shopType === 'transporter';
  const isSupplier = user.declaredPosition === 'vendor' || user.companyData?.shopType === 'vendor';
  const isLender = user.declaredPosition === 'lender' || user.role === 'lender' || user.companyData?.declaredRole === 'lender';
  const isProfessional = user.declaredPosition === 'driver' || user.role === 'driver';
  const isAssociate = user.declaredPosition === 'associate' || user.role === 'associate';
  
  const isSalesActive = ['network', 'performance', 'offer', 'emails'].includes(activeView);
  const isConnectActive = ['connect-loyalty', 'connect-rewards', 'connect-actions'].includes(activeView);
  const isSocialActive = activeView.startsWith('social-');

  return (
    <SidebarProvider>
      <AIChatWidget />
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2 text-left">
            <div className="bg-primary/10 p-2 rounded-full"><User className="h-6 w-6 text-primary" /></div>
            <h2 className="text-lg font-semibold text-sidebar-foreground">{isAssociate ? 'Partner Area' : 'Member Area'}</h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Dashboard" isActive={activeView === 'dashboard'} onClick={() => navigate('dashboard')}><LayoutDashboard /><span>Dashboard</span></SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                  <SidebarMenuButton tooltip={isAssociate ? "Creator Profile" : (isTransporter ? "Service Profile" : isLender ? "Lender Profile" : "My Shop")} isActive={activeView === 'shop'} onClick={() => navigate('shop')}><Store /><span>{isAssociate ? "Creator Profile" : (isTransporter ? "Service Profile" : isLender ? "Lender Profile" : "My Shop")}</span></SidebarMenuButton>
              </SidebarMenuItem>

              {isLender && (
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Lending Focus & Portfolio" isActive={activeView === 'lending-parameters'} onClick={() => navigate('lending-parameters')}><Landmark /><span>Lending Focus & Portfolio</span></SidebarMenuButton>
                </SidebarMenuItem>
              )}
              
              {!isAssociate && (
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Search History" isActive={activeView === 'search-history'} onClick={() => navigate('search-history')}><Search /><span>Search History</span></SidebarMenuButton>
                </SidebarMenuItem>
              )}

              <SidebarMenuItem>
                <SidebarMenuButton tooltip="My Profile" isActive={activeView === 'profile'} onClick={() => navigate('profile')}><User /><span>My Profile</span></SidebarMenuButton>
              </SidebarMenuItem>

              {!isAssociate && (
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Company" isActive={activeView === 'company'} onClick={() => navigate('company')}><Building /><span>Company</span></SidebarMenuButton>
                </SidebarMenuItem>
              )}
              
              {isTransporter && (
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Fleet & Services" isActive={activeView === 'fleet'} onClick={() => navigate('fleet')}><Truck /><span>Fleet & Services</span></SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {isSupplier && (
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Product Portfolio" isActive={activeView === 'product-portfolio'} onClick={() => navigate('product-portfolio')}><Package /><span>Product Portfolio</span></SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {isProfessional && (
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Professional Profile" isActive={activeView === 'professional-profile'} onClick={() => navigate('professional-profile')}><Award /><span>Professional Profile</span></SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {!isTransporter && !isSupplier && !isProfessional && !isAssociate && !isLender && (
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Shipping Requirements" isActive={activeView === 'needs'} onClick={() => navigate('needs')}><ShoppingCart /><span>Shipping Requirements</span></SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {!isAssociate && (
               <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Company Staff" isActive={activeView === 'staff'} onClick={() => navigate('staff')}><Users /><span>Company Staff</span></SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {isAssociate && (
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Content Studio" isActive={activeView === 'marketing-studio'} onClick={() => navigate('marketing-studio')}><Sparkles /><span>Content Studio</span></SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {isAssociate && (
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Social Studio" isActive={isSocialActive}><Share2 /><span>Social Studio</span></SidebarMenuButton>
                    <SidebarMenuSub>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'social-facebook'} onClick={() => navigate('social-facebook')}>Facebook</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'social-linkedin'} onClick={() => navigate('social-linkedin')}>LinkedIn</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'social-instagram'} onClick={() => navigate('social-instagram')}>Instagram</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'social-tiktok'} onClick={() => navigate('social-tiktok')}>TikTok</SidebarMenuSubButton></SidebarMenuSubItem>
                    </SidebarMenuSub>
                </SidebarMenuItem>
              )}

              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Sales" isActive={isSalesActive}><Handshake /><span>Sales & Outreach</span></SidebarMenuButton>
                <SidebarMenuSub>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'network'} onClick={() => navigate('network')}><Users />My Network</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'performance'} onClick={() => navigate('performance')}><TrendingUp />Performance</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'offer'} onClick={() => navigate('offer')}><Gift />The Offer</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'emails'} onClick={() => navigate('emails')}><Mail />Email Templates</SidebarMenuSubButton></SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>

              {!isAssociate && (
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Connect Plans" isActive={isConnectActive}><Zap /><span>Connect</span></SidebarMenuButton>
                    <SidebarMenuSub>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'connect-loyalty'} onClick={() => navigate('connect-loyalty')}><Heart />Loyalty Plan</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'connect-rewards'} onClick={() => navigate('connect-rewards')}><Gift />Rewards Plan</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'connect-actions'} onClick={() => navigate('connect-actions')}><Zap />Actions Plan</SidebarMenuSubButton></SidebarMenuSubItem>
                    </SidebarMenuSub>
                </SidebarMenuItem>
              )}

               <SidebarMenuItem>
                <SidebarMenuButton tooltip="Wallet" isActive={activeView === 'wallet'} onClick={() => navigate('wallet')}><Wallet /><span>Wallet & Earnings</span></SidebarMenuButton>
              </SidebarMenuItem>

              {!isAssociate && (
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Activity" isActive={activeView === 'activity'} onClick={() => navigate('activity')}><Activity /><span>Activity</span></SidebarMenuButton>
                </SidebarMenuItem>
              )}

              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Support Chat" isActive={activeView === 'support-chat'} onClick={() => navigate('support-chat')}><MessageSquare /><span>Support Chat</span></SidebarMenuButton>
              </SidebarMenuItem>

              {!isAssociate && (
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Billing" isActive={activeView === 'billing'} onClick={() => navigate('billing')}><CreditCard /><span>Billing</span></SidebarMenuButton>
                </SidebarMenuItem>
              )}
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
      <SidebarInset><div className="p-4 md:p-6">{renderContent()}</div></SidebarInset>
    </SidebarProvider>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center py-40"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
      <AccountPageContent />
    </Suspense>
  );
}
