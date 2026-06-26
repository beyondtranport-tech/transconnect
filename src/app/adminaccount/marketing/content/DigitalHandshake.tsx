'use client';

import React, { useMemo } from "react";

interface HandshakeContent {
    headline: string;
    intro: string;
    points: string[];
    closing: string;
}

const supplierPitches: Record<string, HandshakeContent> = {
    v1: {
        headline: "Strategic Sales Handshake",
        intro: "Logistics Flow has cataloged the national transport grid. We are opening a direct sales channel for established providers to reach over 5,400+ verified transport companies.",
        points: [
            "Direct Market Access to 5,400+ fleet owners.",
            "Forensic Sales Tools to bypass generic switchboards.",
            "Verified Digital Branch visible to a high-intent community."
        ],
        closing: "Establish the handshake to activate your direct line."
    },
    v2: {
        headline: "Market Velocity Upgrade",
        intro: "Your sales team is fighting against an information gap. We've bridged it. We are inviting you to plug into a high-fidelity registry where the decision-makers are already active.",
        points: [
            "Access direct mobile numbers for MDs and Owners.",
            "Map regional demand before committing inventory.",
            "Join as a Tier-1 Verified Supplier for maximum visibility."
        ],
        closing: "Confirm your standing to accelerate your sales cycle."
    },
    v3: {
        headline: "The Embedded Finance Handshake",
        intro: "We've solved the primary constraint on your growth: customer cash flow. We fund your buyers so they can purchase from you upfront and in full, while you scale without risk.",
        points: [
            "Zero-risk sales: You get paid instantly by the platform.",
            "Expand your credit reach without increasing your debtors' risk.",
            "Direct introduction to members with approved asset-finance limits."
        ],
        closing: "Establish this connection to unlock our capital-powered sales channel."
    },
    v4: {
        headline: "Digital Branch Dominance",
        intro: "Traditional catalogs are static. Your new Digital Branch is alive. We match your specialized inventory with the exact equipment declared by our 5,400+ members.",
        points: [
            "AI-powered product matching based on member fleet data.",
            "Real-time RFQs delivered directly to your secure dashboard.",
            "Establish absolute technical dominance in your specific category."
        ],
        closing: "Secure your digital node and start receiving high-intent matches."
    },
    v5: {
        headline: "Foundational Partnership Offer",
        intro: "We are seeking a single foundational partner in your category to join our strategic advisory board. This is an invitation to share in the total ecosystem revenue as we scale.",
        points: [
            "Earn recurring revenue from every member you refer to the registry.",
            "Priority standing in all Mall search results (Top-of-List).",
            "Direct influence on the platform's industrial roadmap."
        ],
        closing: "This is a maximum-incentive invitation. Establish the handshake to begin the executive briefing."
    }
};

const transporterPitches: Record<string, HandshakeContent> = {
    v1: {
        headline: "Operational Efficiency Handshake",
        intro: "Inefficiency is a silent tax. Logistics Flow is a unified ecosystem designed to break the constraints of high operating costs and empty miles.",
        points: [
            "AI Capacity Alerts for matching freight loads.",
            "Group buying power for tires, fuel, and parts.",
            "Verified standing for future asset finance access."
        ],
        closing: "Establish the connection to start saving on overheads."
    },
    v2: {
        headline: "The Zero-Empty-Mile Initiative",
        intro: "How much did your empty legs cost you last month? We have digitized the national freight map to ensure your trucks never run empty.",
        points: [
            "Real-time visibility into available backhaul loads.",
            "Direct connection to cargo owners (No broker fees).",
            "Automated route optimization via the Tech Division."
        ],
        closing: "Connect your fleet to the industrial brain today."
    },
    v3: {
        headline: "Collective Power Handshake",
        intro: "Independent hauliers are being squeezed by rising costs. We are aggregating the buying power of thousands of small fleets to demand wholesale pricing.",
        points: [
            "Access 'Member-Only' rates for premium tire brands.",
            "Direct-from-manufacturer parts pricing.",
            "Fuel rebates through our integrated wallet system."
        ],
        closing: "Join the syndicate to slash your maintenance costs."
    },
    v4: {
        headline: "Capital Intelligence Upgrade",
        intro: "Traditional banks miss the opportunity in your business. We don't. Your performance data on our platform is the key to unlocking asset finance.",
        points: [
            "Build a validated standing based on real operational data.",
            "Direct access to 85+ specialized industrial lenders.",
            "Pre-vetting for working capital based on your load history."
        ],
        closing: "Establish the handshake to start building your digital credit record."
    },
    v5: {
        headline: "Network Monetization (ISA) Offer",
        intro: "Turn your industry relationships into a new revenue stream. We are inviting you to join as an Authorized Independent Sales Agent with full recurring commissions.",
        points: [
            "Earn a share of the monthly fees from every business you refer.",
            "Participate in Mall commissions across the entire ecosystem.",
            "Graduate your business from operations to strategic growth."
        ],
        closing: "Maximum incentive access. Establish the connection to activate your revenue engine."
    }
};

/**
 * NARRATIVE VARIANCE ENGINE
 * Generates unique greetings and closings based on ID to avoid spam fingerprinting.
 */
function getVariance(id: string) {
    const greetings = ["Good day", "Good morning", "Greetings", "Hello"];
    const closings = ["Regards,", "Best regards,", "Sincerely,", "Kind regards,"];
    const signoffs = ["The Logistics Flow Team", "Logistics Flow Management", "The Growth Team", "Platform Operations"];
    
    // Deterministic selection based on ID hash
    const charCodeSum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    return {
        greeting: greetings[charCodeSum % greetings.length],
        closing: closings[charCodeSum % closings.length],
        signoff: signoffs[charCodeSum % signoffs.length]
    };
}

export default function DigitalHandshake({ partner, audience, version = 'v1' }: { partner?: any, audience?: string, version?: string }) {
    const firstName = partner?.firstName || (partner?.contactPerson ? partner.contactPerson.split(' ')[0] : 'Partner');
    const companyName = partner?.companyName || 'your business';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://studio--ecosystem-hub.us-central1.hosted.app';
    const optInLink = `${baseUrl}/opt-in/${partner?.id || 'PROSPECT'}`;
    const pixelUrl = `${baseUrl}/api/trackEmailOpen/${partner?.id || 'anonymous'}`;

    const isSupplier = audience === 'suppliers';
    const pitch = isSupplier ? (supplierPitches[version] || supplierPitches.v1) : (transporterPitches[version] || transporterPitches.v1);
    
    const variance = useMemo(() => getVariance(partner?.id || 'TEST'), [partner?.id]);

    return (
        <div style={{ 
            fontFamily: 'Calibri, Candara, Segoe, "Segoe UI", Optima, Arial, sans-serif', 
            fontSize: '12pt', 
            color: '#000000', 
            lineHeight: '1.2',
            backgroundColor: '#ffffff',
            padding: '0'
        }}>
            <p style={{ margin: '0 0 14pt 0', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '2px solid #000000', paddingBottom: '4pt' }}>
                {pitch.headline}: {companyName.toUpperCase()}
            </p>

            <p style={{ margin: '0 0 14pt 0' }}>{variance.greeting} {firstName},</p>

            <p style={{ margin: '0 0 14pt 0' }}>{pitch.intro}</p>

            <p style={{ margin: '0 0 7pt 0', fontWeight: 'bold' }}>Key Advantages:</p>
            <ul style={{ listStyleType: 'disc', marginLeft: '20pt', margin: '0 0 14pt 20pt' }}>
                {pitch.points.map((p, i) => (
                    <li key={i} style={{ marginBottom: '7pt' }}>{p}</li>
                ))}
            </ul>

            <p style={{ margin: '0 0 14pt 0', fontWeight: 'bold' }}>
                {pitch.closing}
            </p>
            
            <p style={{ margin: '0 0 14pt 0' }}>
                <a 
                    href={optInLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                        color: '#0000FF', 
                        textDecoration: 'underline',
                        fontWeight: 'bold'
                    }}
                >
                    {optInLink}
                </a>
            </p>
            
            <p style={{ margin: '0 0 14pt 0', fontSize: '10pt', color: '#666666', fontStyle: 'italic' }}>
                By establishing this handshake, you confirm your standing in our secure industrial communication pipeline.
            </p>

            <p style={{ margin: '0 0 1pt 0' }}>{variance.closing}</p>
            <p style={{ margin: '0 0 14pt 0', fontWeight: 'bold' }}>{variance.signoff}</p>

            <div style={{ borderTop: '1px solid #eeeeee', paddingTop: '10pt', marginTop: '20pt' }}>
                <p style={{ fontSize: '9pt', color: '#999999', margin: '0' }}>
                    LOGISTICS FLOW SECURE NETWORK | AUTHORIZED INDUSTRIAL SESSION | ALL RIGHTS RESERVED
                </p>
            </div>

            {/* Forensic Tracking Pixel */}
            <img src={pixelUrl} width="1" height="1" style={{ display: 'none' }} alt="Logistics Flow Tracking" />
        </div>
    );
}
