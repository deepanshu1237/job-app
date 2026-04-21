import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { apiUrl } from '../utils/api';

const CompanyReviews = ({ companyEmail }) => {
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [isPosting, setIsPosting] = useState(false);
  const email = localStorage.getItem('userEmail');

  useEffect(() => {
    fetchReviews();
  }, [companyEmail]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(apiUrl(`/company-reviews/${companyEmail}`));
      const data = await res.json();
      if (res.ok) {
        setReviews(data);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!email) {
      Swal.fire({ icon: 'warning', title: 'Login Required', text: 'Please login as a job seeker to post a review' });
      return;
    }
    if (!newReview.comment.trim()) {
      Swal.fire({ icon: 'warning', title: 'Comment Required', text: 'Please write a review comment' });
      return;
    }

    setIsPosting(true);
    try {
      const res = await fetch(apiUrl('/company-reviews'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyEmail,
          seekerEmail: email,
          rating: newReview.rating,
          comment: newReview.comment,
        })
      });
      const data = await res.json();
      if (res.ok) {
        setNewReview({ rating: 5, comment: '' });
        Swal.fire({ icon: 'success', title: 'Review Posted', timer: 2000 });
        fetchReviews();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.error });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to post review' });
    } finally {
      setIsPosting(false);
    }
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">⭐ Company Reviews</h3>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-4xl font-bold text-yellow-500">{avgRating}</p>
            <p className="text-sm text-gray-600">Average Rating</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-gray-700">{reviews.length}</p>
            <p className="text-sm text-gray-600">Total Reviews</p>
          </div>
        </div>
      </div>

      {/* Post Review Form */}
      {email && (
        <form onSubmit={handleSubmitReview} className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-lg font-bold text-gray-800 mb-4">✍️ Write a Review</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
              <select
                value={newReview.rating}
                onChange={(e) => setNewReview(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none"
              >
                <option value={5}>⭐⭐⭐⭐⭐ Excellent</option>
                <option value={4}>⭐⭐⭐⭐ Good</option>
                <option value={3}>⭐⭐⭐ Average</option>
                <option value={2}>⭐⭐ Poor</option>
                <option value={1}>⭐ Terrible</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Your Review</label>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Share your experience..."
                rows={4}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isPosting}
              className="bg-blue text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition"
            >
              {isPosting ? 'Posting...' : '✓ Post Review'}
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-gray-800">{review.seekerEmail}</p>
                  <p className="text-sm text-gray-500">{new Date(review.postedAt).toLocaleDateString()}</p>
                </div>
                <div className="text-yellow-500">
                  {'⭐'.repeat(review.rating)}
                </div>
              </div>
              <p className="text-gray-700">{review.comment}</p>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600 py-8">No reviews yet. Be the first to review!</p>
        )}
      </div>
    </div>
  );
};

export default CompanyReviews;
