
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
  LogOut,
  Loader2,
  TrendingUp,
  Sheet as FinancialSheetIcon,
  User,
  LayoutDashboard,
  Calculator,
  Database,
  Briefcase,
  Scale,
  Handshake,
  DollarSign,
  Settings,
  Users,
  Wrench,
  FileText,
  Landmark,
  Truck,
  ShieldCheck,
  FileSignature,
  FileSearch,
  Star,
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

// --- Dynamic Imports for Lending Components ---
const LendingModelDashboard = dynamic(() => import('@/app/backend/lending-model-dashboard'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const DiscoveryContent = dynamic(() => import('@/app/backend/lending/discovery-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ScoringContent = dynamic(() => import('@/app/backend/lending/scoring-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ClientsContent = dynamic(() => import('@/app/backend/lending/clients-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const AgreementsContent = dynamic(() => import('@/app/backend/lending/agreements-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const FacilitiesContent = dynamic(() => import('@/app/backend/lending/facilities-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LendingTransactionsContent = dynamic(() => import('@/app/backend/lending/transactions-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const AssetsContent = dynamic(() => import('@/app/backend/lending/assets-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const SecurityContent = dynamic(() => import('@/app/backend/lending/security-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const CollateralContent = dynamic(() => import('@/app/backend/lending/collateral-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PaymentsContent = dynamic(() => import('@/app/backend/lending/payments-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LendingPartnersContent = dynamic(() => import('@/app/backend/lending/partners-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PartnerDetails = dynamic(() => import('@/app/backend/lending/partner-details'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LendingDashboard = () => <div>Lending Dashboard Content...</div>; // Placeholder

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (isUserLoading) return;
        if (!user) {
            router.replace('/signin?redirect=/lending');
        } else if (user.email !== 'mkoton100@gmail.com' && user.email !== 'beyondtransport@gmail.com') {
            router.replace('/account');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || !user || (user.email !== 'mkoton100@gmail.com' && user.email !== 'beyondtransport@gmail.com')) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Verifying admin credentials...</p>
            </div>
        );
    }
    return <>{children}</>;
}

function LendingPortalContent() {
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
    switch (activeView) {
      case 'dashboard': return <LendingDashboard />;
      case 'discovery': return <DiscoveryContent />;
      case 'scoring': return <ScoringContent />;
      case 'clients': return <ClientsContent />;
      case 'agreements': return <AgreementsContent />;
      case 'facilities': return <FacilitiesContent />;
      case 'transactions': return <LendingTransactionsContent />;
      case 'assets': return <AssetsContent />;
      case 'security': return <SecurityContent />;
      case 'collateral': return <CollateralContent />;
      case 'payments': return <PaymentsContent />;
      case 'partners': return <LendingPartnersContent />;
      case 'lending-model': return <LendingModelDashboard />;
      default: return <LendingDashboard />;
    }
  }, [activeView]);
  
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

  const navigate = (view: string) => router.push(`/lending?view=${view}`, { scroll: false });
  
  const isDMSActive = ['clients', 'agreements', 'facilities', 'transactions', 'assets', 'security', 'collateral', 'payments'].includes(activeView);
  const isOriginationActive = ['discovery', 'scoring'].includes(activeView);

  return (
    <AdminAuthGuard>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Landmark className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold text-sidebar-foreground">
                Lending Portal
              </h2>
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
                  <SidebarMenuButton tooltip="Origination" isActive={isOriginationActive}><FileSearch /><span>Origination</span></SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'discovery'} onClick={() => navigate('discovery')}>Discovery</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'scoring'} onClick={() => navigate('scoring')}>Scoring</SidebarMenuSubButton></SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Debtor Management" isActive={isDMSActive}><Briefcase /><span>Debtor Management</span></SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'clients'} onClick={() => navigate('clients')}>Clients</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'agreements'} onClick={() => navigate('agreements')}>Agreements</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'facilities'} onClick={() => navigate('facilities')}>Facilities</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'transactions'} onClick={() => navigate('transactions')}>Transactions</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'assets'} onClick={() => navigate('assets')}>Assets</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'security'} onClick={() => navigate('security')}>Security</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'collateral'} onClick={() => navigate('collateral')}>Collateral</SidebarMenuSubButton></SidebarMenuSubItem>
                    <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'payments'} onClick={() => navigate('payments')}>Payments</SidebarMenuSubButton></SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Partners" isActive={activeView === 'partners'} onClick={() => navigate('partners')}>
                        <Handshake /><span>Partners</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Lending Model" isActive={activeView === 'lending-model'} onClick={() => navigate('lending-model')}>
                        <Calculator /><span>Lending Model</span>
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


export default function LendingPortalPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
      <LendingPortalContent />
    </Suspense>
  );
}
