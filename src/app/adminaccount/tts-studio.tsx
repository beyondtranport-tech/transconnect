
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Sparkles, Download, Mic, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { generateAudio, type TTSInput } from '@/ai/flows/tts-flow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const voices = [
    { id: 'Algenib', name: 'Algenib (Male - Driver 1)' },
    { id: 'Achernar', name: 'Achernar (Female)' },
    { id: 'Hadar', name: 'Hadar (Male - Driver 2)' },
    { id: 'Sirius', name: 'Sirius (Female)' },
    { id: 'Antares', name: 'Antares (Male)' },
    { id: 'Spica', name: 'Spica (Female)' },
];

const TTSInputSchema = z.object({
  script: z.string().min(1, 'Script cannot be empty.'),
  voice: z.string().optional().default('Algenib'),
});

const driverScript = `Speaker1: Hi, have you seen the new logistics flow app?
Speaker2: No, what's that?
Speaker1: It's incredible. Look at this—absolute transparency. I can find any haulier, any supplier, and even get funding. I'm an authorized independent sales agent now. I can add you to my network and you can start earning passive revenue just like me.
Speaker2: That looks amazing, where can I access it? Add me to your network right now!`;

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
            <CardHeader className="text-left">
                <div className="flex items-center justify-between text-left">
                    <div className="flex items-center gap-4 text-left">
                        <Mic className="h-8 w-8 text-primary" />
                        <div className="text-left">
                            <CardTitle>AI Audio Studio (Text-to-Speech)</CardTitle>
                            <CardDescription>Generate high-quality voiceovers for your narrative scenes.</CardDescription>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => form.setValue('script', driverScript)}>
                        <BookOpen className="h-4 w-4" /> Load Driver Dialogue
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <fieldset disabled={isLoading} className="text-left">
                            <FormField
                            control={form.control}
                            name="script"
                            render={({ field }) => (
                                <FormItem className="text-left">
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
                                    <FormItem className="text-left">
                                    <FormLabel>Primary Voice Character</FormLabel>
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
                        
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                            Generate Audio Sequence
                        </Button>
                    </form>
                </Form>

                {generatedAudio && (
                    <div className="mt-8 space-y-4 text-left">
                        <h4 className="font-semibold">Generated Audio Track</h4>
                        <audio controls src={generatedAudio} className="w-full">
                            Your browser does not support the audio element.
                        </audio>
                        <Button onClick={handleDownload} variant="outline" className="w-full">
                            <Download className="mr-2 h-4 w-4" /> Download Track for Post-Production
                        </Button>
                    </div>
                )}
            </CardContent>
             <CardFooter className="bg-muted/30 p-4 border-t rounded-b-xl text-left">
                <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-primary" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                        To add music, we recommend using a simple video editor (like CapCut or iMovie) to layer these tracks over your generated AI video scenes.
                    </p>
                </div>
            </CardFooter>
        </Card>
    );
}
