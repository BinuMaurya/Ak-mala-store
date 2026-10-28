import React, { useState } from 'react';
import { getAnalyticsConsent, setAnalyticsConsent, trackEvent } from '../services/analytics';

export const AnalyticsConsentNotice: React.FC = () => {
  const [consent, setConsent] = useState(getAnalyticsConsent);
  if (consent) return null;

  const choose = (value: 'accepted' | 'rejected') => {
    setAnalyticsConsent(value);
    setConsent(value);
    if (value === 'accepted') trackEvent('page_view');
  };

  return (
    <aside
      aria-label="Analytics consent"
      className="fixed bottom-4 left-4 z-[60] w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-amber-500/40 bg-[#080d19] p-4 text-xs text-gray-200 shadow-2xl"
    >
      <p className="font-bold text-amber-200">Your privacy matters</p>
      <p className="mt-1 text-gray-300">
        Optional analytics count page/product views, wishlist actions, and gallery likes using a random
        browser ID. They do not collect your name, email, phone, or social accounts. If you sign in,
        Supabase verifies your email; checkout saves delivery details to fulfill your order. If you
        order using this browser, its consented activity may be associated with that order.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => choose('accepted')}
          className="rounded-lg bg-amber-400 px-3 py-2 font-bold text-black"
        >
          Accept analytics
        </button>
        <button
          onClick={() => choose('rejected')}
          className="rounded-lg border border-white/20 px-3 py-2 text-gray-200"
        >
          Reject
        </button>
      </div>
    </aside>
  );
};
