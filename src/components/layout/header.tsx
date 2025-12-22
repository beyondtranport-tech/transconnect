
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Truck, Menu, User, ChevronDown, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import * as React from "react";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const mainNavLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/connect", label: "Connect" },
  { href: "/incentives", label: "Incentives" },
  { href: "/resources", label: "Resources" },
  { href: "/contact", label: "Contact Us" },
];

const divisionLinks = [
    { href: "/divisions", label: "All Divisions" },
    { href: "/funding", label: "Funding" },
    { href: "/mall", label: "Mall" },
    { href: "/marketplace", label: "Marketplace" },
    { href: "/tech", label: "Tech" },
]

export function Header() {
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  const isAdmin = isClient && user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  const handleSignOut = async () => {
    if (!auth) return;
    try {
        await signOut(auth);
        // This will trigger the onAuthStateChanged listener and update the UI
        // Also, clear the session cookie by calling our API route
        await fetch('/api/auth/session', { method: 'DELETE' });
    } catch (error) {
        console.error("Error signing out: ", error);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "AC";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">TransConnect</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            {mainNavLinks.map(({ href, label }) => (
                <Link key={href} href={href} className={cn("transition-colors hover:text-primary px-3 py-2 rounded-md", pathname === href ? "text-primary font-semibold" : "text-muted-foreground")}>
                    {label}
                </Link>
            ))}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={cn(
                  "flex items-center gap-1 px-3 py-2 text-sm font-medium hover:text-primary data-[state=open]:text-primary",
                  ["/divisions", "/marketplace", "/tech", "/funding", "/mall"].some(p => pathname.startsWith(p)) ? "text-primary font-semibold" : "text-muted-foreground"
                )}>
                  Divisions
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {divisionLinks.map(({ href, label }) => (
                  <DropdownMenuItem key={href} asChild>
                    <Link href={href}>{label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            {!isClient ? (
               <div className="flex items-center gap-2">
                 <div className="h-9 w-20 rounded-md bg-muted/50 animate-pulse" />
                 <div className="h-9 w-24 rounded-md bg-muted/50 animate-pulse" />
              </div>
            ) : isUserLoading ? (
              <div className="flex items-center gap-2">
                 <div className="h-9 w-20 rounded-md bg-muted/50 animate-pulse" />
                 <div className="h-9 w-24 rounded-md bg-muted/50 animate-pulse" />
              </div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />}
                      <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account">Account</Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/backend" className='flex items-center'>
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Backend
                        </Link>
                      </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/signin">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/join">Join Now</Link>
                </Button>
              </>
            )}
          </div>
          

          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="flex flex-col h-full">
                <div className="border-b pb-4">
                    <Link href="/" className="flex items-center gap-2" onClick={() => setIsSheetOpen(false)}>
                        <Truck className="h-6 w-6 text-primary" />
                        <span className="font-bold text-lg">TransConnect</span>
                    </Link>
                </div>
                <nav className="flex flex-col gap-4 mt-6">
                  {mainNavLinks.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setIsSheetOpen(false)}
                      className={cn(
                        "text-lg transition-colors hover:text-primary",
                        pathname === href ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {label}
                    </Link>
                  ))}
                   <Link
                      href="/divisions"
                      onClick={() => setIsSheetOpen(false)}
                      className={cn(
                        "text-lg transition-colors hover:text-primary",
                         ["/divisions", "/marketplace", "/tech", "/funding", "/mall"].some(p => pathname.startsWith(p)) ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      Divisions
                    </Link>
                   <div className="pl-4 border-l ml-2">
                     {divisionLinks.map(({ href, label }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setIsSheetOpen(false)}
                        className={cn(
                          "text-base transition-colors hover:text-primary block py-2",
                          pathname === href ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        {label}
                      </Link>
                     ))}
                   </div>
                </nav>
                 <div className="mt-auto border-t pt-4">
                    {isUserLoading ? (
                       <div className="h-10 w-full rounded-md bg-muted/50 animate-pulse" />
                    ) : user ? (
                      <Button asChild className="w-full justify-start" >
                        <Link href="/account" onClick={() => setIsSheetOpen(false)}>
                            <User className="mr-2 h-5 w-5" />
                            My Account
                        </Link>
                      </Button>
                    ) : (
                       <div className="flex flex-col gap-2">
                         <Button asChild className="w-full justify-start" variant="outline">
                            <Link href="/signin" onClick={() => setIsSheetOpen(false)}>Sign In</Link>
                         </Button>
                         <Button asChild className="w-full justify-start">
                            <Link href="/join" onClick={() => setIsSheetOpen(false)}>Join Now</Link>
                         </Button>
                       </div>
                    )}
                 </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
