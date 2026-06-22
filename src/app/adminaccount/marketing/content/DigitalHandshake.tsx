
'use client';

import React from "react";

/**
 * Narrative-Driven Digital Handshake
 * Reflects the "Driver-to-Driver" peer recommendation strategy.
 */
export default function DigitalHandshake({ partner, audience }: { partner?: any, audience?: string }) {
    const firstName = partner?.firstName || (partner?.contactPerson ? partner.contactPerson.split(' ')[0] : 'Partner');
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
                Strategic Handshake: {companyName.toUpperCase()}
            </p>

            <p style={{ margin: '0 0 14pt 0' }}>Good day {firstName},</p>

            <p style={{ margin: '0 0 14pt 0' }}>
                The industry is talking. At container depots and harbors across the country, the question is being asked: <strong>"Have you seen the new Logistics Flow app?"</strong>
            </p>

            <div style={{ margin: '0 0 18pt 0', padding: '20pt', border: '2px solid #228B22', borderRadius: '12pt', backgroundColor: '#f0fdf4', textAlign: 'center' }}>
                <p style={{ margin: '0 0 10pt 0', fontWeight: 'bold', color: '#166534', fontSize: '11pt', textTransform: 'uppercase' }}>Visual Presentation: The Peer-to-Peer Network</p>
                <p style={{ margin: '0 0 15pt 0', fontStyle: 'italic', fontSize: '10pt' }}>Watch how our authorized ISA Agents are digitalizing the harbor front.</p>
                <div style={{ margin: '0 auto', maxWidth: '350pt' }}>
                    <a 
                        href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ 
                            backgroundColor: '#228B22', 
                            color: '#ffffff', 
                            padding: '12pt 24pt', 
                            borderRadius: '6pt', 
                            textDecoration: 'none', 
                            fontWeight: 'bold', 
                            display: 'inline-block',
                            fontSize: '13pt',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                    >
                        Watch the 60-Second Narrative Overview
                    </a>
                </div>
                <p style={{ margin: '10pt 0 0 0', fontSize: '9pt', color: '#666666' }}>
                    [REPLACE WITH YOUR GOOGLE CLOUD STORAGE LINK ONCE SCENES ARE GENERATED]
                </p>
            </div>

            <p style={{ margin: '0 0 14pt 0' }}>
                As an authorized Independent Sales Agent, we are opening our secure network to foundational stakeholders like {companyName}. This is more than an app—it is an earning platform where you can build a network and generate passive revenue through community transparency.
            </p>

            <p style={{ margin: '0 0 7pt 0', fontWeight: 'bold' }}>The Connection Advantage:</p>
            <ul style={{ listStyleType: 'disc', marginLeft: '20pt', margin: '0 0 14pt 20pt' }}>
                <li style={{ marginBottom: '7pt' }}><strong>Forensic Registry:</strong> Instant access to decision-makers across the national transport grid.</li>
                <li style={{ marginBottom: '7pt' }}><strong>WhatsApp Integration:</strong> Simple, one-click network growth and lead generation.</li>
                <li style={{ marginBottom: '7pt' }}><strong>Direct Commerce:</strong> Link directly with suppliers and buy through verified product catalogues.</li>
                <li style={{ marginBottom: '7pt' }}><strong>Passive Revenue:</strong> Start earning from the activity within your digitized network today.</li>
            </ul>

            <p style={{ margin: '0 0 14pt 0', fontWeight: 'bold' }}>
                Establish the handshake and join the network below:
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
                By establishing this handshake, you confirm your standing in our secure communication pipeline.
            </p>

            <div style={{ borderTop: '1px solid #eeeeee', paddingTop: '10pt', marginTop: '20pt' }}>
                <p style={{ fontSize: '9pt', color: '#999999', margin: '0' }}>
                    LOGISTICS FLOW SECURE NETWORK | AUTHORIZED ISA SESSION | ALL RIGHTS RESERVED
                </p>
            </div>
        </div>
    );
}
