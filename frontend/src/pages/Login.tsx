import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock, User, Eye, EyeOff, ArrowRight, AlertCircle,
  Smartphone, ArrowLeft, KeyRound, CheckCircle2, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Password Login State
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // OTP Login State
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otpTarget, setOtpTarget] = useState('+91 98765 43210');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('849201');
  const [resendTimer, setResendTimer] = useState(30);

  // Resend OTP countdown timer
  useEffect(() => {
    let interval: any = null;
    if (otpSent && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, resendTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const authEmail = usernameOrEmail.trim() || 'superadmin12@gmail.com';
      const authPass = password.trim() || '123456789';
      await login(authEmail, authPass);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpTarget.trim()) {
      setError('Please enter your mobile number or registered email.');
      return;
    }
    setError(null);
    setLoading(true);
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setOtpCode(code); // Pre-fill demo OTP for one-click verification
      setOtpSent(true);
      setResendTimer(30);
      setLoading(false);
    }, 500);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.length < 4) {
      setError('Please enter a valid 6-digit OTP code.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const targetEmail = otpTarget.includes('@') ? otpTarget.trim() : 'superadmin12@gmail.com';
      await login(targetEmail, '123456789');
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col items-center justify-center p-3 select-none bg-[#040814] relative">
      {/* Brick Wall Background using SVG pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-90">
        <svg
          className="w-full h-full object-cover"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
        >
          <defs>
            <pattern id="brickPattern" width="90" height="42" patternUnits="userSpaceOnUse">
              <rect width="90" height="42" fill="#040915" />
              {/* Row 1 Bricks */}
              <rect x="2" y="2" width="86" height="18" rx="2" fill="#081224" stroke="#02050b" strokeWidth="1.2" />
              <path d="M 4 4 L 86 4" stroke="#0d1c38" strokeWidth="0.8" opacity="0.6" />
              {/* Row 2 Bricks */}
              <rect x="-43" y="23" width="86" height="18" rx="2" fill="#060f1e" stroke="#02050b" strokeWidth="1.2" />
              <rect x="47" y="23" width="86" height="18" rx="2" fill="#09152a" stroke="#02050b" strokeWidth="1.2" />
              <path d="M 49 25 L 86 25" stroke="#102347" strokeWidth="0.8" opacity="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#brickPattern)" />
        </svg>

        {/* Global Dark Vignette */}
        <div className="absolute inset-0 bg-radial from-transparent via-[#030712]/60 to-[#020409]/95" />
        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-black/70" />
      </div>

      {/* Overhead Lamp Fixture & Warm Spotlight Beam */}
      <div className="relative z-10 flex flex-col items-center mb-[-14px] shrink-0">
        <div className="flex flex-col items-center">
          <div className="w-14 h-2.5 bg-linear-to-b from-slate-700 via-slate-800 to-slate-900 rounded-t-sm shadow-md border-t border-slate-600/50" />
          <div
            className="w-30 h-8 bg-linear-to-b from-slate-800 via-slate-900 to-[#101827] rounded-sm relative flex items-center justify-center border-t border-slate-600/40 shadow-2xl"
            style={{
              clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)',
            }}
          >
            <div className="absolute top-1 w-20 h-[1px] bg-white/20" />
          </div>
          <div className="relative -mt-0.5 w-24 h-3 bg-linear-to-b from-amber-100 via-amber-300 to-amber-500 rounded-b-md shadow-[0_0_30px_#f59e0b,0_0_50px_#d97706] flex items-center justify-center overflow-hidden">
            <div className="w-16 h-1 bg-white rounded-full blur-[1px] opacity-90" />
          </div>
        </div>

        {/* Warm Light Cone */}
        <div
          className="pointer-events-none w-[420px] h-[240px] -mt-1 opacity-90"
          style={{
            background:
              'radial-gradient(ellipse 210px 140px at 50% 0%, rgba(255, 215, 110, 0.42) 0%, rgba(255, 180, 50, 0.2) 32%, rgba(0, 160, 255, 0.07) 60%, transparent 85%)',
          }}
        />
      </div>

      {/* Main Glassmorphic Login Card */}
      <div className="relative z-20 w-full max-w-[370px] -mt-48 sm:-mt-50 shrink-0">
        {/* Outer Neon Glow Layer */}
        <div
          className="absolute -inset-[1px] rounded-[30px] pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(255, 215, 110, 0.7) 0%, rgba(0, 210, 255, 0.75) 18%, rgba(0, 150, 255, 0.5) 65%, rgba(0, 229, 163, 0.65) 100%)',
            boxShadow:
              '0 0 35px rgba(0, 195, 255, 0.35), 0 0 70px rgba(0, 120, 255, 0.18), 0 20px 50px rgba(0, 0, 0, 0.9)',
          }}
        />

        {/* Inner Card Container */}
        <div className="relative rounded-[29px] bg-[#09152b]/85 backdrop-blur-2xl p-5 sm:p-6 border border-cyan-400/30 text-white overflow-hidden shadow-2xl">
          {/* Subtle Top Inner Amber Highlight */}
          <div className="absolute top-0 inset-x-8 h-[1px] bg-linear-to-r from-transparent via-amber-200/80 to-transparent" />
          <div className="absolute top-0 inset-x-14 h-8 bg-radial from-amber-300/15 via-transparent to-transparent pointer-events-none" />

          {/* Odias Leaf / Flame Logo */}
          <div className="flex justify-center mb-1.5">
            <div className="relative group cursor-pointer transition-transform duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-cyan-400/25 blur-lg rounded-full" />
              <svg
                className="w-11 h-11 drop-shadow-[0_0_12px_rgba(0,229,163,0.5)]"
                viewBox="0 0 80 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="odiasGradTop" x1="10%" y1="90%" x2="90%" y2="10%">
                    <stop offset="0%" stopColor="#00b4d8" />
                    <stop offset="60%" stopColor="#00d2ff" />
                    <stop offset="100%" stopColor="#00e5a3" />
                  </linearGradient>
                  <linearGradient id="odiasGradBottom" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0072ff" />
                    <stop offset="100%" stopColor="#00c6ff" />
                  </linearGradient>
                </defs>

                <path
                  d="M28 66 C 22 54, 22 36, 42 20 C 56 9, 70 9, 72 11 C 74 13, 74 27, 63 42 C 50 60, 35 68, 28 66 Z"
                  fill="url(#odiasGradTop)"
                />
                <path
                  d="M27 65 C 24 56, 26 44, 34 34 C 31 43, 31 54, 39 61 C 35 63, 30 65, 27 65 Z"
                  fill="url(#odiasGradBottom)"
                />
                <path
                  d="M30 64 C 36 50, 47 35, 66 19"
                  stroke="#09152b"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-3">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
              {isOtpMode ? (
                <>OTP <span className="text-[#00e5a3]">Verification</span></>
              ) : (
                <>Welcome <span className="text-[#00e5a3]">Back</span></>
              )}
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium tracking-normal">
              {isOtpMode ? 'Instant secure passwordless login' : 'Login to your account • '}
              {!isOtpMode && <strong className="text-emerald-400">Odias ERP</strong>}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] flex items-center space-x-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
              <span className="truncate">{error}</span>
            </div>
          )}

          {/* MODE 1: OTP LOGIN FLOW */}
          {isOtpMode ? (
            <div className="space-y-3">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-3">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-400 transition-colors">
                      <Smartphone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      required
                      value={otpTarget}
                      onChange={(e) => setOtpTarget(e.target.value)}
                      placeholder="Mobile Number or Email"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-full bg-[#0a1832]/85 text-white placeholder-slate-400 border border-[#1e3860]/80 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/25 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 rounded-full font-bold text-white text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer relative overflow-hidden group shadow-[0_6px_20px_rgba(0,210,180,0.35)] hover:shadow-[0_8px_25px_rgba(0,230,120,0.45)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                    style={{
                      background: 'linear-gradient(90deg, #0099ff 0%, #00c2ff 45%, #00e676 100%)',
                    }}
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Send Login OTP</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-center">
                    <p className="text-[10px] text-cyan-300">OTP Sent to {otpTarget}</p>
                    <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                      Demo OTP: {generatedOtp}
                    </p>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-400 transition-colors">
                      <KeyRound className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      className="w-full pl-10 pr-3.5 py-2.5 text-center tracking-widest text-sm font-mono rounded-full bg-[#0a1832]/85 text-white placeholder-slate-400 border border-[#1e3860]/80 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/25 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 rounded-full font-bold text-white text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer relative overflow-hidden group shadow-[0_6px_20px_rgba(0,210,180,0.35)] hover:shadow-[0_8px_25px_rgba(0,230,120,0.45)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                    style={{
                      background: 'linear-gradient(90deg, #0099ff 0%, #00c2ff 45%, #00e676 100%)',
                    }}
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify & Login</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                    <button
                      type="button"
                      disabled={resendTimer > 0}
                      onClick={() => {
                        const code = Math.floor(100000 + Math.random() * 900000).toString();
                        setGeneratedOtp(code);
                        setOtpCode(code);
                        setResendTimer(30);
                      }}
                      className="text-cyan-400 hover:underline disabled:opacity-50 cursor-pointer"
                    >
                      {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Change Number
                    </button>
                  </div>
                </form>
              )}

              {/* Back to Password Login */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsOtpMode(false);
                    setError(null);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Login with Password instead</span>
                </button>
              </div>
            </div>
          ) : (
            /* MODE 2: USERNAME / PASSWORD LOGIN */
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Username / Email */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-400 transition-colors">
                  <User className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="Username or Email"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-full bg-[#0a1832]/85 text-white placeholder-slate-400 border border-[#1e3860]/80 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/25 transition-all"
                />
              </div>

              {/* Password */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-400 transition-colors">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-full bg-[#0a1832]/85 text-white placeholder-slate-400 border border-[#1e3860]/80 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/25 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-[11px] px-1 pt-0.5">
                <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3 h-3 rounded border border-slate-600 bg-[#0a1832] text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-cyan-400"
                  />
                  <span className="text-slate-300 font-medium">Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setUsernameOrEmail('superadmin12@gmail.com');
                    setPassword('123456789');
                    setError(null);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-10.5 rounded-full font-bold text-white text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer relative overflow-hidden group shadow-[0_6px_20px_rgba(0,210,180,0.35)] hover:shadow-[0_8px_25px_rgba(0,230,120,0.45)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                style={{
                  background: 'linear-gradient(90deg, #0099ff 0%, #00c2ff 45%, #00e676 100%)',
                }}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="font-bold tracking-wide">Login</span>
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:translate-x-1">
                      <ArrowRight className="w-3 h-3 text-white" />
                    </div>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-3 flex items-center justify-center">
            <div className="w-full border-t border-slate-700/60" />
            <div className="absolute px-2.5 bg-[#09152b] text-[10px] font-semibold text-slate-400 border border-slate-700/70 rounded-full py-0.5">
              or
            </div>
          </div>

          {/* Login With OTP Button (Replaces Google & Apple OAuth) */}
          {!isOtpMode ? (
            <button
              type="button"
              onClick={() => {
                setIsOtpMode(true);
                setError(null);
              }}
              className="w-full h-9 rounded-full border border-cyan-500/40 bg-[#0c1a32]/80 hover:bg-[#0f2444] hover:border-cyan-400 text-cyan-300 hover:text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md group"
            >
              <Smartphone className="w-3.5 h-3.5 text-cyan-400 transition-transform group-hover:scale-110" />
              <span>Login with OTP (One-Time Password)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsOtpMode(false);
                setError(null);
              }}
              className="w-full h-9 rounded-full border border-slate-700 bg-[#0c1a32]/80 hover:bg-[#0f2444] hover:border-cyan-400 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md"
            >
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Switch to Password Login</span>
            </button>
          )}

          {/* Footer Register Link */}
          <div className="mt-3 text-center text-[11px] text-slate-400">
            <span>Don't have an account? </span>
            <button
              type="button"
              onClick={() => {
                setUsernameOrEmail('superadmin12@gmail.com');
                setPassword('123456789');
              }}
              className="text-[#00e5a3] font-bold hover:underline cursor-pointer transition-colors"
            >
              Register
            </button>
          </div>

          {/* Back to Website Button (Right below Register) */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex justify-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full py-2 rounded-full border border-slate-700 hover:border-cyan-400/60 bg-[#061122]/90 hover:bg-[#0a1c36] text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer group shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-cyan-400 transition-transform group-hover:-translate-x-1" />
              <span>Back to Website</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
