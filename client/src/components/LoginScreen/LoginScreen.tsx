import React, { useState, useEffect } from 'react';
import {
  Activity,
  ArrowDownRight,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Fingerprint,
  Globe,
  KeyRound,
  Lock,
  MapPin,
  Network,
  Phone,
  ShieldAlert,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../../services/api';
import './LoginScreen.css';

const DEMO_ONLY_NOTE = 'Synthetic data only. This system is a decision-support prototype and does not trigger real enforcement actions.';

const showcaseSlides = [
  {
    eyebrow: '01 / FIELD INTELLIGENCE',
    title: 'See the bigger picture.',
    description: 'Bring related incident patterns and location context into one focused view for human review.',
    detail: 'Connected case context',
    icon: MapPin,
    color: 'coral',
  },
  {
    eyebrow: '02 / ANALYTICS',
    title: 'Turn signals into insight.',
    description: 'Explore trends and analytical summaries designed to support careful, evidence-led decisions.',
    detail: 'Explainable data views',
    icon: BarChart3,
    color: 'violet',
  },
  {
    eyebrow: '03 / EVIDENCE REVIEW',
    title: 'Follow every connection.',
    description: 'Review timelines and relationship maps while keeping the source trail close at hand.',
    detail: 'Traceable review tools',
    icon: Network,
    color: 'teal',
  },
  {
    eyebrow: '04 / RESPONSIBLE ACCESS',
    title: 'Built around accountability.',
    description: 'Role-based workspaces keep teams focused, with security and human oversight at every step.',
    detail: 'People remain in control',
    icon: Fingerprint,
    color: 'gold',
  },
];

interface LoginScreenProps {
  onLoginSuccess: (userId: string, role: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [badgeId, setBadgeId] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // MFA OTP timer state
  const [countdown, setCountdown] = useState(30);
  const [activeSlide, setActiveSlide] = useState(0);
  const canResend = countdown === 0;

  useEffect(() => {
    if (step !== 'otp' || countdown === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCountdown((previous) => Math.max(0, previous - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [step, countdown]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanBadge = badgeId.toUpperCase().trim();
    if (!cleanBadge) {
      setError('Badge ID is required.');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    // Strict check for demonstration or allow format pattern
    const badgeRegex = /^[A-Z]{3}-\d{4}$/;
    if (!badgeRegex.test(cleanBadge)) {
      setError('Invalid Badge ID format. Expected format: AAA-0000 (e.g. INV-1001).');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.login(cleanBadge, password);
      if (res.success && res.token) {
        localStorage.setItem('ksp_jwt_token', res.token);
        localStorage.setItem('ksp_temp_user_id', res.user.userId);
        localStorage.setItem('ksp_temp_user_role', res.user.role);
        setStep('otp');
        setCountdown(30);
      } else {
        setError(res.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6 || !/^\d+$/.test(cleanOtp)) {
      setError('Security violation: Multi-factor token must be a 6-digit numeric code.');
      return;
    }

    // Complete login using stored temporary session. Trust only the server-issued session data,
    // and reject unknown roles before allowing access to protected UI.
    const tempUserId = localStorage.getItem('ksp_temp_user_id');
    const tempUserRole = localStorage.getItem('ksp_temp_user_role');

    if (!tempUserId || !tempUserRole) {
      setError('Authentication session expired. Please log in again.');
      setStep('credentials');
      return;
    }

    const allowedRoles = ['Investigator', 'Analyst', 'Supervisor', 'Policymaker'];
    if (!allowedRoles.includes(tempUserRole)) {
      localStorage.removeItem('ksp_temp_user_id');
      localStorage.removeItem('ksp_temp_user_role');
      setError('Authentication failed: invalid user role returned by the server.');
      setStep('credentials');
      return;
    }

    // Clean up temporary variables
    localStorage.removeItem('ksp_temp_user_id');
    localStorage.removeItem('ksp_temp_user_role');

    onLoginSuccess(tempUserId, tempUserRole);
  };

  const handleResendOtp = () => {
    setCountdown(30);
    setOtp('');
    setError(null);
    alert('A new secure 2FA verification token has been dispatched to your official communication terminal.');
  };

  return (
    <div className="login-page min-h-screen flex flex-col font-sans">
      
      {/* Government Utility Bar */}
      <div className="login-utility-bar text-[10px] py-1 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span>Official Website of Government of Karnataka</span>
            <a href="https://ksp.karnataka.gov.in" target="_blank" rel="noopener" className="text-[#d4a843] hover:text-white transition hidden sm:inline">ksp.karnataka.gov.in</a>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Phone size={9} />
              <span>Emergency: <strong className="text-white">112</strong></span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1">
              <Globe size={9} />
              <span>English</span>
            </div>
          </div>
        </div>
      </div>

      {/* Indian Tricolor */}
      <div className="h-[4px] w-full flex">
        <div className="flex-1 bg-[#ff9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>

      {/* Login Header Bar */}
      <header className="login-header px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <img src="/emblem.png" alt="KSP Emblem" className="h-12 w-auto object-contain" />
          <div>
            <h1 className="text-[14px] font-bold tracking-wide text-[#1e3a5f] uppercase" style={{ fontFamily: "'Noto Sans Kannada', sans-serif" }}>
              ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್
            </h1>
            <h2 className="text-[12px] font-bold tracking-wider text-[#1e3a5f] uppercase">
              Karnataka State Police
            </h2>
            <span className="text-[10px] text-[#6c757d] font-semibold">Government of Karnataka</span>
          </div>
          <div className="login-header-mark">
            <span className="login-header-mark-dot" />
            <span>INTELLIGENCE • ANALYTICS • ACCOUNTABILITY</span>
          </div>
        </div>
      </header>

      <main className="login-main">
        <div className="login-layout">
          <section className="showcase-panel" aria-label="Portal capabilities">
            <div className="showcase-topline">
              <span className="showcase-live-dot" />
              <span>CRIME INTELLIGENCE &amp; ANALYTICS</span>
              <span className="showcase-topline-rule" />
              <span className="showcase-topline-state">DEMO ENVIRONMENT</span>
            </div>

            <div className="showcase-intro">
              <p className="showcase-kicker">A clearer view. A more considered response.</p>
              <h2>Intelligence that<br /><span>moves with purpose.</span></h2>
              <p className="showcase-summary">
                A unified workspace for Karnataka State Police teams to explore synthetic case context,
                review patterns and collaborate with care.
              </p>
            </div>

            <div className="showcase-stage" aria-live="polite">
              <div className="showcase-stage-glow" />
              <div className={`showcase-slide showcase-slide-${showcaseSlides[activeSlide].color}`} key={activeSlide}>
                <div className="showcase-slide-top">
                  <span>{showcaseSlides[activeSlide].eyebrow}</span>
                  <ArrowDownRight size={19} aria-hidden="true" />
                </div>
                <div className="showcase-visual" aria-hidden="true">
                  <span className="showcase-visual-orbit orbit-a" />
                  <span className="showcase-visual-orbit orbit-b" />
                  <span className="showcase-visual-orbit orbit-c" />
                  <span className="showcase-visual-icon">
                    {React.createElement(showcaseSlides[activeSlide].icon, { size: 34, strokeWidth: 1.6 })}
                  </span>
                  <span className="showcase-visual-node node-a" />
                  <span className="showcase-visual-node node-b" />
                  <span className="showcase-visual-node node-c" />
                </div>
                <div className="showcase-slide-copy">
                  <h3>{showcaseSlides[activeSlide].title}</h3>
                  <p>{showcaseSlides[activeSlide].description}</p>
                </div>
                <div className="showcase-slide-detail">
                  <Activity size={15} aria-hidden="true" />
                  <span>{showcaseSlides[activeSlide].detail}</span>
                  <span className="showcase-detail-label">ILLUSTRATIVE</span>
                </div>
              </div>
              <div className="showcase-float-card float-card-top" aria-hidden="true">
                <span className="float-card-icon"><ShieldAlert size={15} /></span>
                <span><strong>Human review</strong><small>Always in the loop</small></span>
              </div>
              <div className="showcase-float-card float-card-bottom" aria-hidden="true">
                <span className="float-card-icon"><MapPin size={15} /></span>
                <span><strong>Context, connected</strong><small>Designed for clarity</small></span>
              </div>
            </div>

            <div className="showcase-controls">
              <span className="showcase-slide-count">
                <strong>{String(activeSlide + 1).padStart(2, '0')}</strong>
                <span> / {String(showcaseSlides.length).padStart(2, '0')}</span>
              </span>
              <div className="showcase-dots" aria-label="Choose a feature slide">
                {showcaseSlides.map((slide, index) => (
                  <button
                    key={slide.eyebrow}
                    type="button"
                    className={`showcase-dot ${activeSlide === index ? 'is-active' : ''}`}
                    onClick={() => setActiveSlide(index)}
                    aria-label={`Show slide ${index + 1}: ${slide.title}`}
                    aria-current={activeSlide === index ? 'true' : undefined}
                  />
                ))}
              </div>
              <div className="showcase-arrows">
                <button
                  type="button"
                  onClick={() => setActiveSlide((activeSlide - 1 + showcaseSlides.length) % showcaseSlides.length)}
                  aria-label="Previous feature"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSlide((activeSlide + 1) % showcaseSlides.length)}
                  aria-label="Next feature"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="showcase-trust-row">
              <span><Fingerprint size={15} /> Role-aware access</span>
              <span><ShieldAlert size={15} /> Synthetic data only</span>
              <span><Network size={15} /> Human-led decisions</span>
            </div>
          </section>

          <div className="w-full max-w-md login-column">
            <div className="login-demo-note">
              <span className="login-demo-note-icon"><AlertTriangle size={15} /></span>
              <span>{DEMO_ONLY_NOTE}</span>
            </div>

          {/* Login Card */}
          <div className="login-card bg-white border border-[#d1d9e6] rounded-lg shadow-xl overflow-hidden">
            
            {/* Card Navy Header */}
            <div className="login-card-header bg-[#1e3a5f] px-6 py-4 text-center">
              <img src="/emblem.png" alt="Karnataka State Police Emblem" className="h-16 w-auto mx-auto object-contain mb-2 drop-shadow-lg" />
              <h2 className="text-[14px] font-bold tracking-widest text-white uppercase" style={{ fontFamily: "'Noto Sans Kannada', sans-serif" }}>
                ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್
              </h2>
              <h3 className="text-[12px] font-semibold tracking-wide text-[#d4a843] uppercase mt-0.5">
                Karnataka State Police
              </h3>
              <p className="text-[10px] text-blue-200 font-medium tracking-wide uppercase mt-1.5">
                Crime Intelligence & Analytics Portal — Secure Login
              </p>
            </div>

            {/* Card Body */}
            <div className="login-card-body p-6">
              
              {/* Error Alert Box */}
              {error && (
                <div className="login-error mb-5 bg-red-50 border border-red-200 text-[#d9251c] p-3 rounded-lg flex items-start gap-2.5 text-xs" role="alert">
                  <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{error}</span>
                </div>
              )}

              {/* Step 1: Username & Password Credentials */}
              {step === 'credentials' && (
                <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                  
                  {/* Badge ID Input */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-wider">
                      Official Badge ID / Service ID
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6c757d]">
                        <UserCheck size={16} />
                      </span>
                      <input
                        type="text"
                        value={badgeId}
                        disabled={isSubmitting}
                        onChange={(e) => setBadgeId(e.target.value)}
                        placeholder="e.g. INV-1001"
                        className="login-input bg-[#f8f9fa] border border-[#d1d9e6] focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f]/20 focus:outline-none rounded-lg pl-10 pr-3 py-2.5 text-xs text-[#1e3a5f] placeholder-[#9ca3af] w-full tracking-wide transition font-mono uppercase"
                        autoComplete="off"
                        aria-label="Official Badge ID or Service ID"
                      />
                    </div>
                    
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-wider">
                      Access Password
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6c757d]">
                        <Lock size={16} />
                      </span>
                      <input
                        type="password"
                        value={password}
                        disabled={isSubmitting}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="login-input bg-[#f8f9fa] border border-[#d1d9e6] focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f]/20 focus:outline-none rounded-lg pl-10 pr-3 py-2.5 text-xs text-[#1e3a5f] placeholder-[#9ca3af] w-full transition"
                        autoComplete="current-password"
                        aria-label="Access password"
                      />
                    </div>
                  </div>

                  {/* Submit Credentials Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="login-submit w-full bg-[#1e3a5f] hover:bg-[#2a4a73] text-white font-bold text-xs uppercase tracking-wider py-3 rounded-lg shadow-lg cursor-pointer transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <KeyRound size={14} /> {isSubmitting ? 'Authenticating...' : 'Verify Credentials'}
                  </button>
                  
                  <div className="login-badge-examples border-t border-[#e8ecf1] pt-4 mt-2">
                    <span className="block text-[9px] text-[#6c757d] font-bold uppercase tracking-wider mb-2">
                      Badge ID examples <span className="login-badge-hint">Select to fill the field</span>
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[9px]">
                      <button
                        type="button"
                        onClick={() => setBadgeId('INV-1001')}
                        className="text-left bg-[#f8f9fa] hover:bg-[#eef2f7] border border-[#d1d9e6] text-[#4a5568] p-1.5 rounded cursor-pointer transition text-xs"
                        aria-label="Fill Investigator badge ID example"
                      >
                        <span className="font-mono text-[#1e3a5f] block">INV-1001</span>
                        Investigator
                      </button>
                      <button
                        type="button"
                        onClick={() => setBadgeId('ANA-2001')}
                        className="text-left bg-[#f8f9fa] hover:bg-[#eef2f7] border border-[#d1d9e6] text-[#4a5568] p-1.5 rounded cursor-pointer transition text-xs"
                        aria-label="Fill Analyst badge ID example"
                      >
                        <span className="font-mono text-[#1e3a5f] block">ANA-2001</span>
                        Analyst
                      </button>
                      <button
                        type="button"
                        onClick={() => setBadgeId('SUP-3001')}
                        className="text-left bg-[#f8f9fa] hover:bg-[#eef2f7] border border-[#d1d9e6] text-[#4a5568] p-1.5 rounded cursor-pointer transition text-xs"
                        aria-label="Fill Supervisor badge ID example"
                      >
                        <span className="font-mono text-[#1e3a5f] block">SUP-3001</span>
                        Supervisor
                      </button>
                      <button
                        type="button"
                        onClick={() => setBadgeId('POL-4001')}
                        className="text-left bg-[#f8f9fa] hover:bg-[#eef2f7] border border-[#d1d9e6] text-[#4a5568] p-1.5 rounded cursor-pointer transition text-xs"
                        aria-label="Fill Policymaker badge ID example"
                      >
                        <span className="font-mono text-[#1e3a5f] block">POL-4001</span>
                        Policymaker
                      </button>
                    </div>
                  </div>

                </form>
              )}

              {/* Step 2: Multi-Factor Authentication (OTP Token) */}
              {step === 'otp' && (
                <form onSubmit={handleOtpSubmit} className="space-y-6">
                  
                  <div className="space-y-2 text-center bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <span className="text-[10px] font-extrabold text-[#1e3a5f] uppercase tracking-widest block">
                      Two-Factor Security Active
                    </span>
                    <p className="text-[11px] text-[#4a5568] leading-relaxed font-medium">
                      A temporary security passcode has been dispatched to the registered mobile terminal ending in <strong>*9891</strong>.
                    </p>
                    <p className="text-[10px] text-[#6c757d] font-semibold italic">
                      (Enter any 6-digit code or use <strong>123456</strong> to verify)
                    </p>
                  </div>

                  {/* OTP Input */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-wider text-center">
                      Enter 6-Digit MFA Token
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="0 0 0 0 0 0"
                      className="bg-[#f8f9fa] border border-[#d1d9e6] focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f]/20 focus:outline-none rounded-lg py-3.5 text-lg text-[#1e3a5f] font-mono tracking-[0.75em] text-center w-full transition"
                      autoComplete="one-time-code"
                      autoFocus
                    />
                  </div>

                  {/* OTP Status & Resend */}
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#6c757d] font-medium">
                      {countdown > 0 ? (
                        <span>Code expires in: <strong className="text-[#1e3a5f] font-mono">00:{countdown.toString().padStart(2, '0')}</strong></span>
                      ) : (
                        <span className="text-[#d9251c]">Code expired</span>
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={!canResend}
                      className="text-[#1e3a5f] hover:text-[#2a4a73] font-bold uppercase disabled:text-[#9ca3af] cursor-pointer disabled:cursor-not-allowed transition"
                    >
                      Resend Code
                    </button>
                  </div>

                  {/* Verification Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => { setStep('credentials'); setOtp(''); setError(null); }}
                      className="flex-1 bg-[#f8f9fa] hover:bg-[#eef2f7] text-[#4a5568] font-bold text-xs uppercase tracking-wider py-3 rounded-lg border border-[#d1d9e6] transition cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-[2] bg-[#1e3a5f] hover:bg-[#2a4a73] text-white font-bold text-xs uppercase tracking-wider py-3 rounded-lg shadow-lg transition cursor-pointer"
                    >
                      Verify Code & Enter
                    </button>
                  </div>

                </form>
              )}

            </div>
          </div>

          {/* Security Warning Footer */}
          <div className="login-security-note mt-4 bg-white border border-[#d1d9e6] rounded-lg p-4 flex items-start gap-2.5 text-[9px] text-[#6c757d] leading-normal font-medium shadow-sm">
            <AlertTriangle size={14} className="shrink-0 text-amber-500" />
            <span>
              <strong className="text-[#1e3a5f]">WARNING:</strong> This is a secure system of the Karnataka State Police. Unauthorized access, tampering, or intrusion attempts will be recorded and prosecuted under Sections 43, 65, and 66 of the IT Act, 2000.
            </span>
          </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <div className="bg-[#0d2137] border-t-[3px] border-[#d4a843] py-4 text-center">
        <div className="text-[10px] text-slate-400">
          &copy; {new Date().getFullYear()} Karnataka State Police — Crime Intelligence & Analytics Division
        </div>
        <div className="text-[9px] text-slate-500 mt-1">
          Designed & Developed for KSP — Powered by CCTNS & NIC
        </div>
      </div>

    </div>
  );
};
