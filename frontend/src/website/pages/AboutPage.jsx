import React from 'react';
import { Navbar } from '../components/Navbar';
import { About } from '../sections/About';
import { WhyChooseUs } from '../sections/WhyChooseUs';
import { Security } from '../sections/Security';
import { FinalCTA } from '../sections/FinalCTA';
import { Footer } from '../components/Footer';

export const AboutPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-24">
        <About />
        <WhyChooseUs />
        <Security />
        <FinalCTA />
      </div>
      <Footer />
    </div>
  );
};

export default AboutPage;
