import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, Clock, Package, Search, Truck, X } from 'lucide-react';

interface TrackedOrder {
  orderNumber: string;
  createdAt: string;
  total: number;
  paymentStatus: string;
  orderStatus: string;
}

const orderStages = [
  { value: 'confirmed', label: 'Order confirmed', description: 'Your order is saved with the store.' },
  { value: 'packed', label: 'Packed', description: 'The store has marked this order as packed.' },
  { value: 'shipped', label: 'Shipped', description: 'The store has marked this order as shipped.' },
  { value: 'out_for_delivery', label: 'Out for delivery', description: 'A delivery OTP was sent to your checkout phone. Share it only with your delivery agent.' },
  { value: 'delivered', label: 'Delivered', description: 'The store has marked this order delivered.' }
] as const;

export const OrderTrackerModal: React.FC = () => {
  const {
    isTrackerOpen,
    setIsTrackerOpen,
    orders,
    activeTrackingId,
    setActiveTrackingId
  } = useApp();
  const [inputOrderId, setInputOrderId] = useState(activeTrackingId);
  const [phone, setPhone] = useState('');
  const [trackingPhone, setTrackingPhone] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<TrackedOrder | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupVersion, setLookupVersion] = useState(0);

  useEffect(() => {
    setInputOrderId(activeTrackingId);
    const savedOrder = orders.find((order) => order.id.toLowerCase() === activeTrackingId.toLowerCase());
    if (savedOrder?.phone) {
      setPhone(savedOrder.phone);
      setTrackingPhone(savedOrder.phone);
    }
  }, [activeTrackingId, orders]);

  useEffect(() => {
    if (!isTrackerOpen || !activeTrackingId || !trackingPhone.trim()) return;
    let cancelled = false;
    let timer: number | undefined;
    const lookup = async () => {
      try {
        const response = await fetch('/api/orders/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderNumber: activeTrackingId, phone: trackingPhone })
        });
        const result = await response.json() as { order?: TrackedOrder; error?: string };
        if (!response.ok || !result.order) {
          throw new Error(result.error || 'Order not found. Check the order number and checkout phone number.');
        }
        if (!cancelled) {
          setTrackedOrder(result.order);
          setLookupError('');
        }
        return true;
      } catch (error) {
        if (!cancelled) {
          setTrackedOrder(null);
          setLookupError(error instanceof Error ? error.message : 'Unable to look up this order.');
        }
        return false;
      } finally {
        if (!cancelled) setIsLookingUp(false);
      }
    };

    setIsLookingUp(true);
    void lookup().then((found) => {
      if (found && !cancelled) timer = window.setInterval(() => void lookup(), 10_000);
    });
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [isTrackerOpen, activeTrackingId, trackingPhone, lookupVersion]);

  if (!isTrackerOpen) return null;

  const currentStage = trackedOrder
    ? orderStages.findIndex((stage) => stage.value === trackedOrder.orderStatus)
    : -1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-md">
      <div className="relative my-auto flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border-2 border-[#D4AF37]/50 bg-[#080d19] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 bg-[#060a14] p-4">
          <h3 className="font-cinzel text-base font-bold text-white">Order Tracking</h3>
          <button onClick={() => setIsTrackerOpen(false)} className="rounded-lg bg-white/5 p-1.5 text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            setTrackedOrder(null);
            setLookupError('');
            setActiveTrackingId(inputOrderId.trim().toUpperCase());
            setTrackingPhone(phone.trim());
            setLookupVersion((version) => version + 1);
          }}
          className="space-y-2 border-b border-white/5 bg-black/30 p-4"
        >
          <div className="relative">
            <input
              type="text"
              value={inputOrderId}
              onChange={(event) => setInputOrderId(event.target.value)}
              placeholder="Enter your order number"
              aria-label="Order number"
              className="w-full rounded-xl border border-white/20 bg-black/60 py-2 pl-9 pr-20 text-xs uppercase text-white focus:border-amber-400 focus:outline-none"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-amber-400" />
          </div>
          <div className="flex gap-2">
            <input
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Checkout phone number"
              aria-label="Checkout phone number"
              className="min-w-0 flex-1 rounded-xl border border-white/20 bg-black/60 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
            <button type="submit" disabled={isLookingUp} className="rounded-lg bg-amber-500/20 px-4 py-2 text-[11px] font-bold text-amber-300 disabled:opacity-50">
              {isLookingUp ? 'Checking…' : 'Track'}
            </button>
          </div>
        </form>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {trackedOrder ? (
            <>
              <div className="rounded-2xl border border-amber-500/20 bg-white/[0.03] p-4">
                <span className="mb-0.5 block text-[10px] uppercase tracking-widest text-gray-400">Order number</span>
                <h4 className="font-mono text-base font-black text-[#F3E5AB]">{trackedOrder.orderNumber}</h4>
                <p className="mt-1 text-[11px] text-gray-400">Placed {new Date(trackedOrder.createdAt).toLocaleString()}</p>
                <p className="mt-2 text-xs text-amber-200">
                  Payment: {trackedOrder.paymentStatus} · ₹{trackedOrder.total.toLocaleString('en-IN')}
                </p>
              </div>

              {trackedOrder.paymentStatus === 'pending' && (
                <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200">
                  Payment confirmation is pending. Contact the store if your payment was debited.
                </p>
              )}

              <div className="space-y-5 pl-2">
                {orderStages.map((stage, index) => {
                  const isDone = currentStage >= index;
                  const isCurrent = currentStage === index;
                  const Icon = index === 0 ? CheckCircle2 : index === 1 ? Package : index === 4 ? CheckCircle2 : Truck;
                  return (
                    <div key={stage.value} className="relative flex items-start gap-4">
                      {index < orderStages.length - 1 && (
                        <div className={`absolute left-3.5 top-7 h-10 w-[2px] ${isDone ? 'bg-emerald-500' : 'bg-white/10'}`} />
                      )}
                      <div className={`z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        isDone ? 'bg-emerald-500 text-black' : 'border border-white/20 bg-white/10 text-gray-500'
                      } ${isCurrent ? 'ring-4 ring-amber-400/30' : ''}`}>
                        {isDone ? <Icon className="h-4 w-4" /> : <Clock className="h-3.5 w-3.5" />}
                      </div>
                      <div className="flex-1">
                        <h5 className={`text-xs font-bold ${isDone ? 'text-white' : 'text-gray-400'}`}>{stage.label}</h5>
                        <p className="mt-0.5 text-[11px] text-gray-400">{stage.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {trackedOrder.orderStatus === 'delivered' && (
                <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center text-xs text-emerald-200">
                  Delivery OTP verified. Your order is complete.
                </p>
              )}
              {lookupError && <p role="status" className="text-center text-[11px] text-amber-200">{lookupError}</p>}
              <p className="text-center text-[10px] text-gray-500">Order status refreshes automatically. Live courier GPS is not connected.</p>
            </>
          ) : (
            <div className="py-10 text-center text-xs text-gray-400">
              <Package className="mx-auto mb-2 h-8 w-8 text-amber-300" />
              {lookupError || (isLookingUp
                ? 'Checking your order…'
                : 'Enter your order number and the phone number used at checkout to track your order.')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
