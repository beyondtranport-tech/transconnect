
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Handshake, Bot, Briefcase, Code, ArrowRight } from "lucide-react";
import Link from "next/link";
import * as React from "react";

const partnerTypes = [
    {
        id: "partners",
        icon: Handshake,
        title: "Strategic Partners",
        description: "Manage strategic business partners and alliances.",
        href: "/adminaccount?view=partners"
    },
    {
        id: "isa-agents",
        icon: Bot,
        title: "ISA Agents",
        description: "Manage Independent Sales Agents and their performance.",
        href: "/adminaccount?view=isa-agents"
    },
    {
        id: "investors",
        icon: Briefcase,
        title: "Investors",
        description: "Manage investor relations, contacts, and pitching materials.",
        href: "/adminaccount?view=investors"
    },
    {
        id: "developer-list",
        icon: Code,
        title: "Developers",
        description: "Manage third-party developers building on the platform.",
        href: "/adminaccount?view=developer-list"
    },
];

export default function PartnersHub() {
    return (
        <div className="space-y-8">
            <CardHeader className="px-0">
                <CardTitle className="flex items-center gap-2 text-2xl"><Handshake /> Partner Management Hub</CardTitle>
                <CardDescription>Select a partner type to view and manage the corresponding list.</CardDescription>
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {partnerTypes.map((pt) => {
                    const Icon = pt.icon;
                    return (
                        <Link href={pt.href} key={pt.id} className="group block h-full">
                            <Card className="flex flex-col h-full transition-all hover:border-primary hover:shadow-lg">
                                <CardHeader className="flex-row items-start gap-4">
                                     <div className="bg-primary/10 p-3 rounded-lg">
                                        <Icon className="h-8 w-8 text-primary" />
                                    </div>
                                    <CardTitle className="text-xl">{pt.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-muted-foreground">{pt.description}</p>
                                </CardContent>
                                <CardFooter>
                                    <p className="text-sm font-semibold text-primary flex items-center gap-2">
                                        Manage {pt.title}
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </p>
                                </CardFooter>
                            </Card>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
