
'use client';

import React from "react";

/**
 * Professional Digital Handshake Content
 * Format: Black and White, Left-Aligned, High-Contrast Business Style.
 */
export default function DigitalHandshake({ partner }: { partner?: any }) {
    const recipientName = partner?.firstName || 'Partner';
    const companyName = partner?.companyName || 'your business';
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://studio--ecosystem-hub.us-central1.hosted.app';
    const optInLink = `${baseUrl}/opt-in/${partner?.id || 'PROSPECT'}`;

    return (
        <div style={{ 
            fontFamily: 'Arial, sans-serif', 
            color: '#000000', 
            maxWidth: '700px', 
            margin: '0', 
            textAlign: 'left',
            lineHeight: '1.5'
        }}>
            {/* Header Section */}
            <div style={{ marginBottom: '30px', borderBottom: '2px solid #000000', paddingBottom: '10px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Digital Handshake & Strategic Connection
                </h1>
                <p style={{ fontSize: '14px', margin: '5px 0 0', fontWeight: 'bold' }}>
                    Entity: {companyName.toUpperCase()}
                </p>
            </div>

            {/* Content Body */}
            <div style={{ marginBottom: '25px' }}>
                <p style={{ fontSize: '14px', marginBottom: '15px' }}>
                    For too long, the transport industry has been held back by fragmentation, high operating costs, and limited access to capital. <strong>Logistics Flow</strong> exists to break these constraints by building a unified digital ecosystem that combines collective buying power with AI-driven efficiency.
                </p>
                <p style={{ fontSize: '14px', marginBottom: '15px' }}>
                    Before we initiate commercial discussions or match you with our network of vetted suppliers and financiers, we require a formal <strong>Digital Handshake</strong>. This ensures our partnership is founded on data integrity and full compliance with the Protection of Personal Information (POPI) Act.
                </p>
            </div>

            {/* Strategic Value Table */}
            <div style={{ border: '1px solid #000000', padding: '15px', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 10px', textTransform: 'uppercase' }}>Scope of Connection:</h2>
                <div style={{ fontSize: '13px' }}>
                    <p style={{ margin: '5px 0' }}>• <strong>Identity Verification:</strong> Confirmation of professional standing within the ecosystem.</p>
                    <p style={{ margin: '5px 0' }}>• <strong>Data Sovereignty:</strong> Ensuring your business intelligence is handled with POPI-compliant care.</p>
                    <p style={{ margin: '5px 0' }}>• <strong>Intelligence Access:</strong> Authorization for our AI to scan for cost-saving load and finance matches.</p>
                </div>
            </div>

            {/* CTA Section */}
            <div style={{ marginBottom: '40px' }}>
                <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '15px' }}>
                    Please click the secure link below to review terms and establish the connection:
                </p>
                
                <table role="presentation" border={0} cellPadding="0" cellSpacing="0">
                    <tr>
                        <td align="left">
                            <a 
                                href={optInLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ 
                                    backgroundColor: '#000000', 
                                    color: '#ffffff', 
                                    padding: '12px 30px', 
                                    borderRadius: '0px', 
                                    textDecoration: 'none', 
                                    fontWeight: 'bold', 
                                    fontSize: '14px',
                                    display: 'inline-block',
                                    border: '1px solid #000000',
                                    textTransform: 'uppercase'
                                }}
                            >
                                Establish Handshake & Access Registry
                            </a>
                        </td>
                    </tr>
                </table>
                
                <p style={{ fontSize: '12px', color: '#666666', marginTop: '20px', fontStyle: 'italic' }}>
                    This action secures your position in our Priority Communication Pipeline, providing a transparent audit trail of all matched opportunities and community benefits.
                </p>
            </div>

            {/* Footer */}
            <div style={{ borderTop: '1px solid #eeeeee', paddingTop: '15px' }}>
                <p style={{ fontSize: '10px', color: '#999999', margin: '0' }}>
                    LOGISTICS FLOW SECURE DIGITAL BRANCH | POPI COMPLIANT SESSION | ALL RIGHTS RESERVED
                </p>
            </div>
        </div>
    );
}
