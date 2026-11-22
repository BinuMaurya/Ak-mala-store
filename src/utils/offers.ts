import type { SiteAssetsConfig } from '../types';

export function isOfferActive(offer: SiteAssetsConfig, now = new Date()): boolean {
  if (offer.offerEnabled === false) return false;

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
  return (!offer.offerStartDate || today >= offer.offerStartDate) &&
    (!offer.offerEndDate || today <= offer.offerEndDate);
}
