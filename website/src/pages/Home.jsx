import React, { useEffect } from 'react';
import Lenis from 'lenis';
import { ScrollProgress } from '../components/ScrollProgress';
import { Navbar } from '../components/Navbar';
import { Hero } from '../sections/Hero';
import { About } from '../sections/About';
import { HRMS } from '../sections/HRMS';
import { CRM } from '../sections/CRM';
import { Billing } from '../sections/Billing';
import { Integration } from '../sections/Integration';
import { ProductDemo } from '../sections/ProductDemo';
import { Roles } from '../sections/Roles';
import { Features } from '../sections/Features';
import { Industries } from '../sections/Industries';
import { Analytics } from '../sections/Analytics';
import { Security } from '../sections/Security';
import { WhyChooseUs } from '../sections/WhyChooseUs';
import { Testimonials } from '../sections/Testimonials';
import { FAQ } from '../sections/FAQ';
import { Contact } from '../sections/Contact';
import { FinalCTA } from '../sections/FinalCTA';
import { Footer } from '../components/Footer';

export const Home = () => {
  // Initialize Lenis Smooth Scroll per prompt animation requirement
  useEffect(() => {
    // Respect user's prefers-reduced-motion setting
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let lenis;
    let rafId;
    try {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
      });

      function raf(time) {
        lenis?.raf(time);
        rafId = requestAnimationFrame(raf);
      }

      rafId = requestAnimationFrame(raf);
    } catch (e) {
      console.warn("Lenis initialization skipped", e);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      lenis?.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-600 selection:text-white">
      <ScrollProgress />
      <Navbar />

      <main>
        <Hero />
        <About />
        <HRMS />
        <CRM />
        <Billing />
        <Integration />
        <ProductDemo />
        <Roles />
        <Features />
        <Industries />
        <Analytics />
        <Security />
        <WhyChooseUs />
        <Testimonials />
        <FAQ />
        <Contact />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  );
};

export default Home;
