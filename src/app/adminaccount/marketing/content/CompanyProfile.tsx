'use client';

import React from "react";

/**
 * Reinstated Company Profile Template
 * Format: Calibri 12pt, All Black and White, Left-Aligned.
 */
export default function CompanyProfile({ partner }: { audience: string; partner?: any }) {
    const firstName = partner?.firstName || 'Member';
    const email = partner?.email || '';
    const lastName = partner?.lastName || '';
    
    const baseUrl = 'https://studio--ecosystem-hub.us-central1.hosted.app';
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
            <p style={{ margin: '0 0 14pt 0' }}>Good day {firstName}, we write to introduce our company to you.</p>
            
            <p style={{ margin: '0 0 14pt 0' }}>
                Simplyfi Flow is a finance company specialising in funding for the transport sector. I'm reaching out on behalf of our sister company Logistics Flow. Logistics Flow, a digital ecosystem for the transport industry connecting funding, suppliers and transporters into one ecosystem. Accordingly, we have digitised a logistics ecosystem to create a continuous flow of commerce, capital, and opportunity.
            </p>

            <p style={{ margin: '0 0 7pt 0', fontWeight: 'bold' }}>Our Mission</p>
            <p style={{ margin: '0 0 14pt 0' }}>Our mission is to break the constraints that hold back transport businesses. By creating a unified digital platform, we empower every member of the logistics community—from independent transporters to large suppliers—with the tools to increase efficiency, reduce costs, access capital, and grow their business.</p>

            <p style={{ margin: '0 0 7pt 0', fontWeight: 'bold' }}>The Problem</p>
            <p style={{ margin: '0 0 7pt 0' }}>The transport sector is the backbone of the economy, yet it operates in a fragmented, inefficient, and capital-constrained environment. Businesses face:</p>
            <ul style={{ listStyleType: 'disc', marginLeft: '20pt', margin: '0 0 14pt 20pt' }}>
                <li style={{ marginBottom: '7pt' }}>High Operating Costs: Lack of collective buying power means paying premium prices for parts, fuel, and services.</li>
                <li style={{ marginBottom: '7pt' }}>Limited Access to Capital: Traditional lenders don't understand the industry, making it difficult to secure funding for growth or asset acquisition.</li>
                <li style={{ marginBottom: '7pt' }}>Inefficient Operations: Empty miles, manual processes, and a lack of real-time data eat into profit margins.</li>
                <li style={{ marginBottom: '7pt' }}>Digital Divide: Many businesses lack the resources to build a professional online presence, limiting their market reach.</li>
            </ul>

            <p style={{ margin: '0 0 7pt 0', fontWeight: 'bold' }}>The Solution</p>
            <p style={{ margin: '0 0 7pt 0' }}>Logistics Flow tackles these challenges head-on by a having developed a Unified Ecosystem integrating three core pillars into a single platform:</p>
            <ol style={{ listStyleType: 'decimal', marginLeft: '20pt', margin: '0 0 14pt 20pt' }}>
                <li style={{ marginBottom: '7pt' }}>Commerce - Enabling transporters and suppliers to create digital storefronts, sell products, and transact within a trusted network.</li>
                <li style={{ marginBottom: '7pt' }}>Community - Leveraging collective buying power and data contributions to negotiate group discounts and benefits for all members.</li>
                <li style={{ marginBottom: '7pt' }}>Capital - Using real-world operational data from platform activity to create a more accurate risk profile, unlocking access to flexible funding solutions.</li>
            </ol>
            <p style={{ margin: '0 0 14pt 0' }}>This creates a powerful feedback loop: commercial activity generates data, which validates creditworthiness and unlocks capital for further growth.</p>

            <p style={{ margin: '0 0 7pt 0', fontWeight: 'bold' }}>Transporter Opportunity</p>
            <p style={{ margin: '0 0 14pt 0' }}>Logistics Flow offers two powerful pathways for transporters: benefit from the ecosystem as a Member, or earn significant revenue by building the network as an ISA Partner.</p>
            
            <p style={{ margin: '0 0 14pt 0' }}>You can look at the beta version by clicking on the link below in order for you to gain a complete view.</p>
            
            <p style={{ margin: '0 0 14pt 0' }}>
                <a href={signupLink} target="_blank" rel="noopener noreferrer" style={{ color: '#0000FF', textDecoration: 'underline', fontWeight: 'bold' }}>
                    {signupLink}
                </a>
            </p>

            <p style={{ margin: '0 0 14pt 0' }}>Please sign in, create your password and access your personal secure members portal. Please note this is your secure portal and no other member has access to it. This is where you will transact with your clients and ourselves.</p>
            
            <p style={{ margin: '0 0 14pt 0' }}>We will send you further emails to further detail the opportunity.</p>

            <p style={{ margin: '0 0 14pt 0' }}>Regards,</p>
            <p style={{ margin: '0' }}>Michael Koton</p>
            <p style={{ margin: '0' }}>Logistics Flow & Simplyfi Flow</p>
        </div>
    );
}
