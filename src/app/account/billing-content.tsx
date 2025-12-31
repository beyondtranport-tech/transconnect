'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

export default function BillingContent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard /> Billing & Invoices
        </CardTitle>
        <CardDescription>
          View your monthly invoices and billing history.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-10">
          <p className="text-muted-foreground">Your monthly invoice and billing summary will be displayed here soon.</p>
        </div>
      </CardContent>
    </Card>
  );
}
