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
  LogOut,
  Loader2,
  TrendingUp,
  Map,
  Sheet,
  Presentation,
  User,
  Settings,
  Users,
  Banknote,
  Combine,
  Truck,
  Building,
  ShieldAlert,
  Store,
  Wrench,
  CheckCircle,
  XCircle,
  ShoppingBasket,
  Cpu,
  Landmark,
  ArrowRight,
  Key,
  HandCoins,
  TicketPercent,
  Star,
  Gift,
  Award,
  HeartHandshake,
  Boxes,
  Server,
  ListTodo,
  Wallet,
  DollarSign,
  FileText,
  Lock,
  Activity,
  Sparkles,
  LayoutDashboard,
  Mail,
  Handshake as HandshakeIcon,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense, useCallback } from 'react';
import Link from 'next/link';

import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

import dynamic from 'next/dynamic';
import React from 'react';
import MembersList from '../backend/members-list';
import WalletTransactionsList from '../backend/wallet-transactions-list';
import ReconciliationPage from '../backend/reconciliation/page';

// --- Business Strategy Components ---
const SalesRoadmap = dynamic(() => import('./sales-roadmap'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const BudgetPage = dynamic(() => import('../account/budget/page'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ForecastPage = dynamic(() => import('./forecast/page'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PartnerOffer = dynamic(() => import('./partner-offer'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PartnerEmailSequence = dynamic(() => import('./partner-email-sequence'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const FinancialSetup = dynamic(() => import('../account/financial-setup'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const MemberProjection = dynamic(() => import('../account/member-projection'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const Targets = dynamic(() => import('../account/targets'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const StaffContent = dynamic(() => import('./staff-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });

// --- Business Operations Components (from /backend) ---
const MemberWallet = dynamic(() => import('../backend/wallet/[memberId]/member-wallet'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const DashboardContent = dynamic(() => import('../backend/dashboard-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
// const StaffContent = dynamic(() => import('../adminaccount/staff-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ShopsList = dynamic(() => import('../backend/shops-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ContributionsList = dynamic(() => import('../backend/contributions-list'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });


function AdminAuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (isUserLoading) {
            return;
        }

        if (!user) {
            router.replace('/signin?redirect=/adminaccount');
        } else if (user.email !== 'beyondtransport@gmail.com') {
            router.replace('/account'); 
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || !user || user.email !== 'beyondtransport@gmail.com') {
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
  const initialView = searchParams.get('view') || 'partner-offer';
  const memberId = searchParams.get('memberId');
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
    switch (activeView) {
      // Business Strategy
      case 'partner-offer': return <PartnerOffer />;
      case 'partner-email': return <PartnerEmailSequence />;
      case 'financial-setup': return <FinancialSetup />;
      case 'sales-roadmap': return <SalesRoadmap />;
      case 'targets': return <Targets />;
      case 'member-projection': return <MemberProjection />;
      case 'budget': return <BudgetPage />;
      case 'forecast': return <ForecastPage />;
      
      // Business Operations
      case 'dashboard': return <DashboardContent />;
      case 'staff': return <StaffContent />;
      case 'shops': return <ShopsList />;
      case 'contributions': return <ContributionsList />;
      case 'wallet-transactions': return <WalletTransactionsList />;
      case 'wallet-reconciliation': return <ReconciliationPage />;
       case 'wallet':
        if (memberId) {
            return <MemberWallet memberId={memberId} />;
        }
        return <WalletTransactionsList />; // Fallback

      default:
        return <PartnerOffer />;
    }
  }, [activeView, memberId]);
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "AD";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (isUserLoading || !user) {
    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <AdminAuthGuard>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Building className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold text-sidebar-foreground">
                Admin Account
              </h2>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Dashboard" isActive={activeView === 'dashboard'} onClick={() => router.push('/adminaccount?view=dashboard', { scroll: false })}>
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Partner Pitch" isActive={['partner-offer', 'partner-email'].includes(activeView)}>
                  <Presentation />
                  <span>Partner Pitch</span>
                </SidebarMenuButton>
                <SidebarMenuSub>
                    <SidebarMenuSubButton isActive={activeView === 'partner-offer'} onClick={() => router.push('/adminaccount?view=partner-offer', { scroll: false })}>
                        <Presentation />
                        <span>Partner Offer</span>
                    </SidebarMenuSubButton>
                    <SidebarMenuSubButton isActive={activeView === 'partner-email'} onClick={() => router.push('/adminaccount?view=partner-email', { scroll: false })}>
                        <Mail />
                        <span>Email Sequence</span>
                    </SidebarMenuSubButton>
                </SidebarMenuSub>
              </SidebarMenuItem>
              <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Staff" isActive={activeView === 'staff'} onClick={() => router.push('/adminaccount?view=staff', { scroll: false })}>
                  <Users />
                  <span>Staff</span>
                  </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Wallet">
                      <Wallet />
                      <span>Wallet</span>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                      <SidebarMenuSubButton isActive={activeView === 'wallet-transactions'} onClick={() => router.push('/adminaccount?view=wallet-transactions', { scroll: false })}>
                          <DollarSign />
                          <span>Member Wallet Ledger</span>
                      </SidebarMenuSubButton>
                      <SidebarMenuSubButton isActive={activeView === 'wallet-reconciliation'} onClick={() => router.push('/adminaccount?view=wallet-reconciliation', { scroll: false })}>
                          <Combine />
                          <span>Reconciliation</span>
                      </SidebarMenuSubButton>
                  </SidebarMenuSub>
              </SidebarMenuItem>
              <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Projection" isActive={['financial-setup', 'sales-roadmap', 'targets', 'member-projection', 'budget', 'forecast'].includes(activeView)}>
                      <TrendingUp />
                      <span>Projection</span>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                      <SidebarMenuSubButton isActive={activeView === 'financial-setup'} onClick={() => router.push('/adminaccount?view=financial-setup', { scroll: false })}>
                          <Settings />
                          <span>Setup</span>
                      </SidebarMenuSubButton>
                      <SidebarMenuSubButton isActive={activeView === 'sales-roadmap'} onClick={() => router.push('/adminaccount?view=sales-roadmap', { scroll: false })}>
                          <Map />
                          <span>Sales Roadmap</span>
                      </SidebarMenuSubButton>
                      <SidebarMenuSubButton isActive={activeView === 'targets'} onClick={() => router.push('/adminaccount?view=targets', { scroll: false })}>
                          <Sheet />
                          <span>Targets</span>
                      </SidebarMenuSubButton>
                      <SidebarMenuSubButton isActive={activeView === 'member-projection'} onClick={() => router.push('/adminaccount?view=member-projection', { scroll: false })}>
                          <Users />
                          <span>Member Projection</span>
                      </SidebarMenuSubButton>
                      <SidebarMenuSubButton isActive={activeView === 'budget'} onClick={() => router.push('/adminaccount?view=budget', { scroll: false })}>
                          <Sheet />
                          <span>Budget</span>
                      </SidebarMenuSubButton>
                      <SidebarMenuSubButton isActive={activeView === 'forecast'} onClick={() => router.push('/adminaccount?view=forecast', { scroll: false })}>
                          <TrendingUp />
                          <span>Forecast</span>
                      </SidebarMenuSubButton>
                  </SidebarMenuSub>
              </SidebarMenuItem>
              <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Backend" onClick={() => router.push('/backend', { scroll: false })}>
                      <Server />
                      <span>App Backend</span>
                  </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
          {user && (
              <div className="flex items-center gap-3 p-2 rounded-md bg-sidebar-accent">
              <Avatar className="h-10 w-10">
                  <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col truncate">
                  <span className="text-sm font-medium text-sidebar-foreground truncate">
                  {user.displayName || 'Super Admin'}
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
                  title="Sign Out"
              >
                  <LogOut className="h-5 w-5" />
              </Button>
              </div>
          )}
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
