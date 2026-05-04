"use client";

import { LandingNavbar } from "@/components/landing/landing-navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { SocialProof } from "@/components/landing/social-proof";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Animated gradient mesh background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 opacity-40">
          <div className="absolute left-1/4 top-0 h-[600px] w-[600px] animate-pulse rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute right-1/4 top-1/3 h-[500px] w-[500px] animate-pulse rounded-full bg-accent/15 blur-[100px]" style={{ animationDelay: "1s" }} />
          <div className="absolute bottom-1/4 left-1/3 h-[400px] w-[400px] animate-pulse rounded-full bg-clinq-success/10 blur-[80px]" style={{ animationDelay: "2s" }} />
        </div>
        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <LandingNavbar />
      <main>
        <HeroSection />
        <SocialProof />
        <FeaturesSection />
        <TestimonialsSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
