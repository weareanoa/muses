import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { currentUser, logoutUser, type User } from '../../stores/authStore';
import {
  ShieldCheck,
  User as UserIcon,
  Mail,
  Calendar,
  LogOut,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Award,
  ArrowRight,
  Heart
} from 'lucide-react';
import confetti from 'canvas-confetti';

const MEMBERS = [
  { id: 'aria', name: 'Aria', role: 'Leader & Lead Vocalist', emoji: '✦' },
  { id: 'clara', name: 'Clara', role: 'Main Vocalist', emoji: '✿' },
  { id: 'stella', name: 'Stella', role: 'Main Dancer & Lead Rapper', emoji: '✧' },
  { id: 'luna', name: 'Luna', role: 'Lead Vocalist & Visual', emoji: '☾' },
  { id: 'maya', name: 'Maya', role: 'Main Rapper', emoji: '❖' },
  { id: 'reva', name: 'Reva', role: 'Lead Dancer & Sub-Vocalist', emoji: '✺' },
  { id: 'zia', name: 'Zia', role: 'Sub-Vocalist & Maknae', emoji: '◈' },
  { id: 'ot7', name: 'OT7 All', role: 'Full Support for MUSES', emoji: '⭐' },
];

export default function ProfileIsland() {
  const user = useStore(currentUser);
  const [selectedBias, setSelectedBias] = useState<string | null>(null);
  const [isUpdatingBias, setIsUpdatingBias] = useState(false);

  if (!user) {
    return (
      <div className="w-full max-w-md mx-auto bg-white/85 backdrop-blur-2xl border border-[#1F1A12]/10 rounded-3xl p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#9A7420]/10 border border-[#9A7420]/30 text-[#9A7420] mx-auto mb-4 flex items-center justify-center">
          <UserIcon className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold font-display text-[#1F1A12] mb-2">Sign In Required</h2>
        <p className="text-xs text-[#6E6453] mb-6">
          You must be logged in to access your Official Digital CIRCLE Membership Pass.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/login"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#9A7420] to-[#B08A36] text-[#FCFAF5] text-xs font-bold uppercase tracking-wider hover:brightness-110 shadow-lg"
          >
            Sign In
          </a>
          <a
            href="/register"
            className="px-6 py-2.5 rounded-xl bg-[#1F1A12]/5 hover:bg-[#1F1A12]/10 border border-[#1F1A12]/10 text-[#4B4335] text-xs font-semibold uppercase tracking-wider"
          >
            Create Account
          </a>
        </div>
      </div>
    );
  }

  const handleUpdateBias = (member: typeof MEMBERS[0]) => {
    setIsUpdatingBias(true);
    const updated: User = {
      ...user,
      bias: member.name,
      biasEmoji: member.emoji,
    };
    currentUser.set(updated);
    try {
      localStorage.setItem('muse_current_user', JSON.stringify(updated));
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#9A7420', '#B08A36', '#ffffff'],
      });
    } catch {}
    setTimeout(() => {
      setIsUpdatingBias(false);
    }, 400);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7">
          <div className="relative rounded-3xl bg-gradient-to-br from-neutral-800 via-neutral-900 to-black p-7 sm:p-9 border border-[#1F1A12]/15 shadow-[0_20px_50px_rgba(90,70,30,0.18)] overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#9A7420]/20 rounded-full blur-[70px] pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none" />

            <div className="flex items-center justify-between pb-6 border-b border-[#1F1A12]/10 relative z-10">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl font-black text-[#9A7420] font-display">+ × +</span>
                <div>
                  <div className="text-[10px] font-mono tracking-widest uppercase text-[#6E6453]">
                    AUREUM RECORDS / AUREUM
                  </div>
                  <div className="text-xs font-bold text-[#1F1A12] tracking-wider">
                    OFFICIAL DIGITAL FAN PASS
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#9A7420]/20 border border-[#9A7420]/40 text-[#B08A36]">
                5TH GEN
              </span>
            </div>

            <div className="py-6 space-y-5 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#9A7420] to-[#B08A36] p-0.5 shadow-[0_0_15px_rgba(154,116,32,0.4)]">
                  <div className="w-full h-full rounded-2xl bg-[#F6F1E5] flex items-center justify-center text-3xl">
                    {user.biasEmoji || '🐰'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#8A7F6C]">
                    Fan Name
                  </div>
                  <h3 className="text-xl font-bold text-[#1F1A12]">{user.name}</h3>
                  <div className="text-xs font-mono text-[#9A7420]">@{user.username}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#8A7F6C]">
                    Membership Number
                  </div>
                  <div className="text-xs font-mono font-bold text-[#2E281E] mt-0.5">
                    {user.membershipNumber}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#8A7F6C]">
                    Bias / Favorite
                  </div>
                  <div className="text-xs font-semibold text-[#1F1A12] mt-0.5 flex items-center gap-1">
                    <span>{user.biasEmoji}</span>
                    <span>{user.bias}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#8A7F6C]">
                    Tier
                  </div>
                  <div className="text-xs font-semibold text-emerald-700 mt-0.5">
                    {user.membershipTier}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-[#1F1A12]/10 flex items-center justify-between text-xs text-[#6E6453] relative z-10 font-mono">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#9A7420]" />
                <span>Verified Fan Certificate</span>
              </div>
              <span>Member Since: {user.joinedAt}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white/85 backdrop-blur-2xl border border-[#1F1A12]/10 rounded-3xl p-6">
            <h4 className="text-sm font-bold uppercase tracking-wider font-display text-[#1F1A12] mb-2 flex items-center gap-2">
              <Heart className="w-4 h-4 text-[#9A7420]" />
              <span>Change Your Member Bias</span>
            </h4>
            <p className="text-xs text-[#6E6453] mb-4">
              Select your favorite MUSE member to personalize your membership pass and turntable highlights.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {MEMBERS.map((m) => {
                const isSelected = user.bias === m.name;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleUpdateBias(m)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      isSelected
                        ? 'border-[#9A7420] bg-[#9A7420]/20 shadow-[0_0_12px_rgba(154,116,32,0.3)]'
                        : 'border-[#1F1A12]/10 bg-[#F8F4EA] hover:bg-[#1F1A12]/5'
                    }`}
                  >
                    <span className="text-xl">{m.emoji}</span>
                    <span className={`text-[11px] font-semibold ${isSelected ? 'text-[#1F1A12]' : 'text-[#6E6453]'}`}>
                      {m.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white/85 backdrop-blur-2xl border border-[#1F1A12]/10 rounded-3xl p-6 space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider font-display text-[#1F1A12] mb-2">
              Fan Actions
            </h4>
            <a
              href="/address"
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#1F1A12]/5 hover:bg-[#1F1A12]/10 border border-[#1F1A12]/10 text-xs font-semibold text-[#2E281E] hover:text-[#1F1A12] transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#9A7420]" />
                <span>Alamat Pengiriman & Checkout</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#6E6453] group-hover:translate-x-1 transition-transform" />
            </a>

            <a
              href="/store"
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#1F1A12]/5 hover:bg-[#1F1A12]/10 border border-[#1F1A12]/10 text-xs font-semibold text-[#2E281E] hover:text-[#1F1A12] transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4 text-[#9A7420]" />
                <span>Shop Exclusive Merch</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#6E6453] group-hover:translate-x-1 transition-transform" />
            </a>

            <a
              href="/#discography-section"
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#1F1A12]/5 hover:bg-[#1F1A12]/10 border border-[#1F1A12]/10 text-xs font-semibold text-[#2E281E] hover:text-[#1F1A12] transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span>Play Turntable Vinyl Records</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#6E6453] group-hover:translate-x-1 transition-transform" />
            </a>

            <button
              onClick={() => logoutUser()}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-[#1F1A12]/5 hover:bg-red-500/10 border border-[#1F1A12]/10 hover:border-red-500/20 text-xs font-medium text-[#6E6453] hover:text-red-600 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out of CIRCLE Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
