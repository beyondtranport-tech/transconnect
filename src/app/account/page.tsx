
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
  Package,
  DollarSign,
  Presentation,
  Mail,
  Sheet as FinancialSheetIcon, // Renaming to avoid conflict
  Map,
  Target,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense, useCallback } from 'react';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import all components that are conditionally rendered
const AccountDashboard = dynamic(() => import('./dashboard'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const StaffContent = dynamic(() => import('./staff-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ProfileContent = dynamic(() => import('./profile-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const CompanyContent = dynamic(() => import('./company-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ShopContent = dynamic(() => import('./shop-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const BillingContent = dynamic(() => import('./billing-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const WalletContent = dynamic(() => import('./wallet-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const RewardsContent = dynamic(() => import('./rewards'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ActivityFeed = dynamic(() => import('./activity-feed'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });

// --- Sales Section ---
const NetworkContent = dynamic(() => import('./network-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const NetworkOffer = dynamic(() => import('./network-offer'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const NetworkEmails = dynamic(() => import('./network-emails'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PerformanceContent = dynamic(() => import('./performance-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });

// --- Financials Section ---
const FinancialSetup = dynamic(() => import('./financial-setup'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const SalesRoadmap = dynamic(() => import('./sales-roadmap'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const Targets = dynamic(() => import('./targets'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MemberProjection = dynamic(() => import('./member-projection'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const BudgetPage = dynamic(() => import('./budget/page'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ForecastPage = dynamic(() => import('./forecast/page'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });


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

function ProductSalesContent() {
    return (
        <Card>
            <CardHeader><CardTitle>Product Sales</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">This section is under construction. A breakdown of your sales per product will appear here.</p></CardContent>
        </Card>
    )
}
function EarningsContent() {
     return (
        <Card>
            <CardHeader><CardTitle>My Earnings</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">This section is under construction. Your detailed earnings and commission statements will appear here.</p></CardContent>
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
      case 'wallet': return <WalletContent />;
      case 'billing': return <BillingContent />;
      case 'rewards': return <RewardsContent />;
      case 'activity': return <ActivityFeed />;

      // Sales
      case 'network': return <NetworkContent />;
      case 'network-offer': return <NetworkOffer />;
      case 'network-emails': return <NetworkEmails />;
      case 'performance': return <PerformanceContent />;
      case 'product-sales': return <ProductSalesContent />;
      case 'earnings': return <EarningsContent />;

      // Financials
      case 'financial-setup': return <FinancialSetup />;
      case 'sales-roadmap': return <SalesRoadmap />;
      case 'targets': return <Targets />;
      case 'member-projection': return <MemberProjection />;
      case 'budget': return <BudgetPage />;
      case 'forecast': return <ForecastPage />;
      
      // Placeholders
      case 'documents': return <DocumentsContent />;
      case 'settings': return <SettingsContent />;

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
  
  const isSalesActive = ['network', 'performance', 'product-sales', 'earnings', 'network-offer', 'network-emails'].includes(activeView);
  const isFinancialsActive = ['financial-setup', 'sales-roadmap', 'targets', 'member-projection', 'budget', 'forecast'].includes(activeView);


  return (
    <SidebarProvider>
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
                <SidebarMenuButton tooltip="Sales" isActive={isSalesActive}>
                  <Handshake />
                  <span>Sales</span>
                </SidebarMenuButton>
                <SidebarMenuSub>
                    <SidebarMenuSubButton isActive={activeView === 'network'} onClick={() => navigate('network')}>
                        <Users />
                        <span>My Network</span>
                    </SidebarMenuSubButton>
                     <SidebarMenuSubButton isActive={activeView === 'network-offer'} onClick={() => navigate('network-offer')}>
                        <Presentation />
                        <span>Network Offer</span>
                    </SidebarMenuSubButton>
                    <SidebarMenuSubButton isActive={activeView === 'network-emails'} onClick={() => navigate('network-emails')}>
                        <Mail />
                        <span>Network Emails</span>
                    </SidebarMenuSubButton>
                    <SidebarMenuSubButton isActive={activeView === 'performance'} onClick={() => navigate('performance')}>
                        <TrendingUp />
                        <span>Performance</span>
                    </SidebarMenuSubButton>
                    <SidebarMenuSubButton isActive={activeView === 'product-sales'} onClick={() => navigate('product-sales')}>
                        <Package />
                        <span>Product Sales</span>
                    </SidebarMenuSubButton>
                     <SidebarMenuSubButton isActive={activeView === 'earnings'} onClick={() => navigate('earnings')}>
                        <DollarSign />
                        <span>Earnings</span>
                    </SidebarMenuSubButton>
                </SidebarMenuSub>
              </SidebarMenuItem>
              <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Financials" isActive={isFinancialsActive}>
                      <TrendingUp />
                      <span>Financials</span>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                      <SidebarMenuSubButton isActive={activeView === 'financial-setup'} onClick={() => navigate('financial-setup')}>
                          <Settings />
                          <span>Set Up</span>
                      </SidebarMenuSubButton>
                       <SidebarMenuSubButton isActive={activeView === 'sales-roadmap'} onClick={() => navigate('sales-roadmap')}>
                          <Map />
                          <span>Sales Roadmap</span>
                      </SidebarMenuSubButton>
                      <SidebarMenuSubButton isActive={activeView === 'targets'} onClick={() => navigate('targets')}>
                          <Target />
                          <span>Targets</span>
                      </SidebarMenuSubButton>
                      <SidebarMenuSubButton isActive={activeView === 'member-projection'} onClick={() => navigate('member-projection')}>
                          <Users />
                          <span>Member Projection</span>
                      </SidebarMenuSubButton>
                      <SidebarMenuSubButton isActive={activeView === 'budget'} onClick={() => navigate('budget')}>
                          <FinancialSheetIcon />
                          <span>Budget</span>
                      </SidebarMenuSubButton>
                      <SidebarMenuSubButton isActive={activeView === 'forecast'} onClick={() => navigate('forecast')}>
                          <TrendingUp />
                          <span>Forecast</span>
                      </SidebarMenuSubButton>
                  </SidebarMenuSub>
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

    