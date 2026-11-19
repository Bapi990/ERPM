import React from 'react';
import * as Icons from 'lucide-react';

export const FeatureCard = ({
  title,
  description,
  icon = "Sparkles",
  badge = null,
  category = null,
  className = ""
}) => {
  // Dynamically resolve Lucide icon with fallback
  const IconComponent = Icons[icon] || Icons.Sparkles;

  return (
    <div className={`group relative bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between ${className}`}>
      {/* Subtle top accent gradient line on hover */}
      <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />

      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-xs">
            <IconComponent className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
          </div>

          {badge && (
            <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
              {badge}
            </span>
          )}
        </div>

        {category && (
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
            {category}
          </span>
        )}

        <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors mb-2 leading-snug">
          {title}
        </h3>

        <p className="text-sm text-slate-600 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <span>Learn workflow</span>
        <Icons.ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
      </div>
    </div>
  );
};

export default FeatureCard;
