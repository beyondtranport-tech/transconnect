"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MatchFreightInputSchema, type MatchFreightOutput } from "@/ai/flows/ai-freight-matching";
import type { z } from "zod";

import { handleMatchFreight } from "./actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Route, Package, Weight, ArrowRight, DollarSign } from "lucide-react";

type MatchFreightInput = z.infer<typeof MatchFreightInputSchema>;

export default function FreightMatcher() {
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<MatchFreightOutput | null>(null);
    const { toast } = useToast();

    const form = useForm<MatchFreightInput>({
        resolver: zodResolver(MatchFreightInputSchema),
        defaultValues: {
            location: "",
            vehicleType: "",
            capacity: "",
            preferences: "",
        },
    });

    async function onSubmit(values: MatchFreightInput) {
        setIsLoading(true);
        setResults(null);

        const response = await handleMatchFreight(values);

        if (response.success && response.data) {
            setResults(response.data);
        } else {
            toast({
                variant: "destructive",
                title: "An error occurred",
                description: response.error,
            });
        }
        setIsLoading(false);
    }

    return (
        <Card className="max-w-4xl mx-auto shadow-lg">
            <CardHeader>
                <CardTitle>AI Freight Matcher</CardTitle>
                <CardDescription>Enter your details to find matching loads instantly.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="location"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Current Location</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Chicago, IL" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="vehicleType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vehicle Type</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., 53' Dry Van" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="capacity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Carrying Capacity</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., 45,000 lbs" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="preferences"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Preferences (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., No-touch freight" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Find Matches
                        </Button>
                    </form>
                </Form>

                {isLoading && (
                    <div className="mt-8 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        <p className="mt-2 text-muted-foreground">Searching for the best matches...</p>
                    </div>
                )}
                
                {results && (
                    <div className="mt-10">
                        <h3 className="text-2xl font-bold font-headline mb-4">
                            Matching Loads ({results.matches.length})
                        </h3>
                        {results.matches.length > 0 ? (
                            <div className="space-y-4">
                                {results.matches.map((match) => (
                                    <Card key={match.loadId} className="bg-background/50">
                                        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                            <div className="md:col-span-2 space-y-3">
                                                <div className="flex items-center gap-4 text-lg font-semibold">
                                                    <span>{match.origin}</span>
                                                    <ArrowRight className="h-5 w-5 text-primary" />
                                                    <span>{match.destination}</span>
                                                </div>
                                                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1.5"><Weight className="h-4 w-4"/> {match.weight}</span>
                                                    <span className="flex items-center gap-1.5"><Package className="h-4 w-4"/> {match.size}</span>
                                                </div>
                                                {match.requirements && <p className="text-sm"><strong className="font-medium">Requirements:</strong> {match.requirements}</p>}
                                            </div>
                                            <div className="md:text-right">
                                                <p className="text-2xl font-bold text-primary">{match.price}</p>
                                                <Button className="mt-2 w-full md:w-auto">View Details</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-8">No matching loads found. Try adjusting your criteria.</p>
                        )}
                    </div>
                )}

            </CardContent>
        </Card>
    );
}
