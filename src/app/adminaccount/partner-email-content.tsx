
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardCopy, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const emailContent = `
Subject: Partnership Opportunity with TransConnect

Dear [Partner Name],

I hope this email finds you well.

My name is [Your Name], and I'm reaching out from TransConnect. We've developed a comprehensive digital ecosystem specifically for the transport industry, designed to solve the key challenges transporters face every day: accessing capital, finding work, and reducing operational costs.

What is TransConnect?

TransConnect is an all-in-one platform that brings together:

- A Funding Division: We offer flexible finance solutions where traditional banks often can't.
- A Network of Malls: Specialized marketplaces for parts, vehicles, and services where members get group-negotiated discounts.
- A Value-Added Marketplace: We provide essential third-party products, like the Mahala Hub for drivers, which offers benefits and rewards, creating more value for your network.
- Powerful Tech Tools: Including an AI-powered system to match available trucks with freight loads, reducing empty miles.

The Opportunity for a Partnership

We believe in growth through collaboration. We are looking for key strategic partners like yourself who have a strong network and trusted relationships within the transport sector.

What we want from a partner:

- To introduce TransConnect to your network of transporters, suppliers, and other industry players.
- To act as an ambassador for our mission to empower transport businesses.

What we will give you in return:

- A Free Lifetime Premium Membership: Full access to our entire ecosystem, forever.
- A Recurring Revenue Stream: Earn a significant, recurring commission on all membership and subscription fees from every member you bring into the network.
- Transactional Revenue Share: Earn a share of the revenue TransConnect generates from your network's activity across our Finance and Supplier Malls.

This is more than a referral program; it's a true business partnership where your earnings grow as your network's activity on our platform grows. We provide you with a unique referral link and a personal dashboard to track your sign-ups, activity, and earnings in real-time.

I would be delighted to schedule a brief call to discuss this further and demonstrate how a partnership could be mutually beneficial.

Best regards,

[Your Name]
`;

export default function PartnerEmailContent() {
    const { toast } = useToast();

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(emailContent.trim());
        toast({
            title: "Copied to Clipboard!",
            description: "You can now paste the email content into your email client.",
        });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Mail className="h-8 w-8 text-primary"/>
                    <div>
                        <CardTitle>Partner Outreach Email</CardTitle>
                        <CardDescription>
                            Use this template to introduce the TransConnect partnership opportunity to potential partners.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="p-4 bg-muted/50 border rounded-md whitespace-pre-wrap font-mono text-sm">
                    {emailContent.trim()}
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleCopyToClipboard}>
                    <ClipboardCopy className="mr-2 h-4 w-4" />
                    Copy Email Content
                </Button>
            </CardFooter>
        </Card>
    );
}
