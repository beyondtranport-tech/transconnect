'use client';

import React from "react";

export default function TechArchitecture({ partner }: { partner?: any }) {
    const recipientName = partner?.firstName || 'Partner';
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
                Technology Architecture & Scalability: {companyName.toUpperCase()}
            </p>

            <p style={{ margin: '0 0 14pt 0' }}>
                Logistics Flow provides {companyName} with a robust, scalable, and secure digital infrastructure designed to replace manual processes with high-velocity data flow.
            </p>

            <p style={{ margin: '0 0 7pt 0', fontWeight: 'bold' }}>Core Architectural Pillars:</p>
            <ul style={{ listStyleType: 'disc', marginLeft: '20pt', margin: '0 0 14pt 20pt' }}>
                <li style={{ marginBottom: '7pt' }}><strong>Performance & Scale:</strong> Built on a modern, serverless architecture ensuring zero downtime and lightning-fast load times for your digital branch.</li>
                <li style={{ marginBottom: '7pt' }}><strong>Real-Time Ledger:</strong> Utilizing specialized database structures to maintain an immutable record of all commercial activity, creating a validated track record for funding.</li>
                <li style={{ marginBottom: '7pt' }}><strong>Integrated Intelligence:</strong> Core AI integration (Gemini 1.5) that handles complex freight matching and automated SEO for your product listings.</li>
                <li style={{ marginBottom: '7pt' }}><strong>Enterprise Security:</strong> Full encryption and strict security protocols ensuring that {companyName}&apos;s sensitive business data remains private.</li>
            </ul>

            <p style={{ margin: '0 0 14pt 0' }}>
                This technology stack allows {recipientName} to compete with the industry&apos;s largest players by leveraging the same high-tier tools used by global logistics giants.
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
