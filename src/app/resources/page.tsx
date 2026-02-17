
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { BookUser, BrainCircuit, Handshake, Info } from "lucide-react";

const resources = [
    {
        icon: <BookUser className="h-5 w-5 mr-3 text-primary" />,
        title: "Getting Started Guide",
        content: (
            <div className="space-y-4 text-muted-foreground">
                <p>Welcome to Logistics Flow! Here’s how to get the most out of our ecosystem from day one.</p>
                <div>
                    <h4 className="font-semibold text-foreground">1. Create Your Free Account</h4>
                    <p>Click the "Join Now" button on the homepage or navigation bar. The registration process is quick and easy. All you need is your name, company name, and contact details. Your account gives you immediate access to the member dashboard and marketplace.</p>
                </div>
                <div>
                    <h4 className="font-semibold text-foreground">2. Explore the Divisions</h4>
                    <p>Logistics Flow is built on four core divisions. Visit the "Divisions" page to understand how each one can help your business: Funding, the Mall, the Marketplace, and our cutting-edge Tech.</p>
                </div>
                 <div>
                    <h4 className="font-semibold text-foreground">3. Visit Your Account Dashboard</h4>
                    <p>Once you're logged in, your Account Dashboard is your personal mission control. From here, you can view your membership status, check your reward points, and access member-exclusive features like the Contribution Hub.</p>
                </div>
            </div>
        )
    },
    {
        icon: <Handshake className="h-5 w-5 mr-3 text-primary" />,
        title: "The Contribution Hub Explained",
        content: (
             <div className="space-y-4 text-muted-foreground">
                <p>The Contribution Hub is a tool that empowers our community. By sharing anonymous data, you help us negotiate better group discounts on everything from parts to insurance.</p>
                <div>
                    <h4 className="font-semibold text-foreground">Why should I contribute?</h4>
                    <p>The more data we have, the stronger our bargaining position with suppliers. When we can show a supplier that 500 of our members use their products, we can negotiate a bulk discount that benefits everyone. Your contribution directly leads to lower costs for the entire community.</p>
                </div>
                <div>
                    <h4 className="font-semibold text-foreground">How do I contribute?</h4>
                    <p>Navigate to your Account Dashboard and click on the "Contribute Data" button. This will take you to the Contribution Hub, where you'll find simple, secure forms to upload details about your trucks, trailers, and suppliers. Each form is designed to be quick and easy to complete.</p>
                </div>
                 <div>
                    <h4 className="font-semibold text-foreground">Is my data safe and anonymous?</h4>
                    <p>Absolutely. We are committed to your privacy. All data submitted is used anonymously and in aggregate. Your individual company's information will never be shared with third parties or other members. The data is used for one purpose only: to demonstrate collective buying power.</p>
                </div>
            </div>
        )
    },
    {
        icon: <BrainCircuit className="h-5 w-5 mr-3 text-primary" />,
        title: "AI-Powered Tools",
        content: (
            <div className="space-y-4 text-muted-foreground">
                <p>Our technology division is dedicated to building smart tools that give you a competitive edge. Our flagship tool is the AI Freight Matcher.</p>
                <div>
                    <h4 className="font-semibold text-foreground">How does the AI Freight Matcher work?</h4>
                    <p>Visit the "Tech" page and enter your current location, vehicle type, and capacity. Our AI model instantly searches a vast database of available loads to find the most profitable and efficient matches for you. It helps reduce empty miles and ensures you're always carrying the best possible freight.</p>
                </div>
                 <div>
                    <h4 className="font-semibold text-foreground">What information do I need?</h4>
                    <p>The more specific you are, the better the matches. Providing your exact location, vehicle specifications (e.g., '53-foot reefer'), and any preferences (e.g., 'no-touch freight') will allow the AI to find the perfect load for your needs.</p>
                </div>
            </div>
        )
    },
    {
        icon: <Info className="h-5 w-5 mr-3 text-primary" />,
        title: "Understanding The 'Connect' Page",
        content: (
             <div className="space-y-4 text-muted-foreground">
                <p>The "Connect" page is where you can activate optional paid plans to unlock new ways to save money and earn revenue.</p>
                <div>
                    <h4 className="font-semibold text-foreground">The Loyalty Plan & Savings Calculator</h4>
                    <p>This plan gives you access to exclusive discounts we've negotiated with suppliers. The Savings Calculator is a powerful tool that demonstrates how it works. By adjusting the sliders for your monthly spend and the average discount, you can see your potential savings in real-time. The "Your Loyalty Tier" slider shows how sharing in the community's negotiated discounts can be passed back to you.</p>
                </div>
                <div>
                    <h4 className="font-semibold text-foreground">The Rewards & Actions Plans</h4>
                    <p>The Rewards Plan allows you to earn points on purchases made through the Logistics Flow Mall, which can be redeemed for valuable items like fuel vouchers. The Actions Plan allows you to earn direct commission by referring new members or sharing supplier discounts with your network.</p>
                </div>
            </div>
        )
    }
]

export default function ResourcesPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline">Resource Center</h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground">
          Your central hub for guides, manuals, and tutorials. Find everything you need to know about navigating the Logistics Flow ecosystem.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
            {resources.map((resource, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                        <div className="flex items-center">
                            {resource.icon}
                            {resource.title}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 bg-card rounded-b-lg">
                        {resource.content}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
      </div>
    </div>
  );
}
