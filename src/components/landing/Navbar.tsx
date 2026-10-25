import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Menu, X, ArrowRight } from 'lucide-react';

export interface NavbarProps {
  onSignIn: () => void;
  onOpenCanvas: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSignIn, onOpenCanvas }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'For Educators', href: '#educators' },
    { label: 'For Students', href: '#students' },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#090b0e]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <a 
          href="#" 
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 rounded-lg p-1"
        >
          <img 
            src="/logo.svg" 
            alt="StudyCanvas" 
            className="h-8 w-8 transition-transform group-hover:scale-105" 
          />
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold tracking-tight text-white font-heading">
              StudyCanvas
            </span>
            <span className="rounded-full bg-lime-400/10 border border-lime-400/25 px-1.5 py-0.2 text-[10px] font-semibold text-lime-400">
              EDU
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.href)}
              className="text-sm font-medium text-slate-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 rounded-md px-1 py-0.5"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignIn}
            className="text-slate-300 hover:text-white hover:bg-slate-800/80 text-xs font-medium"
          >
            Sign In
          </Button>

          <Button
            variant="lime"
            size="sm"
            onClick={onOpenCanvas}
            className="text-xs gap-1.5"
          >
            <span>Open Canvas</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(prev => !prev)}
          className="md:hidden rounded-lg p-2 text-slate-400 hover:bg-slate-850 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#0d1014] px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-850 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMobileMenuOpen(false);
                onSignIn();
              }}
              className="w-full text-xs"
            >
              Sign In
            </Button>
            <Button
              variant="lime"
              size="sm"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCanvas();
              }}
              className="w-full text-xs font-semibold"
            >
              Open Interactive Canvas
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
