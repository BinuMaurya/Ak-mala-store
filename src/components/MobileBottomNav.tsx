import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, LayoutGrid, Heart, ShoppingBag, User } from 'lucide-react';

interface MobileBottomNavProps {
  onOpenOrders?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenOrders }) => {
  const {
    cartCount,
    wishlistIds,
    setIsCartOpen,
    setSelectedCategory,
    setIsAuthOpen,
    selectedCategory
  } = useApp();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#060a14]/95 backdrop-blur-xl border-t border-[#D4AF37]/30 px-3 py-2">
      <div className="flex items-center justify-around">
        
        {/* 1. Home */}
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setSelectedCategory('all');
          }}
          className={`flex flex-col items-center gap-1 p-1 cursor-pointer transition-colors ${
            selectedCategory === 'all' ? 'text-[#E5C158]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </button>

        {/* 2. Categories */}
        <button
          onClick={() => {
            const el = document.getElementById('bestsellers-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex flex-col items-center gap-1 p-1 text-gray-400 hover:text-white cursor-pointer transition-colors"
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] font-medium">Categories</span>
        </button>

        {/* 3. Wishlist */}
        <button
          onClick={() => {
            const el = document.getElementById('bestsellers-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="relative flex flex-col items-center gap-1 p-1 text-gray-400 hover:text-white cursor-pointer transition-colors"
        >
          <Heart className="w-5 h-5" />
          {wishlistIds.length > 0 && (
            <span className="absolute top-0 right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">
              {wishlistIds.length}
            </span>
          )}
          <span className="text-[10px] font-medium">Wishlist</span>
        </button>

        {/* 4. Cart with quantity badge */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative flex flex-col items-center gap-1 p-1 text-[#E5C158] cursor-pointer transition-colors"
        >
          <ShoppingBag className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute top-0 right-1 w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-black flex items-center justify-center">
              {cartCount}
            </span>
          )}
          <span className="text-[10px] font-bold">Cart</span>
        </button>

        {/* 5. Account */}
        <button
          onClick={() => setIsAuthOpen(true)}
          className="flex flex-col items-center gap-1 p-1 text-gray-400 hover:text-white cursor-pointer transition-colors"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">Account</span>
        </button>

      </div>
    </div>
  );
};
