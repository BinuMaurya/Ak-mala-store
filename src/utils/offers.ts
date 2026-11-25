import type { SiteAssetsConfig } from '../types';

export function isOfferActive(offer: SiteAssetsConfig, now = new Date()): boolean {
  if (
    offer.offerEnabled !== true ||
    typeof offer.offerCode !== 'string' ||
    !offer.offerCode.trim() ||
    !Number.isFinite(offer.offerDiscountPercent) ||
    offer.offerDiscountPercent < 1 ||
    offer.offerDiscountPercent > 90
  ) return false;

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
  return (!offer.offerStartDate || today >= offer.offerStartDate) &&
    (!offer.offerEndDate || today <= offer.offerEndDate);
}
