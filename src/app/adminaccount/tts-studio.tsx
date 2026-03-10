
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Sparkles, Download, Mic, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { TTSInputSchema, type TTSInput } from '@/ai/schemas';
import { generateAudio } from '@/ai/flows/tts-flow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const voices = [
    { id: 'Algenib', name: 'Algenib (Male)' },
    { id: 'Achernar', name: 'Achernar (Female)' },
    { id: 'Hadar', name: 'Hadar (Male)' },
    { id: 'Sirius', name: 'Sirius (Female)' },
    { id: 'Antares', name: 'Antares (Male)' },
    { id: 'Spica', name: 'Spica (Female)' },
];

export default function TTSStudio() {
    const [isLoading, setIsLoading] = useState(false);
    const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
    const { toast } = useToast();

    const form = useForm<TTSInput>({
        resolver: zodResolver(TTSInputSchema),
        defaultValues: {
            script: '',
            voice: 'Algenib',
        },
    });

    const onSubmit = async (values: TTSInput) => {
        setIsLoading(true);
        setGeneratedAudio(null);
        try {
            const result = await generateAudio(values);
            if (result.audioDataUri) {
                setGeneratedAudio(result.audioDataUri);
                toast({ title: 'Audio Generated', description: 'Your voiceover is ready.' });
            } else {
                throw new Error("The AI did not return any audio data.");
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Generation Failed', description: e.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!generatedAudio) return;
        const link = document.createElement('a');
        link.href = generatedAudio;
        link.download = `voiceover-${Date.now()}.wav`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Mic className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle>AI Audio Studio (Text-to-Speech)</CardTitle>
                        <CardDescription>Generate high-quality voiceovers from your text scripts.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Feature Temporarily Disabled</AlertTitle>
                            <AlertDescription>
                                Text-to-Speech is currently unavailable due to a necessary package downgrade. This feature will be re-enabled after a future platform upgrade.
                            </AlertDescription>
                        </Alert>

                        <fieldset disabled>
                            <FormField
                            control={form.control}
                            name="script"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Your Script</FormLabel>
                                <FormControl>
                                    <Textarea
                                    placeholder="Enter the script for your voiceover here..."
                                    className="min-h-[200px] font-mono text-sm"
                                    {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                                control={form.control}
                                name="voice"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Voice</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a voice" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {voices.map(v => (
                                                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </fieldset>
                        
                        <Button type="submit" disabled={true} className="w-full">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                            Generate Audio
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
