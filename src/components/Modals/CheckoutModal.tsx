import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import confetti from 'canvas-confetti';
import { startRazorpayCheckout } from '../../services/razorpay';
import { getConsentedVisitorId } from '../../services/analytics';
import {
  X,
  MapPin,
  CheckCircle2,
  CreditCard,
  QrCode,
  Building,
  Wallet,
  Banknote,
  ShieldCheck,
  ArrowRight,
  Sparkles,
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
    placeOrder,
    setIsTrackerOpen,
    showNotification
  } = useApp();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(2); // Default on Payment as in screenshot
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking' | 'wallets' | 'cod'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    email: user?.email || '',
    line1: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [editingAddress, setEditingAddress] = useState(true);

  if (!isCheckoutOpen) return null;

  const handlePay = async () => {
    if (
      !address.name.trim() ||
      (address.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email.trim())) ||
      !address.line1.trim() ||
      !address.city.trim() ||
      !address.state.trim() ||
      !/^\d{6}$/.test(address.pincode) ||
      !/^\+?\d[\d\s()-]{8,}\d$/.test(address.phone)
    ) {
      setEditingAddress(true);
      showNotification('Please enter your name, valid phone, and complete delivery address.');
      return;
    }

    setIsProcessing(true);
    try {
      const customer = {
        name: address.name,
        phone: address.phone,
        email: address.email.trim(),
        address: {
          line1: address.line1,
          city: address.city,
          state: address.state,
          pincode: address.pincode
        }
      };
      const visitorId = getConsentedVisitorId();
      let quote = { subtotal, discount, deliveryCharge, total: finalTotal };
      let orderNumber: string;
      let verifiedPaymentMethod: 'upi' | 'card' | 'netbanking' | 'wallet' | 'cod';

      if (paymentMethod === 'cod') {
        const response = await fetch('/api/orders/cod', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cart: cart.map(({ productId, selectedSize, quantity }) => ({
              productId,
              selectedSize,
              quantity
            })),
            couponCode: appliedCoupon,
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
      } else {
        const payment = await startRazorpayCheckout({
            cart,
            couponCode: appliedCoupon,
            expectedTotal: finalTotal,
            method: paymentMethod === 'wallets' ? 'wallet' : paymentMethod,
            customer,
            visitorId
          });
        quote = payment.quote;
        orderNumber = payment.orderNumber;
        verifiedPaymentMethod = payment.paymentMethod;
      }

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#E5C158', '#dc2626', '#10b981']
      });

      const newOrder = placeOrder({
        customerName: address.name,
        phone: address.phone,
        email: address.email.trim(),
        address: customer.address,
        items: cart,
        ...quote,
        paymentMethod: verifiedPaymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
        orderStatus: 'confirmed',
        estimatedDelivery: 'Get it by 20 May - 22 May (Express Cold-Chain)'
      }, orderNumber);

      setIsCheckoutOpen(false);
      setIsTrackerOpen(true);
      showNotification(
        paymentMethod === 'cod'
          ? `Cash on delivery order ${newOrder.id} placed.`
          : `Payment verified. Order ${newOrder.id} placed successfully!`
      );
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#080d19] border-2 border-[#D4AF37]/50 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header Bar */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#060a14]">
          <h3 className="font-cinzel text-base font-bold text-white">Checkout</h3>
          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator: 1 Address -> 2 Payment -> 3 Confirm */}
        <div className="bg-black/40 px-6 py-3 border-b border-white/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-black font-bold text-[10px] flex items-center justify-center">
              ✓
            </span>
            <span className="text-gray-300 font-medium">1 Address</span>
          </div>
          <div className="w-10 h-[1px] bg-amber-500/40" />
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#E5C158] text-black font-bold text-[10px] flex items-center justify-center">
              2
            </span>
            <span className="text-amber-200 font-bold">2 Payment</span>
          </div>
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
          
          {/* DELIVERY ADDRESS CARD */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                  DELIVERY ADDRESS
                </span>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.2 rounded border border-amber-500/30">
                  Home
                </span>
              </div>
              <button
                onClick={() => setEditingAddress(!editingAddress)}
                className="text-xs text-[#E5C158] hover:underline cursor-pointer"
              >
                {editingAddress ? 'Save' : 'Change'}
              </button>
            </div>

            {editingAddress ? (
              <div className="space-y-2 pt-2">
                <input
                  type="text"
                  value={address.name}
                  onChange={(e) => setAddress({ ...address, name: e.target.value })}
                  placeholder="Full Name"
                  className="w-full p-2 rounded-lg bg-black/50 border border-white/20 text-xs text-white"
                />
                <input
                  type="tel"
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  placeholder="Phone Number"
                  className="w-full p-2 rounded-lg bg-black/50 border border-white/20 text-xs text-white"
                />
                <input
                  type="email"
                  value={address.email}
                  onChange={(e) => setAddress({ ...address, email: e.target.value })}
                  placeholder="Email (optional)"
                  autoComplete="email"
                  className="w-full p-2 rounded-lg bg-black/50 border border-white/20 text-xs text-white"
                />
                <input
                  type="text"
                  value={address.line1}
                  onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                  placeholder="Address Line"
                  className="w-full p-2 rounded-lg bg-black/50 border border-white/20 text-xs text-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    placeholder="City"
                    className="p-2 rounded-lg bg-black/50 border border-white/20 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    placeholder="State"
                    className="p-2 rounded-lg bg-black/50 border border-white/20 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                    placeholder="Pincode"
                    className="p-2 rounded-lg bg-black/50 border border-white/20 text-xs text-white"
                  />
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-300 space-y-0.5">
                <p className="font-bold text-white">{address.name}</p>
                <p className="text-gray-400">{address.line1}, {address.city}, {address.state} - {address.pincode}</p>
                <p className="text-amber-200/80 font-mono text-[11px]">{address.phone}</p>
              </div>
            )}
          </div>

          {/* PAYMENT METHODS ACCORDION / RADIO LIST */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300 block">
              PAYMENT METHODS
            </span>

            {/* UPI Option */}
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
                  <h4 className="text-xs font-bold text-white">UPI</h4>
                  <p className="text-[10px] text-gray-400">UPI apps such as Google Pay, PhonePe and Navi</p>
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

          {/* Secure Trust note */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-gray-400">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Your phone and delivery address are used to fulfill this order. Email is optional; we do not collect social-media IDs.</span>
          </div>

        </div>

        {/* Sticky Proceed to Pay Button */}
        <div className="p-4 border-t border-white/10 bg-[#060a14]">
          <button
            onClick={handlePay}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-black text-xs uppercase tracking-wider shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Connecting to Secure Gateway...
              </span>
            ) : (
              <>
                <span>PROCEED TO PAY ₹{finalTotal}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
