import React, { useState } from 'react';
import { CinematicHeader } from '../components/landing/CinematicHeader';
import { HeroSection } from '../components/landing/HeroSection';
import { TrustGapSection, DevQuickstartSection, ProgrammableEscrowsSection, EconomicUseCasesSection } from '../components/landing/CoreFeatures';
import { IdentityCeilingsSection, ZeroKnowledgeSection, SmartContractSection, NetworkVitalsSection } from '../components/landing/AdvancedFeatures';
import { SdkIntegrationSection, TokenEconomySection, DaoGovernanceSection, CrossChainSection, RoadmapSection, FooterSection } from '../components/landing/EcosystemFeatures';
import { ContactModal } from '../components/legacy-ui/ContactModal';
import { RegistryExplorer } from '../components/legacy-ui/RegistryExplorer';

export const LandingPage = () => {
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [contactType, setContactType] = useState<'investor' | 'developer'>('investor');
    const [isRegistryOpen, setIsRegistryOpen] = useState(false);

    return (
        <div style={{ background: 'var(--navy-deep)', color: 'white', minHeight: '100vh', overflowX: 'hidden' }}>
            <CinematicHeader 
                setIsContactOpen={setIsContactOpen} 
                setContactType={setContactType} 
            />
            
            <HeroSection 
                setIsRegistryOpen={setIsRegistryOpen}
                setContactType={setContactType}
                setIsContactOpen={setIsContactOpen}
            />

            <TrustGapSection />
            <DevQuickstartSection />
            <ProgrammableEscrowsSection />
            <IdentityCeilingsSection />
            <EconomicUseCasesSection />
            <ZeroKnowledgeSection />
            <SmartContractSection />
            <NetworkVitalsSection />
            <SdkIntegrationSection />
            <TokenEconomySection />
            <DaoGovernanceSection />
            <CrossChainSection />
            <RoadmapSection />

            <FooterSection 
                setIsContactOpen={setIsContactOpen} 
                setContactType={setContactType} 
            />

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
