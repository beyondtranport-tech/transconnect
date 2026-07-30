
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
  UserCheck
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

// --- Dynamic Imports ---
const FundingDivisionContent = dynamic(() => import('@/app/backend/funding-division-content'), { ssr: false, loading: () => <div className="flex justify-center p-20"><Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" /></div> });
const ClientsContent = dynamic(() => import('@/app/lending/clients-content'), { ssr: false, loading: () => <div className="flex justify-center p-20"><Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" /></div> });
const AgreementsContent = dynamic(() => import('@/app/lending/agreements-content'), { ssr: false, loading: () => <div className="flex justify-center p-20"><Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" /></div> });
const AssetRegisterContent = dynamic(() => import('@/app/lending/asset-register-content'), { ssr: false, loading: () => <div className="flex justify-center p-20"><Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" /></div> });
const FacilitiesContent = dynamic(() => import('@/app/lending/facilities-content'), { ssr: false, loading: () => <div className="flex justify-center p-20"><Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" /></div> });
const LenderDeskContent = dynamic(() => import('@/app/lending/lender-desk-content'), { ssr: false, loading: () => <div className="flex justify-center p-20"><Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" /></div> });

// New Internal Modules
const PlatformStaffManagement = dynamic(() => import('@/app/adminaccount/platform-staff'), { ssr: false });
const PermissionsContent = dynamic(() => import('@/app/backend/permissions-content'), { ssr: false });

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
      case 'agreements': return <AgreementsContent />;
      case 'assets': return <AssetRegisterContent />;
      case 'facilities': return <FacilitiesContent />;
      case 'staff': return <PlatformStaffManagement />;
      case 'permissions': return <PermissionsContent />;
      case 'market': return <FundingDivisionContent mode="market" />;
      default: return <LenderDeskContent />;
    }
  }, [activeView]);

  if (isUserLoading || !user) {
    return (
        <div className="flex flex-col justify-center items-center py-40 gap-4">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Authenticating Portal Access...</p>
        </div>
    );
  }

  const navigate = (view: string) => router.push(`/lending?view=${view}`, { scroll: false });

  return (
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <div className="bg-primary/10 p-2 rounded-lg"><Landmark className="h-6 w-6 text-primary" /></div>
              <h2 className="text-lg font-black uppercase tracking-tight text-sidebar-foreground">Lending Desk</h2>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Admin Ledger" isActive={activeView === 'desk'} onClick={() => navigate('desk')}>
                        <LayoutDashboard /><span>Lender Desk (Ledger)</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Clients" isActive={activeView === 'clients'} onClick={() => navigate('clients')}>
                        <Users /><span>Debtor Registry</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Portfolios" isActive={['agreements', 'assets', 'facilities'].includes(activeView)}>
                        <ClipboardList /><span>Lending Portfolios</span>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'agreements'} onClick={() => navigate('agreements')}>Active Agreements</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'assets'} onClick={() => navigate('assets')}>Asset Register</SidebarMenuSubButton></SidebarMenuSubItem>
                        <SidebarMenuSubItem><SidebarMenuSubButton isActive={activeView === 'facilities'} onClick={() => navigate('facilities')}>Credit Facilities</SidebarMenuSubButton></SidebarMenuSubItem>
                    </SidebarMenuSub>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Market Origination" isActive={activeView === 'market'} onClick={() => navigate('market')}>
                        <Globe /><span>Inbound deal-flow</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarGroup>

            <SidebarGroup>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Team" isActive={activeView === 'staff'} onClick={() => navigate('staff')}>
                        <UserCheck /><span>Internal Team (Staff)</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Security" isActive={activeView === 'permissions'} onClick={() => navigate('permissions')}>
                        <Lock /><span>Security Matrix</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
             <div className="p-4 border-t space-y-4">
                <VisionOnboardingDialog onExtractionComplete={(data) => {
                    router.push(`/lending?view=clients&action=create&prefill=${encodeURIComponent(JSON.stringify(data))}`);
                }} />
                <Button variant="outline" className="w-full justify-start gap-2 h-9 text-[10px] font-black uppercase tracking-widest" asChild>
                    <Link href="/backend"><ArrowRightLeft className="h-3.5 w-3.5" /> Platform Backend</Link>
                </Button>
                <div className="flex items-center gap-3 p-2 rounded-md bg-sidebar-accent">
                    <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary text-white font-bold text-xs">AD</AvatarFallback></Avatar>
                    <div className="flex flex-col truncate text-left">
                        <span className="text-xs font-bold text-sidebar-foreground truncate text-left">{user.displayName || 'Admin'}</span>
                        <span className="text-[10px] text-sidebar-foreground/70 truncate text-left">{user.email}</span>
                    </div>
                </div>
             </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
            <div className="p-8 text-left text-foreground">
                <Suspense fallback={<div className="py-20 text-center"><Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" /></div>}>
                    {renderContent()}
                </Suspense>
            </div>
        </SidebarInset>
      </SidebarProvider>
  );
}

export default function LendingPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-8rem)] text-foreground"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
      <LendingPortalContent />
    </Suspense>
  );
}
