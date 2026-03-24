
import React from 'react';
import { useNavigate } from 'react-router-dom';

const TermsPrivacy = () => {
    const navigate = useNavigate();

    return (
        <div className="terms-page">
            <div className="terms-container">
                <div className="terms-header">
                    <h1>Terms of Service & Privacy Policy</h1>
                    <button className="back-button" onClick={() => navigate(-1)}>Back</button>
                </div>

                <div className="terms-content">
                    <section>
                        <h2>1. Terms of Service</h2>
                        <p>Last updated: February 2026</p>

                        <h3>1.1 Acceptance of Terms</h3>
                        <p>By accessing and using Akshuu Transports ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.</p>

                        <h3>1.2 Use of Service</h3>
                        <p>You agree to use this service only for lawful purposes. You are prohibited from violating or attempting to violate the security of the Service.</p>

                        <h3>1.3 Account Responsibilities</h3>
                        <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>
                    </section>

                    <section>
                        <h2>2. Privacy Policy</h2>
                        <p>Your privacy is important to us. This policy explains how we collect and use your information.</p>

                        <h3>2.1 Information Collection</h3>
                        <p>We collect information that you provide directly to us, such as when you create an account, update your profile, or use our location-based services.</p>

                        <h3>2.2 Use of Information</h3>
                        <p>We use the information we collect to operate, maintain, and provide the features of the Service, including real-time bus tracking and attendance monitoring.</p>

                        <h3>2.3 Data Security</h3>
                        <p>We implement appropriate technical and organizational measures to protect specific personal data against unauthorized or unlawful processing.</p>

                        <h3>2.4 Location Data</h3>
                        <p>Our app requires access to your location data to provide real-time tracking services. This data is only used when the app is active and for the purpose of transportation logistics.</p>
                    </section>

                    <section>
                        <h2>3. Contact Us</h2>
                        <p>If you have any questions about these Terms, please contact us at support@akshuutransports.com.</p>
                    </section>
                </div>
            </div>

            <style>{`
                .terms-page {
                    min-height: 100vh;
                    padding: 32px 20px 48px;
                    background:
                        radial-gradient(circle at top left, rgba(240, 181, 45, 0.22) 0%, transparent 28%),
                        radial-gradient(circle at top right, rgba(204, 139, 17, 0.14) 0%, transparent 24%),
                        radial-gradient(circle at bottom left, rgba(31, 42, 68, 0.08) 0%, transparent 34%),
                        linear-gradient(180deg, #f8f3ea 0%, #f5efe4 52%, #efe7da 100%);
                }
                .terms-container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 36px 28px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    color: #324154;
                    line-height: 1.6;
                    background: rgba(255, 255, 255, 0.94);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.45);
                    border-radius: 32px;
                    box-shadow: 0 24px 60px rgba(15, 23, 42, 0.26);
                }
                .terms-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid rgba(204, 139, 17, 0.18);
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .terms-header h1 {
                    font-size: 2rem;
                    color: #1f2a44;
                    margin: 0;
                    font-weight: 900;
                }
                .back-button {
                    background: linear-gradient(135deg, #cc8b11 0%, #f0b52d 100%);
                    color: #1f1a10;
                    border: none;
                    padding: 10px 18px;
                    border-radius: 14px;
                    cursor: pointer;
                    font-weight: 900;
                    box-shadow: 0 14px 30px rgba(204, 139, 17, 0.28);
                    transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
                }
                .back-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 18px 34px rgba(204, 139, 17, 0.34);
                    filter: brightness(1.02);
                }
                section {
                    margin-bottom: 40px;
                    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 248, 238, 0.94) 100%);
                    padding: 24px;
                    border-radius: 22px;
                    border: 1px solid rgba(204, 139, 17, 0.16);
                    box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
                }
                h2 {
                    color: #cc8b11;
                    border-bottom: 1px solid rgba(204, 139, 17, 0.18);
                    padding-bottom: 10px;
                    margin-top: 0;
                    font-size: 2rem;
                    font-weight: 900;
                }
                h3 {
                    color: #1f4f85;
                    margin-top: 20px;
                    font-size: 1.1rem;
                }
                p {
                    color: #5b6b82;
                    margin-bottom: 15px;
                }
                @media (max-width: 600px) {
                    .terms-page {
                        padding: 14px 10px 28px;
                    }
                    .terms-container {
                        padding: 20px 14px;
                        border-radius: 22px;
                    }
                    .terms-header {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 14px;
                        text-align: center;
                        padding-bottom: 16px;
                        margin-bottom: 20px;
                    }
                    .terms-header h1 {
                        font-size: 1.8rem;
                        line-height: 1.15;
                    }
                    .back-button {
                        width: 100%;
                        padding: 12px 16px;
                    }
                    .terms-content {
                        display: grid;
                        gap: 18px;
                    }
                    section {
                        margin-bottom: 0;
                        padding: 18px 14px;
                        border-radius: 18px;
                    }
                    h2 {
                        font-size: 1.75rem;
                        line-height: 1.15;
                        margin-bottom: 14px;
                    }
                    h3 {
                        font-size: 1rem;
                        line-height: 1.35;
                    }
                    p {
                        font-size: 0.98rem;
                        line-height: 1.75;
                    }
                }
            `}</style>
        </div>
    );
};

export default TermsPrivacy;
