import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../services/supabase';
import { ArrowRight, KeyRound, LockKeyhole, LogOut, Mail, X } from 'lucide-react';

export const AuthOtpModal: React.FC = () => {
  const { isAuthOpen, setIsAuthOpen, user, setUser, showNotification } = useApp();
  const [email, setEmail] = useState(user?.email || '');
  const [name, setName] = useState(user?.name || '');
  const [otp, setOtp] = useState('');
  const [waitingForOtp, setWaitingForOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthOpen) return null;

  const sendCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      setError('Secure sign-in is not configured yet. Please contact the store owner.');
      return;
    }
    setIsLoading(true);
    setError('');
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true }
    });
    setIsLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    setWaitingForOtp(true);
    showNotification('A one-time verification code was sent to your email.');
  };

  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setIsLoading(true);
    setError('');
    const { data, error: authError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: 'email'
    });
    setIsLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    setUser({
      name: name.trim() || data.user?.email || 'AK MALA Customer',
      phone: '',
      email: data.user?.email || email.trim()
    });
    showNotification('Your email has been verified. Welcome to AK MALA.');
    setIsAuthOpen(false);
  };

  const signOut = async () => {
    const { error: authError } = await supabase?.auth.signOut() || {};
    if (authError) {
      setError(authError.message);
      return;
    }
    setUser(null);
    showNotification('Signed out safely.');
    setIsAuthOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-md">
      <div className="relative w-full max-w-sm space-y-5 rounded-3xl border-2 border-[#D4AF37]/50 bg-[#080d19] p-6 shadow-2xl">
        <button onClick={() => setIsAuthOpen(false)} className="absolute right-4 top-4 rounded-lg bg-white/5 p-1.5 text-gray-400 hover:text-white">
          <X className="h-5 w-5" />
        </button>

        {user ? (
          <div className="space-y-4 pt-2 text-center">
            <Mail className="mx-auto h-10 w-10 text-amber-300" />
            <div>
              <h3 className="font-cinzel text-lg font-bold text-white">{user.name}</h3>
              <p className="mt-1 text-xs text-gray-300">{user.email}</p>
              <p className="mt-2 text-[11px] text-gray-500">Email verified by Supabase</p>
            </div>
            <button onClick={() => void signOut()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 py-2.5 text-xs font-bold text-red-300">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        ) : (
          <div className="space-y-5 pt-2">
            <div className="text-center">
              <LockKeyhole className="mx-auto mb-3 h-9 w-9 text-amber-300" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#E5C158]">Secure customer access</span>
              <h3 className="mt-1 font-cinzel text-xl font-bold text-white">Sign in / Register</h3>
              <p className="mt-2 text-xs text-gray-400">We will email a real one-time verification code.</p>
            </div>

            {!waitingForOtp ? (
              <form onSubmit={sendCode} className="space-y-3">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Name (optional)"
                  autoComplete="name"
                  className="w-full rounded-xl border border-white/20 bg-black/50 p-3 text-xs text-white"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email address"
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/20 bg-black/50 p-3 text-xs text-white"
                />
                <button disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] py-3 text-xs font-extrabold uppercase text-black disabled:opacity-50">
                  {isLoading ? 'Sending code…' : 'Email me a code'} <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={verifyCode} className="space-y-3">
                <p className="text-center text-xs text-gray-400">Enter the code sent to {email}</p>
                <input
                  inputMode="numeric"
                  required
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  placeholder="One-time code"
                  autoComplete="one-time-code"
                  className="w-full rounded-xl border border-amber-400/50 bg-black/60 p-3 text-center font-mono text-base text-white"
                />
                <button disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs font-extrabold uppercase text-white disabled:opacity-50">
                  {isLoading ? 'Verifying…' : 'Verify email'} <KeyRound className="h-4 w-4" />
                </button>
              </form>
            )}
            {error && <p role="alert" className="text-center text-xs text-red-300">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
};
