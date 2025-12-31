
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Key, FileJson, Database, ArrowRight, Server, ShieldAlert, RefreshCw } from 'lucide-react';
import { testFirestoreConnection } from './actions';
import Link from 'next/link';


export default function DebugToolsContent() {
    const [isLoading, setIsLoading] = useState(false);
    const [testResult, setTestResult] = useState<{ loading: boolean, success: boolean, error?: string }>({ loading: false, success: false });

    const handleTestConnection = async () => {
        setTestResult({ loading: true, success: false });
        const result = await testFirestoreConnection();
        setTestResult({ ...result, loading: false });
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Admin SDK Debug Tools</h1>
                <p className="mt-2 text-muted-foreground">Tools for diagnosing the admin backend configuration.</p>
            </div>

            <Card>
                <CardHeader>
                     <CardTitle className="flex items-center gap-2"><Database /> Firestore Connection Test</CardTitle>
                    <CardDescription>
                        This button attempts to make a live, authenticated request to Firestore using the Admin SDK from the backend to verify the end-to-end connection.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {testResult.loading ? (
                         <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Testing connection...</span>
                        </div>
                    ) : testResult.error ? (
                         <div className="flex flex-col gap-2 text-destructive">
                            <div className="flex items-center gap-2 font-semibold">
                                <XCircle className="h-5 w-5" />
                                <span>Connection Failed.</span>
                            </div>
                            <p className="text-sm font-mono bg-destructive/10 p-2 rounded-md">{testResult.error}</p>
                        </div>
                    ) : testResult.success ? (
                         <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-semibold">Successfully connected to Firestore and fetched data.</span>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Click the button to start the test.</p>
                    )}
                </CardContent>
                <CardFooter>
                    <Button onClick={handleTestConnection} disabled={testResult.loading}>
                        {testResult.loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        Run Live Connection Test
                    </Button>
                </CardFooter>
            </Card>
            
             <Card className="border-primary bg-primary/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary"><RefreshCw /> Troubleshooting Step: Restart Server</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>
                        If the connection test below fails with an `UNAUTHENTICATED` error, it can often mean the development server is using old, cached credentials.
                    </p>
                    <p>
                        **Please restart your development server to force it to load the `service-account.json` file you just saved.**
                    </p>
                     <ol className="list-decimal list-inside space-y-2 pl-4">
                        <li>Go to your terminal where `npm run dev` is running.</li>
                        <li>Press `Ctrl + C` to stop the server.</li>
                        <li>Run `npm run dev` again to restart it.</li>
                    </ol>
                    <p>
                        After restarting, click the **"Run Live Connection Test"** button again.
                    </p>
                </CardContent>
            </Card>

             <Card className="border-destructive/50 bg-destructive/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive"><ShieldAlert />If Connection Still Fails: Check IAM Permissions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-destructive-foreground/90">
                    <p>
                       If the test fails after a server restart, the issue is not with the code or the key's format, but with the permissions assigned to the service account in Google Cloud.
                    </p>
                    <h4 className="font-semibold">Action Required:</h4>
                    <ol className="list-decimal list-inside space-y-2">
                        <li>Go to the Google Cloud IAM page for your project.</li>
                        <li>Find the service account (its email is in your `service-account.json` file).</li>
                        <li>Check its "Roles". It must have a role that allows Firestore access, such as <b className="font-bold">`Firebase Admin`</b>, <b className="font-bold">`Editor`</b>, or at a minimum, <b className="font-bold">`Cloud Datastore User`</b>.</li>
                        <li>If the necessary roles are missing, add them.</li>
                    </ol>
                </CardContent>
                <CardFooter>
                     <Button asChild variant="destructive">
                        <a href="https://console.cloud.google.com/iam-admin/iam" target="_blank" rel="noopener noreferrer">
                           Open Google Cloud IAM Roles <ArrowRight className="ml-2 h-4 w-4" />
                        </a>
                    </Button>
                </CardFooter>
            </Card>

        </div>
    );
}
