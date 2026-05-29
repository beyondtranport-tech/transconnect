
'use client';

import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Building2, User, Truck, ShoppingCart } from 'lucide-react';
import * as gtag from '@/lib/gtag';

interface HomeIntentModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function HomeIntentModal({ isOpen, onOpenChange }: HomeIntentModalProps) {
    const router = useRouter();

    const handleNavigation = (role: string, intent: string) => {
        if (process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID) {
            gtag.event({
                action: 'homepage_intent_selection',
                category: 'Engagement',
                label: intent,
                value: 1
            });
        }
        router.push(`/join?role=${role}`);
        onOpenChange(false);
    }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Declare Your Position</DialogTitle>
          <DialogDescription>
            To personalize your ecosystem experience, please select the role that best describes your business or individual goal.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 py-6">
            <Button onClick={() => handleNavigation('transporter', 'transporter')} className="w-full h-24 text-lg justify-start px-6 gap-6" variant="outline">
                <div className="bg-primary/10 p-3 rounded-full">
                    <Truck className="h-6 w-6 text-primary"/>
                </div>
                <div className="text-left">
                    <p className="font-bold">I am a Transporter</p>
                    <p className="text-xs font-normal text-muted-foreground">Looking to sell services, find loads, and reduce fleet costs.</p>
                </div>
            </Button>
            <Button onClick={() => handleNavigation('vendor', 'vendor')} className="w-full h-24 text-lg justify-start px-6 gap-6" variant="outline">
                <div className="bg-primary/10 p-3 rounded-full">
                    <ShoppingCart className="h-6 w-6 text-primary"/>
                </div>
                <div className="text-left">
                    <p className="font-bold">I am a Vendor / Supplier</p>
                    <p className="text-xs font-normal text-muted-foreground">Looking to create a digital shop and sell products to the network.</p>
                </div>
            </Button>
            <Button onClick={() => handleNavigation('driver', 'individual')} className="w-full h-24 text-lg justify-start px-6 gap-6" variant="outline">
                <div className="bg-primary/10 p-3 rounded-full">
                    <User className="h-6 w-6 text-primary"/>
                </div>
                <div className="text-left">
                    <p className="font-bold">I am an Individual</p>
                    <p className="text-xs font-normal text-muted-foreground">Looking for driver benefits, rewards, and career opportunities.</p>
                </div>
            </Button>
        </div>
        <DialogFooter className="sm:justify-center">
             <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                I'm just browsing for now
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
