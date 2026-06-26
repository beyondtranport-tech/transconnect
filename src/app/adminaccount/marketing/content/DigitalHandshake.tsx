'use client';

import React from "react";

/**
 * AUTHORITATIVE DIGITAL HANDSHAKE
 * Removed em dash from growth engine statement.
 */
export default function DigitalHandshake({ partner, audience, version = 'v1' }: { partner?: any, audience?: string, version?: string }) {
    const firstName = partner?.firstName || (partner?.contactPerson ? partner.contactPerson.split(' ')[0] : 'Partner');
    const companyName = partner?.companyName || 'your business';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://studio--ecosystem-hub.us-central1.hosted.app';
    const optInLink = `${baseUrl}/opt-in/${partner?.id || 'PROSPECT'}`;
    const pixelUrl = `${baseUrl}/api/trackEmailOpen/${partner?.id || 'anonymous'}`;

    const isSupplier = audience === 'suppliers';

    if (isSupplier) {
        return (
            <div style={{ 
                fontFamily: 'Calibri, Candara, Segoe, "Segoe UI", Optima, Arial, sans-serif', 
                fontSize: '12pt', 
                color: '#000000', 
                lineHeight: '1.2',
                backgroundColor: '#ffffff',
                padding: '0'
            }}>
                <p style={{ margin: '0 0 14pt 0' }}>Good day {firstName},</p>

                <p style={{ margin: '0 0 14pt 0' }}>
                    The opportunity to scale your supply business has never been more immediate. With over 5,400+ verified transport companies already active in our ecosystem, we are opening a direct sales channel for established providers like {companyName}.
                </p>

                <p style={{ margin: '0 0 14pt 0', fontWeight: 'bold' }}>
                    "This is more than a registry, it is a high-velocity growth engine. We provide you with the forensic data to find your most profitable customers and the embedded finance to ensure they have the capital to buy from you upfront and in full."
                </p>

                <p style={{ margin: '0 0 7pt 0', fontWeight: 'bold' }}>The Supplier Advantage:</p>
                <ul style={{ listStyleType: 'disc', marginLeft: '20pt', margin: '0 0 14pt 20pt' }}>
                    <li style={{ marginBottom: '7pt' }}><strong>Direct Market Access:</strong> Instantly reach 5,400+ fleet owners actively searching for parts and services.</li>
                    <li style={{ marginBottom: '7pt' }}><strong>Forensic Sales Tools:</strong> Access direct mobile numbers and emails for MDs/Owners to bypass generic switchboards.</li>
                    <li style={{ marginBottom: '7pt' }}><strong>Embedded Finance:</strong> We fund your customers so you can close more deals without cash flow constraints.</li>
                    <li style={{ marginBottom: '7pt' }}><strong>Verified Digital Branch:</strong> Showcase your specialized inventory to a high-intent industrial community 24/7.</li>
                </ul>

                <p style={{ margin: '0 0 14pt 0' }}>
                    Establish the handshake to secure your direct line to the community below:
                </p>
                
                <p style={{ margin: '0 0 14pt 0' }}>
                    <a href={optInLink} target="_blank" rel="noopener noreferrer" style={{ color: '#0000FF', textDecoration: 'underline', fontWeight: 'bold' }}>
                        {optInLink}
                    </a>
                </p>
                
                <p style={{ margin: '0 0 14pt 0' }}>
                    By establishing this handshake, you confirm your standing in our secure industrial communication pipeline.
                </p>

                <div style={{ borderTop: '1px solid #eeeeee', paddingTop: '10pt', marginTop: '20pt' }}>
                    <p style={{ fontSize: '9pt', color: '#999999', margin: '0', fontWeight: 'bold' }}>
                        LOGISTICS FLOW SECURE NETWORK | AUTHORIZED INDUSTRIAL SESSION | ALL RIGHTS RESERVED
                    </p>
                </div>

                <img src={pixelUrl} width="1" height="1" style={{ display: 'none' }} alt="Tracking" />
            </div>
        );
    }

    // Transporter Version
    return (
        <div style={{ 
            fontFamily: 'Calibri, Candara, Segoe, "Segoe UI", Optima, Arial, sans-serif', 
            fontSize: '12pt', 
            color: '#000000', 
            lineHeight: '1.2',
            backgroundColor: '#ffffff',
            padding: '0'
        }}>
            <p style={{ margin: '0 0 14pt 0' }}>Good day {firstName},</p>

            <p style={{ margin: '0 0 14pt 0' }}>
                Inefficiency is a silent tax on your transport business. Logistics Flow is a unified digital ecosystem designed to break the constraints of high operating costs and empty miles for companies like {companyName}.
            </p>

            <p style={{ margin: '0 0 14pt 0', fontWeight: 'bold' }}>
                "This is more than a registry, it is a high-velocity growth engine. We provide you with the forensic data to find your most profitable customers and the embedded finance to ensure they have the capital to buy from you upfront and in full."
            </p>

            <p style={{ margin: '0 0 7pt 0', fontWeight: 'bold' }}>The Transporter Advantage:</p>
            <ul style={{ listStyleType: 'disc', marginLeft: '20pt', margin: '0 0 14pt 20pt' }}>
                <li style={{ marginBottom: '7pt' }}><strong>Capacity Matching:</strong> Proactive AI alerts for loads that match your empty leg routes.</li>
                <li style={{ marginBottom: '7pt' }}><strong>Group Buying Power:</strong> Access community-negotiated rates for tires, fuel, and parts.</li>
                <li style={{ marginBottom: '7pt' }}><strong>Validated Standing:</strong> Build a digital track record to unlock asset finance from our 85+ lenders.</li>
                <li style={{ marginBottom: '7pt' }}><strong>Direct Engagement:</strong> Connect with cargo owners and vetted suppliers without middle-man friction.</li>
            </ul>

            <p style={{ margin: '0 0 14pt 0' }}>
                Establish the handshake to secure your standing in the industrial brain:
            </p>
            
            <p style={{ margin: '0 0 14pt 0' }}>
                <a href={optInLink} target="_blank" rel="noopener noreferrer" style={{ color: '#0000FF', textDecoration: 'underline', fontWeight: 'bold' }}>
                    {optInLink}
                </a>
            </p>
            
            <p style={{ margin: '0 0 14pt 0' }}>
                By establishing this handshake, you confirm your standing in our secure industrial communication pipeline.
            </p>

            <div style={{ borderTop: '1px solid #eeeeee', paddingTop: '10pt', marginTop: '20pt' }}>
                <p style={{ fontSize: '9pt', color: '#999999', margin: '0', fontWeight: 'bold' }}>
                    LOGISTICS FLOW SECURE NETWORK | AUTHORIZED INDUSTRIAL SESSION | ALL RIGHTS RESERVED
                </p>
            </div>

            <img src={pixelUrl} width="1" height="1" style={{ display: 'none' }} alt="Tracking" />
        </div>
    );
}
