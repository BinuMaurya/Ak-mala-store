import { supabase } from './supabase';

const consentStorageKey = 'ak_mala_analytics_consent';
const visitorStorageKey = 'ak_mala_visitor_id';

export type AnalyticsEventType =
  | 'page_view'
  | 'product_view'
  | 'wishlist_add'
  | 'wishlist_remove'
  | 'gallery_like'
  | 'gallery_unlike';

export function getAnalyticsConsent(): 'accepted' | 'rejected' | null {
  const value = localStorage.getItem(consentStorageKey);
  return value === 'accepted' || value === 'rejected' ? value : null;
}

export function setAnalyticsConsent(value: 'accepted' | 'rejected'): void {
  localStorage.setItem(consentStorageKey, value);
}

function getVisitorId(): string {
  let visitorId = localStorage.getItem(visitorStorageKey);
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(visitorStorageKey, visitorId);
  }
  return visitorId;
}

export function getConsentedVisitorId(): string | null {
  return getAnalyticsConsent() === 'accepted' ? getVisitorId() : null;
}

export function trackEvent(eventType: AnalyticsEventType, productId?: string): void {
  if (getAnalyticsConsent() !== 'accepted' || !supabase) return;

  void fetch('/api/analytics/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      visitorId: getVisitorId(),
      eventType,
      productId,
      pagePath: window.location.pathname
    })
  }).then(async (response) => {
    if (!response.ok) {
      const result = await response.json() as { error?: string };
      throw new Error(result.error || 'Analytics event was rejected.');
    }
  }).catch((error: unknown) => {
    console.error('Could not record consented analytics event:', error);
  });
}
