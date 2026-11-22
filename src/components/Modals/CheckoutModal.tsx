import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../services/supabase';
import confetti from 'canvas-confetti';
import { startRazorpayCheckout } from '../../services/razorpay';
import { getConsentedVisitorId } from '../../services/analytics';
import {
  X,
  CreditCard,
  QrCode,
  Building,
  Wallet,
  Banknote,
  ArrowRight,
  Lock
} from 'lucide-react';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cart,
    subtotal,
    discount,
    appliedCoupon,
    deliveryCharge,
    finalTotal,
    user,
    customerAddresses,
    refreshCustomerAccount,
    placeOrder,
    setIsTrackerOpen,
    showNotification
  } = useApp();

  const [step, setStep] = useState<'address' | 'payment'>('address');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking' | 'wallets' | 'cod'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [address, setAddress] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: ''
  });

  useEffect(() => {
    if (!isCheckoutOpen) return;
    const savedAddress = customerAddresses.find((item) => item.isDefault) || customerAddresses[0];
    if (savedAddress) {
      setSelectedAddressId(savedAddress.id);
      setAddress((current) => ({
        ...current,
        name: savedAddress.recipientName,
        phone: savedAddress.phone,
        line1: savedAddress.line1,
        line2: savedAddress.line2 || '',
        city: savedAddress.city,
        state: savedAddress.state,
        pincode: savedAddress.pincode,
        email: user?.email || current.email
      }));
      return;
    }
    setSelectedAddressId('');
    setAddress((current) => ({
      ...current,
      name: user?.name || current.name,
      phone: user?.phone || current.phone,
      email: user?.email || current.email
    }));
  }, [isCheckoutOpen, user?.id, user?.name, user?.phone, user?.email, customerAddresses]);

  if (!isCheckoutOpen) return null;

  const isValidAddress = () =>
    Boolean(
      address.name.trim() &&
      (!address.email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email.trim())) &&
      address.line1.trim() &&
      address.city.trim() &&
      address.state.trim() &&
      /^\d{6}$/.test(address.pincode.trim()) &&
      /^\+?\d[\d\s()-]{8,}\d$/.test(address.phone.trim())
    );

  const handleContinueToPayment = () => {
    if (!isValidAddress()) {
      showNotification('Pehle Name, valid Phone, Address, City, State aur 6-digit Pincode bharo.');
      return;
    }
    setStep('payment');
  };

  const handlePay = async () => {
    if (!isValidAddress()) {
      setStep('address');
      showNotification('Delivery address adhoora hai. Pehle address complete karo.');
      return;
    }

    setIsProcessing(true);
    try {
      const customer = {
        name: address.name.trim(),
        phone: address.phone.trim(),
        email: address.email.trim() || null,
        address: {
          line1: address.line1.trim(),
          line2: address.line2.trim(),
          city: address.city.trim(),
          state: address.state.trim(),
          pincode: address.pincode.trim()
        }
      };
      const visitorId = getConsentedVisitorId();
      let accessToken: string | undefined;
      if (user) {
        if (!supabase) throw new Error('Your account session is unavailable. Sign in again before placing this order.');
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        accessToken = sessionData.session?.access_token;
        if (!accessToken) throw new Error('Your account session has expired. Sign in again before placing this order.');
      }
      let quote = { subtotal, discount, deliveryCharge, total: finalTotal };
      let orderNumber: string;
      let verifiedPaymentMethod: 'upi' | 'card' | 'netbanking' | 'wallet' | 'cod';
      let verifiedPaymentStatus: 'pending' | 'paid' = 'paid';

      if (paymentMethod === 'cod') {
        const response = await fetch('/api/orders/cod', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
          },
          body: JSON.stringify({
            cart: cart.map(({ productId, selectedSize, quantity }) => ({
              productId,
              selectedSize,
              quantity
            })),
            couponCode: discount > 0 ? appliedCoupon : null,
            customer,
            visitorId
          })
        });
        const result = await response.json() as {
          order?: { order_number: string; total: number; subtotal: number; discount: number; delivery_charge: number };
          error?: string;
        };
        if (!response.ok || !result.order) {
          throw new Error(result.error || 'Unable to save your order. Please try again.');
        }
        orderNumber = result.order.order_number;
        quote = {
          subtotal: result.order.subtotal,
          discount: result.order.discount,
          deliveryCharge: result.order.delivery_charge,
          total: result.order.total
        };
        verifiedPaymentMethod = 'cod';
        verifiedPaymentStatus = 'pending';
      } else {
        const payment = await startRazorpayCheckout({
          cart,
          couponCode: discount > 0 ? appliedCoupon : null,
          expectedTotal: finalTotal,
          method: paymentMethod === 'wallets' ? 'wallet' : paymentMethod,
          customer: {
            ...customer,
            email: customer.email || ''
          },
          visitorId,
          accessToken
        });
        quote = payment.quote;
        orderNumber = payment.orderNumber;
        verifiedPaymentMethod = payment.paymentMethod;
        verifiedPaymentStatus = 'paid';
      }

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#E5C158', '#dc2626', '#10b981']
      });

      const newOrder = placeOrder({
        customerName: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address,
        items: cart,
        ...quote,
        paymentMethod: verifiedPaymentMethod,
        paymentStatus: verifiedPaymentStatus,
        orderStatus: 'confirmed',
        estimatedDelivery: 'Get it by 20 May - 22 May (Express Cold-Chain)'
      }, orderNumber);

      if (user) {
        try {
          await refreshCustomerAccount();
        } catch (accountError) {
          console.error('Order placed but account history could not be refreshed:', accountError);
          showNotification('Order placed, but account history could not refresh. Reopen your account to retry.');
        }
      }
      setIsCheckoutOpen(false);
      setIsTrackerOpen(true);
      showNotification(
        paymentMethod === 'cod'
          ? `Cash on delivery order ${newOrder.id} placed.`
          : `Payment verified. Order ${newOrder.id} placed successfully!`
      );
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Order submit nahi ho paya.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#080d19] border-2 border-[#D4AF37]/50 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">

        {/* Header Bar */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#060a14]">
          <div>
            <h3 className="font-cinzel text-base font-bold text-white">Checkout</h3>
            <p className="text-[11px] text-amber-200/80">Order Total: ₹{finalTotal}</p>
          </div>
          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="bg-black/40 px-6 py-3 border-b border-white/5 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setStep('address')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span className={`w-5 h-5 rounded-full font-bold text-[10px] flex items-center justify-center ${
              isValidAddress() ? 'bg-emerald-500 text-black' : 'bg-[#E5C158] text-black'
            }`}>
              {isValidAddress() ? '✓' : '1'}
            </span>
            <span className={step === 'address' ? 'text-amber-200 font-bold' : 'text-gray-300 font-medium'}>
              1 Address
            </span>
          </button>
          <div className="w-10 h-[1px] bg-amber-500/40" />
          <button
            type="button"
            onClick={handleContinueToPayment}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span className={`w-5 h-5 rounded-full font-bold text-[10px] flex items-center justify-center ${
              step === 'payment' ? 'bg-[#E5C158] text-black' : 'bg-white/10 text-gray-400'
            }`}>
              2
            </span>
            <span className={step === 'payment' ? 'text-amber-200 font-bold' : 'text-gray-500'}>
              2 Payment
            </span>
          </button>
          <div className="w-10 h-[1px] bg-white/20" />
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-white/10 text-gray-400 font-bold text-[10px] flex items-center justify-center">
              3
            </span>
            <span className="text-gray-500">3 Confirm</span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">

          {step === 'address' ? (
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-200">
                  DELIVERY ADDRESS (COMPULSORY)
                </span>
                <span className="text-[11px] text-gray-400">Total: ₹{finalTotal}</span>
              </div>

              {customerAddresses.length > 0 && (
                <select
                  value={selectedAddressId}
                  onChange={(event) => {
                    const selected = customerAddresses.find((item) => item.id === event.target.value);
                    setSelectedAddressId(event.target.value);
                    if (selected) {
                      setAddress({
                        ...address,
                        name: selected.recipientName,
                        phone: selected.phone,
                        line1: selected.line1,
                        line2: selected.line2 || '',
                        city: selected.city,
                        state: selected.state,
                        pincode: selected.pincode
                      });
                    }
                  }}
                  className="w-full rounded-lg border border-amber-400/30 bg-black/50 p-2.5 text-xs text-white"
                  aria-label="Choose a saved address"
                >
                  <option value="">Enter a new address</option>
                  {customerAddresses.map((savedAddress) => (
                    <option key={savedAddress.id} value={savedAddress.id}>
                      {savedAddress.label}{savedAddress.isDefault ? ' (Default)' : ''} — {savedAddress.city}, {savedAddress.pincode}
                    </option>
                  ))}
                </select>
              )}

              <input
                type="text"
                value={address.name}
                onChange={(e) => setAddress({ ...address, name: e.target.value })}
                placeholder="Full Name *"
                className="w-full p-2.5 rounded-lg bg-black/50 border border-white/20 text-xs text-white"
              />
              <input
                type="tel"
                value={address.phone}
                onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                placeholder="Phone Number (10 digits) *"
                className="w-full p-2.5 rounded-lg bg-black/50 border border-white/20 text-xs text-white"
              />
              <input
                type="email"
                value={address.email}
                onChange={(e) => setAddress({ ...address, email: e.target.value })}
                placeholder="Email (optional)"
                autoComplete="email"
                className="w-full p-2.5 rounded-lg bg-black/50 border border-white/20 text-xs text-white"
              />
              <input
                type="text"
                value={address.line1}
                onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                placeholder="House No., Street, Area / Landmark *"
                className="w-full p-2.5 rounded-lg bg-black/50 border border-white/20 text-xs text-white"
              />
              <input
                type="text"
                value={address.line2}
                onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                placeholder="Landmark / Address line 2 (optional)"
                className="w-full p-2.5 rounded-lg bg-black/50 border border-white/20 text-xs text-white"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  placeholder="City *"
                  className="p-2.5 rounded-lg bg-black/50 border border-white/20 text-xs text-white"
                />
                <input
                  type="text"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  placeholder="State *"
                  className="p-2.5 rounded-lg bg-black/50 border border-white/20 text-xs text-white"
                />
                <input
                  type="text"
                  value={address.pincode}
                  onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                  placeholder="6-Digit Pincode *"
                  maxLength={6}
                  className="p-2.5 rounded-lg bg-black/50 border border-white/20 text-xs text-white"
                />
              </div>
            </div>
          ) : (
            <>
              {/* Selected Address Summary */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start justify-between gap-3">
                <div className="text-xs text-gray-300 space-y-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    DELIVERING TO
                  </p>
                  <p className="font-bold text-white">{address.name} ({address.phone})</p>
                  <p className="text-gray-400">
                    {address.line1}{address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state} - {address.pincode}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('address')}
                  className="text-xs text-[#E5C158] hover:underline shrink-0 cursor-pointer"
                >
                  Edit
                </button>
              </div>

              {/* PAYMENT METHODS */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-300 block">
                    RAZORPAY PAYMENT METHODS
                  </span>
                  <span className="text-[11px] text-amber-200 font-semibold">
                    Exact Amount: ₹{finalTotal}
                  </span>
                </div>

                {/* Razorpay UPI */}
                <label
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    paymentMethod === 'upi'
                      ? 'bg-amber-500/15 border-amber-400 shadow-sm ring-1 ring-amber-400/50'
                      : 'bg-white/[0.02] border-white/10 hover:border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-[#E5C158] flex items-center justify-center">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">UPI / QR (Razorpay)</h4>
                      <p className="text-[10px] text-gray-400">Google Pay, PhonePe, Paytm, BHIM & UPI apps</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payOption"
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                    className="w-4 h-4 text-amber-500 accent-amber-500"
                  />
                </label>

                {/* Credit / Debit Card */}
                <label
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    paymentMethod === 'card'
                      ? 'bg-amber-500/15 border-amber-400 shadow-sm ring-1 ring-amber-400/50'
                      : 'bg-white/[0.02] border-white/10 hover:border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Credit / Debit Card</h4>
                      <p className="text-[10px] text-gray-400">Visa, Mastercard, RuPay</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payOption"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="w-4 h-4 text-amber-500 accent-amber-500"
                  />
                </label>

                {/* Net Banking */}
                <label
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    paymentMethod === 'netbanking'
                      ? 'bg-amber-500/15 border-amber-400 shadow-sm ring-1 ring-amber-400/50'
                      : 'bg-white/[0.02] border-white/10 hover:border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Net Banking</h4>
                      <p className="text-[10px] text-gray-400">All major Indian banks</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payOption"
                    checked={paymentMethod === 'netbanking'}
                    onChange={() => setPaymentMethod('netbanking')}
                    className="w-4 h-4 text-amber-500 accent-amber-500"
                  />
                </label>

                {/* Wallets */}
                <label
                  onClick={() => setPaymentMethod('wallets')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    paymentMethod === 'wallets'
                      ? 'bg-amber-500/15 border-amber-400 shadow-sm ring-1 ring-amber-400/50'
                      : 'bg-white/[0.02] border-white/10 hover:border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Wallets</h4>
                      <p className="text-[10px] text-gray-400">PhonePe, Paytm, Amazon Pay</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payOption"
                    checked={paymentMethod === 'wallets'}
                    onChange={() => setPaymentMethod('wallets')}
                    className="w-4 h-4 text-amber-500 accent-amber-500"
                  />
                </label>

                {/* Cash on Delivery */}
                <label
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    paymentMethod === 'cod'
                      ? 'bg-amber-500/15 border-amber-400 shadow-sm ring-1 ring-amber-400/50'
                      : 'bg-white/[0.02] border-white/10 hover:border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-300 flex items-center justify-center">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Cash on Delivery</h4>
                      <p className="text-[10px] text-gray-400">Pay when you receive the sacred parcel</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payOption"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="w-4 h-4 text-amber-500 accent-amber-500"
                  />
                </label>
              </div>
            </>
          )}

          {/* Secure Trust note */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-gray-400">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Payments Razorpay ke through exact order amount (₹{finalTotal}) ke saath securely process hote hain.</span>
          </div>

        </div>

        {/* Sticky Footer Button */}
        <div className="p-4 border-t border-white/10 bg-[#060a14]">
          {isProcessing ? (
            <div
              className="flex items-center justify-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 py-2"
              role="status"
              aria-live="polite"
            >
              <span
                className="h-8 w-8 shrink-0 animate-spin rounded-full border-2 border-amber-500/25 border-t-amber-300"
                aria-hidden="true"
              />
              <div>
                <p className="text-xs font-bold text-amber-100">Processing your order...</p>
                <p className="mt-1 text-[10px] text-gray-400">
                  Please wait while we securely confirm it.
                </p>
              </div>
            </div>
          ) : step === 'address' ? (
            <button
              type="button"
              onClick={handleContinueToPayment}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-black text-xs uppercase tracking-wider shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>CONTINUE TO PAYMENT (₹{finalTotal})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePay}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-black text-xs uppercase tracking-wider shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>
                {paymentMethod === 'cod'
                  ? 'PLACE ORDER (COD)'
                  : `PROCEED TO PAY ₹${finalTotal}`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};