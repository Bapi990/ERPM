import React from 'react';
import { LogIn, ArrowRight } from 'lucide-react';
import { APP_CONFIG } from '../config/appConfig';

/**
 * Reusable LoginButton Component
 *
 * Mandated Requirement: Opens the actual ERP login portal in a new tab
 * using the centralized APP_CONFIG.loginUrl configuration.
 * Never redirects to a non-existing or dummy internal route.
 */
export const LoginButton = ({
  text = "Login to ERP",
  variant = "primary", // 'primary' | 'secondary' | 'navbar' | 'outline' | 'white' | 'hero' | 'cta' | 'footer'
  className = "",
  showIcon = true,
  iconPosition = "left", // 'left' | 'right'
  role = null, // optional role intent: 'admin' | 'employee'
  size = "md", // 'sm' | 'md' | 'lg'
}) => {
  // Determine appropriate login URL from centralized config
  let targetUrl = APP_CONFIG.loginUrl;
  if (role === 'admin' && APP_CONFIG.adminLoginUrl) {
    targetUrl = APP_CONFIG.adminLoginUrl;
  } else if (role === 'employee' && APP_CONFIG.employeeLoginUrl) {
    targetUrl = APP_CONFIG.employeeLoginUrl;
  }

  // Base size classes
  const sizeStyles = {
    sm: "px-3.5 py-1.5 text-xs font-semibold rounded-lg",
    md: "px-5 py-2.5 text-sm font-bold rounded-xl",
    lg: "px-7 py-3.5 text-base font-extrabold rounded-2xl shadow-lg",
  }[size] || "px-5 py-2.5 text-sm font-bold rounded-xl";

  // Variant styling
  const variantStyles = {
    // Primary Royal Blue Button
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 active:scale-[0.98]",
    
    // Navbar specific styling
    navbar: "bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-md hover:shadow-blue-600/20 active:scale-95",
    
    // Hero action button
    hero: "bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all duration-200",
    
    // Large Final CTA button
    cta: "bg-white hover:bg-slate-100 text-blue-900 font-black px-8 py-4 rounded-2xl shadow-2xl hover:shadow-white/20 hover:-translate-y-0.5 transition-all duration-200 text-base tracking-wide",
    
    // Secondary Dark Navy
    secondary: "bg-slate-900 hover:bg-slate-800 text-white transition-all duration-200",
    
    // Subtle Outline
    outline: "border-2 border-slate-200 hover:border-blue-600 text-slate-700 hover:text-blue-600 bg-white transition-all duration-200",
    
    // White card action
    white: "bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 shadow-sm transition-all duration-200",
    
    // Minimal link style for footers
    footer: "text-slate-400 hover:text-white p-0 text-xs font-medium hover:underline inline-flex items-center",
  }[variant] || "bg-blue-600 hover:bg-blue-700 text-white";

  const isExternal = targetUrl.startsWith('http');

  return (
    <a
      href={targetUrl}
      target={isExternal ? "_blank" : "_self"}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={`inline-flex items-center justify-center gap-2 cursor-pointer select-none text-center ${sizeStyles} ${variantStyles} ${className}`}
      title={`Open ${APP_CONFIG.brandName} Portal`}
    >
      {showIcon && iconPosition === 'left' && (
        <LogIn className={size === 'sm' ? "w-3.5 h-3.5" : "w-4 h-4"} />
      )}
      <span>{text}</span>
      {showIcon && iconPosition === 'right' && (
        <ArrowRight className={size === 'sm' ? "w-3.5 h-3.5" : "w-4 h-4"} />
      )}
    </a>
  );
};

export default LoginButton;
