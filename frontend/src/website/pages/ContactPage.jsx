import React from 'react';
import { Navbar } from '../components/Navbar';
import { Contact } from '../sections/Contact';
import { FAQ } from '../sections/FAQ';
import { Footer } from '../components/Footer';

export const ContactPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-24">
        <Contact />
        <FAQ />
      </div>
      <Footer />
    </div>
  );
};

export default ContactPage;
