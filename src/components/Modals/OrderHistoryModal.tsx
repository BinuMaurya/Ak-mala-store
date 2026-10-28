import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Package, ArrowRight } from 'lucide-react';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type OrderFilter = 'All' | 'Processing' | 'Shipped' | 'Delivered';

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({ isOpen, onClose }) => {
  const { orders, setIsTrackerOpen, setActiveTrackingId } = useApp();
  const [activeTab, setActiveTab] = useState<OrderFilter>('All');

  if (!isOpen) return null;

  const filtered = orders.filter((order) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Delivered') return order.orderStatus === 'delivered';
    if (activeTab === 'Shipped') {
      return order.orderStatus === 'shipped' || order.orderStatus === 'out_for_delivery';
    }
    return order.orderStatus === 'confirmed' || order.orderStatus === 'packed';
  });

  const handleTrack = (id: string) => {
    setActiveTrackingId(id);
    onClose();
    setIsTrackerOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-md">
      <div className="relative my-auto flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border-2 border-[#D4AF37]/50 bg-[#080d19] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 bg-[#060a14] p-4">
          <h3 className="font-cinzel text-base font-bold text-white">My Orders</h3>
          <button onClick={onClose} className="rounded-lg bg-white/5 p-1.5 text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-1.5 overflow-x-auto border-b border-white/10 bg-black/40 p-3 text-xs">
          {(['All', 'Processing', 'Shipped', 'Delivered'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap rounded-full px-3 py-1 transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5C158] font-bold text-black'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-3.5 overflow-y-auto p-4">
          {filtered.map((order) => (
            <article key={order.id} className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-mono text-xs font-bold text-amber-200">{order.id}</h4>
                  <p className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    {order.orderStatus.replaceAll('_', ' ')}
                  </span>
                  <p className="mt-1 text-[10px] text-gray-400">Payment: {order.paymentStatus}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {order.items.map((item) => (
                  <img
                    key={item.id}
                    src={item.product.image}
                    alt={item.product.name}
                    title={`${item.product.name} × ${item.quantity}`}
                    className="h-12 w-12 rounded-xl border border-amber-500/20 object-cover"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-2 text-xs">
                <span className="font-bold text-[#F3E5AB]">₹{order.total.toLocaleString('en-IN')}</span>
                <button
                  onClick={() => handleTrack(order.id)}
                  className="flex items-center gap-1 rounded-xl border border-amber-500/40 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-amber-200"
                >
                  TRACK ORDER <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </article>
          ))}
          {filtered.length === 0 && (
            <div className="py-10 text-center text-xs text-gray-400">
              <Package className="mx-auto mb-2 h-8 w-8 text-amber-300" />
              {orders.length ? 'No orders in this category.' : 'No orders saved on this device yet.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
