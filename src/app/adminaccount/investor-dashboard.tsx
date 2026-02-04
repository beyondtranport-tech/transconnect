
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InvestorManagement from "./investor-management";
import ElevatorPitch from "./elevator-pitch";
import InvestorOffer from "./investor-offer";
import InvestorEmailSequence from "./investor-email-sequence";
import { Briefcase, Info, Presentation, Mail } from "lucide-react";

export default function InvestorDashboard() {
  return (
    <Tabs defaultValue="list" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="list">
            <Briefcase className="mr-2 h-4 w-4" />
            Investor List
        </TabsTrigger>
        <TabsTrigger value="pitch">
            <Info className="mr-2 h-4 w-4" />
            Elevator Pitch
        </TabsTrigger>
        <TabsTrigger value="offer">
            <Presentation className="mr-2 h-4 w-4" />
            Investor Offer
        </TabsTrigger>
        <TabsTrigger value="emails">
            <Mail className="mr-2 h-4 w-4" />
            Email Sequence
        </TabsTrigger>
      </TabsList>
      <TabsContent value="list" className="mt-6">
        <InvestorManagement />
      </TabsContent>
      <TabsContent value="pitch" className="mt-6">
        <ElevatorPitch />
      </TabsContent>
      <TabsContent value="offer" className="mt-6">
        <InvestorOffer />
      </TabsContent>
      <TabsContent value="emails" className="mt-6">
        <InvestorEmailSequence />
      </TabsContent>
    </Tabs>
  );
}
