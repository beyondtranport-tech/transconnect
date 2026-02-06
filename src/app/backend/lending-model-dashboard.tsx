
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LendingAssumptions from "./lending-assumptions";
import LendingLoanBook from "./lending-loan-book";
import LendingIncomeStatement from "./lending-income-statement";
import LendingCashflow from "./lending-cashflow";
import LendingBalanceSheet from "./lending-balance-sheet";
import { Calculator, Database, TrendingUp, DollarSign, Sheet } from "lucide-react";

export default function LendingModelDashboard() {
  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold">Lending Model Dashboard</h1>
            <p className="text-muted-foreground">Manage inputs and view projections for your lending business.</p>
        </div>
        <Tabs defaultValue="assumptions" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="assumptions"><Calculator className="mr-2 h-4 w-4"/>Assumptions</TabsTrigger>
                <TabsTrigger value="loan-book"><Database className="mr-2 h-4 w-4"/>Loan Book</TabsTrigger>
                <TabsTrigger value="income-statement"><TrendingUp className="mr-2 h-4 w-4"/>Income Statement</TabsTrigger>
                <TabsTrigger value="cashflow"><DollarSign className="mr-2 h-4 w-4"/>Cashflow</TabsTrigger>
                <TabsTrigger value="balance-sheet"><Sheet className="mr-2 h-4 w-4"/>Balance Sheet</TabsTrigger>
            </TabsList>
            <TabsContent value="assumptions" className="mt-6">
                <LendingAssumptions />
            </TabsContent>
            <TabsContent value="loan-book" className="mt-6">
                <LendingLoanBook />
            </TabsContent>
            <TabsContent value="income-statement" className="mt-6">
                <LendingIncomeStatement />
            </TabsContent>
            <TabsContent value="cashflow" className="mt-6">
                <LendingCashflow />
            </TabsContent>
            <TabsContent value="balance-sheet" className="mt-6">
                <LendingBalanceSheet />
            </TabsContent>
        </Tabs>
    </div>
  );
}
