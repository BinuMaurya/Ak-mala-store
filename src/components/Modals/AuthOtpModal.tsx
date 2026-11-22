import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../services/supabase';
import type { CustomerAddress } from '../../types';
import {
  ArrowRight, KeyRound, LockKeyhole, LogOut, Mail, MapPin, PackageCheck,
  Phone, Plus, RotateCcw, Save, Trash2, UserRound, X
} from 'lucide-react';

type LoginMethod = 'email' | 'phone';
type AddressForm = Omit<CustomerAddress, 'id'>;

const emptyAddress: AddressForm = {
  label: 'Home',
  recipientName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
  isDefault: false
};

interface AuthOtpModalProps {
  onOpenOrders?: () => void;
}

export const AuthOtpModal: React.FC<AuthOtpModalProps> = ({ onOpenOrders }) => {
  const {
    isAuthOpen, setIsAuthOpen, user, setUser, showNotification,
    customerAddresses, isCustomerAccountLoading, saveCustomerAddress, deleteCustomerAddress
  } = useApp();
  const [method, setMethod] = useState<LoginMethod>('email');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [name, setName] = useState(user?.name || '');
  const [otp, setOtp] = useState('');
  const [waitingForOtp, setWaitingForOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddresses, setShowAddresses] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | undefined>();
  const [addressForm, setAddressForm] = useState<AddressForm>(emptyAddress);
  const [linkMethod, setLinkMethod] = useState<LoginMethod | null>(null);
  const [linkDestination, setLinkDestination] = useState('');
  const [linkOtp, setLinkOtp] = useState('');
  const [linkCodeSent, setLinkCodeSent] = useState(false);

  if (!isAuthOpen) return null;

  const normalizePhone = (value: string) => {
    const compact = value.replace(/[\s()-]/g, '');
    if (/^[6-9]\d{9}$/.test(compact)) return `+91${compact}`;
    if (/^\+[1-9]\d{7,14}$/.test(compact)) return compact;
    return '';
  };
  const normalizedPhone = () => normalizePhone(phone);

  const sendCode = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    if (!supabase) {
      setError('Secure sign-in is not configured yet. Please contact the store owner.');
      return;
    }
    const destination = method === 'email' ? email.trim() : normalizedPhone();
    if (!destination) {
      setError(method === 'phone' ? 'Enter a valid phone number with country code.' : 'Enter a valid email address.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithOtp(
        method === 'email'
          ? {
              email: destination,
              options: {
                shouldCreateUser: true,
                emailRedirectTo: window.location.origin,
                data: name.trim() ? { full_name: name.trim() } : undefined
              }
            }
          : {
              phone: destination,
              options: { shouldCreateUser: true, data: name.trim() ? { full_name: name.trim() } : undefined }
            }
      );
      if (authError) {
        setError(authError.message);
        return;
      }
      setWaitingForOtp(true);
      showNotification(method === 'email' ? 'Check your email for a sign-in link or 6-digit code.' : 'Check your phone for the 6-digit sign-in code.');
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'The sign-in code could not be sent.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    const destination = method === 'email' ? email.trim() : normalizedPhone();
    setIsLoading(true);
    setError('');
    try {
      const { data, error: authError } = await supabase.auth.verifyOtp(
        method === 'email'
          ? { email: destination, token: otp.trim(), type: 'email' }
          : { phone: destination, token: otp.trim(), type: 'sms' }
      );
      if (authError) {
        setError(authError.message);
        return;
      }
      let verifiedName = name.trim();
      if (verifiedName) {
        const { data: updatedUser, error: profileError } = await supabase.auth.updateUser({
          data: { full_name: verifiedName }
        });
        if (profileError) {
          showNotification('Signed in, but your profile name could not be saved.');
        } else {
          verifiedName = updatedUser.user.user_metadata.full_name || verifiedName;
        }
      }
      const authenticatedUser = data.user;
      if (!authenticatedUser) {
        setError('Verification succeeded but the customer session could not be created. Please try again.');
        return;
      }
      setUser({
        id: authenticatedUser.id,
        name: verifiedName || authenticatedUser.user_metadata?.full_name || authenticatedUser.email || authenticatedUser.phone || 'AK MALA Customer',
        phone: authenticatedUser.phone || '',
        email: authenticatedUser.email
      });
      showNotification('Your account has been verified. Welcome to AK MALA.');
      setIsAuthOpen(false);
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'The verification code could not be confirmed.');
    } finally {
      setIsLoading(false);
    }
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

  const saveAddress = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await saveCustomerAddress({
        ...addressForm,
        ...(editingAddressId ? { id: editingAddressId } : {})
      });
      setAddressForm(emptyAddress);
      setEditingAddressId(undefined);
      showNotification('Delivery address saved to your account.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Delivery address could not be saved.');
    } finally {
      setIsLoading(false);
    }
  };

  const removeAddress = async (id: string) => {
    setError('');
    try {
      await deleteCustomerAddress(id);
      showNotification('Delivery address removed.');
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Delivery address could not be removed.');
    }
  };

  const editAddress = (address: CustomerAddress) => {
    const { id, ...fields } = address;
    setEditingAddressId(id);
    setAddressForm(fields);
  };

  const sendContactCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || !linkMethod) return;
    const destination = linkMethod === 'email' ? linkDestination.trim() : normalizePhone(linkDestination);
    if (!destination) {
      setError(linkMethod === 'phone' ? 'Enter a valid phone number with country code.' : 'Enter a valid email address.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const { error: updateError } = await supabase.auth.updateUser(
        linkMethod === 'email' ? { email: destination } : { phone: destination }
      );
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setLinkDestination(destination);
      setLinkCodeSent(true);
      showNotification(`A verification code was sent to your ${linkMethod}.`);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'The verification code could not be sent.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyContactCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || !linkMethod) return;
    setIsLoading(true);
    setError('');
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp(
        linkMethod === 'email'
          ? { email: linkDestination, token: linkOtp.trim(), type: 'email_change' }
          : { phone: linkDestination, token: linkOtp.trim(), type: 'phone_change' }
      );
      if (verifyError) {
        setError(verifyError.message);
        return;
      }
      if (!data.user) {
        setError('Contact verification completed, but the updated account could not be loaded. Please sign in again.');
        return;
      }
      setUser({
        id: data.user.id,
        name: data.user.user_metadata?.full_name || user?.name || 'AK MALA Customer',
        phone: data.user.phone || '',
        email: data.user.email
      });
      setLinkMethod(null);
      setLinkDestination('');
      setLinkOtp('');
      setLinkCodeSent(false);
      showNotification('Verified contact added to your customer account.');
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'The verification code could not be confirmed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-md">
      <div className="relative max-h-[92vh] w-full max-w-md space-y-5 overflow-y-auto rounded-3xl border-2 border-[#D4AF37]/50 bg-[#080d19] p-6 shadow-2xl">
        <button onClick={() => setIsAuthOpen(false)} className="absolute right-4 top-4 rounded-lg bg-white/5 p-1.5 text-gray-400 hover:text-white" aria-label="Close account">
          <X className="h-5 w-5" />
        </button>

        {user ? (
          <div className="space-y-4 pt-2">
            <div className="text-center">
              <UserRound className="mx-auto h-10 w-10 text-amber-300" />
              <h3 className="mt-2 font-cinzel text-lg font-bold text-white">{user.name}</h3>
              <p className="mt-1 text-xs text-gray-300">{user.email || 'Email not connected'}</p>
              <p className="mt-1 text-xs text-gray-300">{user.phone || 'Phone not connected'}</p>
              <p className="mt-2 text-[11px] text-gray-500">Signed in securely with Supabase</p>
            </div>
            {(!user.email || !user.phone) && (
              <div className="space-y-2">
                {!user.email && <button type="button" onClick={() => { setLinkMethod('email'); setLinkDestination(''); setLinkCodeSent(false); setError(''); }} className="w-full rounded-lg border border-white/15 py-2 text-xs text-amber-200">Connect an email to this account</button>}
                {!user.phone && <button type="button" onClick={() => { setLinkMethod('phone'); setLinkDestination(''); setLinkCodeSent(false); setError(''); }} className="w-full rounded-lg border border-white/15 py-2 text-xs text-amber-200">Connect a phone to this account</button>}
              </div>
            )}
            {linkMethod && (
              <form onSubmit={linkCodeSent ? verifyContactCode : sendContactCode} className="space-y-2 rounded-xl border border-amber-400/20 p-3">
                {!linkCodeSent ? (
                  <>
                    <p className="text-xs text-gray-300">Verify this {linkMethod} to add it to your current account.</p>
                    <input
                      required
                      type={linkMethod === 'email' ? 'email' : 'tel'}
                      value={linkDestination}
                      onChange={(event) => setLinkDestination(event.target.value)}
                      placeholder={linkMethod === 'email' ? 'Email address' : 'Phone (e.g. +91 9876543210)'}
                      className="w-full rounded-lg border border-white/15 bg-black/50 p-2 text-xs text-white"
                    />
                  </>
                ) : (
                  <>
                    <p className="text-xs text-gray-300">Enter the verification code sent to {linkDestination}.</p>
                    <input required inputMode="numeric" value={linkOtp} onChange={(event) => setLinkOtp(event.target.value)} placeholder="6-digit code" className="w-full rounded-lg border border-white/15 bg-black/50 p-2 text-center text-xs text-white" />
                  </>
                )}
                <div className="flex gap-2">
                  <button disabled={isLoading} className="flex-1 rounded-lg bg-amber-400 py-2 text-xs font-bold text-black disabled:opacity-50">{isLoading ? 'Verifying…' : linkCodeSent ? 'Verify contact' : 'Send verification code'}</button>
                  <button type="button" onClick={() => { setLinkMethod(null); setLinkCodeSent(false); setError(''); }} className="rounded-lg border border-white/20 px-3 text-xs text-gray-300">Cancel</button>
                </div>
              </form>
            )}
            <button onClick={() => { setShowAddresses((value) => !value); setError(''); }} className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/40 py-2.5 text-xs font-bold text-amber-200">
              <MapPin className="h-4 w-4" /> {showAddresses ? 'Hide saved addresses' : 'Manage saved addresses'}
            </button>
            <button onClick={onOpenOrders} className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 py-2.5 text-xs font-bold text-white">
              <PackageCheck className="h-4 w-4" /> My orders
            </button>

            {showAddresses && (
              <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-200">Saved delivery addresses</h4>
                {isCustomerAccountLoading ? <p className="text-xs text-gray-400">Loading account…</p> : customerAddresses.map((address) => (
                  <div key={address.id} className="rounded-lg border border-white/10 p-3 text-xs text-gray-200">
                    <div className="flex justify-between gap-2">
                      <strong>{address.label}{address.isDefault ? ' · Default' : ''}</strong>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => editAddress(address)} className="text-amber-200">Edit</button>
                        <button type="button" onClick={() => void removeAddress(address.id)} className="text-red-300" aria-label={`Remove ${address.label} address`}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                    <p className="mt-1">{address.recipientName} · {address.phone}</p>
                    <p>{address.line1}{address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state} {address.pincode}</p>
                  </div>
                ))}
                {!isCustomerAccountLoading && customerAddresses.length === 0 && (
                  <p className="text-xs text-gray-400">No saved addresses yet. Add one below for faster checkout.</p>
                )}
                <form onSubmit={saveAddress} className="space-y-2 border-t border-white/10 pt-3">
                  <h5 className="text-xs font-bold text-white">{editingAddressId ? 'Edit address' : 'Add address'}</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <input required value={addressForm.label} onChange={(event) => setAddressForm({ ...addressForm, label: event.target.value })} placeholder="Label (Home)" className="rounded-lg border border-white/15 bg-black/50 p-2 text-xs text-white" />
                    <input required value={addressForm.recipientName} onChange={(event) => setAddressForm({ ...addressForm, recipientName: event.target.value })} placeholder="Recipient name" className="rounded-lg border border-white/15 bg-black/50 p-2 text-xs text-white" />
                    <input required type="tel" value={addressForm.phone} onChange={(event) => setAddressForm({ ...addressForm, phone: event.target.value })} placeholder="Phone" className="rounded-lg border border-white/15 bg-black/50 p-2 text-xs text-white" />
                    <input required value={addressForm.pincode} onChange={(event) => setAddressForm({ ...addressForm, pincode: event.target.value })} placeholder="6-digit PIN code" maxLength={6} inputMode="numeric" className="rounded-lg border border-white/15 bg-black/50 p-2 text-xs text-white" />
                  </div>
                  <input required value={addressForm.line1} onChange={(event) => setAddressForm({ ...addressForm, line1: event.target.value })} placeholder="Address line 1" className="w-full rounded-lg border border-white/15 bg-black/50 p-2 text-xs text-white" />
                  <input value={addressForm.line2 || ''} onChange={(event) => setAddressForm({ ...addressForm, line2: event.target.value })} placeholder="Landmark / Address line 2 (optional)" className="w-full rounded-lg border border-white/15 bg-black/50 p-2 text-xs text-white" />
                  <div className="grid grid-cols-2 gap-2">
                    <input required value={addressForm.city} onChange={(event) => setAddressForm({ ...addressForm, city: event.target.value })} placeholder="City" className="rounded-lg border border-white/15 bg-black/50 p-2 text-xs text-white" />
                    <input required value={addressForm.state} onChange={(event) => setAddressForm({ ...addressForm, state: event.target.value })} placeholder="State" className="rounded-lg border border-white/15 bg-black/50 p-2 text-xs text-white" />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-gray-300">
                    <input type="checkbox" checked={addressForm.isDefault} onChange={(event) => setAddressForm({ ...addressForm, isDefault: event.target.checked })} />
                    Make this my default address
                  </label>
                  <div className="flex gap-2">
                    <button disabled={isLoading} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-400 py-2 text-xs font-bold text-black disabled:opacity-50">
                      {editingAddressId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      {isLoading ? 'Saving…' : editingAddressId ? 'Update address' : 'Save address'}
                    </button>
                    {editingAddressId && <button type="button" onClick={() => { setEditingAddressId(undefined); setAddressForm(emptyAddress); }} className="rounded-lg border border-white/20 px-3 text-xs text-white">Cancel</button>}
                  </div>
                </form>
              </div>
            )}

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
              <p className="mt-2 text-xs text-gray-400">Use email OTP or phone SMS OTP for your customer account.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => { setMethod('email'); setWaitingForOtp(false); setError(''); }} className={`flex items-center justify-center gap-2 rounded-lg border p-2 text-xs ${method === 'email' ? 'border-amber-300 text-amber-200' : 'border-white/10 text-gray-400'}`}><Mail className="h-4 w-4" /> Email OTP</button>
              <button type="button" onClick={() => { setMethod('phone'); setWaitingForOtp(false); setError(''); }} className={`flex items-center justify-center gap-2 rounded-lg border p-2 text-xs ${method === 'phone' ? 'border-amber-300 text-amber-200' : 'border-white/10 text-gray-400'}`}><Phone className="h-4 w-4" /> Phone OTP</button>
            </div>

            {!waitingForOtp ? (
              <form onSubmit={sendCode} className="space-y-3">
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name (optional)" autoComplete="name" className="w-full rounded-xl border border-white/20 bg-black/50 p-3 text-xs text-white" />
                {method === 'email' ? (
                  <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" autoComplete="email" className="w-full rounded-xl border border-white/20 bg-black/50 p-3 text-xs text-white" />
                ) : (
                  <input type="tel" required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone number (e.g. +91 9876543210)" autoComplete="tel" className="w-full rounded-xl border border-white/20 bg-black/50 p-3 text-xs text-white" />
                )}
                <button disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] py-3 text-xs font-extrabold uppercase text-black disabled:opacity-50">
                  {isLoading ? 'Sending…' : method === 'email' ? 'Email me a sign-in link / code' : 'Text me a sign-in code'} <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={verifyCode} className="space-y-3">
                <p className="text-center text-xs text-gray-400">
                  Enter the 6-digit code sent to {method === 'email' ? email : normalizedPhone()}.
                </p>
                <input inputMode="numeric" required value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="6-digit code" autoComplete="one-time-code" className="w-full rounded-xl border border-amber-400/50 bg-black/60 p-3 text-center font-mono text-base text-white" />
                <button disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs font-extrabold uppercase text-white disabled:opacity-50">
                  {isLoading ? 'Verifying…' : 'Verify code'} <KeyRound className="h-4 w-4" />
                </button>
                <button type="button" disabled={isLoading} onClick={() => void sendCode()} className="flex w-full items-center justify-center gap-1.5 pt-1 text-[11px] text-amber-300 hover:underline">
                  <RotateCcw className="h-3 w-3" /> Resend code
                </button>
              </form>
            )}
            {error && <p role="alert" className="text-center text-xs text-red-300">{error}</p>}
          </div>
        )}
        {error && user && <p role="alert" className="text-center text-xs text-red-300">{error}</p>}
      </div>
    </div>
  );
};
