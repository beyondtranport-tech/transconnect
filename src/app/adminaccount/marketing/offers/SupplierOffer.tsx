'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBasket } from "lucide-react";

export default function SupplierOffer() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShoppingBasket className="h-6 w-6" />
                    Supplier Offer
                </CardTitle>
                <CardDescription>This section is under construction.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">A detailed offer document for potential suppliers will be available here.</p>
            </CardContent>
        </Card>
    );
}
