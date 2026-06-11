'use client';

import React from "react";

/**
 * Professional Digital Handshake Content
 * Format: Calibri 12pt, All Black and White, Left-Aligned, High-Contrast Business Style.
 */
export default function DigitalHandshake({ partner }: { partner?: any }) {
    const companyName = partner?.companyName || 'your business';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://studio--ecosystem-hub.us-central1.hosted.app';
    const optInLink = `${baseUrl}/join?ref=${partner?.id || 'PROSPECT'}`;

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
                Digital Handshake & Strategic Connection: {companyName.toUpperCase()}
            </p>

            <p style={{ margin: '0 0 14pt 0' }}>
                For too long, the transport industry has been held back by fragmentation, high operating costs, and limited access to capital. Logistics Flow exists to break these constraints by building a unified digital ecosystem that combines collective buying power with AI-driven efficiency.
            </p>

            <p style={{ margin: '0 0 14pt 0' }}>
                Before we initiate commercial discussions or match you with our network of vetted suppliers and financiers, we require a formal Digital Handshake. This ensures our partnership is founded on data integrity and full compliance with the Protection of Personal Information (POPI) Act.
            </p>

            <p style={{ margin: '0 0 7pt 0', fontWeight: 'bold' }}>Scope of Connection:</p>
            <ul style={{ listStyleType: 'disc', marginLeft: '20pt', margin: '0 0 14pt 20pt' }}>
                <li style={{ marginBottom: '7pt' }}>Identity Verification: Confirmation of professional standing within the ecosystem.</li>
                <li style={{ marginBottom: '7pt' }}>Data Sovereignty: Ensuring your business intelligence is handled with POPI-compliant care.</li>
                <li style={{ marginBottom: '7pt' }}>Intelligence Access: Authorization for our AI to scan for cost-saving load and finance matches.</li>
            </ul>

            <p style={{ margin: '0 0 14pt 0', fontWeight: 'bold' }}>
                Please click the secure link below to review terms and establish the connection:
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
                This action secures your position in our Priority Communication Pipeline, providing a transparent audit trail of all matched opportunities and community benefits.
            </p>

            <div style={{ borderTop: '1px solid #eeeeee', paddingTop: '10pt', marginTop: '20pt' }}>
                <p style={{ fontSize: '9pt', color: '#999999', margin: '0' }}>
                    LOGISTICS FLOW SECURE DIGITAL BRANCH | POPI COMPLIANT SESSION | ALL RIGHTS RESERVED
                </p>
            </div>
        </div>
    );
}
