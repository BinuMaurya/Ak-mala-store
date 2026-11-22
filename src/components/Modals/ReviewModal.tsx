import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, ImagePlus, ShieldCheck, Star, X } from 'lucide-react';

export const ReviewModal: React.FC = () => {
  const {
    isReviewOpen,
    setIsReviewOpen,
    reviewProductId,
    reviews,
    allProducts,
    showNotification
  } = useApp();
  const [productId, setProductId] = useState(reviewProductId || '');
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isReviewOpen) setProductId(reviewProductId || '');
  }, [isReviewOpen, reviewProductId]);

  if (!isReviewOpen) return null;

  const displayedReviews = reviews.filter((review) => !productId || review.productId === productId);

  const uploadPhoto = async (file: File, order: string, phoneNumber: string, product: string): Promise<string> => {
    const prepareResponse = await fetch('/api/reviews/photo-upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentType: file.type,
        size: file.size,
        orderNumber: order,
        phone: phoneNumber,
        productId: product
      })
    });
    const uploadDetails = await prepareResponse.json() as {
      uploadUrl?: string;
      publicUrl?: string;
      error?: string;
    };
    if (!prepareResponse.ok || !uploadDetails.uploadUrl || !uploadDetails.publicUrl) {
      throw new Error(uploadDetails.error || 'Could not prepare your photo upload.');
    }

    const uploadResponse = await fetch(uploadDetails.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file
    });
    if (!uploadResponse.ok) throw new Error('Review photo upload failed. Please try again.');
    return uploadDetails.publicUrl;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!productId) {
      showNotification('Select the product you purchased before submitting a review.');
      return;
    }
    setSubmitting(true);
    try {
      const photoUrl = photo ? await uploadPhoto(photo, orderNumber, phone, productId) : undefined;
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          phone,
          productId,
          rating,
          title,
          comment,
          photoUrl
        })
      });
      const result = await response.json() as { pendingApproval?: boolean; error?: string };
      if (!response.ok) throw new Error(result.error || 'Your review could not be submitted.');
      showNotification(result.pendingApproval
        ? 'Verified review submitted. It will appear after admin approval.'
        : 'Your verified review was submitted.');
      setOrderNumber('');
      setPhone('');
      setTitle('');
      setComment('');
      setPhoto(null);
      setIsReviewOpen(false);
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Your review could not be submitted.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#080d19] border-2 border-[#D4AF37]/50 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div>
            <h3 className="font-cinzel text-base font-bold text-white">Verified Customer Reviews</h3>
            <p className="text-[11px] text-gray-400 mt-1">Reviews appear publicly after purchase verification and moderation.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsReviewOpen(false)}
            aria-label="Close reviews"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 mb-6 max-h-56 overflow-y-auto pr-1">
          {displayedReviews.length === 0 ? (
            <p className="text-sm text-gray-400 py-3">No approved customer reviews yet. Be the first verified buyer to share feedback.</p>
          ) : displayedReviews.map((review) => (
            <article key={review.id} className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-white">{review.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{review.author}{review.city ? ` · ${review.city}` : ''}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 whitespace-nowrap">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified purchase
                </span>
              </div>
              <div className="flex gap-0.5 mt-2" aria-label={`${review.rating} out of 5 stars`}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className={`w-3.5 h-3.5 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`} />
                ))}
              </div>
              <p className="text-xs text-gray-300 mt-2 whitespace-pre-wrap">{review.comment}</p>
              {review.photoUrl && (
                <img src={review.photoUrl} alt={`Photo shared by ${review.author}`} className="mt-2 max-h-40 rounded-xl object-cover" />
              )}
            </article>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs border-t border-white/10 pt-5">
          <h4 className="text-sm font-bold text-[#E5C158]">Write a review for a purchase</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-gray-300 font-bold">
              Product
              <select
                required
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                className="mt-1 w-full p-2.5 rounded-xl bg-black/50 border border-white/20 text-white"
              >
                <option value="">Select purchased product</option>
                {allProducts.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
              </select>
            </label>
            <label className="text-gray-300 font-bold">
              Order number
              <input
                required
                value={orderNumber}
                onChange={(event) => setOrderNumber(event.target.value.toUpperCase())}
                placeholder="AKM-XXXXXXXX"
                className="mt-1 w-full p-2.5 rounded-xl bg-black/50 border border-white/20 text-white"
              />
            </label>
          </div>
          <label className="text-gray-300 font-bold block">
            Phone number used for the order
            <input
              required
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="mt-1 w-full p-2.5 rounded-xl bg-black/50 border border-white/20 text-white"
            />
          </label>
          <div>
            <label className="text-gray-300 font-bold block mb-1">Your rating</label>
            <div className="flex items-center gap-1" role="group" aria-label="Choose a rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setRating(star)} aria-label={`${star} stars`}>
                  <Star className={`w-7 h-7 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`} />
                </button>
              ))}
            </div>
          </div>
          <label className="text-gray-300 font-bold block">
            Review headline
            <input
              required
              maxLength={120}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 w-full p-2.5 rounded-xl bg-black/50 border border-white/20 text-white"
            />
          </label>
          <label className="text-gray-300 font-bold block">
            Your review
            <textarea
              required
              maxLength={2000}
              rows={3}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="How did the mala look on your murti?"
              className="mt-1 w-full p-2.5 rounded-xl bg-black/50 border border-white/20 text-white"
            />
          </label>
          <label className="flex items-center gap-2 text-gray-300 font-semibold cursor-pointer">
            <ImagePlus className="w-4 h-4 text-amber-300" />
            Add a customer photo (optional, max 5 MB)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                if (file && file.size > 5 * 1024 * 1024) {
                  showNotification('Review photos must be smaller than 5 MB.');
                  event.target.value = '';
                  setPhoto(null);
                  return;
                }
                setPhoto(file);
              }}
              className="sr-only"
            />
            {photo && <span className="text-amber-200 font-normal">{photo.name}</span>}
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-extrabold text-xs uppercase tracking-wider shadow-lg hover:opacity-95 disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : <><CheckCircle2 className="w-4 h-4 inline mr-2" />Submit verified review</>}
          </button>
        </form>
      </div>
    </div>
  );
};
