import React from 'react';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { HowItWorks } from './components/HowItWorks';
import { Stats } from './components/Stats';
import { Testimonials } from './components/Testimonials';
import { CTA } from './components/CTA';
import { FeaturedJobs } from './components/FeaturedJobs';
import { FeaturedWorkers } from './components/FeaturedWorkers';
import { AboutSection } from './components/AboutSection';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Welcome & CTAs */}
      <Hero />
      
      {/* Platform Statistics */}
      <Stats />
      
      {/* Key Features */}
      <Features />
      
      {/* Featured Job Opportunities */}
      <FeaturedJobs />
      
      {/* How It Works Guide */}
      <HowItWorks />
      
      {/* Featured Skilled Workers */}
      <FeaturedWorkers />
      
      {/* User Testimonials */}
      <Testimonials />
      
      {/* About WorkForge */}
      <AboutSection />
      
      {/* Final Call to Action */}
      <CTA />
    </div>
  );
};

export default Home;
