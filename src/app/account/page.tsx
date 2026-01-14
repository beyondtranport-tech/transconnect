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
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import AccountDashboard from './dashboard';
import { Loader2 } from 'lucide-react';
import StaffContent from './staff-content';
import ProfileContent from './profile-content';
import CompanyContent from './company-content';
import ShopContent from './shop-content';
import BillingContent from './billing-content';
import WalletContent from './wallet-content';
import RewardsContent from './rewards';
import NetworkContent from './network-content';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import NetworkOffer from './network-offer';
import NetworkEmails from './network-emails';


function DocumentsContent() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Documents</h1>
            <p className="mt-2 text-muted-foreground">This is where document management will go.</p>
        </div>
    )
}
function SettingsContent() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="mt-2 text-muted-foreground">This is where account settings will go.</p>
        </div>
    )
}

// Placeholder components for new sales sections
function PerformanceContent() {
    return (
        <Card>
            <CardHeader><CardTitle>Performance Dashboard</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">This section is under construction. Your sales performance metrics will appear here.</p></CardContent>
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

  const renderContent = () => {
    switch (activeView) {
      case 'profile':
        return <ProfileContent />;
      case 'company':
        return <CompanyContent />;
      case 'staff':
        return <StaffContent />;
      case 'shop':
        return <ShopContent />;
      case 'wallet':
        return <WalletContent />;
      case 'billing':
        return <BillingContent />;
      case 'rewards':
        return <RewardsContent />;
      case 'network':
        return <NetworkContent />;
      case 'performance':
        return <PerformanceContent />;
      case 'product-sales':
        return <ProductSalesContent />;
      case 'earnings':
        return <EarningsContent />;
      case 'network-offer':
        return <NetworkOffer />;
      case 'network-emails':
        return <NetworkEmails />;
      case 'documents':
        return <DocumentsContent />;
      case 'activity-feed':
        return <ActivityFeed />;
      case 'settings':
        return <SettingsContent />;
      case 'dashboard':
      default:
        return <AccountDashboard />;
    }
  }

  if (isUserLoading || !user) {
    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

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
                <SidebarMenuButton tooltip="Dashboard" isActive={activeView === 'dashboard'} onClick={() => router.push('/account?view=dashboard', { scroll: false })}>
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="My Profile" isActive={activeView === 'profile'} onClick={() => router.push('/account?view=profile', { scroll: false })}>
                  <User />
                  <span>My Profile</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton tooltip="Company" isActive={activeView === 'company'} onClick={() => router.push('/account?view=company', { scroll: false })}>
                  <Building />
                  <span>Company</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton tooltip="Staff" isActive={activeView === 'staff'} onClick={() => router.push('/account?view=staff', { scroll: false })}>
                  <Users />
                  <span>Staff</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="My Shop" isActive={activeView === 'shop'} onClick={() => router.push('/account?view=shop', { scroll: false })}>
                  <Store />
                  <span>My Shop</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton tooltip="Wallet" isActive={activeView === 'wallet'} onClick={() => router.push('/account?view=wallet', { scroll: false })}>
                  <Wallet />
                  <span>Wallet</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton tooltip="Rewards" isActive={activeView === 'rewards'} onClick={() => router.push('/account?view=rewards', { scroll: false })}>
                  <Gift />
                  <span>Rewards</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Sales" isActive={['network', 'performance', 'product-sales', 'earnings', 'network-offer', 'network-emails'].includes(activeView)}>
                  <Handshake />
                  <span>Sales</span>
                </SidebarMenuButton>
                <SidebarMenuSub>
                    <SidebarMenuSubButton isActive={activeView === 'network'} onClick={() => router.push('/account?view=network', { scroll: false })}>
                        <Users />
                        <span>My Network</span>
                    </SidebarMenuSubButton>
                     <SidebarMenuSubButton isActive={activeView === 'network-offer'} onClick={() => router.push('/account?view=network-offer', { scroll: false })}>
                        <Presentation />
                        <span>Network Offer</span>
                    </SidebarMenuSubButton>
                    <SidebarMenuSubButton isActive={activeView === 'network-emails'} onClick={() => router.push('/account?view=network-emails', { scroll: false })}>
                        <Mail />
                        <span>Network Emails</span>
                    </SidebarMenuSubButton>
                    <SidebarMenuSubButton isActive={activeView === 'performance'} onClick={() => router.push('/account?view=performance', { scroll: false })}>
                        <TrendingUp />
                        <span>Performance</span>
                    </SidebarMenuSubButton>
                    <SidebarMenuSubButton isActive={activeView === 'product-sales'} onClick={() => router.push('/account?view=product-sales', { scroll: false })}>
                        <Package />
                        <span>Product Sales</span>
                    </SidebarMenuSubButton>
                     <SidebarMenuSubButton isActive={activeView === 'earnings'} onClick={() => router.push('/account?view=earnings', { scroll: false })}>
                        <DollarSign />
                        <span>Earnings</span>
                    </SidebarMenuSubButton>
                </SidebarMenuSub>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Billing" isActive={activeView === 'billing'} onClick={() => router.push('/account?view=billing', { scroll: false })}>
                  <CreditCard />
                  <span>Billing</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Documents" isActive={activeView === 'documents'} onClick={() => router.push('/account?view=documents', { scroll: false })}>
                  <FileText />
                  <span>Documents</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Activity Feed" isActive={activeView === 'activity-feed'} onClick={() => router.push('/account?view=activity-feed', { scroll: false })}>
                  <Activity />
                  <span>Activity Feed</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Settings" isActive={activeView === 'settings'} onClick={() => router.push('/account?view=settings', { scroll: false })}>
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
          {renderContent()}
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
