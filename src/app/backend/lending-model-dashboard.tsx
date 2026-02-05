
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LendingAssumptions from "./lending-assumptions";
import LendingLoanBook from "./lending-loan-book";
import LendingRepaymentSchedule from "./lending/repayment-schedule";
import { Calculator, Database, Sheet } from "lucide-react";

export default function LendingModelDashboard() {
  return (
    <Tabs defaultValue="assumptions" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="assumptions"><Calculator className="mr-2 h-4 w-4"/>Assumptions</TabsTrigger>
        <TabsTrigger value="repayment-schedule"><Sheet className="mr-2 h-4 w-4"/>Repayment Schedule</TabsTrigger>
        <TabsTrigger value="loan-book"><Database className="mr-2 h-4 w-4"/>Loan Book</TabsTrigger>
      </TabsList>
      <TabsContent value="assumptions" className="mt-6">
        <LendingAssumptions />
      </TabsContent>
      <TabsContent value="repayment-schedule" className="mt-6">
        <LendingRepaymentSchedule />
      </TabsContent>
      <TabsContent value="loan-book" className="mt-6">
        <LendingLoanBook />
      </TabsContent>
    </Tabs>
  );
}
