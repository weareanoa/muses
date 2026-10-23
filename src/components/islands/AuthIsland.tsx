import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import {
  currentUser,
  loginWithGoogle,
  loginUser,
  registerUser,
  requestOtp,
  verifyOtp,
  type User
} from '../../stores/authStore';
import {
  Mail,
  Lock,
  Phone,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { withBase } from '../../lib/paths';

interface AuthIslandProps {
  initialMode?: 'login' | 'register';
  redirectPath?: string;
}

export default function AuthIsland({
  initialMode = 'login',
  redirectPath = '/'
}: AuthIslandProps) {
  const user = useStore(currentUser);
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(initialMode === 'register');
  const [isOtpFlow, setIsOtpFlow] = useState<boolean>(false);
  const [otpStep, setOtpStep] = useState<'email' | 'code'>('email');

  const [email, setEmail] = useState<string>('aulia@email.com');
  const [phone, setPhone] = useState<string>('081234567890');
  const [password, setPassword] = useState<string>('muses2026');
  const [confirmPassword, setConfirmPassword] = useState<string>('muses2026');
  const [agreeTerms, setAgreeTerms] = useState<boolean>(true);
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
      window.location.href = redirectPath || '/';
    }
  }, [user, redirectPath]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
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
        particleCount: 90,
        spread: 75,
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
      setErrorMessage('Silakan masukkan format alamat email yang valid.');
      return;
    }
    if (!password) {
      setErrorMessage('Silakan masukkan kata sandi Anda.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = loginUser(cleanEmail, password);
      setIsLoading(false);
      if (res.success && res.user) {
        triggerCelebration();
        window.location.href = redirectPath || '/';
      } else {
        setErrorMessage(res.error || 'Email atau kata sandi tidak sesuai.');
      }
    }, 400);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Silakan masukkan format alamat email yang valid.');
      return;
    }
    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMessage('Silakan masukkan nomor HP yang valid.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Kata sandi harus minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('Anda harus menyetujui Syarat & Ketentuan serta Kebijakan Privasi.');
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
        window.location.href = redirectPath || '/';
      } else {
        setErrorMessage(res.error || 'Gagal mendaftarkan akun. Silakan coba kembali.');
      }
    }, 500);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setErrorMessage(null);
    setTimeout(() => {
      const result = loginWithGoogle();
      setIsLoading(false);
      if (result.success) {
        triggerCelebration();
        window.location.href = redirectPath || '/';
      }
    }, 500);
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
          setSuccessNotice(`Kode verifikasi 6-digit dikirim ke ${clean} (Kode demo: ${res.testCode})`);
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
      setErrorMessage('Silakan masukkan format alamat email yang valid.');
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
        setSuccessNotice(`Kode verifikasi dikirim ke ${clean} (Kode demo: ${res.testCode})`);
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
      setErrorMessage('Harap masukkan 6 digit kode OTP secara lengkap.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      const result = verifyOtp(email, fullCode);
      setIsLoading(false);
      if (result.success && result.user) {
        triggerCelebration();
        window.location.href = redirectPath || '/';
      } else {
        setErrorMessage(result.error || 'Kode verifikasi tidak valid.');
      }
    }, 500);
  };

  return (
    <div className="w-full max-w-md mx-auto relative select-none">
      <div className="relative bg-white/95 backdrop-blur-2xl border border-[#C9971C]/30 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(201,151,28,0.14)] overflow-hidden">
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-[#F7E08F]/25 rounded-full blur-[80px] pointer-events-none" />

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <a href={withBase('/')} className="inline-flex items-center gap-2 group" aria-label="MUSES Home">
              <span className="text-xl font-display font-black tracking-widest gold-gradient-text transition-transform group-hover:scale-105">
                MUSES
              </span>
            </a>
            <a
              href={withBase('/')}
              className="text-xs text-[#8C6A1C] hover:text-[#C9971C] transition-colors flex items-center gap-1 font-medium"
            >
              <span>← Beranda</span>
            </a>
          </div>

          <h1 className="text-2xl font-bold text-[#1F1A12] tracking-tight">
            {isOtpFlow
              ? otpStep === 'code'
                ? 'Verifikasi Kode OTP'
                : 'Masuk dengan Email OTP'
              : isRegisterMode
              ? 'Daftar Akun MUSES'
              : 'Masuk ke Akun'}
          </h1>
          <p className="text-xs text-[#6E6453] mt-1 leading-relaxed">
            {isOtpFlow
              ? `Kode verifikasi 6 digit dikirim ke ${email}.`
              : isRegisterMode
              ? 'Lengkapi data diri Anda untuk membuat akun resmi fans MUSES.'
              : 'Gunakan akun Anda untuk melanjutkan belanja dan menikmati akses eksklusif.'}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs flex items-start gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successNotice && isOtpFlow && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-xs flex items-start gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700" />
            <span>{successNotice}</span>
          </div>
        )}

        {!isOtpFlow && !isRegisterMode && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-semibold text-[#1F1A12] mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full bg-[#FCFAF5] border border-[#C9971C]/35 focus:border-[#C9971C] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[#1F1A12] placeholder:text-[#A3977F] focus:outline-none transition-colors"
                  required
                />
                <Mail className="w-4 h-4 text-[#8C6A1C] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F1A12] mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full bg-[#FCFAF5] border border-[#C9971C]/35 focus:border-[#C9971C] rounded-xl pl-9 pr-9 py-2.5 text-xs text-[#1F1A12] placeholder:text-[#A3977F] focus:outline-none transition-colors"
                  required
                />
                <Lock className="w-4 h-4 text-[#8C6A1C] absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C6A1C] hover:text-[#1F1A12] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl pill-active text-[#1F1A12] font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#1F1A12]/30 border-t-[#1F1A12] rounded-full animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Akun</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="relative flex items-center justify-center my-4">
              <div className="w-full border-t border-[#1F1A12]/10" />
              <span className="absolute px-3 bg-white text-[11px] font-mono text-[#8C6A1C] uppercase tracking-wider">
                atau masuk dengan
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="py-2.5 px-3 rounded-xl bg-[#FCFAF5] hover:bg-[#FDF6E7] border border-[#C9971C]/35 text-[#1F1A12] font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer hover:border-[#C9971C]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={handleStartEmailOtp}
                className="py-2.5 px-3 rounded-xl bg-[#FCFAF5] hover:bg-[#FDF6E7] border border-[#C9971C]/35 text-[#1F1A12] font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer hover:border-[#C9971C]"
              >
                <Mail className="w-4 h-4 text-[#C9971C]" />
                <span>Email OTP</span>
              </button>
            </div>
          </form>
        )}

        {!isOtpFlow && isRegisterMode && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-semibold text-[#1F1A12] mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full bg-[#FCFAF5] border border-[#C9971C]/35 focus:border-[#C9971C] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#1F1A12] placeholder:text-[#A3977F] focus:outline-none transition-colors"
                  required
                />
                <Mail className="w-4 h-4 text-[#8C6A1C] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F1A12] mb-1">
                Nomor Handphone
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full bg-[#FCFAF5] border border-[#C9971C]/35 focus:border-[#C9971C] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#1F1A12] placeholder:text-[#A3977F] focus:outline-none transition-colors"
                  required
                />
                <Phone className="w-4 h-4 text-[#8C6A1C] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1F1A12] mb-1">
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 digit"
                    className="w-full bg-[#FCFAF5] border border-[#C9971C]/35 focus:border-[#C9971C] rounded-xl pl-8 pr-3 py-2 text-xs text-[#1F1A12] placeholder:text-[#A3977F] focus:outline-none transition-colors"
                    required
                  />
                  <Lock className="w-3.5 h-3.5 text-[#8C6A1C] absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F1A12] mb-1">
                  Ulangi Sandi
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi sandi"
                    className="w-full bg-[#FCFAF5] border border-[#C9971C]/35 focus:border-[#C9971C] rounded-xl pl-8 pr-3 py-2 text-xs text-[#1F1A12] placeholder:text-[#A3977F] focus:outline-none transition-colors"
                    required
                  />
                  <Lock className="w-3.5 h-3.5 text-[#8C6A1C] absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="agree-terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#C9971C] focus:ring-[#C9971C] border-[#C9971C]/50 cursor-pointer"
                required
              />
              <label htmlFor="agree-terms" className="text-[11px] text-[#6E6453] leading-snug cursor-pointer">
                Saya menyetujui Syarat & Ketentuan serta Kebijakan Privasi MUSES.
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl pill-active text-[#1F1A12] font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-xs mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#1F1A12]/30 border-t-[#1F1A12] rounded-full animate-spin" />
                  <span>Mendaftarkan...</span>
                </>
              ) : (
                <>
                  <span>Daftar Akun</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="relative flex items-center justify-center my-3">
              <div className="w-full border-t border-[#1F1A12]/10" />
              <span className="absolute px-3 bg-white text-[11px] font-mono text-[#8C6A1C] uppercase tracking-wider">
                atau daftar dengan
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="py-2.5 px-3 rounded-xl bg-[#FCFAF5] hover:bg-[#FDF6E7] border border-[#C9971C]/35 text-[#1F1A12] font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer hover:border-[#C9971C]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={handleStartEmailOtp}
                className="py-2.5 px-3 rounded-xl bg-[#FCFAF5] hover:bg-[#FDF6E7] border border-[#C9971C]/35 text-[#1F1A12] font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer hover:border-[#C9971C]"
              >
                <Mail className="w-4 h-4 text-[#C9971C]" />
                <span>Email OTP</span>
              </button>
            </div>
          </form>
        )}

        {isOtpFlow && otpStep === 'email' && (
          <form onSubmit={handleSendOtpForm} className="space-y-4 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-semibold text-[#1F1A12] mb-1.5">
                Alamat Email untuk OTP
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full bg-[#FCFAF5] border border-[#C9971C]/35 focus:border-[#C9971C] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[#1F1A12] placeholder:text-[#A3977F] focus:outline-none transition-colors"
                  required
                  autoFocus
                />
                <Mail className="w-4 h-4 text-[#8C6A1C] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl pill-active text-[#1F1A12] font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#1F1A12]/30 border-t-[#1F1A12] rounded-full animate-spin" />
                  <span>Mengirim Kode...</span>
                </>
              ) : (
                <>
                  <span>Kirim Kode OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOtpFlow(false);
                setErrorMessage(null);
              }}
              className="w-full text-center text-xs text-[#6E6453] hover:text-[#1F1A12] pt-1 cursor-pointer"
            >
              ← Kembali ke form utama
            </button>
          </form>
        )}

        {isOtpFlow && otpStep === 'code' && (
          <form onSubmit={handleOtpSubmit} className="space-y-5 animate-in fade-in duration-200">
            <div className="flex justify-between items-center gap-2">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpInputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  onPaste={handleOtpPaste}
                  className="w-12 h-13 sm:w-13 sm:h-14 text-center font-mono text-xl font-bold bg-[#FCFAF5] border border-[#C9971C]/40 focus:border-[#C9971C] rounded-xl text-[#1F1A12] focus:outline-none focus:ring-2 focus:ring-[#C9971C]/30 transition-all"
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-[#6E6453] pt-1">
              <button
                type="button"
                onClick={() => {
                  setOtpStep('email');
                  setErrorMessage(null);
                  setSuccessNotice(null);
                }}
                className="text-[#8C6A1C] hover:text-[#C9971C] font-semibold underline cursor-pointer"
              >
                Ganti email
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
                      setSuccessNotice(`Kode baru telah dikirim! (Gunakan: ${res.testCode})`);
                    }}
                    className="text-[#C9971C] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Kirim ulang</span>
                  </button>
                ) : (
                  <span className="font-mono text-[#8A7F6C]">
                    Kirim ulang ({countdown}s)
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || otpDigits.join('').length !== 6}
              className="w-full py-3 rounded-xl pill-active text-[#1F1A12] font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#1F1A12]/30 border-t-[#1F1A12] rounded-full animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <span>Verifikasi & Masuk</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOtpFlow(false);
                setErrorMessage(null);
              }}
              className="w-full text-center text-xs text-[#6E6453] hover:text-[#1F1A12] pt-1 cursor-pointer"
            >
              ← Kembali ke form utama
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-[#1F1A12]/10 text-center text-xs text-[#6E6453]">
          {isRegisterMode ? (
            <p>
              Sudah punya akun?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(false);
                  setIsOtpFlow(false);
                  setErrorMessage(null);
                  setSuccessNotice(null);
                }}
                className="text-[#8C6A1C] hover:text-[#C9971C] font-bold underline ml-1 cursor-pointer"
              >
                Masuk
              </button>
            </p>
          ) : (
            <p>
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(true);
                  setIsOtpFlow(false);
                  setErrorMessage(null);
                  setSuccessNotice(null);
                }}
                className="text-[#8C6A1C] hover:text-[#C9971C] font-bold underline ml-1 cursor-pointer"
              >
                Daftar
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
