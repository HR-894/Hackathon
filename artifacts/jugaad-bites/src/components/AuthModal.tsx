// =========================================================================
// JugaadBites: Google Sign-In & AI Usage Credits Tracker
// Manages User Profile, Session Persistence, Daily Free AI Credits & Pro Tier
// =========================================================================

import React, { useState, useEffect } from 'react';
import { User, Sparkles, Check, X, Shield, Zap, LogOut } from 'lucide-react';
import { sounds } from '@/lib/sound';

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  isLoggedIn: boolean;
  isPro: boolean;
  aiCreditsRemaining: number;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUserUpdate: (updated: UserProfile) => void;
}

export function AuthModal({
  isOpen,
  onClose,
  user,
  onUserUpdate,
}: AuthModalProps) {
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  if (!isOpen) return null;

  const handleGoogleSignIn = () => {
    sounds.playSuccess();
    const googleUser: UserProfile = {
      name: nameInput.trim() || 'Hungry Student',
      email: emailInput.trim() || 'hostel.cook@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isLoggedIn: true,
      isPro: true,
      aiCreditsRemaining: 999,
    };
    onUserUpdate(googleUser);
    localStorage.setItem('jugaad_user_profile', JSON.stringify(googleUser));
    onClose();
  };

  const handleSignOut = () => {
    sounds.playDelete();
    const guestUser: UserProfile = {
      name: 'Guest Cook',
      email: '',
      avatar: '',
      isLoggedIn: false,
      isPro: false,
      aiCreditsRemaining: 5,
    };
    onUserUpdate(guestUser);
    localStorage.removeItem('jugaad_user_profile');
    onClose();
  };

  const handleTogglePro = () => {
    sounds.playPop();
    const updated: UserProfile = {
      ...user,
      isPro: !user.isPro,
      aiCreditsRemaining: !user.isPro ? 999 : 5,
    };
    onUserUpdate(updated);
    localStorage.setItem('jugaad_user_profile', JSON.stringify(updated));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-[#ded4c1] dark:border-[#2a3c45] bg-[#fffdf9] dark:bg-[#152026] p-6 shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 text-[#52636a] dark:text-[#8ba098] hover:bg-[#ede3cf] dark:hover:bg-[#203038] transition"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e65e3d] text-white shadow-md">
            <User size={22} />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-[#16202a] dark:text-[#f3eee4]">
              {user.isLoggedIn ? 'Your Cook Profile' : 'Sign in to JugaadBites'}
            </h3>
            <p className="text-xs text-[#52636a] dark:text-[#8ea299] font-medium">
              {user.isLoggedIn ? 'Manage credits & recipe bookmarks' : 'Sync your favorite stashes & unlock unlimited AI'}
            </p>
          </div>
        </div>

        {/* User Card or Login Form */}
        {user.isLoggedIn ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-[#ded4c1] dark:border-[#2a3c45] bg-[#f8f5ee] dark:bg-[#10171a] p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#166e64] text-white font-bold text-lg shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-[#16202a] dark:text-[#f3eee4]">{user.name}</h4>
                  {user.isPro && (
                    <span className="rounded-full bg-[#f4c453] px-2 py-0.5 text-[0.65rem] font-extrabold text-[#16202a]">
                      PRO AI
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#52636a] dark:text-[#8ea299]">{user.email}</p>
              </div>
            </div>

            {/* AI Credits Meter */}
            <div className="rounded-2xl border border-[#bfe2d4] dark:border-[#27443d] bg-[#def2ea] dark:bg-[#14312a] p-4">
              <div className="flex items-center justify-between text-xs font-bold text-[#0f5c53] dark:text-[#38c9bc]">
                <span className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#e65e3d]" />
                  <span>AI Chef Credits:</span>
                </span>
                <span>{user.isPro ? '✨ Unlimited Pro AI' : `${user.aiCreditsRemaining} / 5 Left Today`}</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#b2ded0] dark:bg-[#1f473c]">
                <div
                  className="h-full bg-[#166e64] dark:bg-[#38c9bc] transition-all"
                  style={{ width: user.isPro ? '100%' : `${(user.aiCreditsRemaining / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* Pro Upgrade / Downgrade simulation */}
            <div className="flex items-center justify-between rounded-xl border border-[#ded4c1] dark:border-[#2a3c45] bg-[#fffdf9] dark:bg-[#162126] p-3 text-xs">
              <div>
                <span className="font-bold text-[#16202a] dark:text-[#f3eee4]">Pro AI Chef Mode</span>
                <p className="text-[0.7rem] text-[#52636a] dark:text-[#8ea299]">Database + Live AI Merge Generation</p>
              </div>
              <button
                onClick={handleTogglePro}
                className={`rounded-lg px-3 py-1.5 font-bold transition ${
                  user.isPro
                    ? 'bg-[#f4c453] text-[#16202a] hover:bg-[#e4b33f]'
                    : 'bg-[#166e64] text-white hover:bg-[#115e54]'
                }`}
              >
                {user.isPro ? 'Active ✓' : 'Enable Pro'}
              </button>
            </div>

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#ded4c1] dark:border-[#2a3c45] p-2.5 text-xs font-bold text-[#b8321a] dark:text-[#f9705a] hover:bg-[#feedeb] dark:hover:bg-[#301613] transition"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#16202a] dark:text-[#e4efe9] mb-1">
                Your Name / Room Nickname
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Rahul / Hostel Chef"
                className="w-full h-10 rounded-xl border border-[#d0c2ac] dark:border-[#2c3d45] bg-[#f8f3ea] dark:bg-[#11181c] px-3.5 text-xs text-[#16202a] dark:text-[#e4efe9] outline-none focus:border-[#166e64]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16202a] dark:text-[#e4efe9] mb-1">
                Google / College Email
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@college.edu"
                className="w-full h-10 rounded-xl border border-[#d0c2ac] dark:border-[#2c3d45] bg-[#f8f3ea] dark:bg-[#11181c] px-3.5 text-xs text-[#16202a] dark:text-[#e4efe9] outline-none focus:border-[#166e64]"
              />
            </div>

            {/* Google 1-Tap Button */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-[#ded4c1] dark:border-[#2c3d45] bg-white dark:bg-[#18242a] p-3 text-xs font-bold text-[#16202a] dark:text-[#f3eee4] shadow-sm hover:bg-[#f8f5ee] dark:hover:bg-[#1e2d35] transition active:scale-95"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
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
              <span>Sign in with Google</span>
            </button>

            <div className="rounded-xl bg-[#f8f5ee] dark:bg-[#11171a] p-3 text-[0.7rem] text-[#52636a] dark:text-[#8ea299] space-y-1">
              <p className="flex items-center gap-1 font-semibold text-[#166e64] dark:text-[#38c9bc]">
                <Shield size={12} />
                <span>Zero spam guarantee.</span>
              </p>
              <p>Signing in unlocks unlimited AI generations + blends our vast Civilization Database with Live AI!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
