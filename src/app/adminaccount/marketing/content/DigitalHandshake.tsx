
'use client';

import { ShieldCheck, Zap, ArrowRight, FileText, Lock, Scale } from "lucide-react";
import React from "react";

/**
 * Digital Handshake Content
 * Optimized for Email Copy-Paste. Uses standard HTML tags and inline-compatible styles.
 */
export default function DigitalHandshake({ partner }: { partner?: any }) {
    const recipientName = partner?.firstName || 'Partner';
    const companyName = partner?.companyName || 'your business';
    
    // We use a fixed absolute base for the link to ensure it works when pasted into external mail clients
    const baseUrl = 'https://studio--ecosystem-hub.us-central1.hosted.app';
    const optInLink = `${baseUrl}/opt-in/${partner?.id || 'PROSPECT'}`;

    return (
        <div style={{ fontFamily: 'sans-serif', color: '#1e293b' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ 
                    backgroundColor: '#f0fdf4', 
                    padding: '20px', 
                    borderRadius: '50%', 
                    width: '80px', 
                    height: '80px', 
                    margin: '0 auto 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <img src="https://img.icons8.com/color/96/handshake.png" alt="Handshake" width="48" height="48" />
                </div>
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0' }}>The Digital Handshake</h1>
                <p style={{ fontSize: '18px', color: '#64748b', marginTop: '8px' }}>
                    Establishing a secure, compliant foundation for our partnership with {companyName}.
                </p>
            </div>

            <div style={{ 
                border: '1px solid #e2e8f0', 
                backgroundColor: '#f8fafc', 
                borderRadius: '12px', 
                padding: '24px',
                marginBottom: '32px'
            }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 16px' }}>
                    <span style={{ color: '#228B22' }}>●</span> Why We Start with a Handshake
                </h2>
                <p style={{ color: '#475569', fontSize: '16px', lineHeight: '1.6' }}>
                    Before we dive into the commercial aspects of Logistics Flow, we believe in establishing trust. This "Digital Handshake" serves as our mutual commitment to data privacy and professional engagement standards.
                </p>
                
                <div style={{ marginTop: '24px', display: 'table', width: '100%' }}>
                    <div style={{ display: 'table-row' }}>
                        <div style={{ display: 'table-cell', width: '50%', paddingRight: '10px' }}>
                            <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', height: '120px' }}>
                                <strong style={{ fontSize: '14px', color: '#1e293b', display: 'block', marginBottom: '8px' }}>Privacy First (POPI)</strong>
                                <p style={{ fontSize: '12px', color: '#64748b', margin: '0' }}>We respect your privacy. You will be prompted to review and accept our formal POPI agreement, ensuring your data is handled with 100% compliance.</p>
                            </div>
                        </div>
                        <div style={{ display: 'table-cell', width: '50%', paddingLeft: '10px' }}>
                            <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', height: '120px' }}>
                                <strong style={{ fontSize: '14px', color: '#1e293b', display: 'block', marginBottom: '8px' }}>Qualified Intelligence</strong>
                                <p style={{ fontSize: '12px', color: '#64748b', margin: '0' }}>By establishing this handshake, you authorize our AI engine to begin identifying relevant cost-saving deals specifically for {companyName}.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* POPI TERMS SECTION - Included in email body for transparency */}
            <div style={{ 
                border: '1px solid #cbd5e1', 
                borderRadius: '8px', 
                padding: '20px', 
                backgroundColor: '#ffffff',
                marginBottom: '32px'
            }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                    POPI Disclosure Summary
                </h3>
                <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
                    <p style={{ marginBottom: '8px' }}><strong>1. Data Purpose:</strong> Information is collected solely to facilitate commerce, unlock capital, and negotiate group-based discounts with vetted suppliers.</p>
                    <p style={{ marginBottom: '8px' }}><strong>2. Third-Party Access:</strong> Your identifiable data is never sold. It is only shared with financiers or suppliers upon your explicit request for a quote.</p>
                    <p style={{ marginBottom: '0' }}><strong>3. Security:</strong> We utilize enterprise-grade encryption to ensure your business data is protected from unauthorized access.</p>
                </div>
            </div>

            <div style={{ textAlign: 'center', padding: '32px', backgroundColor: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
                <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Ready to establish the connection, {recipientName}?</p>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>Click the secure button below to confirm your interest and review our full standards.</p>
                
                {/* 
                    IMPORTANT: We use a standard <a> tag styled as a button here. 
                    React <Button> tags are stripped of links when pasted into Gmail/Outlook.
                */}
                <a 
                    href={optInLink}
                    style={{ 
                        backgroundColor: '#228B22', 
                        color: '#ffffff', 
                        padding: '16px 32px', 
                        borderRadius: '8px', 
                        textDecoration: 'none', 
                        fontWeight: 'bold', 
                        fontSize: '18px',
                        display: 'inline-block',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                >
                    Accept Handshake & View Full Terms
                </a>
            </div>

            <div style={{ marginTop: '32px', borderTop: '1px solid #e2e8f0', paddingTop: '16px', textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                    Logistics Flow is a verified digital ecosystem. All interactions are logged on a secure, encrypted ledger to protect the integrity of our members' networks and information.
                </p>
            </div>
        </div>
    );
}
