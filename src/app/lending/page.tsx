'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
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
  Landmark,
  FileSignature,
  ClipboardList,
  Users,
  Handshake,
  Truck,
  Paperclip,
  Settings,
  ArrowRightLeft,
  Globe,
  Database,
  SearchCode,
  Zap,
  Sparkles,
  ShieldCheck,
  Lock,
  UserCheck,
  ListChecks,
  Scale,
  Wrench,
  FileText,
  TrendingUp,
  Gavel,
  History,
  Archive,
  User
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
import { VisionOnboardingDialog } from './VisionOnboardingDialog';

// --- Dynamic Imports for Modular Content ---
const ClientsContent = dynamic(() => import('@/app/lending/clients-content'), { ssr: false, loading: () => <div className="flex justify-center p-20"><Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" /></div> });
const DebtorsContent = dynamic(() => import('@/app/lending/debtors-content'), { ssr: false, loading: () => <div className="flex justify-center p-20"><Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" /></div> });
const AgreementsContent = dynamic(() => import('@/app/lending/agreements-content'), { ssr: false, loading: () => <div className="flex justify-center p-20"><Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" /></div> });
const AssetRegisterContent = dynamic(() => import('@/app/lending/asset-register-content'), { ssr: false, loading: () => <div className="flex justify-center p-20"><Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" /></div> });
const FacilitiesContent = dynamic(() => import('@/app/lending/facilities-content'), { ssr: false, loading: () => <div className="flex justify-center p-20"><Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" /></div> });
const LenderDeskContent = dynamic(() => import('@/app/lending/lender-desk-content'), { ssr: false, loading: () => <div className="flex justify-center p-20"><Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" /></div> });
const CollateralContent = dynamic(() => import('@/app/lending/collateral-content'), { ssr: false });
const DocumentVaultContent = dynamic(() => import('@/app/lending/documents-content'), { ssr: false });
const SecurityVaultContent = dynamic(() => import('@/app/lending/security-content'), { ssr: false });

// Admin / Fiduciary Control Modules
const PlatformStaffManagement = dynamic(() => import('@/app/adminaccount/platform-staff'), { ssr: false });
const PermissionsContent = dynamic(() => import('@/app/backend/permissions-content'), { ssr: false });
const PoliciesContent = dynamic(() => import('./policies-content'), { ssr: false });
const UtilitiesContent = dynamic(() => import('./utilities-content'), { ssr: false });

function LendingPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') || 'desk';
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

  const renderContent = useCallback(() => {
    switch (activeView) {
      case 'desk': return <LenderDeskContent />;
      case 'clients': return <ClientsContent />;
      case 'debtors': return <DebtorsContent />;
      case 'agreements': return <AgreementsContent />;
      case 'assets': return <AssetRegisterContent />;
      case 'facilities-clients': return <FacilitiesContent mode="client-global" />;
      case 'facilities-agreements': return <FacilitiesContent mode="client-sub" />;
      case 'facilities-debtors': return <FacilitiesContent mode="debtor" />;
      case 'collateral': return <CollateralContent />;
      case 'documents': return <DocumentVaultContent />;
      case 'security-vault': return <SecurityVaultContent />;
      case 'staff': return <PlatformStaffManagement />;
      case 'permissions': return <PermissionsContent />;
      case 'policies': return <PoliciesContent />;
      case 'utilities': return <UtilitiesContent />;
      default: return <LenderDeskContent />;
    }
  }, [activeView]);

  if (isUserLoading || !user) {
    return (
        <div className="flex flex-col justify-center items-center py-40 gap-4 text-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground text-center">Authenticating Portal Access...</p>
        </div>
    );
  }

  const navigate = (view: string) => router.push(`/lending?view=${view}`, { scroll: false });

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2 text-left">
            <div className="bg-primary/10 p-2 rounded-lg text-left">
              <Landmark className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-tight text-sidebar-foreground text-left">Lending Desk</h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Admin Ledger" isActive={activeView === 'desk'} onClick={() => navigate('desk')}>
                  <ListChecks />
                  <span>Master Action Ledger</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Portfolios" isActive={['clients', 'debtors', 'agreements', 'assets'].includes(activeView)}>
                  <ClipboardList />
                  <span>Lending Portfolios</span>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton isActive={activeView === 'clients'} onClick={() => navigate('clients')}>
                      Clients
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                   <SidebarMenuSubItem>
                    <SidebarMenuSubButton isActive={activeView === 'debtors'} onClick={() => navigate('debtors')}>
                      Debtors
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton isActive={activeView === 'agreements'} onClick={() => navigate('agreements')}>
                      Agreements
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton isActive={activeView === 'assets'} onClick={() => navigate('assets')}>
                      Asset Register
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Facilities" isActive={activeView.startsWith('facilities-')}>
                  <Scale />
                  <span>Facilities</span>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton isActive={activeView === 'facilities-clients'} onClick={() => navigate('facilities-clients')}>
                      Client Global
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton isActive={activeView === 'facilities-agreements'} onClick={() => navigate('facilities-agreements')}>
                      Client Sub-Limits
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton isActive={activeView === 'facilities-debtors'} onClick={() => navigate('facilities-debtors')}>
                      Debtor Registry
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Vaults" isActive={['documents', 'security-vault', 'collateral'].includes(activeView)}>
                  <Lock />
                  <span>Registry Vaults</span>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton isActive={activeView === 'documents'} onClick={() => navigate('documents')}>
                      Document Register
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton 
                      isActive={activeView === 'security-vault'} 
                      onClick={() => navigate('security-vault')}
                    >
                      Security Vault
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton 
                      isActive={activeView === 'collateral'} 
                      onClick={() => navigate('collateral')}
                    >
                      Collateral Register
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Staff" isActive={activeView === 'staff'} onClick={() => navigate('staff')}>
                  <UserCheck />
                  <span>Internal Team</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Security" isActive={activeView === 'permissions'} onClick={() => navigate('permissions')}>
                  <Lock />
                  <span>Security Matrix</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Policies" isActive={activeView === 'policies'} onClick={() => navigate('policies')}>
                  <Gavel />
                  <span>Lending Policies</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Utilities" isActive={activeView === 'utilities'} onClick={() => navigate('utilities')}>
                  <Wrench />
                  <span>Global Utilities</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </Sidebar>
        <SidebarInset>
          <div className="p-8 text-left text-foreground">
            <Suspense fallback={<div className="py-20 text-center text-foreground"><Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" /></div>}>
              {renderContent()}
            </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function LendingPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col justify-center items-center min-h-screen text-foreground gap-4 text-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground text-center">Initializing Portal...</p>
      </div>
    }>
      <LendingPortalContent />
    </Suspense>
  );
}
