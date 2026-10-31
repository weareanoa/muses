import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import {
  currentUser,
  loginWithGoogle,
  loginUser,
  registerUser,
  requestOtp,
  verifyOtp,
} from '../../stores/authStore';
import {
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { withBase } from '../../lib/paths';
import { fmt, getDict, translateServiceError, type Locale } from '../../i18n/dictionary';

interface AuthIslandProps {
  initialMode?: 'login' | 'register';
  redirectPath?: string;
  locale?: Locale;
}

export default function AuthIsland({
  initialMode = 'login',
  redirectPath = '/',
  locale = 'id'
}: AuthIslandProps) {
  const d = getDict(locale).auth;
  const user = useStore(currentUser);
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(initialMode === 'register');
  const [isOtpFlow, setIsOtpFlow] = useState<boolean>(false);
  const [otpStep, setOtpStep] = useState<'email' | 'code'>('email');

  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [agreeTerms, setAgreeTerms] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (user) {
      window.location.href = withBase(redirectPath || '/');
    }
  }, [user, redirectPath]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isOtpFlow && otpStep === 'code' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOtpFlow, otpStep, countdown]);

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 85,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C9971C', '#E5BF55', '#F7E08F', '#1F1A12'],
      });
    } catch {}
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage(d.errInvalidEmail);
      return;
    }
    if (!password) {
      setErrorMessage(d.errPasswordRequired);
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = loginUser(cleanEmail, password);
      setIsLoading(false);
      if (res.success && res.user) {
        triggerCelebration();
        window.location.href = withBase(redirectPath || '/');
      } else {
        setErrorMessage(res.error ? translateServiceError(locale, res.error) : d.errLoginMismatch);
      }
    }, 400);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage(d.errInvalidEmail);
      return;
    }
    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMessage(d.errPhoneInvalid);
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage(d.errPasswordMin);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage(d.errConfirmMismatch);
      return;
    }
    if (!agreeTerms) {
      setErrorMessage(d.errAgreeRequired);
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const namePart = cleanEmail.split('@')[0];
      const capitalized = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      const res = registerUser({
        name: capitalized,
        email: cleanEmail,
        phone: cleanPhone,
        password,
      });
      setIsLoading(false);
      if (res.success && res.user) {
        triggerCelebration();
        window.location.href = withBase(redirectPath || '/');
      } else {
        setErrorMessage(res.error ? translateServiceError(locale, res.error) : d.errRegisterFailed);
      }
    }, 450);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    const result = await loginWithGoogle();
    if (!result.success) {
      setIsLoading(false);
      setErrorMessage(result.error ? translateServiceError(locale, result.error) : d.errGoogleFailed);
    }
    // Kalau sukses, loginWithGoogle() sudah mengarahkan browser ke Google.
    // Jangan redirect ke '/' di sini dan jangan set user lokal: sesi baru
    // hanya ada setelah user kembali dari Google.
  };

  const handleStartEmailOtp = () => {
    setIsOtpFlow(true);
    setErrorMessage(null);
    const clean = email.trim();
    if (clean && clean.includes('@')) {
      setIsLoading(true);
      setTimeout(() => {
        const res = requestOtp(clean);
        setIsLoading(false);
        if (res.success) {
          setOtpStep('code');
          setCountdown(60);
          setCanResend(false);
          setOtpDigits(['', '', '', '', '', '']);
          setSuccessNotice(fmt(d.otpSent, { email: clean, code: res.testCode }));
          setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
        }
      }, 400);
    } else {
      setOtpStep('email');
    }
  };

  const handleSendOtpForm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const clean = email.trim();
    if (!clean || !clean.includes('@')) {
      setErrorMessage(d.errInvalidEmail);
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      const res = requestOtp(clean);
      setIsLoading(false);
      if (res.success) {
        setOtpStep('code');
        setCountdown(60);
        setCanResend(false);
        setOtpDigits(['', '', '', '', '', '']);
        setSuccessNotice(fmt(d.otpSent, { email: clean, code: res.testCode }));
        setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
      }
    }, 400);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6).split('');
      const newDigits = [...otpDigits];
      pasted.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setOtpDigits(newDigits);
      const nextFocus = Math.min(pasted.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newDigits = [...otpDigits];
      pasted.split('').forEach((char, idx) => {
        newDigits[idx] = char;
      });
      setOtpDigits(newDigits);
      const targetIdx = Math.min(pasted.length, 5);
      otpInputRefs.current[targetIdx]?.focus();
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      setErrorMessage(d.errOtpIncomplete);
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      const result = verifyOtp(email, fullCode);
      setIsLoading(false);
      if (result.success && result.user) {
        triggerCelebration();
        window.location.href = withBase(redirectPath || '/');
      } else {
        setErrorMessage(result.error ? translateServiceError(locale, result.error) : d.errOtpInvalid);
      }
    }, 450);
  };

  return (
    <div className="w-full max-w-[408px] mx-auto select-none">
      <div className="text-center mb-5">
        <a href={withBase('/')} className="inline-block" aria-label="MUSES Home">
          <img
            src={withBase('/images/muses_logo_3d_clean.svg')}
            alt="MUSES"
            className="h-10 sm:h-11 mx-auto object-contain hover:scale-105 transition-transform"
          />
        </a>
      </div>

      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-[26px] font-bold text-[#9C6F13] tracking-tight mb-1">
          {d.welcome}
        </h1>
        <p className="text-xs text-[#7A6B53] font-normal">
          {d.welcomeSub}
        </p>
      </div>

      <div className="space-y-2.5 mb-4">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-3.5 px-4 rounded-[20px] bg-[#F4EAD1] hover:bg-[#EFE2C7] border border-[#EBD6A7] text-[#4A3C23] font-semibold text-xs transition-all flex items-center justify-center gap-2.5 shadow-2xs cursor-pointer active:scale-[0.99]"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{d.continueGoogle}</span>
        </button>

        
      </div>

      <div className="relative flex items-center justify-center my-4">
        <div className="w-full border-t border-[#EAE3D2]" />
        <span className="absolute px-3 bg-[#FEFAF1] text-[10px] font-bold text-[#C9971C] uppercase tracking-widest">
          {d.or}
        </span>
      </div>

      {errorMessage && (
        <div className="mb-3.5 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successNotice && isOtpFlow && (
        <div className="mb-3.5 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700" />
          <span>{successNotice}</span>
        </div>
      )}

      {!isOtpFlow && !isRegisterMode && (
        <form onSubmit={handleLoginSubmit} className="space-y-3.5">
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold text-[#1F1A12] mb-1.5 px-1">
              {d.emailLabel}
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={d.emailPlaceholder}
              className="w-full bg-white border border-[#E2D8C3] focus:border-[#C9971C] rounded-[20px] px-4 py-3.5 text-xs text-[#1F1A12] placeholder:text-[#A89C85] focus:outline-none focus:ring-2 focus:ring-[#C9971C]/20 transition-all shadow-2xs"
              required
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-semibold text-[#1F1A12] mb-1.5 px-1">
              {d.passwordLabel}
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={d.passwordPlaceholder}
                className="w-full bg-white border border-[#E2D8C3] focus:border-[#C9971C] rounded-[20px] pl-4 pr-10 py-3.5 text-xs text-[#1F1A12] placeholder:text-[#A89C85] focus:outline-none focus:ring-2 focus:ring-[#C9971C]/20 transition-all shadow-2xs"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C6A1C] hover:text-[#1F1A12] cursor-pointer"
                aria-label={showPassword ? d.hidePassword : d.showPassword}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 rounded-[20px] bg-gradient-to-r from-[#D7A838] via-[#BF8E25] to-[#8C6010] hover:brightness-105 active:scale-[0.99] text-white font-semibold text-xs tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-[0_4px_14px_rgba(201,151,28,0.35)] flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{d.processing}</span>
              </>
            ) : (
              <span>{d.loginSubmit}</span>
            )}
          </button>

          <div className="flex items-center justify-center text-[11px] text-[#6E6453] pt-2 px-1">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setIsOtpFlow(false);
                setErrorMessage(null);
                setSuccessNotice(null);
              }}
              className="text-[#8C6A1C] hover:text-[#C9971C] font-semibold underline cursor-pointer"
            >
              {d.noAccount}
            </button>
          </div>
        </form>
      )}

      {!isOtpFlow && isRegisterMode && (
        <form onSubmit={handleRegisterSubmit} className="space-y-3">
          <div>
            <label htmlFor="reg-email" className="block text-xs font-semibold text-[#1F1A12] mb-1 px-1">
              {d.emailLabel}
            </label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={d.emailPlaceholder}
              className="w-full bg-white border border-[#E2D8C3] focus:border-[#C9971C] rounded-[20px] px-4 py-3.5 text-xs text-[#1F1A12] placeholder:text-[#A89C85] focus:outline-none focus:ring-2 focus:ring-[#C9971C]/20 transition-all shadow-2xs"
              required
            />
          </div>

          <div>
            <label htmlFor="reg-phone" className="block text-xs font-semibold text-[#1F1A12] mb-1 px-1">
              {d.phoneLabel}
            </label>
            <input
              id="reg-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={d.phonePlaceholder}
              className="w-full bg-white border border-[#E2D8C3] focus:border-[#C9971C] rounded-[20px] px-4 py-3.5 text-xs text-[#1F1A12] placeholder:text-[#A89C85] focus:outline-none focus:ring-2 focus:ring-[#C9971C]/20 transition-all shadow-2xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="reg-password" className="block text-xs font-semibold text-[#1F1A12] mb-1 px-1">
                {d.passwordLabel}
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={d.passwordMinPlaceholder}
                  className="w-full bg-white border border-[#E2D8C3] focus:border-[#C9971C] rounded-[20px] px-3.5 py-3.5 text-xs text-[#1F1A12] placeholder:text-[#A89C85] focus:outline-none focus:ring-2 focus:ring-[#C9971C]/20 transition-all shadow-2xs"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="reg-confirm" className="block text-xs font-semibold text-[#1F1A12] mb-1 px-1">
                {d.confirmLabel}
              </label>
              <div className="relative">
                <input
                  id="reg-confirm"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={d.confirmPlaceholder}
                  className="w-full bg-white border border-[#E2D8C3] focus:border-[#C9971C] rounded-[20px] px-3.5 py-3.5 text-xs text-[#1F1A12] placeholder:text-[#A89C85] focus:outline-none focus:ring-2 focus:ring-[#C9971C]/20 transition-all shadow-2xs"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 pt-1 px-1">
            <input
              type="checkbox"
              id="agree-terms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 w-3.5 h-3.5 rounded text-[#C9971C] focus:ring-[#C9971C] border-[#C9971C]/50 cursor-pointer"
              required
            />
            <label htmlFor="agree-terms" className="text-[11px] text-[#6E6453] leading-snug cursor-pointer">
              {d.terms}
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 rounded-[20px] bg-gradient-to-r from-[#D7A838] via-[#BF8E25] to-[#8C6010] hover:brightness-105 active:scale-[0.99] text-white font-semibold text-xs tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-[0_4px_14px_rgba(201,151,28,0.35)] flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{d.registering}</span>
              </>
            ) : (
              <span>{d.registerSubmit}</span>
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setIsOtpFlow(false);
                setErrorMessage(null);
                setSuccessNotice(null);
              }}
              className="text-[11px] text-[#8C6A1C] hover:text-[#C9971C] font-semibold underline cursor-pointer"
            >
              {d.hasAccount}
            </button>
          </div>
        </form>
      )}

      {isOtpFlow && otpStep === 'email' && (
        <form onSubmit={handleSendOtpForm} className="space-y-3">
          <div>
            <label htmlFor="otp-email" className="block text-xs font-semibold text-[#1F1A12] mb-1.5 px-1">
              {d.otpEmailLabel}
            </label>
            <input
              id="otp-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={d.emailPlaceholder}
              className="w-full bg-white border border-[#E2D8C3] focus:border-[#C9971C] rounded-[20px] px-4 py-3.5 text-xs text-[#1F1A12] placeholder:text-[#A89C85] focus:outline-none focus:ring-2 focus:ring-[#C9971C]/20 transition-all shadow-2xs"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-[20px] bg-gradient-to-r from-[#D7A838] via-[#BF8E25] to-[#8C6010] hover:brightness-105 active:scale-[0.99] text-white font-semibold text-xs tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-[0_4px_14px_rgba(201,151,28,0.35)] flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{d.sendingCode}</span>
              </>
            ) : (
              <span>{d.sendOtp}</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOtpFlow(false);
              setErrorMessage(null);
              setSuccessNotice(null);
            }}
            className="w-full text-center text-xs text-[#6E6453] hover:text-[#1F1A12] pt-1 cursor-pointer"
          >
            {d.backToMain}
          </button>
        </form>
      )}

      {isOtpFlow && otpStep === 'code' && (
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <div className="flex justify-between items-center gap-1.5 sm:gap-2">
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  otpInputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                onPaste={handleOtpPaste}
                className="w-10 h-12 sm:w-11 sm:h-13 text-center font-mono text-lg font-bold bg-[#FCFAF5] border border-[#C9971C]/40 focus:border-[#C9971C] rounded-xl text-[#1F1A12] focus:outline-none focus:ring-2 focus:ring-[#C9971C]/30 transition-all"
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-[#6E6453] px-1">
            <button
              type="button"
              onClick={() => {
                setOtpStep('email');
                setErrorMessage(null);
                setSuccessNotice(null);
              }}
              className="text-[#8C6A1C] hover:text-[#C9971C] font-semibold underline cursor-pointer"
            >
              {d.changeEmail}
            </button>

            <div>
              {canResend ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!canResend) return;
                    const res = requestOtp(email);
                    setCountdown(60);
                    setCanResend(false);
                    setSuccessNotice(fmt(d.otpResent, { code: res.testCode }));
                  }}
                  className="text-[#C9971C] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{d.resend}</span>
                </button>
              ) : (
                <span className="font-mono text-[#8A7F6C]">
                  {fmt(d.resendIn, { seconds: countdown })}
                </span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || otpDigits.join('').length !== 6}
            className="w-full py-3.5 rounded-[20px] bg-gradient-to-r from-[#D7A838] via-[#BF8E25] to-[#8C6010] hover:brightness-105 active:scale-[0.99] text-white font-semibold text-xs tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-[0_4px_14px_rgba(201,151,28,0.35)] flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{d.verifying}</span>
              </>
            ) : (
              <span>{d.verify}</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOtpFlow(false);
              setErrorMessage(null);
              setSuccessNotice(null);
            }}
            className="w-full text-center text-xs text-[#6E6453] hover:text-[#1F1A12] pt-1 cursor-pointer"
          >
            {d.backToMain}
          </button>
        </form>
      )}
    </div>
  );
}
