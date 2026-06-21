import React, { useState } from 'react';
import { HeroSection } from '../components/landing/HeroSection';
import { ContactModal } from '../components/legacy-ui/ContactModal';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider, githubProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

export const LandingPage = () => {
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [contactType, setContactType] = useState<'investor' | 'developer'>('investor');
    const navigate = useNavigate();

    const handleLogin = async (provider: 'google' | 'github') => {
        try {
            const authProvider = provider === 'google' ? googleProvider : githubProvider;
            const result = await signInWithPopup(auth, authProvider);
            
            // Give 100,000 ITK by mocking an address and balance in localStorage
            if (result.user) {
                const mockEthAddress = '0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');
                localStorage.setItem('integrity_wallet_connected', mockEthAddress);
                localStorage.setItem('integrity_mock_balance', '100000');
                navigate('/dashboard');
            }
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    return (
        <div style={{ background: 'var(--navy-deep)', color: 'white', minHeight: '100vh', overflowX: 'hidden' }}>
            <HeroSection 
                onLogin={handleLogin}
            />

            <section className="container" style={{ padding: '80px 20px', maxWidth: '800px', margin: '0 auto', lineHeight: '1.8', fontSize: '1.1rem', color: 'rgba(255,255,255,0.85)' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '24px', fontFamily: 'Playfair Display, serif', color: 'var(--gold)', textAlign: 'center' }}>
                    The Architectural Layer for the Agentic Economy
                </h2>
                <p style={{ marginBottom: '24px' }}>
                    We are entering a new era where autonomous agents will conduct business, negotiate deals, and execute high-stakes smart contracts on our behalf. But how do we trust these digital entities? 
                </p>
                <p style={{ marginBottom: '24px' }}>
                    Integrity Protocol is the foundational trust layer that makes the agentic economy possible. We provide the essential infrastructure for developers to build accountable AI, and for investors to securely participate in a world driven by autonomous value creation.
                </p>
                <p>
                    By anchoring agent reputations and actions on the blockchain, we eliminate the black boxes. We turn uncertain AI interactions into cryptographically verifiable, commercially accountable transactions. Join us in building the mathematical rails for a resilient, autonomous digital future.
                </p>
            </section>

            <footer style={{ padding: '40px 20px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '60px' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                    &copy; {new Date().getFullYear()} Xibalba Solutions LLC. — Sovereign Intelligence Foundries.
                </p>
            </footer>

            <ContactModal 
                isOpen={isContactOpen} 
                onClose={() => setIsContactOpen(false)} 
            />
        </div>
    );
};
