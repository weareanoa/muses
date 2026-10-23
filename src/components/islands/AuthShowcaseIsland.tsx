import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  currentUser,
  registerUser,
  addUserAddress,
  type UserAddress
} from '../../stores/authStore';
import {
  Sparkles,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { withBase } from '../../lib/paths';

export default function AuthShowcaseIsland() {
  const user = useStore(currentUser);

  const [name, setName] = useState(user?.name || 'Aulia Rahma');
  const [email, setEmail] = useState(user?.email || 'aulia@email.com');
  const [phone, setPhone] = useState(user?.phone?.replace(/^\+62\s*/, '') || '812 3456 7890');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(true);

  const [addressLabel, setAddressLabel] = useState('Rumah');
  const [street, setStreet] = useState('Jl. Contoh No. 12');
  const [city, setCity] = useState('Bandung');
  const [province, setProvince] = useState('Jawa Barat');
  const [postalCode, setPostalCode] = useState('40123');

  const [isEditAddressOpen, setIsEditAddressOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paidDone, setPaidDone] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const fullPhone = phone.trim().startsWith('+62') ? phone.trim() : `+62 ${phone.trim()}`;
  const fullAddress = `${street}, ${city}, ${province} ${postalCode}`;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setFeedbackMsg('Nama dan email wajib diisi.');
      return;
    }
    if (password.length < 8) {
      setFeedbackMsg('Kata sandi minimal 8 karakter.');
      return;
    }

    setIsRegistering(true);
    setTimeout(() => {
      const res = registerUser({
        name: name.trim(),
        email: email.trim(),
        phone: fullPhone,
        password: password,
        initialAddress: {
          label: addressLabel,
          recipientName: name.trim(),
          phone: fullPhone,
          street: street.trim(),
          city: city.trim(),
          province: province.trim(),
          postalCode: postalCode.trim(),
          isDefault: true,
        },
      });
      setIsRegistering(false);
      if (res.success) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#9A7420', '#B08A36', '#ffffff'],
          });
        } catch {}
        setFeedbackMsg('Akun berhasil didaftarkan dan terhubung ke checkout!');
      } else {
        setFeedbackMsg(res.error || 'Pendaftaran gagal.');
      }
    }, 500);
  };

  const handlePay = () => {
    setIsPaying(true);
    setTimeout(() => {
      setIsPaying(false);
      setPaidDone(true);
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#9A7420', '#B08A36', '#C9A227', '#ffffff'],
        });
      } catch {}
    }, 1000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div>
          <p className="text-xs text-[#6E6453] mb-2 font-mono">1. Registrasi</p>
          <div className="bg-white/90 backdrop-blur-2xl border border-[#1F1A12]/10 rounded-2xl p-6 shadow-xl relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-[#EFE3C4] text-[#6B5214] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-[#1F1A12]">MUSE</span>
            </div>

            <h3 className="text-lg font-bold text-[#1F1A12] mb-1">Buat akun</h3>
            <p className="text-xs text-[#6E6453] mb-4 leading-relaxed">
              Cukup sekali. Data ini dipakai otomatis saat checkout.
            </p>

            {feedbackMsg && (
              <div className="mb-3 p-2.5 rounded-lg bg-[#9A7420]/15 border border-[#9A7420]/30 text-[#B08A36] text-xs">
                {feedbackMsg}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#4B4335] mb-1">Nama lengkap</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#FBF8F1] border border-[#1F1A12]/15 focus:border-[#9A7420] rounded-lg px-3 py-2 text-[#1F1A12] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[#4B4335] mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#FBF8F1] border border-[#1F1A12]/15 focus:border-[#9A7420] rounded-lg px-3 py-2 text-[#1F1A12] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[#4B4335] mb-1">No. HP</label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 bg-[#FBF8F1] border border-[#1F1A12]/15 rounded-lg text-[#4B4335] font-mono text-xs">
                    +62
                  </div>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 bg-[#FBF8F1] border border-[#1F1A12]/15 focus:border-[#9A7420] rounded-lg px-3 py-2 text-[#1F1A12] focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#4B4335] mb-1">Kata sandi</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#FBF8F1] border border-[#1F1A12]/15 focus:border-[#9A7420] rounded-lg px-3 py-2 text-[#1F1A12] focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A7F6C] hover:text-[#4B4335]"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-[#8A7F6C] mt-1">Minimal 8 karakter.</p>
              </div>

              <label className="flex gap-2 items-start text-[#4B4335] pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="accent-[#9A7420] mt-0.5 rounded w-3.5 h-3.5 cursor-pointer"
                />
                <span className="text-[11px] leading-relaxed text-[#6E6453]">
                  Saya setuju dengan syarat layanan dan kebijakan privasi.
                </span>
              </label>

              <button
                type="submit"
                disabled={isRegistering}
                className="w-full py-2.5 rounded-lg bg-[#9A7420] hover:bg-[#B08A36] text-[#FCFAF5] font-semibold text-xs tracking-wide transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isRegistering ? 'Menyimpan Akun...' : 'Daftar'}
              </button>

              <p className="text-center text-[#6E6453] pt-1">
                Sudah punya akun?{' '}
                <a href={withBase("/login")} className="text-[#9A7420] font-semibold hover:underline">
                  Masuk
                </a>
              </p>
            </form>
          </div>
        </div>

        <div>
          <p className="text-xs text-[#6E6453] mb-2 font-mono">2. Checkout</p>
          <div className="bg-white/90 backdrop-blur-2xl border border-[#1F1A12]/10 rounded-2xl p-6 shadow-xl relative">
            <h3 className="text-lg font-bold text-[#1F1A12] mb-4">Checkout</h3>

            {paidDone ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-[#9A7420] mx-auto animate-bounce" />
                <h4 className="text-base font-bold text-[#1F1A12]">Pembayaran Sukses!</h4>
                <p className="text-xs text-[#6E6453] max-w-xs mx-auto">
                  Paket resmi MUSE siap dikirimkan ke alamat Anda.
                </p>
                <button
                  type="button"
                  onClick={() => setPaidDone(false)}
                  className="mt-3 px-4 py-2 bg-[#1F1A12]/10 hover:bg-[#1F1A12]/20 text-[#1F1A12] rounded-lg text-xs"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[#4B4335] font-medium">Penerima</span>
                    <a href={withBase("/profile")} className="text-[#9A7420] hover:underline cursor-pointer">
                      Ubah di profil
                    </a>
                  </div>
                  <div className="bg-[#FBF8F1] border border-[#1F1A12]/10 rounded-lg p-3 space-y-1">
                    <div className="font-semibold text-[#1F1A12]">{name || 'Aulia Rahma'}</div>
                    <div className="text-[#6E6453]">{email || 'aulia@email.com'}</div>
                    <div className="text-[#6E6453] font-mono">{fullPhone}</div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[#4B4335] font-medium">Alamat pengiriman</span>
                    <button
                      type="button"
                      onClick={() => setIsEditAddressOpen(!isEditAddressOpen)}
                      className="text-[#9A7420] hover:underline cursor-pointer"
                    >
                      {isEditAddressOpen ? 'Tutup form' : 'Tambah alamat'}
                    </button>
                  </div>

                  {isEditAddressOpen && (
                    <div className="p-3 mb-3 bg-[#FBF8F1] border border-[#9A7420]/30 rounded-lg space-y-2 animate-in fade-in duration-150">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={addressLabel}
                          onChange={(e) => setAddressLabel(e.target.value)}
                          placeholder="Label (e.g. Rumah)"
                          className="bg-[#F6F1E5] border border-[#1F1A12]/15 focus:border-[#9A7420] rounded px-2.5 py-1.5 text-xs text-[#1F1A12]"
                        />
                        <input
                          type="text"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder="Kode Pos"
                          className="bg-[#F6F1E5] border border-[#1F1A12]/15 focus:border-[#9A7420] rounded px-2.5 py-1.5 text-xs text-[#1F1A12] font-mono"
                        />
                      </div>
                      <input
                        type="text"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="Alamat jalan"
                        className="w-full bg-[#F6F1E5] border border-[#1F1A12]/15 focus:border-[#9A7420] rounded px-2.5 py-1.5 text-xs text-[#1F1A12]"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Kota"
                          className="bg-[#F6F1E5] border border-[#1F1A12]/15 focus:border-[#9A7420] rounded px-2.5 py-1.5 text-xs text-[#1F1A12]"
                        />
                        <input
                          type="text"
                          value={province}
                          onChange={(e) => setProvince(e.target.value)}
                          placeholder="Provinsi"
                          className="bg-[#F6F1E5] border border-[#1F1A12]/15 focus:border-[#9A7420] rounded px-2.5 py-1.5 text-xs text-[#1F1A12]"
                        />
                      </div>
                    </div>
                  )}

                  <div className="border border-[#1F1A12]/15 rounded-lg p-3 flex gap-2.5 bg-[#F8F4EA]">
                    <MapPin className="w-4 h-4 text-[#6E6453] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-[#1F1A12] flex items-center gap-1.5">
                        <span>{addressLabel}</span>
                        <span className="text-[10px] bg-[#9A7420]/20 text-[#B08A36] border border-[#9A7420]/30 px-2 py-0.5 rounded-full font-semibold">
                          Utama
                        </span>
                      </div>
                      <div className="text-[#6E6453] mt-1 leading-relaxed">
                        {fullAddress}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#1F1A12]/10 pt-3 space-y-1.5">
                  <div className="flex justify-between text-[#4B4335]">
                    <span>Lightstick x1</span>
                    <span className="font-mono">Rp 350.000</span>
                  </div>
                  <div className="flex justify-between text-[#6E6453]">
                    <span>Ongkir</span>
                    <span className="font-mono">Rp 20.000</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-[#1F1A12] pt-2 border-t border-[#1F1A12]/10">
                    <span>Total</span>
                    <span className="font-mono text-[#B08A36]">Rp 370.000</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePay}
                  disabled={isPaying}
                  className="w-full py-2.5 rounded-lg bg-[#9A7420] hover:bg-[#B08A36] text-[#FCFAF5] font-semibold text-xs tracking-wide transition-all shadow-md cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isPaying ? 'Memproses...' : 'Bayar sekarang'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
