import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Tag,
  CheckCircle2
} from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    subtotal,
    discount,
    deliveryCharge,
    finalTotal,
    appliedCoupon,
    setIsCheckoutOpen
  } = useApp();

  if (!isCartOpen) return null;

  const totalMRP = cart.reduce((acc, item) => {
    const sizeExtra = item.product.availableSizes.find(s => s.size === item.selectedSize)?.extraPrice || 0;
    return acc + (item.product.originalPrice + sizeExtra) * item.quantity;
  }, 0);

  const discountAmount = Math.max(0, totalMRP - (subtotal - discount));

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#080d19] border-l border-[#D4AF37]/40 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#060a14]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#E5C158]" />
            <h3 className="font-cinzel text-base font-bold text-white">
              Cart ({cart.reduce((a, b) => a + b.quantity, 0)})
            </h3>
          </div>

          <div className="flex items-center gap-3">
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-red-400 hover:underline cursor-pointer"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="bg-amber-500/10 px-4 py-2 border-b border-amber-500/20 text-xs text-amber-200 flex items-center justify-between">
          <span>
            {subtotal >= 999 ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> FREE Cold-Chain Delivery Unlocked!
              </span>
            ) : (
              <span>Add ₹{999 - subtotal} more for Free Delivery!</span>
            )}
          </span>
          <span className="font-mono font-bold">₹999 Target</span>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-amber-400/60">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="font-cinzel text-sm font-bold text-gray-200">Your basket is empty</h4>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                Explore our divine collections to bring auspicious blossoms to your temple.
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const sizeExtra = item.product.availableSizes.find(s => s.size === item.selectedSize)?.extraPrice || 0;
              const originalPrice = item.product.originalPrice + sizeExtra;

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-500/30 transition-all flex items-start gap-3 relative group"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 rounded-xl object-cover border border-amber-500/30 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className="text-xs font-bold text-gray-100 truncate pr-4">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] text-amber-300/80">
                      Size: {item.selectedSize} ({item.product.availableSizes.find(s => s.size === item.selectedSize)?.name.split(' ')[0] || 'Standard'})
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-extrabold text-[#F3E5AB]">
                          ₹{item.pricePerUnit}
                        </span>
                        <span className="text-[10px] text-gray-500 line-through">
                          ₹{originalPrice}
                        </span>
                      </div>

                      {/* Quantity Controller: - 1 + */}
                      <div className="flex items-center gap-2 bg-black/60 px-2 py-0.5 rounded-lg border border-white/15 text-xs">
                        <button
                          onClick={() => updateCartQuantity(item.id, -1)}
                          className="text-gray-300 hover:text-white p-0.5"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-amber-200 px-1">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.id, 1)}
                          className="text-gray-300 hover:text-white p-0.5"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Price Details & Sticky Bottom Action */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-white/10 bg-[#060a14] space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-300">
              PRICE DETAILS
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Total MRP</span>
                <span>₹{totalMRP}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Discount on MRP</span>
                <span>- ₹{discountAmount}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Delivery Charges</span>
                <span className={deliveryCharge === 0 ? 'text-emerald-400 font-bold' : ''}>
                  {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-white/10">
                <span>Total Amount</span>
                <span className="text-[#F3E5AB] font-black text-base">₹{finalTotal}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-extrabold text-xs uppercase tracking-wider shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>PROCEED TO CHECKOUT</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
