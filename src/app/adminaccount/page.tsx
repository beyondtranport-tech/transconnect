
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
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  LogOut,
  Loader2,
  TrendingUp,
  Map,
  User,
  LayoutDashboard,
  Mail,
  Target,
  Bot,
  Sparkles,
  Settings,
  Shield,
  Activity,
  Wrench,
  Banknote,
  UserPlus,
  BookOpen,
  UserCheck2,
  Code2,
  DollarSign,
  Lock,
  Star,
  Award,
  Gift,
  Handshake,
  Truck,
  Building,
  Contact,
  Users,
  FileText,
  Landmark,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense, useCallback } from 'react';

import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import React from 'react';

// Static Imports for reliability
import AdminDashboardContent from '@/app/backend/dashboard-content';
import ActivityFeed from '@/app/backend/activity-feed';
import LeadsAgent from '@/app/adminaccount/leads-agent';
import LeadsDatabase from '@/app/adminaccount/leads-database';
import MarketingPage from '@/app/adminaccount/marketing/MarketingPage';
import BrandingStudio from '@/app/adminaccount/branding-studio';
import TTSStudio from '@/app/adminaccount/tts-studio';
import AssetGallery from '@/app/adminaccount/asset-gallery';
import SalesRoadmap from '@/app/account/sales-roadmap';
import TargetsPage from '@/app/account/targets';
import FinancialProjections from '@/app/backend/financial-projections';
import FinancialsGeneralSettings from '@/app/adminaccount/financials-general-settings';
import FinancialSetup from '@/app/account/financial-setup';
import BudgetPage from '@/app/account/budget/page';
import SalaryForecastPage from '@/app/backend/salary-forecast';
import PermissionsContent from '@/app/backend/permissions-content';
import PricingManagement from '@/app/backend/revenue/pricing-management';
import ConnectPlanPricing from '@/app/backend/revenue/connect-plan-pricing';
import TechPricing from '@/app/backend/revenue/tech-pricing';
import MarketplaceFees from '@/app/backend/revenue/marketplace-fees';
import MallCommissions from '@/app/backend/revenue/mall-commissions';
import ISAPitchSettings from '@/app/backend/revenue/isa-pitch-settings';
import SalesIncentives from '@/app/backend/revenue/sales-incentives';
import ActionPlanSettings from '@/app/backend/loyalty-settings';
import TierBenefits from '@/app/backend/tier-benefits';
import RewardsManagement from '@/app/backend/rewards-management';
import PlatformTasks from '@/app/backend/platform-tasks';
import PlatformSettingsContent from '@/app/backend/platform-settings';
import UnifiedDirectory from '@/app/adminaccount/unified-directory';
import PlatformStaffManagement from '@/app/adminaccount/platform-staff';

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (isUserLoading) return;
        if (!user) {
            router.replace('/signin?redirect=/adminaccount');
        } else if (user.email !== 'mkoton100@gmail.com' && user.email !== 'beyondtransport@gmail.com') {
            router.replace('/account'); 
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || !user || (user.email !== 'mkoton100@gmail.com' && user.email !== 'beyondtransport@gmail.com')) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[calc(100vh-8rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Verifying admin credentials...</p>
            </div>
        );
    }
    return <>{children}</>;
}

function AdminAccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') || 'dashboard';
  const [activeView, setActiveView] = useState(initialView);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  
  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  const onLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };

  const renderContent = useCallback(() => {
    if (activeView.startsWith('marketing-')) {
        const audience = activeView.split('-')[1] as "partners" | "isa" | "transporters" | "suppliers" | "finance" | "investors" | "developers";
        return <MarketingPage audience={audience} />;
    }
    switch (activeView) {
      case 'dashboard': return <AdminDashboardContent />;
      case 'unified-directory': return <UnifiedDirectory />;
      case 'activity': return <ActivityFeed />;
      case 'leads-agent': return <LeadsAgent />;
      case 'leads-database': return <LeadsDatabase />;
      case 'branding-studio': return <BrandingStudio />;
      case 'tts-studio': return <TTSStudio />;
      case 'asset-gallery': return <AssetGallery />;
      case 'sales-roadmap': return <SalesRoadmap />;
      case 'targets': return <TargetsPage />;
      case 'financial-projections': return <FinancialProjections />;
      case 'financial-settings': return <FinancialsGeneralSettings />;
      case 'financial-setup': return <FinancialSetup />;
      case 'budget': return <BudgetPage />;
      case 'salary-forecast': return <SalaryForecastPage />;
      case 'permissions': return <PermissionsContent />;
      case 'action-plan': return <ActionPlanSettings />;
      case 'loyalty-plan': return <TierBenefits />;
      case 'rewards-plan': return <RewardsManagement />;
      case 'pricing-memberships': return <PricingManagement />;
      case 'pricing-connect': return <ConnectPlanPricing />;
      case 'pricing-tech': return <TechPricing />;
      case 'pricing-marketplace': return <MarketplaceFees />;
      case 'commissions-malls': return <MallCommissions />;
      case 'commissions-isa': return <ISAPitchSettings />;
      case 'incentives-sales': return <SalesIncentives />;
      case 'tasks': return <PlatformTasks />;
      case 'settings-bank': return <PlatformSettingsContent />;
      case 'platform-staff': return <PlatformStaffManagement />;
      default: return <AdminDashboardContent />;
    }
  }, [activeView]);
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "AD";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (isUserLoading || !user) {
    return (
        <div className="flex justify-center items-center py-20">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  const navigate = (view: string) => router.push(`/adminaccount?view=${view}`, { scroll: false });
  const isMarketingActive = activeView.startsWith('marketing-');

  return (
    <AdminAuthGuard>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <Shield className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold text-sidebar-foreground">Admin Portal</h2>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Dashboard" isActive={activeView === 'dashboard'} onClick={() => navigate('dashboard')}>
                        <LayoutDashboard /><span>Dashboard</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Activity" isActive={activeView === 'activity'} onClick={() => navigate('activity')}>
                        <Activity /><span>Activity</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Marketing" isActive={isMarketingActive}><BookOpen /><span>Marketing Library</span></SidebarMenuButton>
                    <SidebarMenuSub>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'marketing-partners'} onClick={() => navigate('marketing-partners')}><Handshake className="h-4 w-4 mr-2"/>Partners</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'marketing-isa'} onClick={() => navigate('marketing-isa')}><UserCheck2 className="h-4 w-4 mr-2"/>ISA Agents</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'marketing-suppliers'} onClick={() => navigate('marketing-suppliers')}><Building className="h-4 w-4 mr-2"/>Suppliers</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'marketing-transporters'} onClick={() => navigate('marketing-transporters')}><Truck className="h-4 w-4 mr-2"/>Transporters</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'marketing-finance'} onClick={() => navigate('marketing-finance')}><Landmark className="h-4 w-4 mr-2"/>Finance Companies</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'marketing-investors'} onClick={() => navigate('marketing-investors')}><DollarSign className="h-4 w-4 mr-2"/>Investors</SidebarMenuSubButton></SidebarMenuSubItem>
                    </SidebarMenuSub>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Leads" isActive={activeView.includes('leads') || activeView === 'unified-directory'}><UserPlus /><span>Leads & CRM</span></SidebarMenuButton>
                    <SidebarMenuSub>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'unified-directory'} onClick={() => navigate('unified-directory')}><Contact className="h-4 w-4 mr-2"/>Unified Directory</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'leads-agent'} onClick={() => navigate('leads-agent')}><Bot className="h-4 w-4 mr-2"/>Leads Agent</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'leads-database'} onClick={() => navigate('leads-database')}><Users className="h-4 w-4 mr-2"/>Leads Database</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'platform-staff'} onClick={() => navigate('platform-staff')}><Users className="h-4 w-4 mr-2"/>Platform Staff</SidebarMenuSubButton></SidebarMenuSubItem>
                    </SidebarMenuSub>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Content" isActive={activeView.includes('studio')}><Sparkles /><span>Content Studio</span></SidebarMenuButton>
                    <SidebarMenuSub>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'branding-studio'} onClick={() => navigate('branding-studio')}>Branding Studio</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'tts-studio'} onClick={() => navigate('tts-studio')}>TTS Studio</SidebarMenuSubButton></SidebarMenuSubItem>
                    </SidebarMenuSub>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Financials" isActive={activeView.includes('financial') || activeView === 'budget'}><FileText /><span>Financials</span></SidebarMenuButton>
                    <SidebarMenuSub>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'financial-projections'} onClick={() => navigate('financial-projections')}>Projections</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'budget'} onClick={() => navigate('budget')}>Budget</SidebarMenuSubButton></SidebarMenuSubItem>
                    </SidebarMenuSub>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Platform Settings" isActive={activeView === 'settings-bank' || activeView === 'permissions'}><Settings /><span>Platform Settings</span></SidebarMenuButton>
                  <SidebarMenuSub>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'permissions'} onClick={() => navigate('permissions')}><Lock className="h-4 w-4 mr-2"/>Permissions</SidebarMenuSubButton></SidebarMenuSubItem>
                     <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'settings-bank'} onClick={() => navigate('settings-bank')}><Banknote className="h-4 w-4 mr-2"/>Bank Details</SidebarMenuSubButton></SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
              <div className="flex items-center gap-3 p-2 rounded-md bg-sidebar-accent">
                <Avatar className="h-10 w-10">
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col truncate">
                    <span className="text-sm font-medium text-sidebar-foreground truncate">{user.displayName || 'Admin'}</span>
                    <span className="text-xs text-sidebar-foreground/70 truncate">{user.email}</span>
                </div>
                <Button variant="ghost" size="icon" className="ml-auto" onClick={onLogout} title="Sign Out">
                    <LogOut className="h-5 w-5" />
                </Button>
              </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
            <div className="p-6">
                <Suspense fallback={<Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" />}>
                    {renderContent()}
                </Suspense>
            </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminAuthGuard>
  );
}

export default function AdminAccountPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
      <AdminAccountContent />
    </Suspense>
  );
}
