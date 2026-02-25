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
  SidebarMenuSeparator,
} from '@/components/ui/sidebar';
import {
  LogOut,
  Loader2,
  LayoutDashboard,
  Users,
  Briefcase,
  Database,
  FileText,
  FileCheck,
  FileSearch,
  Wrench,
  ShieldCheck,
  Handshake,
  Landmark,
  DollarSign,
  Sheet
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense, useCallback } from 'react';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import dynamic from 'next/dynamic';
import React from 'react';

// --- Dynamic Imports for Lending Components ---
const LendingDashboard = dynamic(() => import('./dashboard-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const DiscoveryContent = dynamic(() => import('./discovery-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ScoringContent = dynamic(() => import('./scoring-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ClientsContent = dynamic(() => import('./clients-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PartnersContent = dynamic(() => import('./partners-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const AgreementsContent = dynamic(() => import('./agreements-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const AssetsContent = dynamic(() => import('./assets-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const TransactionsContent = dynamic(() => import('./transactions-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const FacilitiesContent = dynamic(() => import('./facilities-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const CollateralContent = dynamic(() => import('./collateral-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PaymentsContent = dynamic(() => import('./payments-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const SecurityContent = dynamic(() => import('./security-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LendingModelDashboard = dynamic(() => import('@/app/backend/lending-model-dashboard'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });


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
            <div className="flex flex-col justify-center items-center min-h-[calc(100vh-8rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Verifying admin credentials for Lending Portal...</p>
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
      case 'partners': return <PartnersContent />;
      case 'agreements': return <AgreementsContent />;
      case 'assets': return <AssetsContent />;
      case 'transactions': return <TransactionsContent />;
      case 'facilities': return <FacilitiesContent />;
      case 'collateral': return <CollateralContent />;
      case 'payments': return <PaymentsContent />;
      case 'security': return <SecurityContent />;
      case 'model': return <LendingModelDashboard />;
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

  return (
    <AdminAuthGuard>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
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
                <SidebarMenuSeparator />
                 <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Discovery" isActive={activeView === 'discovery'} onClick={() => navigate('discovery')}>
                        <FileSearch /><span>Discovery</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Scoring" isActive={activeView === 'scoring'} onClick={() => navigate('scoring')}>
                        <FileCheck /><span>Scoring</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuSeparator />
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Clients" isActive={activeView === 'clients'} onClick={() => navigate('clients')}><Users /><span>Clients (Debtors)</span></SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Partners" isActive={activeView === 'partners'} onClick={() => navigate('partners')}><Handshake /><span>Partners (Co-funders)</span></SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuSeparator />
                 <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Agreements" isActive={activeView === 'agreements'} onClick={() => navigate('agreements')}><FileText /><span>Agreements</span></SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Assets" isActive={activeView === 'assets'} onClick={() => navigate('assets')}><Briefcase /><span>Asset Register</span></SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Transactions" isActive={activeView === 'transactions'} onClick={() => navigate('transactions')}><Database /><span>Transactions</span></SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Facilities" isActive={activeView === 'facilities'} onClick={() => navigate('facilities')}><Landmark /><span>Facilities</span></SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Collateral" isActive={activeView === 'collateral'} onClick={() => navigate('collateral')}><Wrench /><span>Collateral</span></SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Payments" isActive={activeView === 'payments'} onClick={() => navigate('payments')}><FileCheck /><span>Payments</span></SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Security" isActive={activeView === 'security'} onClick={() => navigate('security')}><ShieldCheck /><span>Security</span></SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuSeparator />
                 <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Financial Model" isActive={activeView === 'model'} onClick={() => navigate('model')}><Sheet /><span>Financial Model</span></SidebarMenuButton>
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
    </LendingAuthGuard>
  );
}


export default function LendingPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
      <LendingPortalContent />
    </Suspense>
  );
}