
'use client';

import React from "react";

/**
 * STRATEGIC COMPANY PROFILE
 * Updated Base URL to professional domain.
 */
export default function CompanyProfile({ audience, partner }: { audience: string; partner?: any }) {
    const isValid = (val: any) => !!val && val !== 'N/A' && val !== 'null' && val !== 'None';

    // RESOLVE SALUTATION NAME VIA CONTACT HIERARCHY
    const resolvedName = (partner?.marketingManager?.name && isValid(partner.marketingManager.name)) 
        ? partner.marketingManager.name 
        : (partner?.ceo?.name && isValid(partner.ceo.name))
        ? partner.ceo.name
        : partner?.firstName || partner?.contactPerson || 'Member';

    const firstName = resolvedName.split(' ')[0];

    const email = isValid(partner?.marketingManager?.email) 
        ? partner.marketingManager.email 
        : isValid(partner?.ceo?.email)
        ? partner.ceo.email
        : partner?.email || '';

    const baseUrl = 'https://logisticsflow.co.za';
    const pixelUrl = `${baseUrl}/api/trackEmailOpen/${partner?.id || 'anonymous'}`;
    const signupLink = `${baseUrl}/join?email=${encodeURIComponent(email)}&firstName=${encodeURIComponent(firstName)}`;

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
                INDUSTRIAL MEMO: THE DIGITALIZATION OF LOGISTICS FLOW
            </p>

            <p style={{ margin: '0 0 14pt 0' }}>Good day {firstName}, we write to introduce the Logistics Flow ecosystem to your business.</p>
            
            <p style={{ margin: '0 0 14pt 0' }}>
                Logistics Flow is a <strong>Data-as-a-Service (DaaS)</strong> ecosystem designed to break the constraints of the South African transport industry. We have digitized the industrial map of the country, integrating commerce, capital, and forensic intelligence into a single flow of opportunity.
            </p>

            <p style={{ margin: '0 0 7pt 0', fontWeight: 'bold' }}>Our Four Pillars of Flow</p>
            
            <ul style={{ listStyleType: 'disc', marginLeft: '20pt', margin: '0 0 14pt 20pt' }}>
                <li style={{ marginBottom: '7pt' }}><strong>Intelligence:</strong> A forensic registry of 22,000+ industrial records. We provide absolute market transparency, giving you the names, emails, and direct mobile numbers of decision-makers.</li>
                <li style={{ marginBottom: '7pt' }}><strong>Commerce:</strong> Digital branches that allow transporters and suppliers to showcase capacity and inventory directly to a captive, high-intent community.</li>
                <li style={{ marginBottom: '7pt' }}><strong>Community:</strong> Collective buying power that negotiates massive discounts on fuel, tires, and parts for our member syndicate.</li>
                <li style={{ marginBottom: '7pt' }}><strong>Capital:</strong> A data-driven lending engine that uses your platform performance to unlock asset finance and working capital where traditional banks can't.</li>
            </ul>

            <p style={{ margin: '0 0 7pt 0', fontWeight: 'bold' }}>The Intelligence Tier</p>
            <p style={{ margin: '0 0 14pt 0' }}>
                Our <strong>Intelligence Access</strong> tier gives you the "Keys to the Kingdom." No more cold calling generic support lines. You get the map to the industry's leadership, allowing you to build relationships that drive revenue.
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
            <p style={{ margin: '0 0 14pt 0', fontWeight: 'bold' }}>The Logistics Flow Team</p>

            <img src={pixelUrl} width="1" height="1" style={{ display: 'none' }} alt="Tracking" />
        </div>
    );
}
