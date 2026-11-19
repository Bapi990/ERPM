import React from 'react';
import { Sparkles, Calendar } from 'lucide-react';

export const DemoButton = ({
  text = "Book a Demo",
  variant = "primary", // 'primary' | 'navbar' | 'outline' | 'hero' | 'secondary'
  className = "",
  size = "md"
}) => {
  const handleClick = (e) => {
    e.preventDefault();
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = '#contact';
    }
  };

  const sizeStyles = {
    sm: "px-3.5 py-1.5 text-xs font-semibold rounded-lg",
    md: "px-5 py-2.5 text-sm font-bold rounded-xl",
    lg: "px-7 py-3.5 text-base font-extrabold rounded-2xl",
  }[size] || "px-5 py-2.5 text-sm font-bold rounded-xl";

  const variantStyles = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all",
    navbar: "bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-all hover:shadow-blue-500/25 active:scale-95",
    hero: "bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 hover:border-slate-300 font-extrabold px-6 py-3.5 rounded-2xl shadow-sm hover:shadow-md transition-all",
    outline: "border border-blue-600 text-blue-600 hover:bg-blue-50 font-bold transition-all",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-all"
  }[variant] || "bg-blue-600 text-white";

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center justify-center gap-2 cursor-pointer select-none ${sizeStyles} ${variantStyles} ${className}`}
    >
      <Calendar className={size === 'sm' ? "w-3.5 h-3.5" : "w-4 h-4 text-blue-400"} />
      <span>{text}</span>
    </button>
  );
};

export default DemoButton;
