
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
  SidebarTrigger
} from '@/components/ui/sidebar';
import {
  Users,
  Settings,
  LogOut,
  LayoutDashboard,
  FileText,
  DollarSign,
  User,
  Building,
  Store,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useUser, useAuth, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import AccountDashboard from './dashboard';
import { Loader2 } from 'lucide-react';
import StaffContent from './staff-content';
import ProfileContent from './profile-content';
import CompanyContent from './company-content';
import TransactionsContent from './transactions-content';
import ShopContent from './shop-content'; // Import the new component
import { doc } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useFirestore } from '@/firebase';


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


function AccountPageContent() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  
  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') || 'dashboard';
  const [activeView, setActiveView] = useState(initialView);

  const memberDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'members', user.uid);
  }, [firestore, user]);

  const { data: memberData, isLoading: isMemberLoading } = useDoc(memberDocRef);

  const isVendor = memberData?.role === 'vendor';
  
  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  useEffect(() => {
    if (isUserLoading) {
      return; // Do nothing while loading
    }
    if (!user) {
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
        // Pass memberData down to ShopContent
        return isVendor ? <ShopContent memberData={memberData} /> : <AccountDashboard />;
      case 'transactions':
        return <TransactionsContent />;
      case 'documents':
        return <DocumentsContent />;
      case 'settings':
        return <SettingsContent />;
      case 'dashboard':
      default:
        return <AccountDashboard />;
    }
  }

  if (isUserLoading || !user || isMemberLoading) {
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
              {isVendor && (
                 <SidebarMenuItem>
                    <SidebarMenuButton tooltip="My Shop" isActive={activeView === 'shop'} onClick={() => router.push('/account?view=shop', { scroll: false })}>
                      <Store />
                      <span>My Shop</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Transactions" isActive={activeView === 'transactions'} onClick={() => router.push('/account?view=transactions', { scroll: false })}>
                  <DollarSign />
                  <span>Transactions</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Documents" isActive={activeView === 'documents'} onClick={() => router.push('/account?view=documents', { scroll: false })}>
                  <FileText />
                  <span>Documents</span>
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
