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
import { Building2, User } from 'lucide-react';
import * as gtag from '@/lib/gtag';

interface HomeIntentModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function HomeIntentModal({ isOpen, onOpenChange }: HomeIntentModalProps) {
    const router = useRouter();

    const handleNavigation = (path: string, intent: 'business_owner' | 'individual') => {
        if (process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID) {
            gtag.event({
                action: 'homepage_intent_selection',
                category: 'Engagement',
                label: intent,
                value: 1
            });
        }
        router.push(path);
        onOpenChange(false);
    }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to Logistics Flow!</DialogTitle>
          <DialogDescription>
            To help you get started, tell us what you're looking for.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col sm:flex-row gap-4 py-4">
            <Button onClick={() => handleNavigation('/about', 'business_owner')} className="w-full h-24 text-lg flex-col" variant="outline">
                <Building2 className="mb-2 h-6 w-6"/>
                I'm a Business Owner
                <span className="text-xs font-normal text-muted-foreground">Looking for funding, efficiency & growth.</span>
            </Button>
            <Button onClick={() => handleNavigation('/incentives', 'individual')} className="w-full h-24 text-lg flex-col">
                <User className="mb-2 h-6 w-6"/>
                I'm an Individual
                <span className="text-xs font-normal text-primary-foreground/80">Looking for driver benefits & deals.</span>
            </Button>
        </div>
        <DialogFooter>
             <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Just browsing
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
