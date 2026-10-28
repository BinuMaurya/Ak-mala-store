import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Star, UploadCloud, CheckCircle2, ShieldCheck, Heart } from 'lucide-react';

export const ReviewModal: React.FC = () => {
  const { isReviewOpen, setIsReviewOpen, showNotification } = useApp();
  const [rating, setRating] = useState(5);
  const [author, setAuthor] = useState('');
  const [city, setCity] = useState('');
  const [deity, setDeity] = useState('Lord Ganesha');
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  if (!isReviewOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showNotification('Thank you for sharing your sacred devotion review!');
    setIsReviewOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#080d19] border-2 border-[#D4AF37]/50 rounded-3xl shadow-2xl overflow-hidden p-6 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <h3 className="font-cinzel text-base font-bold text-white">Write a Devotee Review</h3>
          <button
            onClick={() => setIsReviewOpen(false)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Star selector */}
          <div>
            <label className="text-gray-300 font-bold block mb-1.5">Your Divine Rating:</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 cursor-pointer transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-600'
                    }`}
                  />
                </button>
              ))}
              <span className="text-amber-300 font-bold ml-2">
                {rating === 5 ? 'Divinely Blessed (5/5)' : `${rating} Stars`}
              </span>
            </div>
          </div>

          <div>
            <label className="text-gray-300 font-bold block mb-1">Your Name:</label>
            <input
              type="text"
              required
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. Anand Kulkarni"
              className="w-full p-2.5 rounded-xl bg-black/50 border border-white/20 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-gray-300 font-bold block mb-1">City / State:</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Pune"
                className="w-full p-2.5 rounded-xl bg-black/50 border border-white/20 text-white"
              />
            </div>
            <div>
              <label className="text-gray-300 font-bold block mb-1">Purchased For Deity:</label>
              <input
                type="text"
                value={deity}
                onChange={(e) => setDeity(e.target.value)}
                placeholder="e.g. Ganpati Bappa"
                className="w-full p-2.5 rounded-xl bg-black/50 border border-white/20 text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-gray-300 font-bold block mb-1">Review Headline:</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Exceptional fresh flowers & divine scent!"
              className="w-full p-2.5 rounded-xl bg-black/50 border border-white/20 text-white"
            />
          </div>

          <div>
            <label className="text-gray-300 font-bold block mb-1">Your Devotional Experience:</label>
            <textarea
              rows={3}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How did the garland look on your deity idol? How was the fragrance and freshness?"
              className="w-full p-2.5 rounded-xl bg-black/50 border border-white/20 text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-extrabold text-xs uppercase tracking-wider shadow-lg hover:opacity-95 transition-all cursor-pointer"
          >
            Submit Blessed Review
          </button>

        </form>

      </div>
    </div>
  );
};
