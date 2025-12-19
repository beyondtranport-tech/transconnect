import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FleetForm from "./fleet-form";
import { Users, Building, Truck } from "lucide-react";
import SupplierForm from "./supplier-form";

export default function ContributePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline">Contribution Hub</h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground">
          Thank you for helping us strengthen the TransConnect community. Your anonymous data is key to unlocking better discounts for everyone.
        </p>
      </div>

      <Tabs defaultValue="fleet" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fleet">
            <Truck className="mr-2 h-4 w-4" />
            Fleet Details
          </TabsTrigger>
          <TabsTrigger value="suppliers">
            <Building className="mr-2 h-4 w-4" />
            Suppliers
          </TabsTrigger>
          <TabsTrigger value="clients">
            <Users className="mr-2 h-4 w-4" />
            Clients
          </TabsTrigger>
        </TabsList>
        <TabsContent value="fleet">
          <Card>
            <CardHeader>
              <CardTitle>Upload Fleet Details</CardTitle>
              <CardDescription>
                Provide some basic, anonymous information about your vehicles. This helps us negotiate bulk deals on parts, maintenance, and insurance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FleetForm />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="suppliers">
           <Card>
            <CardHeader>
              <CardTitle>List Your Suppliers</CardTitle>
              <CardDescription>
                Let us know who you buy from. This allows us to identify common suppliers and start negotiating group discounts.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <SupplierForm />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="clients">
           <Card>
            <CardHeader>
              <CardTitle>Describe Your Clients</CardTitle>
              <CardDescription>
                Help us understand the types of industries you serve. This data can reveal opportunities for specialized services and partnerships.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
                <p className="text-muted-foreground">This contribution form is coming soon. Thank you for your interest!</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
