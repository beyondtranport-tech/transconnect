
'use client';

import FreightMatcher from "@/app/tech/freight-matcher";
import Image from "next/image";
import data from "@/lib/placeholder-images.json";
import LoadCalculator from "@/app/tech/load-calculator";
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import LoadBoardContent from "./load-board-content";

const { placeholderImages } = data;
const techImage = placeholderImages.find(p => p.id === "tech-home");

export default function LoadsMallPage() {
    const { isUserLoading } = useUser();

    return (
        <div>
            <section className="relative w-full h-80 bg-card">
                {techImage && (
                    <Image
                        src={techImage.imageUrl}
                        alt="Loads Mall"
                        fill
                        className="object-cover"
                        priority
                        data-ai-hint={techImage.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative h-full flex flex-col items-center justify-center text-center text-primary-foreground z-10 p-4">
                    <h1 className="text-4xl md:text-5xl font-bold font-headline">Loads Mall</h1>
                    <p className="mt-4 text-lg md:text-xl max-w-3xl">Find available loads, reduce empty miles, and maximize your profitability.</p>
                </div>
            </section>

            <section className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-2 space-y-8">
                             <FreightMatcher />
                             {isUserLoading ? (
                                <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin" /></div>
                             ) : (
                                <LoadBoardContent />
                             )}
                        </div>
                         <div className="lg:col-span-1 space-y-8">
                           <LoadCalculator />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

    