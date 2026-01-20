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

export interface ModalConfig {
  title: string;
  description: string;
  primary: {
    label: string;
    description: string;
    action: () => void;
  };
  secondary: {
    label: string;
    description: string;
    action: () => void;
  };
}

// New type for the incentive step
export interface IncentiveStep {
    title: string;
    description: string;
    cta: string;
    action: () => void;
}


interface IntentModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  config: ModalConfig | null;
  incentiveStep?: IncentiveStep | null;
  showIncentiveStep: boolean;
  setShowIncentiveStep: (show: boolean) => void;
}

export function IntentModal({ isOpen, onOpenChange, config, incentiveStep, showIncentiveStep, setShowIncentiveStep }: IntentModalProps) {
  
  if (!config) return null;

  const handleClose = () => {
    setShowIncentiveStep(false);
    onOpenChange(false);
  }

  // Render the incentive step if it's active
  if (showIncentiveStep && incentiveStep) {
     return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                 <DialogHeader>
                    <DialogTitle>{incentiveStep.title}</DialogTitle>
                    <DialogDescription>
                        {incentiveStep.description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-between">
                     <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
                        Maybe Later
                    </Button>
                     <Button type="button" onClick={incentiveStep.action}>
                        {incentiveStep.cta} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
     )
  }

  // Render the initial intent step
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>
            {config.description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col sm:flex-row gap-4 py-4">
            <Button onClick={config.primary.action} className="w-full h-20 text-lg flex-col" variant="outline">
                {config.primary.label}
                <span className="text-xs font-normal text-muted-foreground">{config.primary.description}</span>
            </Button>
            <Button onClick={config.secondary.action} className="w-full h-20 text-lg flex-col">
                {config.secondary.label}
                 <span className="text-xs font-normal text-primary-foreground/80">{config.secondary.description}</span>
            </Button>
        </div>
        <DialogFooter>
             <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
                Just browsing
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
