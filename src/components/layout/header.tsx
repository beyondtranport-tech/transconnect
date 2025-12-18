"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Truck, Menu, User } from "lucide-react";
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

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/divisions", label: "Divisions" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/tech", label: "Tech" },
];

export function Header() {
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const handleSignOut = () => {
    signOut(auth);
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

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "transition-colors hover:text-primary",
                pathname === href ? "text-primary" : "text-muted-foreground"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {!isUserLoading && (
            <>
              {user ? (
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Button asChild variant="ghost">
                    <Link href="/signin">Sign In</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/join">Join Now</Link>
                  </Button>
                </div>
              )}
            </>
          )}

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
                  {navLinks.map(({ href, label }) => (
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
                </nav>
                 <div className="mt-auto border-t pt-4">
                    {!isUserLoading && (
                      <>
                        {user ? (
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
                      </>
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