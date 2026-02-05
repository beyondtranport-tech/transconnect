
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LendingLoanBook() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Loan Book Projection</CardTitle>
        <CardDescription>
          This page will display the projected growth and performance of the loan book. This page is currently under construction.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Detailed tables showing payouts, receipts, interest, capital, and outstanding balances will be displayed here.</p>
      </CardContent>
    </Card>
  );
}
