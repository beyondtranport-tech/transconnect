
'use client';

import React from "react";

/**
 * Digital Handshake Content
 * Optimized for high deliverability and professional impact.
 */
export default function DigitalHandshake({ partner }: { partner?: any }) {
    const recipientName = partner?.firstName || 'Partner';
    const companyName = partner?.companyName || 'your business';
    
    const baseUrl = 'https://studio--ecosystem-hub.us-central1.hosted.app';
    const optInLink = `${baseUrl}/opt-in/${partner?.id || 'PROSPECT'}`;

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', color: '#1e293b', maxWidth: '600px', margin: '0 auto' }}>
            {/* Main Icon and Header */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ 
                    backgroundColor: '#f0fdf4', 
                    padding: '20px', 
                    borderRadius: '40px', 
                    width: '40px', 
                    height: '40px', 
                    margin: '0 auto 16px',
                    textAlign: 'center'
                }}>
                    <span style={{ fontSize: '32px', lineHeight: '40px' }}>🤝</span>
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px' }}>The Digital Handshake</h1>
                <p style={{ fontSize: '16px', color: '#64748b', margin: '0' }}>
                    Establishing a compliant foundation with {companyName}.
                </p>
            </div>

            {/* Strategic Intro Paragraph */}
            <div style={{ marginBottom: '24px', padding: '0 8px' }}>
                <p style={{ fontSize: '15px', color: '#334155', lineHeight: '1.7', margin: '0' }}>
                    Dear {recipientName}, for too long, the transport industry has been held back by fragmentation, high operating costs, and limited access to capital. <strong>Logistics Flow</strong> exists to break these constraints. We have built a unified digital ecosystem that combines collective buying power with AI-driven efficiency to help you move more with less.
                </p>
                <p style={{ fontSize: '15px', color: '#334155', lineHeight: '1.7', marginTop: '12px' }}>
                    Before we move into commercial discussions or matching you with our network of vetted suppliers and financiers, we require a formal <strong>Digital Handshake</strong>. This ensures our partnership is built on data integrity and full compliance with the POPI Act.
                </p>
            </div>

            {/* Context Box */}
            <div style={{ 
                border: '1px solid #e2e8f0', 
                backgroundColor: '#f8fafc', 
                borderRadius: '12px', 
                padding: '24px',
                marginBottom: '32px'
            }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 12px' }}>Why establish this connection?</h2>
                <div style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.8' }}>
                    <p style={{ margin: '4px 0' }}>• <strong>Verified Identity:</strong> Establish your standing within our community.</p>
                    <p style={{ margin: '4px 0' }}>• <strong>Data Security:</strong> Ensure your business data is handled with POPI-compliant care.</p>
                    <p style={{ margin: '4px 0' }}>• <strong>Intelligence Access:</strong> Authorize our AI to find cost-saving load and finance matches for {companyName}.</p>
                </div>
            </div>

            {/* CTA Section - Table based for best email rendering */}
            <div style={{ textAlign: 'center', padding: '32px', backgroundColor: '#f1f5f9', borderRadius: '12px' }}>
                <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginBottom: '24px' }}>Ready to unlock the ecosystem, {recipientName}?</p>
                
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
                    Establishing this handshake secures your place in our <strong>Priority Communication Pipeline</strong>, providing a transparent audit trail of all matched opportunities and group benefits.
                </p>
            </div>

            <div style={{ marginTop: '40px', borderTop: '1px solid #f1f5f9', paddingTop: '16px', textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: '#cbd5e1', fontStyle: 'italic' }}>
                    Logistics Flow is a secure digital branch for the transport industry. All data processing is strictly handled in accordance with the Protection of Personal Information Act.
                </p>
            </div>
        </div>
    );
}
