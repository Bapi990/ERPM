import React from 'react';

export const SectionHeading = ({
  badge = null,
  title,
  highlight = null,
  subtitle = null,
  align = "center", // 'left' | 'center' | 'right'
  dark = false,
  className = ""
}) => {
  const alignClass = {
    left: "text-left items-start",
    center: "text-center items-center mx-auto",
    right: "text-right items-end ml-auto"
  }[align] || "text-center items-center mx-auto";

  return (
    <div className={`flex flex-col max-w-3xl ${alignClass} ${className} mb-12 lg:mb-16`}>
      {badge && (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase mb-4 ${
          dark
            ? "bg-blue-900/50 text-blue-300 border border-blue-500/30"
            : "bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs"
        }`}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
          {badge}
        </span>
      )}

      <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] ${
        dark ? "text-white" : "text-slate-900"
      }`}>
        {title}{" "}
        {highlight && (
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {highlight}
          </span>
        )}
      </h2>

      {subtitle && (
        <p className={`mt-4 text-base sm:text-lg leading-relaxed ${
          dark ? "text-slate-300" : "text-slate-600"
        }`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionHeading;
