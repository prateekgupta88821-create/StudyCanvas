import React, { useState } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { ProductPreview } from '@/components/landing/ProductPreview';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { PersonaBenefits } from '@/components/landing/PersonaBenefits';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';
import { AuthModal } from '@/components/auth/AuthModal';
import { useAuth } from '@/hooks/useAuth';

export interface LandingPageProps {
  onOpenCanvas: () => void;
  onOpenDashboard: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenCanvas,
  onOpenDashboard,
}) => {
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleGetStarted = () => {
    if (user) {
      onOpenDashboard();
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleOpenCanvas = () => {
    if (user) {
      onOpenCanvas();
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#090b0e] text-slate-100 flex flex-col selection:bg-lime-400 selection:text-slate-950">
      {/* Top Navigation */}
      <Navbar
        onSignIn={() => setIsAuthModalOpen(true)}
        onOpenCanvas={handleOpenCanvas}
      />

      {/* Hero Section */}
      <HeroSection
        onGetStarted={handleGetStarted}
        onOpenCanvas={handleOpenCanvas}
      />

      {/* Main Interactive Product Preview */}
      <ProductPreview
        onOpenCanvas={handleOpenCanvas}
      />

      {/* Core Educational Features */}
      <FeatureGrid />

      {/* How It Works (Three Simple Steps) */}
      <HowItWorksSection
        onOpenCanvas={handleOpenCanvas}
      />

      {/* Segmented Persona Benefits for Teachers, Professors, Students */}
      <PersonaBenefits
        onOpenCanvas={handleOpenCanvas}
        onSignIn={() => setIsAuthModalOpen(true)}
      />

      {/* Pre-footer Call-To-Action Banner */}
      <CTASection
        onGetStarted={handleGetStarted}
        onOpenCanvas={handleOpenCanvas}
      />

      {/* Polished Footer */}
      <Footer
        onOpenCanvas={handleOpenCanvas}
        onSignIn={() => setIsAuthModalOpen(true)}
      />

      {/* Google Sign-In & Role Selector Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={onOpenDashboard}
      />
    </div>
  );
};
