
'use client';

import React from "react";

/**
 * Enhanced Company Profile with Intelligence and Video Focus
 */
export default function CompanyProfile({ audience, partner }: { audience: string; partner?: any }) {
    const firstName = partner?.firstName || (partner?.contactPerson ? partner.contactPerson.split(' ')[0] : 'Member');
    const email = partner?.email || '';
    const lastName = partner?.lastName || '';
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://studio--ecosystem-hub.us-central1.hosted.app';
    const signupLink = `${baseUrl}/join?email=${encodeURIComponent(email)}&firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}`;

    return (
        <div style={{ 
            fontFamily: 'Calibri, Candara, Segoe, "Segoe UI", Optima, Arial, sans-serif', 
            fontSize: '12pt', 
            color: '#000000', 
            lineHeight: '1.2',
            backgroundColor: '#ffffff',
            padding: '0'
        }}>
            <p style={{ margin: '0 0 14pt 0' }}>Good day {firstName}, we write to introduce Logistics Flow to your business.</p>
            
            <p style={{ margin: '0 0 14pt 0' }}>
                Logistics Flow is a Data-as-a-Service (DaaS) ecosystem designed to break the constraints of the South African transport industry. We have digitized the industrial map of the country, integrating commerce, capital, and forensic intelligence into a single flow of opportunity.
            </p>

            <div style={{ margin: '0 0 14pt 0', padding: '16pt', border: '2px solid #228B22', borderRadius: '10pt', backgroundColor: '#f0fdf4', textAlign: 'center' }}>
                <p style={{ margin: '0 0 7pt 0', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10pt', color: '#166534' }}>Visual Validation Briefing</p>
                <p style={{ margin: '0 0 12pt 0', fontSize: '11pt' }}>See how our forensic industrial registry is digitizing the national transport grid.</p>
                <div style={{ margin: '0 auto', maxWidth: '300pt' }}>
                    <a 
                        href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ 
                            backgroundColor: '#228B22', 
                            color: '#ffffff', 
                            padding: '10pt 20pt', 
                            borderRadius: '5pt', 
                            textDecoration: 'none', 
                            fontWeight: 'bold', 
                            display: 'inline-block',
                            fontSize: '12pt'
                        }}
                    >
                        Watch the 60-Second Overview
                    </a>
                </div>
                <p style={{ margin: '8pt 0 0 0', fontSize: '9pt', color: '#666666', fontStyle: 'italic' }}>Note: Replace the link above with your generated AI showcase video once ready.</p>
            </div>

            <p style={{ margin: '0 0 7pt 0', fontWeight: 'bold' }}>Our Pillars of Flow</p>
            <p style={{ margin: '0 0 14pt 0' }}>We empower the transport community through four integrated divisions:</p>
            
            <ul style={{ listStyleType: 'disc', marginLeft: '20pt', margin: '0 0 14pt 20pt' }}>
                <li style={{ marginBottom: '7pt' }}><strong>Intelligence:</strong> A forensic registry of 22,000+ industrial records. We provide absolute market transparency, giving you the names, emails, and direct mobile numbers of decision-makers.</li>
                <li style={{ marginBottom: '7pt' }}><strong>Commerce:</strong> Digital branches that allow transporters and suppliers to showcase capacity and inventory directly to a captive, high-intent market.</li>
                <li style={{ marginBottom: '7pt' }}><strong>Community:</strong> Collective buying power that negotiates massive discounts on fuel, tires, and parts for our member syndicate.</li>
                <li style={{ marginBottom: '7pt' }}><strong>Capital:</strong> A data-driven lending engine that uses your platform performance to unlock asset finance and working capital where traditional banks can't.</li>
            </ul>

            <p style={{ margin: '0 0 7pt 0', fontWeight: 'bold' }}>The Value Proposition</p>
            <p style={{ margin: '0 0 14pt 0' }}>
                For just R100/month, our <strong>Intelligence Access</strong> tier gives you the keys to the kingdom. No more cold calling generic support lines. You get the map to the industry's leadership, allowing you to build relationships that drive revenue.
            </p>

            <p style={{ margin: '0 0 14pt 0' }}>
                You can explore our forensic registries and set up your own digital branch via the secure link below:
            </p>
            
            <p style={{ margin: '0 0 14pt 0' }}>
                <a href={signupLink} target="_blank" rel="noopener noreferrer" style={{ color: '#0000FF', textDecoration: 'underline', fontWeight: 'bold' }}>
                    {signupLink}
                </a>
            </p>

            <p style={{ margin: '0 0 14pt 0' }}>Please sign in to access your personal secure portal. This is your command center for industrial growth and data-driven profitability.</p>
            
            <p style={{ margin: '0 0 14pt 0' }}>Regards,</p>
            <p style={{ margin: '0' }}>The Logistics Flow Team</p>
        </div>
    );
}
