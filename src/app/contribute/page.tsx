import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TruckForm from "./truck-form";
import { Users, Building, Truck, Warehouse } from "lucide-react";
import SupplierForm from "./supplier-form";
import TrailerForm from "./trailer-form";

export default function ContributePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline">Contribution Hub</h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground">
          Thank you for helping us strengthen the TransConnect community. Your anonymous data is key to unlocking better discounts for everyone.
        </p>
      </div>

      <Tabs defaultValue="trucks" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trucks">
            <Truck className="mr-2 h-4 w-4" />
            Trucks
          </TabsTrigger>
          <TabsTrigger value="trailers">
            <Warehouse className="mr-2 h-4 w-4" />
            Trailers
          </TabsTrigger>
          <TabsTrigger value="suppliers">
            <Building className="mr-2 h-4 w-4" />
            Suppliers
          </TabsTrigger>
          <TabsTrigger value="debtors">
            <Users className="mr-2 h-4 w-4" />
            Debtors
          </TabsTrigger>
        </TabsList>
        <TabsContent value="trucks">
          <Card>
            <CardHeader>
              <CardTitle>Upload Truck Details</CardTitle>
              <CardDescription>
                Provide anonymous information about your trucks based on their RC1 certificate. This helps us negotiate bulk deals on parts, maintenance, and insurance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TruckForm />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="trailers">
          <Card>
            <CardHeader>
              <CardTitle>Upload Trailer Details</CardTitle>
              <CardDescription>
                Provide anonymous information about your trailers. This data helps us understand fleet composition for better marketplace and funding opportunities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrailerForm />
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
        <TabsContent value="debtors">
           <Card>
            <CardHeader>
              <CardTitle>Describe Your Debtors (Clients)</CardTitle>
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
