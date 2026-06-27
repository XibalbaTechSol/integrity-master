import React, { useState } from 'react';
import { CinematicHeader } from '../components/landing/CinematicHeader';
import { HeroSection } from '../components/landing/HeroSection';
import { TrustGapSection, DevQuickstartSection, EconomicUseCasesSection, PrivacyArchitectureSection } from '../components/landing/CoreFeatures';
import { SdkIntegrationSection, FooterSection } from '../components/landing/EcosystemFeatures';
import { ContactModal } from '../components/legacy-ui/ContactModal';
import { RegistryExplorer } from '../components/legacy-ui/RegistryExplorer';

export const LandingPage = () => {
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [contactType, setContactType] = useState<'investor' | 'developer'>('investor');
    const [isRegistryOpen, setIsRegistryOpen] = useState(false);

    return (
        <div style={{ background: 'var(--navy-deep)', color: 'white', minHeight: '100vh', overflowX: 'hidden' }}>
            <CinematicHeader setIsContactOpen={setIsContactOpen} setContactType={setContactType} />
            <HeroSection setContactType={setContactType} setIsContactOpen={setIsContactOpen} setIsRegistryOpen={setIsRegistryOpen} />
            
            <TrustGapSection />
            <EconomicUseCasesSection />
            <PrivacyArchitectureSection />
            
            <div style={{ padding: '80px 0', background: 'var(--navy-deep)' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Start Building</h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)' }}>Integrate the Integrity Protocol into your stack.</p>
                </div>
                <DevQuickstartSection setContactType={setContactType} setIsContactOpen={setIsContactOpen} />
                <SdkIntegrationSection />
            </div>

            <FooterSection setIsContactOpen={setIsContactOpen} setContactType={setContactType} />
            
            {/* Modals */}
            <ContactModal 
                isOpen={isContactOpen} 
                onClose={() => setIsContactOpen(false)} 
                initialType={contactType} 
            />
            
            <RegistryExplorer 
                isOpen={isRegistryOpen} 
                onClose={() => setIsRegistryOpen(false)} 
            />
        </div>
    );
};
