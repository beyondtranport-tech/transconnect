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
  Calculator,
  Banknote,
  Landmark,
  Lightbulb,
  FileSignature,
  ClipboardList,
  Users,
  Handshake,
  Truck,
  Repeat,
  Paperclip,
  CalendarCheck,
  Settings,
  ArrowRightLeft,
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

// --- Components ---
const FundingDivisionContent = dynamic(() => import('@/app/backend/funding-division-content'), { ssr: false, loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LendingAssumptions = dynamic(() => import('@/app/lending/lending-assumptions'), { ssr: false, loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LoanBook = dynamic(() => import('@/app/lending/loan-book'), { ssr: false, loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const DiscoveryContent = dynamic(() => import('@/app/lending/discovery-content'), { ssr: false, loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ScoringContent = dynamic(() => import('@/app/lending/scoring-content'), { ssr: false, loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ClientsContent = dynamic(() => import('@/app/lending/clients-content'), { ssr: false, loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PartnersContent = dynamic(() => import('@/app/lending/partners-content'), { ssr: false, loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const AgreementsContent = dynamic(() => import('@/app/lending/agreements-content'), { ssr: false, loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const AssetRegisterContent = dynamic(() => import('@/app/lending/asset-register-content'), { ssr: false, loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const TransactionsContent = dynamic(() => import('@/app/lending/transactions-content'), { ssr: false, loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const FacilitiesContent = dynamic(() => import('@/app/lending/facilities-content'), { ssr: false, loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const CollateralContent = dynamic(() => import('@/app/lending/collateral-content'), { ssr: false, loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PaymentsContent = dynamic(() => import('@/app/lending/payments-content'), { ssr: false, loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const FinancialModel = dynamic(() => import('@/app/lending/financial-model'), { ssr: false, loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LendingParametersContent = dynamic(() => import('@/app/account/lending-parameters-content'), { ssr: false, loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });


function LendingPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') || 'direct-deals';
  const [activeView, setActiveView] = useState(initialView);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  
  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

   useEffect(() => {
    if (!isUserLoading && !user) {
        router.replace('/signin?redirect=/lending');
    }
  }, [isUserLoading, user, router]);

  const onLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "AD";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const renderContent = useCallback(() => {
    switch (activeView) {
      case 'direct-deals': return <FundingDivisionContent mode="direct" />;
      case 'discovery': return <DiscoveryContent />;
      case 'scoring': return <ScoringContent />;
      case 'clients': return <ClientsContent />;
      case 'partners': return <PartnersContent />;
      case 'agreements': return <AgreementsContent />;
      case 'asset-register': return <AssetRegisterContent />;
      case 'transactions': return <TransactionsContent />;
      case 'facilities': return <FacilitiesContent />;
      case 'collateral': return <CollateralContent />;
      case 'payments': return <PaymentsContent />;
      case 'financial-model': return <FinancialModel />;
      case 'assumptions': return <LendingAssumptions />;
      case 'loan-book': return <LoanBook />;
      case 'lending-focus': return <LendingParametersContent />;
      default: return <FundingDivisionContent mode="direct" />;
    }
  }, [activeView]);
  

  if (isUserLoading || !user) {
    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  const navigate = (view: string) => router.push(`/lending?view=${view}`, { scroll: false });

  const isOriginationActive = ['direct-deals', 'discovery', 'scoring', 'lending-focus'].includes(activeView);
  const isPortfolioActive = ['clients', 'partners', 'agreements', 'asset-register', 'transactions', 'facilities', 'collateral', 'payments'].includes(activeView);
  const isModellingActive = ['financial-model', 'assumptions', 'loan-book'].includes(activeView);
  
  return (
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <Landmark className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold text-sidebar-foreground">
                Lending Portal
              </h2>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Deal Flow" isActive={isOriginationActive}>
                        <Lightbulb /><span>Deal Flow</span>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                        <SidebarMenuSubItem>
                            <SidebarMenuSubButton isActive={activeView === 'direct-deals'} onClick={() => navigate('direct-deals')}>
                                <Landmark className="h-3.5 w-3.5" />Direct Queue
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                            <SidebarMenuSubButton isActive={activeView === 'lending-focus'} onClick={() => navigate('lending-focus')}>
                                <Settings className="h-3.5 w-3.5" />Investment Focus
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                            <SidebarMenuSubButton isActive={activeView === 'discovery'} onClick={() => navigate('discovery')}>
                                KYC Discovery
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                            <SidebarMenuSubButton isActive={activeView === 'scoring'} onClick={() => navigate('scoring')}>
                                Risk Scoring
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                    </SidebarMenuSub>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Portfolio Management" isActive={isPortfolioActive}>
                        <ClipboardList /><span>Portfolio</span>
                    </SidebarMenuButton>
                     <SidebarMenuSub>
                        <SidebarMenuSubItem>
                            <SidebarMenuSubButton isActive={activeView === 'clients'} onClick={() => navigate('clients')}>
                                <Users />Clients (Debtors)
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                            <SidebarMenuSubButton isActive={activeView === 'partners'} onClick={() => navigate('partners')}>
                                <Handshake />Partners
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                         <SidebarMenuSubItem>
                            <SidebarMenuSubButton isActive={activeView === 'agreements'} onClick={() => navigate('agreements')}>
                                <FileSignature />Agreements
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                         <SidebarMenuSubItem>
                            <SidebarMenuSubButton isActive={activeView === 'asset-register'} onClick={() => navigate('asset-register')}>
                                <Truck />Asset Register
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                            <SidebarMenuSubButton isActive={activeView === 'transactions'} onClick={() => navigate('transactions')}>
                                <Repeat />Transactions
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                         <SidebarMenuSubItem>
                            <SidebarMenuSubButton isActive={activeView === 'facilities'} onClick={() => navigate('facilities')}>
                                <Banknote />Facilities
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                         <SidebarMenuSubItem>
                            <SidebarMenuSubButton isActive={activeView === 'collateral'} onClick={() => navigate('collateral')}>
                                <Paperclip />Collateral
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                         <SidebarMenuSubItem>
                            <SidebarMenuSubButton isActive={activeView === 'payments'} onClick={() => navigate('payments')}>
                                <CalendarCheck />Payments
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                    </SidebarMenuSub>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Modelling" isActive={isModellingActive}>
                        <Calculator /><span>Modelling</span>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                        <SidebarMenuSubItem>
                            <SidebarMenuSubButton isActive={activeView === 'financial-model'} onClick={() => navigate('financial-model')}>
                                Financial Model
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                         <SidebarMenuSubItem>
                            <SidebarMenuSubButton isActive={activeView === 'assumptions'} onClick={() => navigate('assumptions')}>
                                Assumptions
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                            <SidebarMenuSubButton isActive={activeView === 'loan-book'} onClick={() => navigate('loan-book')}>
                                Loan Book
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                    </SidebarMenuSub>
                </SidebarMenuItem>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
          <div className="border-t p-2">
            <Button variant="outline" className="w-full justify-start gap-2 h-9 text-xs" asChild>
                <Link href="/backend">
                    <ArrowRightLeft className="h-3.5 w-3.5" /> Operations Backend
                </Link>
            </Button>
          </div>
          {user && (
              <div className="flex items-center gap-3 p-2 rounded-md bg-sidebar-accent">
              <Avatar className="h-10 w-10">
                  <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col truncate">
                  <span className="text-sm font-medium text-sidebar-foreground truncate text-left">
                  {user.displayName || 'Admin'}
                  </span>
                  <span className="text-xs text-sidebar-foreground/70 truncate text-left">
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
  );
}


export default function LendingPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
      <LendingPortalContent />
    </Suspense>
  );
}
