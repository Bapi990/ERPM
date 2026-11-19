import React from 'react';
import heroShowcaseImg from '../../assets/hero_showcase.png';

/**
 * HeroProductStage - Executive Stage Showcase
 * On desktop (lg+): Acts as a dedicated clearance stage for the seamless
 * background artwork in new hero section photo.png, keeping the visual uncluttered.
 * On mobile/tablet (< lg): Renders the showcase graphic below the hero text for responsive fidelity.
 */
export const HeroProductStage = () => {
  return (
    <div className="relative w-full flex items-center justify-center lg:justify-end min-h-[260px] sm:min-h-[320px] lg:min-h-[420px] pointer-events-none">
      {/* Mobile-only artwork rendering so phone/tablet users get full illustration */}
      <div className="block lg:hidden w-full max-w-md mx-auto pt-4 pb-2">
        <img
          src={heroShowcaseImg}
          alt="Odias ERP Platform Architecture"
          className="w-full h-auto object-contain drop-shadow-xl"
          loading="eager"
        />
      </div>

      {/* Desktop spacer keeping right column open for background artwork */}
      <div className="hidden lg:block w-full h-full min-h-[380px] lg:min-h-[420px]" aria-hidden="true" />
    </div>
  );
};

export default HeroProductStage;

