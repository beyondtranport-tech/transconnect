'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LendingBalanceSheet() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lending Model: Balance Sheet</CardTitle>
        <CardDescription>
          This page will display the projected balance sheet for the lending business. This page is currently under construction.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">The balance sheet, showing the loan book as an asset, will be displayed here.</p>
      </CardContent>
    </Card>
  );
}
