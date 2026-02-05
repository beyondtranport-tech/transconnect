
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function LendingAssumptions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lending Model Assumptions</CardTitle>
        <CardDescription>
          This is where you will set the inputs for your lending book financial model. This page is currently under construction.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Input fields for member funnel, conversion rates, and loan product terms will be added here.</p>
      </CardContent>
    </Card>
  );
}
