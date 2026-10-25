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
import { useAuth } from '@/contexts/AuthContext';

export interface LandingPageProps {
  onOpenCanvas: () => void;
  onOpenDashboard: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenCanvas,
  onOpenDashboard,
}) => {
  const { user, signInWithGoogle } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleContinueWithGoogle = async () => {
    if (user && user.uid !== 'educator-demo-user') {
      onOpenDashboard();
      return;
    }
    try {
      await signInWithGoogle();
      onOpenDashboard();
    } catch {
      // If error or cancelled, show AuthModal with role selector and status
      setIsAuthModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#090b0e] text-slate-100 flex flex-col selection:bg-lime-400 selection:text-slate-950">
      {/* Top Navigation */}
      <Navbar
        onSignIn={() => setIsAuthModalOpen(true)}
        onOpenCanvas={onOpenCanvas}
      />

      {/* Hero Section */}
      <HeroSection
        onContinueWithGoogle={handleContinueWithGoogle}
        onOpenCanvas={onOpenCanvas}
      />

      {/* Main Interactive Product Preview */}
      <ProductPreview
        onOpenCanvas={onOpenCanvas}
      />

      {/* Core Educational Features */}
      <FeatureGrid />

      {/* How It Works (Three Simple Steps) */}
      <HowItWorksSection
        onOpenCanvas={onOpenCanvas}
      />

      {/* Segmented Persona Benefits for Teachers, Professors, Students */}
      <PersonaBenefits
        onOpenCanvas={onOpenCanvas}
        onSignIn={() => setIsAuthModalOpen(true)}
      />

      {/* Pre-footer Call-To-Action Banner */}
      <CTASection
        onContinueWithGoogle={handleContinueWithGoogle}
        onOpenCanvas={onOpenCanvas}
      />

      {/* Polished Footer */}
      <Footer
        onOpenCanvas={onOpenCanvas}
        onSignIn={() => setIsAuthModalOpen(true)}
      />

      {/* Google Sign-In & Role Selector Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};
