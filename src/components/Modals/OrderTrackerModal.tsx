import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, Clock, Package, Search, Truck, X } from 'lucide-react';

const orderStages = [
  { value: 'confirmed', label: 'Order confirmed', description: 'Your order is saved with the store.' },
  { value: 'packed', label: 'Packed', description: 'The store has marked this order as packed.' },
  { value: 'shipped', label: 'Shipped', description: 'The store has marked this order as shipped.' },
  { value: 'out_for_delivery', label: 'Out for delivery', description: 'The store has marked this order out for delivery.' },
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

  useEffect(() => {
    setInputOrderId(activeTrackingId);
  }, [activeTrackingId]);

  if (!isTrackerOpen) return null;

  const currentOrder =
    orders.find((order) => order.id.toLowerCase() === activeTrackingId.toLowerCase()) || null;
  const currentStage = currentOrder
    ? orderStages.findIndex((stage) => stage.value === currentOrder.orderStatus)
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
            setActiveTrackingId(inputOrderId.trim());
          }}
          className="relative border-b border-white/5 bg-black/30 p-4"
        >
          <input
            type="text"
            value={inputOrderId}
            onChange={(event) => setInputOrderId(event.target.value)}
            placeholder="Enter your order number"
            aria-label="Order number"
            className="w-full rounded-xl border border-white/20 bg-black/60 py-2 pl-9 pr-20 text-xs uppercase text-white focus:border-amber-400 focus:outline-none"
          />
          <Search className="absolute left-7 top-6 h-4 w-4 text-amber-400" />
          <button type="submit" className="absolute right-5 top-[21px] rounded-lg bg-amber-500/20 px-3 py-1 text-[11px] font-bold text-amber-300">
            Track
          </button>
        </form>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {currentOrder ? (
            <>
              <div className="rounded-2xl border border-amber-500/20 bg-white/[0.03] p-4">
                <span className="mb-0.5 block text-[10px] uppercase tracking-widest text-gray-400">Order number</span>
                <h4 className="font-mono text-base font-black text-[#F3E5AB]">{currentOrder.id}</h4>
                <p className="mt-1 text-[11px] text-gray-400">Placed {new Date(currentOrder.createdAt).toLocaleString()}</p>
                <p className="mt-2 text-xs text-amber-200">
                  Payment: {currentOrder.paymentStatus} · ₹{currentOrder.total.toLocaleString('en-IN')}
                </p>
              </div>

              {currentOrder.paymentStatus === 'pending' && currentOrder.paymentMethod !== 'cod' && (
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
              <p className="text-center text-[10px] text-gray-500">Order status is updated by the store owner. Live courier GPS is not connected.</p>
            </>
          ) : (
            <div className="py-10 text-center text-xs text-gray-400">
              <Package className="mx-auto mb-2 h-8 w-8 text-amber-300" />
              {orders.length
                ? 'Order not found on this device. Check the number or sign in on the device where you placed the order.'
                : 'No saved orders on this device yet.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
