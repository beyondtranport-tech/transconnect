
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Key, FileJson, Database } from 'lucide-react';
import { getAdminSdkDiagnostics, testFirestoreConnection } from './actions';

interface SdkDiagnostics {
    isB64VarPresent: boolean;
    isJsonParsable: boolean;
    projectId?: string;
    clientEmail?: string;
    hasPrivateKey?: boolean;
}

export default function DebugToolsContent() {
    const [diagnostics, setDiagnostics] = useState<SdkDiagnostics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [testResult, setTestResult] = useState<{ loading: boolean, success: boolean, error?: string }>({ loading: false, success: false });

    useEffect(() => {
        async function fetchDiagnostics() {
            setIsLoading(true);
            try {
                const result = await getAdminSdkDiagnostics();
                setDiagnostics(result);
            } catch (e: any) {
                setError(e.message || "An unknown error occurred while running diagnostics.");
            } finally {
                setIsLoading(false);
            }
        }
        fetchDiagnostics();
    }, []);

    const handleTestConnection = async () => {
        setTestResult({ loading: true, success: false });
        const result = await testFirestoreConnection();
        setTestResult({ ...result, loading: false });
    }

    const renderCheck = (condition: boolean) => {
        return condition ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
            <XCircle className="h-5 w-5 text-destructive" />
        );
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Admin SDK Debug Tools</h1>
                <p className="mt-2 text-muted-foreground">Tools for diagnosing the admin backend configuration.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Key /> Firebase Admin SDK Diagnostics</CardTitle>
                    <CardDescription>
                        This tool checks if the backend server has the correct credentials to perform admin actions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Running diagnostics...</span>
                        </div>
                    ) : error ? (
                        <div className="text-destructive font-semibold">
                            Error running diagnostics: {error}
                        </div>
                    ) : diagnostics ? (
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2">
                                {renderCheck(diagnostics.isB64VarPresent)}
                                <span>`FIREBASE_ADMIN_SDK_CONFIG_B64` variable is present in environment.</span>
                            </li>
                            <li className="flex items-center gap-2">
                                {renderCheck(diagnostics.isJsonParsable)}
                                <span>Base64 value is parsable as JSON.</span>
                            </li>
                            <li className="flex items-center gap-2">
                                {renderCheck(!!diagnostics.projectId)}
                                <span>Project ID: <span className="font-mono bg-muted px-2 py-1 rounded">{diagnostics.projectId || 'Not Found'}</span></span>
                            </li>
                             <li className="flex items-center gap-2">
                                {renderCheck(!!diagnostics.clientEmail)}
                                <span>Client Email: <span className="font-mono bg-muted px-2 py-1 rounded">{diagnostics.clientEmail || 'Not Found'}</span></span>
                            </li>
                             <li className="flex items-center gap-2">
                                {renderCheck(!!diagnostics.hasPrivateKey)}
                                <span>Private Key is present (not empty).</span>
                            </li>
                        </ul>
                    ) : null}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                     <CardTitle className="flex items-center gap-2"><Database /> Firestore Connection Test</CardTitle>
                    <CardDescription>
                        This button attempts to make a live, authenticated request to Firestore from the backend to verify the end-to-end connection.
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

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileJson /> Base64 Encoder Tool</CardTitle>
                    <CardDescription>
                        Use this secure, local tool to encode your service account JSON file for the environment variables. Your data never leaves your browser.
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button asChild>
                        <Link href="/tools/base64-encoder.html" target="_blank">
                            Open Encoder Tool <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
