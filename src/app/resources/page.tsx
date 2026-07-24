'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { BookUser, BrainCircuit, Handshake, Info, Database, Zap, Fingerprint, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const resources = [
    {
        icon: <Fingerprint className="h-5 w-5 mr-3 text-primary" />,
        title: "Node Ownership (Foundation)",
        content: (
            <div className="space-y-4 text-muted-foreground">
                <p>The foundation of the grid is your digital identity. For R10/mo, you "claim" your record in the forensic registry.</p>
                <div>
                    <h4 className="font-semibold text-foreground">Why own your node?</h4>
                    <p>Owning your node allows you to verify your direct contacts, manage your community reputation, and receive direct RFQs from members matching your trade. It is the mandatory starting point for building forensic trust.</p>
                </div>
            </div>
        )
    },
    {
        icon: <Database className="h-5 w-5 mr-3 text-primary" />,
        title: "Registry Intelligence (The Map)",
        content: (
             <div className="space-y-4 text-muted-foreground">
                <p>Registry Intelligence is the "Map" of South African logistics. For R100/mo, you unlock absolute transparency.</p>
                <div>
                    <h4 className="font-semibold text-foreground">What data is unlocked?</h4>
                    <p>Access the direct MD/CEO names, emails, and mobile numbers for over 22,000 verified industrial records. Stop dealing with gatekeepers and speak directly to the leadership of your next partner or customer.</p>
                </div>
            </div>
        )
    },
    {
        icon: <Zap className="h-5 w-5 mr-3 text-primary" />,
        title: "Mall Intelligence Nodes",
        content: (
            <div className="space-y-4 text-muted-foreground">
                <p>Specialized nodes provide "Deep Data" access within specific industrial malls (Loads, Warehouse, Transport, etc.).</p>
                <div>
                    <h4 className="font-semibold text-foreground">How does it work?</h4>
                    <p>While Registry access gives you contacts, Mall Intelligence gives you technicals. See specific fleet specs (RC1), detailed product catalogs, available warehouse pallet positions, or real-time load board matches.</p>
                </div>
            </div>
        )
    },
    {
        icon: <Scale className="h-5 w-5 mr-3 text-primary" />,
        title: "Transactional App Membership",
        content: (
             <div className="space-y-4 text-muted-foreground">
                <p>This is the "Engine." Transactional tiers (Basic, Standard, Premium) allow you to run your business operations on the platform.</p>
                <div>
                    <h4 className="font-semibold text-foreground">Commerce & Execution</h4>
                    <p>Operational memberships allow you to create digital branches, process commercial handshakes, use the fulfillment ledger (PODs/Invoicing), and access AI-powered operational tools.</p>
                </div>
            </div>
        )
    }
]

export default function ResourcesPage() {
  return (
    <div className="container mx-auto px-4 py-16 text-left">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <Badge variant="outline" className="border-primary/30 text-primary font-black uppercase text-[10px] tracking-widest px-4">Operator Manual</Badge>
        <h1 className="text-4xl md:text-5xl font-black font-headline">Industrial Resource Center</h1>
        <p className="mt-4 text-lg text-muted-foreground text-center">
          Understand the 4-layer architecture of the grid. Learn how to bridge data gaps and execute transactional flow.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
            {resources.map((resource, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border rounded-xl mb-4 bg-white overflow-hidden shadow-sm">
                    <AccordionTrigger className="text-lg font-bold hover:no-underline px-6 py-5">
                        <div className="flex items-center text-left">
                            {resource.icon}
                            {resource.title}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 pt-2 bg-slate-50/50 border-t">
                        {resource.content}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
      </div>
      
      <div className="mt-20 max-w-2xl mx-auto p-8 border-2 border-dashed rounded-3xl bg-muted/10 text-center">
          <Info className="h-10 w-10 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-black uppercase tracking-tight">Need technical support?</h3>
          <p className="text-sm text-muted-foreground mt-2 mb-6">Our Engagement Division is available for direct handshake verification and node setup assistance.</p>
          <Button asChild variant="outline" className="font-bold border-2">
              <a href="/contact">Open Support Ticket</a>
          </Button>
      </div>
    </div>
  );
}
