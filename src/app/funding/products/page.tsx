
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Landmark } from "lucide-react";

export default function ProductTypesPage() {
    return (
        <div className="container mx-auto px-4 py-16">
            <div className="text-center max-w-3xl mx-auto mb-12">
                <h1 className="text-4xl md:text-5xl font-bold font-headline">Product Types</h1>
                <p className="mt-4 text-lg md:text-xl text-muted-foreground">
                    Select a product to continue.
                </p>
            </div>
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Landmark /> Coming Soon</CardTitle>
                    <CardDescription>
                        The product selection for this agreement type will be configured here.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    )
}
