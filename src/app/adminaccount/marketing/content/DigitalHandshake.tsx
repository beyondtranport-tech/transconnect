
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Handshake, ShieldCheck, Zap, ArrowRight, FileText, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DigitalHandshake({ partner }: { partner?: any }) {
    const recipientName = partner?.firstName || 'Partner';
    const companyName = partner?.companyName || 'your business';

    return (
        <div className="space-y-8">
            <div className="text-center">
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                    <Handshake className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-3xl font-bold font-headline">The Digital Handshake</h1>
                <p className="mt-2 text-lg text-muted-foreground">Establishing a secure, compliant foundation for our partnership with {companyName}.</p>
            </div>

            <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                        Why We Start with a Handshake
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        Before we dive into the deep technical and commercial aspects of Logistics Flow, we believe in establishing trust. This "Digital Handshake" serves as our mutual commitment to data privacy and professional engagement standards.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 pt-4">
                        <div className="p-4 bg-white rounded-lg border shadow-sm text-left">
                            <div className="flex items-center gap-2 mb-2">
                                <Lock className="h-4 w-4 text-primary" />
                                <h4 className="font-bold text-sm">Privacy First (POPI)</h4>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">We respect your privacy. You will be prompted to review and accept our formal POPI agreement, ensuring your data is handled with 100% compliance.</p>
                        </div>
                        <div className="p-4 bg-white rounded-lg border shadow-sm text-left">
                             <div className="flex items-center gap-2 mb-2">
                                <Zap className="h-4 w-4 text-primary" />
                                <h4 className="font-bold text-sm">Qualified Intelligence</h4>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">By establishing this handshake, you authorize our AI engine to begin identifying relevant cost-saving deals and freight loads specifically for {companyName}.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="p-8 border rounded-xl bg-white text-center shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-4 text-primary">
                    <FileText className="h-5 w-5" />
                    <span className="text-sm font-bold uppercase tracking-widest">Formal Opt-In Request</span>
                </div>
                <p className="font-bold text-lg mb-2">Ready to establish the connection, {recipientName}?</p>
                <p className="text-sm text-muted-foreground mb-6">The first step is a simple digital confirmation of your interest. You will be able to read our full POPI agreement on the next page.</p>
                <div className="flex justify-center">
                    <Button className="gap-2 px-8 py-6 text-lg" variant="default">
                        Send Handshake Request <ArrowRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            <div className="pt-8 border-t text-center">
                <p className="text-xs text-muted-foreground italic">
                    Logistics Flow is a verified digital ecosystem. All interactions are logged on a secure, encrypted ledger to protect the integrity of our members' networks and information.
                </p>
            </div>
        </div>
    );
}
