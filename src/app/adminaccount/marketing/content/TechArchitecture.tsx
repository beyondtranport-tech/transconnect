'use client';

import React from "react";

export default function TechArchitecture({ partner }: { partner?: any }) {
    const companyName = partner?.companyName || 'your business';

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
                The Industrial Brain: Intelligence Architecture
            </p>

            <p style={{ margin: '0 0 14pt 0' }}>
                Technology is the vehicle, but data is the fuel. Logistics Flow provides {companyName} with a robust "Industrial Brain" designed to replace manual, fragmented processes with high-velocity intelligence.
            </p>

            <p style={{ margin: '0 0 7pt 0', fontWeight: 'bold' }}>Architectural Pillars:</p>
            <ul style={{ listStyleType: 'disc', marginLeft: '20pt', margin: '0 0 14pt 20pt' }}>
                <li style={{ marginBottom: '7pt' }}><strong>Forensic Registry Engine:</strong> Our proprietary crawlers have mapped the South African transport grid, cataloging every haulier and supplier into a searchable, high-fidelity database.</li>
                <li style={{ marginBottom: '7pt' }}><strong>AI Synergy Matching:</strong> We use Gemini 1.5 Pro to analyze your fleet equipment and cargo needs, proactively matching you with the most efficient partners in the registry.</li>
                <li style={{ marginBottom: '7pt' }}><strong>Immutable Activity Ledger:</strong> Every quote, transaction, and interaction is logged, creating a validated track record of your business standing for our funding partners.</li>
                <li style={{ marginBottom: '7pt' }}><strong>Real-Time Digital Branches:</strong> Lightning-fast storefronts that ensure your products and services are visible to the community 24/7.</li>
            </ul>

            <p style={{ margin: '0 0 14pt 0' }}>
                By leveraging this stack, {companyName} gains the same technological advantage as global logistics giants, allowing you to compete and scale with absolute precision.
            </p>

            <p style={{ margin: '0 0 14pt 0' }}>
                Regards,
            </p>
            <p style={{ margin: '0' }}>
                The Logistics Flow Technical Division
            </p>
        </div>
    );
}
