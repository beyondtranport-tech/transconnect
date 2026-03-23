
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
  LayoutDashboard,
  User,
  Bot,
  Mic,
  BarChart3,
  Search,
  Database,
  Palette,
  GalleryVertical,
  Handshake,
  Users2,
  UserCheck2,
  Code2,
  Presentation,
  Building,
  Wrench,
  DollarSign,
  Gift,
  FileText,
  Mail,
  TrendingUp,
  Settings,
  Banknote,
  Map,
  Target,
  Calculator,
  Sheet as FinancialSheetIcon,
  LineChart,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense, useCallback } from 'react';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import all the content components
const DashboardContent = dynamic(() => import('./dashboard'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const AnalyticsContent = dynamic(() => import('./analytics'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LeadsAgent = dynamic(() => import('./leads-agent'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const LeadsDatabase = dynamic(() => import('@/app/backend/leads-database'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const BrandingStudio = dynamic(() => import('./branding-studio'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const AudioStudio = dynamic(() => import('./tts-studio'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const AssetGallery = dynamic(() => import('./asset-gallery'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });

const PartnerManagement = dynamic(() => import('@/app/backend/partner-management'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const ISAManagement = dynamic(() => import('@/app/backend/isa-management'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const InvestorManagement = dynamic(() => import('./investor-management'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const DeveloperManagement = dynamic(() => import('@/app/backend/developer-management'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });

const PitchCompanyProfile = dynamic(() => import('./pitch-company-profile'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PitchTechArchitecture = dynamic(() => import('./pitch-tech-architecture'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PitchRevenueModel = dynamic(() => import('./pitch-revenue-model'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PitchMemberOffer = dynamic(() => import('@/app/account/network-offer'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PitchPartner = dynamic(() => import('@/app/backend/pitch-content'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const PitchPartnerFramework = dynamic(() => import('./pitch-partner-framework'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const EmailSequence = dynamic(() => import('@/app/account/partner-email-sequence'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const InvestorOffer = dynamic(() => import('@/app/backend/investor-offer'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const DeveloperOffer = dynamic(() => import('./pitch-developer-offer'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });

const FinancialsSetup = dynamic(() => import('@/app/backend/financial-setup'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const FinancialsGeneralSettings = dynamic(() => import('./financials-general-settings'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const FinancialsBankDetails = dynamic(() => import('@/app/backend/bank-details-settings'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const FinancialsSalesRoadmap = dynamic(() => import('@/app/account/sales-roadmap'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const FinancialsTargets = dynamic(() => import('@/app/account/targets'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const FinancialsBudget = dynamic(() => import('@/app/account/budget/page'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });
const FinancialsProjections = dynamic(() => import('@/app/backend/financial-projections'), { loading: () => <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto my-20" /> });


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
    switch (activeView) {
      case 'dashboard': return <DashboardContent />;
      case 'analytics': return <AnalyticsContent />;
      case 'leads-agent': return <LeadsAgent />;
      case 'leads-database': return <LeadsDatabase />;
      case 'branding-studio': return <BrandingStudio />;
      case 'audio-studio': return <AudioStudio />;
      case 'asset-gallery': return <AssetGallery />;
      case 'partners-strategic': return <PartnerManagement />;
      case 'partners-isa': return <ISAManagement />;
      case 'partners-investor': return <InvestorManagement />;
      case 'partners-developer': return <DeveloperManagement />;

      case 'pitch-company-profile': return <PitchCompanyProfile />;
      case 'pitch-tech-architecture': return <PitchTechArchitecture />;
      case 'pitch-revenue-model': return <PitchRevenueModel />;
      case 'pitch-member-offer': return <PitchMemberOffer />;
      case 'pitch-partner': return <PitchPartner />;
      case 'pitch-partner-framework': return <PitchPartnerFramework />;
      case 'pitch-isa-emails': return <EmailSequence />;
      case 'pitch-partner-emails': return <EmailSequence />;
      case 'pitch-investor': return <InvestorOffer />;
      case 'pitch-investor-offer': return <InvestorOffer />;
      case 'pitch-investor-emails': return <EmailSequence />;
      case 'pitch-developer': return <DeveloperOffer />;
      case 'pitch-developer-offer': return <DeveloperOffer />;
      case 'pitch-developer-emails': return <EmailSequence />;
      
      case 'financials-setup': return <FinancialsSetup />;
      case 'financials-general-settings': return <FinancialsGeneralSettings />;
      case 'financials-bank-details': return <FinancialsBankDetails />;
      case 'financials-sales-roadmap': return <FinancialsSalesRoadmap />;
      case 'financials-targets': return <FinancialsTargets />;
      case 'financials-budget': return <FinancialsBudget />;
      case 'financials-projections-members': return <FinancialsProjections />;
      case 'financials-projections-turnover': return <FinancialsProjections />;
      case 'financials-projections-income': return <FinancialsProjections />;
      
      default: return <DashboardContent />;
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

  const navigate = (view: string) => router.push(`/adminaccount?view=${view}`, { scroll: false });
  
  const isSalesActive = ['leads-agent', 'leads-database', 'branding-studio', 'audio-studio', 'asset-gallery'].includes(activeView);
  const isPartnersActive = ['partners-strategic', 'partners-isa', 'partners-investor', 'partners-developer'].includes(activeView);
  const isPitchingActive = activeView.startsWith('pitch-');
  const isFinancialsInputsActive = activeView.startsWith('financials-') && !activeView.includes('projections');
  const isFinancialsProjectionsActive = activeView.startsWith('financials-projections');

  return (
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <User className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold text-sidebar-foreground">
                Admin Account
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
                    <SidebarMenuButton tooltip="Analytics" isActive={activeView === 'analytics'} onClick={() => navigate('analytics')}>
                        <BarChart3 /><span>Analytics</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Sales & Marketing" isActive={isSalesActive}>
                        <TrendingUp /><span>Sales & Marketing</span>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'leads-agent'} onClick={() => navigate('leads-agent')}><Bot />AI Leads Agent</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'leads-database'} onClick={() => navigate('leads-database')}><Database />Leads Database</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'branding-studio'} onClick={() => navigate('branding-studio')}><Palette />Branding Studio</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'audio-studio'} onClick={() => navigate('audio-studio')}><Mic />Audio Studio</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'asset-gallery'} onClick={() => navigate('asset-gallery')}><GalleryVertical />Asset Gallery</SidebarMenuSubButton></SidebarMenuSubItem>
                    </SidebarMenuSub>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Partner Management" isActive={isPartnersActive}>
                        <Handshake /><span>Partner Management</span>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'partners-strategic'} onClick={() => navigate('partners-strategic')}><Users2 />Strategic Partners</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'partners-isa'} onClick={() => navigate('partners-isa')}><UserCheck2 />ISA Agents</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'partners-investor'} onClick={() => navigate('partners-investor')}><DollarSign />Investors</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'partners-developer'} onClick={() => navigate('partners-developer')}><Code2 />Developers</SidebarMenuSubButton></SidebarMenuSubItem>
                    </SidebarMenuSub>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Pitching" isActive={isPitchingActive}>
                        <Presentation /><span>Pitching</span>
                    </SidebarMenuButton>
                     <SidebarMenuSub>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'pitch-company-profile'} onClick={() => navigate('pitch-company-profile')}><Building />Company Profile</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'pitch-tech-architecture'} onClick={() => navigate('pitch-tech-architecture')}><Wrench />Tech Architecture</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'pitch-revenue-model'} onClick={() => navigate('pitch-revenue-model')}><DollarSign />Revenue Model</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'pitch-member-offer'} onClick={() => navigate('pitch-member-offer')}><Gift />Member Offer</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'pitch-partner'} onClick={() => navigate('pitch-partner')}><FileText />Partner Pitch</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'pitch-partner-framework'} onClick={() => navigate('pitch-partner-framework')}><Handshake />Partner Framework</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'pitch-isa-emails'} onClick={() => navigate('pitch-isa-emails')}><Mail />ISA Email Seq.</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'pitch-partner-emails'} onClick={() => navigate('pitch-partner-emails')}><Mail />Partner Email Seq.</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'pitch-investor'} onClick={() => navigate('pitch-investor')}><FileText />Investor Pitch</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'pitch-investor-offer'} onClick={() => navigate('pitch-investor-offer')}><DollarSign />Investor Offer</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'pitch-investor-emails'} onClick={() => navigate('pitch-investor-emails')}><Mail />Investor Email Seq.</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'pitch-developer'} onClick={() => navigate('pitch-developer')}><FileText />Developer Pitch</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'pitch-developer-offer'} onClick={() => navigate('pitch-developer-offer')}><Code2 />Developer Offer</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'pitch-developer-emails'} onClick={() => navigate('pitch-developer-emails')}><Mail />Developer Email Seq.</SidebarMenuSubButton></SidebarMenuSubItem>
                    </SidebarMenuSub>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton tooltip="App Financials" isActive={isFinancialsInputsActive || isFinancialsProjectionsActive}>
                        <FinancialSheetIcon /><span>App Financials</span>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                       <SidebarMenuSubItem>
                            <SidebarMenuButton size="sm" isActive={isFinancialsInputsActive}>
                                <Settings /><span>Inputs</span>
                            </SidebarMenuButton>
                             <SidebarMenuSub>
                                <SidebarMenuSubItem><SidebarMenuSubButton size="sm" isActive={activeView === 'financials-setup'} onClick={() => navigate('financials-setup')}>Set Up</SidebarMenuSubButton></SidebarMenuSubItem>
                                <SidebarMenuSubItem><SidebarMenuSubButton size="sm" isActive={activeView === 'financials-general-settings'} onClick={() => navigate('financials-general-settings')}>General Settings</SidebarMenuSubButton></SidebarMenuSubItem>
                                <SidebarMenuSubItem><SidebarMenuSubButton size="sm" isActive={activeView === 'financials-bank-details'} onClick={() => navigate('financials-bank-details')}>Bank Details</SidebarMenuSubButton></SidebarMenuSubItem>
                                <SidebarMenuSubItem><SidebarMenuSubButton size="sm" isActive={activeView === 'financials-sales-roadmap'} onClick={() => navigate('financials-sales-roadmap')}>Sales Roadmap</SidebarMenuSubButton></SidebarMenuSubItem>
                                <SidebarMenuSubItem><SidebarMenuSubButton size="sm" isActive={activeView === 'financials-targets'} onClick={() => navigate('financials-targets')}>Monthly Targets</SidebarMenuSubButton></SidebarMenuSubItem>
                                <SidebarMenuSubItem><SidebarMenuSubButton size="sm" isActive={activeView === 'financials-budget'} onClick={() => navigate('financials-budget')}>Budget</SidebarMenuSubButton></SidebarMenuSubItem>
                            </SidebarMenuSub>
                       </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                            <SidebarMenuButton size="sm" isActive={isFinancialsProjectionsActive}>
                                <LineChart /><span>Projections</span>
                            </SidebarMenuButton>
                             <SidebarMenuSub>
                                <SidebarMenuSubItem><SidebarMenuSubButton size="sm" isActive={activeView === 'financials-projections-members'} onClick={() => navigate('financials-projections-members')}>Members</SidebarMenuSubButton></SidebarMenuSubItem>
                                <SidebarMenuSubItem><SidebarMenuSubButton size="sm" isActive={activeView === 'financials-projections-turnover'} onClick={() => navigate('financials-projections-turnover')}>Turnover</SidebarMenuSubButton></SidebarMenuSubItem>
                                <SidebarMenuSubItem><SidebarMenuSubButton size="sm" isActive={activeView === 'financials-projections-income'} onClick={() => navigate('financials-projections-income')}>Income Statement</SidebarMenuSubButton></SidebarMenuSubItem>
                            </SidebarMenuSub>
                       </SidebarMenuSubItem>
                    </SidebarMenuSub>
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
                  {user.displayName || 'Admin'}
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
  );
}


export default function AdminAccountPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
      <AdminAccountContent />
    </Suspense>
  );
}
