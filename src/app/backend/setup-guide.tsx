
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";

const projectId = "transconnect-v1-39578841-2a857";

const steps = [
    {
        step: 1,
        title: "Enable Firestore API",
        description: "Your application uses Firestore to store data. This API must be enabled for the backend to connect to your database.",
        link: `https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=${projectId}`,
        cta: "Enable Firestore API"
    },
    {
        step: 2,
        title: "Enable Identity Toolkit API",
        description: "Your application uses Firebase Authentication. The Identity Toolkit API is required for your backend to manage users and verify credentials.",
        link: `https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com?project=${projectId}`,
        cta: "Enable Identity Toolkit API"
    }
];

export default function SetupGuide() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-muted">
            <div className="container max-w-4xl py-12">
                <Card className="shadow-2xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl font-bold font-headline">Final Configuration Step</CardTitle>
                        <CardDescription className="text-lg text-muted-foreground mt-2">
                            To fix the authentication error, please enable the required cloud services for your project.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 p-8">
                        {steps.map((step) => (
                            <div key={step.step} className="flex items-start gap-6 p-6 border rounded-lg bg-background">
                                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground font-bold text-xl">
                                    {step.step}
                                </div>
                                <div className="flex-grow">
                                    <h3 className="text-xl font-semibold">{step.title}</h3>
                                    <p className="text-muted-foreground mt-1">{step.description}</p>
                                </div>
                                <Button asChild>
                                    <a href={step.link} target="_blank" rel="noopener noreferrer">
                                        {step.cta}
                                        <ExternalLink className="ml-2 h-4 w-4" />
                                    </a>
                                </Button>
                            </div>
                        ))}
                         <div className="text-center pt-6 border-t">
                            <h3 className="text-lg font-semibold">After You Enable Both APIs</h3>
                            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                                Once both APIs show "API Enabled", come back here and tell me to "remove the setup guide". I will then restore the backend dashboard, which should now load correctly.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
