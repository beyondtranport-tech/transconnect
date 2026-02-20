
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LendingCashflow() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lending Model: Cashflow Statement</CardTitle>
        <CardDescription>
          This page will display the projected cashflow statement for the lending business. This page is currently under construction.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">The cashflow statement, showing cash recycling from receipts to new payouts, will be displayed here.</p>
      </CardContent>
    </Card>
  );
}
