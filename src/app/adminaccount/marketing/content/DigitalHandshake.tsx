
'use client';

import React from "react";

/**
 * Digital Handshake Content
 * Optimized for Email Copy-Paste. Uses absolute URLs and strict inline CSS for cross-client compatibility.
 */
export default function DigitalHandshake({ partner }: { partner?: any }) {
    const recipientName = partner?.firstName || 'Partner';
    const companyName = partner?.companyName || 'your business';
    
    const baseUrl = 'https://studio--ecosystem-hub.us-central1.hosted.app';
    const optInLink = `${baseUrl}/opt-in/${partner?.id || 'PROSPECT'}`;

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', color: '#1e293b', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ 
                    backgroundColor: '#f0fdf4', 
                    padding: '24px', 
                    borderRadius: '50%', 
                    width: '64px', 
                    height: '64px', 
                    margin: '0 auto 16px',
                    lineHeight: '64px'
                }}>
                    <span style={{ fontSize: '32px' }}>🤝</span>
                </div>
                <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px' }}>The Digital Handshake</h1>
                <p style={{ fontSize: '16px', color: '#64748b', margin: '0' }}>
                    Establishing a compliant foundation with {companyName}.
                </p>
            </div>

            <div style={{ 
                border: '1px solid #e2e8f0', 
                backgroundColor: '#f8fafc', 
                borderRadius: '12px', 
                padding: '24px',
                marginBottom: '32px'
            }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 12px' }}>Establishing Trust & Consent</h2>
                <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.6', margin: '0 0 20px' }}>
                    Before we move into commercial discussions, we believe in establishing a formal "Digital Handshake." This ensures our partnership is built on data integrity and full compliance with the POPI Act.
                </p>
                
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>Why establish the handshake?</p>
                    <ul style={{ paddingLeft: '20px', margin: '0', fontSize: '13px', color: '#64748b', lineHeight: '1.8' }}>
                        <li><strong>Verified Identity:</strong> Confirms your standing in the Logistics Flow ecosystem.</li>
                        <li><strong>Legal Compliance:</strong> Securely records your POPI and marketing preferences.</li>
                        <li><strong>Market Intelligence:</strong> Authorizes our AI to identify relevant cost-saving opportunities for you.</li>
                    </ul>
                </div>
            </div>

            {/* POPI PREVIEW - Essential for transparency inside the email */}
            <div style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '32px' }}>
                <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    Compliance Standards Preview
                </p>
                <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
                    <p style={{ marginBottom: '8px' }}>• <strong>Data Security:</strong> We utilize enterprise-grade encryption to protect business data.</p>
                    <p style={{ marginBottom: '8px' }}>• <strong>No Selling:</strong> Your contact data is never sold. It is only used to facilitate matched commerce.</p>
                    <p style={{ marginBottom: '0' }}>• <strong>Explicit Opt-In:</strong> You maintain full control over which communications you receive.</p>
                </div>
            </div>

            <div style={{ textAlign: 'center', padding: '32px', backgroundColor: '#f1f5f9', borderRadius: '12px' }}>
                <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginBottom: '24px' }}>Ready to establish the connection, {recipientName}?</p>
                
                {/* STANDARDIZED HTML BUTTON */}
                <table role="presentation" border={0} cellPadding="0" cellSpacing="0" style={{ margin: '0 auto' }}>
                    <tr>
                        <td align="center" style={{ backgroundColor: '#228B22', borderRadius: '8px' }}>
                            <a 
                                href={optInLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ 
                                    backgroundColor: '#228B22', 
                                    color: '#ffffff', 
                                    padding: '16px 40px', 
                                    borderRadius: '8px', 
                                    textDecoration: 'none', 
                                    fontWeight: 'bold', 
                                    fontSize: '18px',
                                    display: 'inline-block',
                                    border: '1px solid #228B22'
                                }}
                            >
                                Accept Handshake & Review Terms
                            </a>
                        </td>
                    </tr>
                </table>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '24px' }}>
                    A secure record of your acceptance will be logged on our platform ledger.
                </p>
            </div>

            <div style={{ marginTop: '32px', borderTop: '1px solid #f1f5f9', paddingTop: '16px', textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                    Logistics Flow is a secure digital branch for the transport industry. All data processing is strictly handled in accordance with South African privacy laws.
                </p>
            </div>
        </div>
    );
}
