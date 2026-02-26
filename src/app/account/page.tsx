

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
  SidebarMenuSeparator,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  Users,
  Settings,
  LogOut,
  LayoutDashboard,
  FileText,
  User,
  Building,
  Store,
  CreditCard,
  Wallet,
  Gift,
  Activity,
  Handshake,
  TrendingUp,
  Presentation,
  Mail,
  Sparkles,
  MessageSquare,
  Truck,
  Network,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense, useCallback } from 'react';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import React from 'react';
import AIChatWidget from '@/components/ai-chat-widget';
import Link from 'next/link';

// Statically import all components that are conditionally rendered
import AccountDashboard from './dashboard';
import StaffContent from './staff-content';
import ProfileContent from './profile-content';
import CompanyContent from './company-content';
import ShopContent from './shop-content';
import BillingContent from './billing-content';
import WalletContent from './wallet-content';
import RewardsContent from './rewards';
import ActivityFeed from './activity-feed';
import NetworkContent from './network-content';
import PerformanceContent from './performance-content';
import NetworkOffer from './network-offer';
import NetworkEmails from './network-emails';
import MarketingStudio from './marketing-studio';
import SupportChatContent from './support-chat';
import LoadBoardContent from './load-board-content';
import VehicleListingsContent from './vehicle-listings-content';
import FinancialSetup from './financial-setup';
import SalesRoadmap from './sales-roadmap';
import Targets from './targets';
import BudgetPage from './budget/page';


// Placeholder components for sections under construction
function DocumentsContent() {
    return (
        <Card>
            <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">This section is under construction. Your document management center will appear here.</p></CardContent>
        </Card>
    )
}
function SettingsContent() {
     return (
        <Card>
            <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">This section is under construction. Your account settings will appear here.</p></CardContent>
        </Card>
    )
}


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

  const renderContent = useCallback(() => {
    switch (activeView) {
      case 'profile': return <ProfileContent />;
      case 'company': return <CompanyContent />;
      case 'staff': return <StaffContent />;
      case 'shop': return <ShopContent />;
      case 'load-board': return <LoadBoardContent />;
      case 'vehicle-listings': return <VehicleListingsContent />;
      case 'marketing-studio': return <MarketingStudio />;
      case 'wallet': return <WalletContent />;
      case 'billing': return <BillingContent />;
      case 'rewards': return <RewardsContent />;
      case 'activity': return <ActivityFeed />;
      case 'support-chat': return <SupportChatContent />;
      
      // Sales / Network
      case 'network': return <NetworkContent />;
      case 'performance': return <PerformanceContent />;
      case 'offer': return <NetworkOffer />;
      case 'emails': return <NetworkEmails />;
      
      // Placeholders
      case 'documents': return <DocumentsContent />;
      case 'settings': return <SettingsContent />;
      case 'financial-setup': return <FinancialSetup />;
      case 'sales-roadmap': return <SalesRoadmap />;
      case 'targets': return <Targets />;
      case 'budget': return <BudgetPage />;


      case 'dashboard':
      default:
        return <AccountDashboard />;
    }
  }, [activeView]);

  if (isUserLoading || !user) {
    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  const navigate = (view: string) => {
    router.push(`/account?view=${view}`, { scroll: false });
  };
  
  const isSalesActive = ['network', 'performance', 'offer', 'emails'].includes(activeView);
  const isFinancialsActive = ['financial-setup', 'sales-roadmap', 'targets', 'budget'].includes(activeView);


  return (
    <SidebarProvider>
      <AIChatWidget />
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-full">
              <User className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-sidebar-foreground">
              Member Area
            </h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Dashboard" isActive={activeView === 'dashboard'} onClick={() => navigate('dashboard')}>
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="My Profile" isActive={activeView === 'profile'} onClick={() => navigate('profile')}>
                  <User />
                  <span>My Profile</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton tooltip="Company" isActive={activeView === 'company'} onClick={() => navigate('company')}>
                  <Building />
                  <span>Company</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton tooltip="Company Staff" isActive={activeView === 'staff'} onClick={() => navigate('staff')}>
                  <Users />
                  <span>Company Staff</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="My Shop" isActive={activeView === 'shop'} onClick={() => navigate('shop')}>
                  <Store />
                  <span>My Shop</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton tooltip="My Load Board" isActive={activeView === 'load-board'} onClick={() => navigate('load-board')}>
                  <Truck />
                  <span>My Load Board</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton tooltip="My Vehicles" isActive={activeView === 'vehicle-listings'} onClick={() => navigate('vehicle-listings')}>
                  <Truck />
                  <span>My Vehicles</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="AI Marketing Studio" isActive={activeView === 'marketing-studio'} onClick={() => navigate('marketing-studio')}>
                  <Sparkles />
                  <span>AI Marketing</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Sales" isActive={isSalesActive}>
                    <Handshake /><span>Sales</span>
                </SidebarMenuButton>
                <SidebarMenuSub>
                    <SidebarMenuSubItem>
                        <SidebarMenuSubButton isActive={activeView === 'network'} onClick={() => navigate('network')}>
                            <Users />My Network
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                        <SidebarMenuSubButton isActive={activeView === 'performance'} onClick={() => navigate('performance')}>
                            <TrendingUp />Performance
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                        <SidebarMenuSubButton isActive={activeView === 'offer'} onClick={() => navigate('offer')}>
                            <Presentation />The Offer
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                        <SidebarMenuSubButton isActive={activeView === 'emails'} onClick={() => navigate('emails')}>
                            <Mail />Email Templates
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
                 <SidebarMenuItem>
                <SidebarMenuButton tooltip="Financials" isActive={isFinancialsActive}>
                    <TrendingUp /><span>Financials</span>
                </SidebarMenuButton>
                <SidebarMenuSub>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'financial-setup'} onClick={() => navigate('financial-setup')}>Set Up</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'sales-roadmap'} onClick={() => navigate('sales-roadmap')}>Sales Roadmap</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'targets'} onClick={() => navigate('targets')}>Targets</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'budget'} onClick={() => navigate('budget')}>Budget</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'forecast'} onClick={() => navigate('forecast')}>Forecast</SidebarMenuSubButton></SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton tooltip="Wallet" isActive={activeView === 'wallet'} onClick={() => navigate('wallet')}>
                  <Wallet />
                  <span>Wallet</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton tooltip="Rewards" isActive={activeView === 'rewards'} onClick={() => navigate('rewards')}>
                  <Gift />
                  <span>Rewards</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton tooltip="Activity" isActive={activeView === 'activity'} onClick={() => navigate('activity')}>
                  <Activity />
                  <span>Activity</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Support Chat" isActive={activeView === 'support-chat'} onClick={() => navigate('support-chat')}>
                  <MessageSquare />
                  <span>Support Chat</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Billing" isActive={activeView === 'billing'} onClick={() => navigate('billing')}>
                  <CreditCard />
                  <span>Billing</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Documents" isActive={activeView === 'documents'} onClick={() => navigate('documents')}>
                  <FileText />
                  <span>Documents</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Settings" isActive={activeView === 'settings'} onClick={() => navigate('settings')}>
                  <Settings />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-3 p-2 rounded-md bg-sidebar-accent">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-sidebar-foreground truncate">
                {user.displayName}
              </span>
              <span className="text-xs text-sidebar-foreground/70 truncate">
                {user.email}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto"
              onClick={onLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="p-4 md:p-6">
          <Suspense fallback={<Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" />}>
            {renderContent()}
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}


export default function AccountPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
      <AccountPageContent />
    </Suspense>
  );
}
