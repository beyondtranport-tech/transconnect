
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import * as gtag from '@/lib/gtag';

interface IntentModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  buyHref: string | null;
}

export function IntentModal({ isOpen, onOpenChange, buyHref }: IntentModalProps) {
  const router = useRouter();
  const { user } = useUser();

  const handleSellClick = () => {
    gtag.event({
        action: 'intent_capture',
        category: 'Mall Navigation',
        label: 'sell',
        value: 1
    });

    const sellHref = user ? '/account?view=shop' : '/join?role=vendor';
    router.push(sellHref);
    onOpenChange(false);
  };

  const handleBuyClick = () => {
     gtag.event({
        action: 'intent_capture',
        category: 'Mall Navigation',
        label: 'buy',
        value: 1
    });

    if (buyHref) {
      router.push(buyHref);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>What brings you here today?</DialogTitle>
          <DialogDescription>
            Let us know if you're here to buy products/services or to sell your own. This helps us tailor your experience.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col sm:flex-row gap-4 py-4">
            <Button onClick={handleBuyClick} className="w-full h-20 text-lg flex-col" variant="outline">
                I want to Buy
                <span className="text-xs font-normal text-muted-foreground">Find parts, services, and loads.</span>
            </Button>
            <Button onClick={handleSellClick} className="w-full h-20 text-lg flex-col">
                I want to Sell
                 <span className="text-xs font-normal text-primary-foreground/80">List my products or services.</span>
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
