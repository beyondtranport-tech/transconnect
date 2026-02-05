
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LendingIncomeStatement() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lending Model: Income Statement</CardTitle>
        <CardDescription>
          This page will display the projected income statement for the lending business. This page is currently under construction.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">The P&L, showing interest and fee income, will be displayed here.</p>
      </CardContent>
    </Card>
  );
}
