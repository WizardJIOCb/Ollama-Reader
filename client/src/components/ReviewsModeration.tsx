import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiCall, reviewsApi } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Review {
  id: string;
  content: string;
  author: string;
  userId?: string;
  avatarUrl?: string | null;
  rating: number;
  bookId: string;
  bookTitle?: string;
  createdAt: string;
  updatedAt: string;
}

const ReviewsModeration: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingReview, setEditingReview] = useState<{id: string, content: string, rating: number} | null>(null);
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = localStorage.getItem('admin_reviews_page');
    return saved ? parseInt(saved) : 1;
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const saved = localStorage.getItem('admin_reviews_limit');
    return saved ? parseInt(saved) : 20;
  });
  const isInitialMount = useRef(true);

  // Save pagination settings to localStorage
  useEffect(() => {
    localStorage.setItem('admin_reviews_page', currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    localStorage.setItem('admin_reviews_limit', itemsPerPage.toString());
  }, [itemsPerPage]);

  useEffect(() => {
    fetchPendingReviews();
  }, [currentPage, itemsPerPage]);

  const fetchPendingReviews = async () => {
    try {
      setLoading(true);
      const response = await apiCall(`/api/admin/reviews/pending?page=${currentPage}&limit=${itemsPerPage}`);
      const data = await response.json();
      
      // Handle both paginated response format and array format
      const items = data.items || data;
      const total = data.total || items.length;
      const totalPages = data.totalPages || Math.ceil(total / itemsPerPage);
      
      // Fetch book titles for each review
      const reviewsWithBooks = await Promise.all(items.map(async (review: Review) => {
        try {
          const bookResponse = await apiCall(`/api/books/${review.bookId}`);
          const bookData = await bookResponse.json();
          return {
            ...review,
            bookTitle: bookData.title
          };
        } catch (err) {
          console.error(`Error fetching book ${review.bookId} for review ${review.id}:`, err);
          return {
            ...review,
            bookTitle: t('admin:reviews.unknownBook')
          };
        }
      }));
      
      setReviews(reviewsWithBooks);
      setTotalReviews(total);
      setTotalPages(totalPages);
      setError(null);
    } catch (err) {
      console.error('Error fetching pending reviews:', err);
      setError('Failed to load pending reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('admin:reviews.deleteConfirm'))) {
      return;
    }
    
    try {
      await reviewsApi.adminDeleteReview(id);
      setReviews(reviews.filter(review => review.id !== id));
    } catch (err) {
      console.error('Error deleting review:', err);
      setError('Failed to delete review');
    }
  };

  const handleEdit = (review: Review) => {
    setEditingReview({id: review.id, content: review.content, rating: review.rating});
  };

  const handleSaveEdit = async (reviewId: string) => {
    if (!editingReview || editingReview.id !== reviewId) return;
    
    try {
      await reviewsApi.adminUpdateReview(reviewId, {content: editingReview.content, rating: editingReview.rating});
      setReviews(reviews.map(review => 
        review.id === reviewId ? {...review, content: editingReview.content, rating: editingReview.rating} : review
      ));
      setEditingReview(null);
    } catch (err) {
      console.error('Error updating review:', err);
      setError('Failed to update review');
    }
  };

  const handleCancelEdit = () => {
    setEditingReview(null);
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            {t('admin:common.loading')}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center text-red-500">
            {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('admin:reviews.title')}</h2>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {totalReviews} {totalReviews === 1 ? t('admin:reviews.totalReviews') : t('admin:reviews.totalReviewsPlural')}
          </p>
          <Select value={itemsPerPage.toString()} onValueChange={(value) => {
            setItemsPerPage(parseInt(value));
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 {t('admin:activity.perPage')}</SelectItem>
              <SelectItem value="10">10 {t('admin:activity.perPage')}</SelectItem>
              <SelectItem value="20">20 {t('admin:activity.perPage')}</SelectItem>
              <SelectItem value="50">50 {t('admin:activity.perPage')}</SelectItem>
              <SelectItem value="100">100 {t('admin:activity.perPage')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin:reviews.awaitingModeration')}</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length > 0 ? (
            <>
              <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3 flex-1">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        {review.avatarUrl ? (
                          <AvatarImage src={review.avatarUrl} alt={review.author} />
                        ) : null}
                        <AvatarFallback>
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center">
                          {review.userId ? (
                            <a
                              href={`/profile/${review.userId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-primary hover:underline"
                            >
                              {review.author || t('admin:reviews.anonymous')}
                            </a>
                          ) : (
                            <span className="font-medium">{review.author || t('admin:reviews.anonymous')}</span>
                          )}
                          <span className="mx-2 text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                          <span className="mx-2 text-muted-foreground">•</span>
                          <span className="text-sm font-medium text-yellow-600">
                            {t('admin:reviews.rating')} {review.rating}/10
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {t('admin:reviews.book')} <span className="font-medium">{review.bookTitle || t('admin:reviews.unknownBook')}</span>
                        </div>
                      {editingReview && editingReview.id === review.id ? (
                        <div className="mt-2">
                          <div className="mb-2">
                            <label className="block text-sm font-medium mb-1">{t('admin:reviews.ratingLabel')}</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={editingReview.rating}
                              onChange={(e) => setEditingReview({...editingReview, rating: parseInt(e.target.value) || 0})}
                              className="w-20 p-2 border rounded"
                            />
                          </div>
                          <textarea
                            value={editingReview.content}
                            onChange={(e) => setEditingReview({...editingReview, content: e.target.value})}
                            className="w-full p-2 border rounded"
                            rows={3}
                          />
                          <div className="flex space-x-2 mt-2">
                            <Button 
                              variant="default" 
                              size="sm" 
                              onClick={() => handleSaveEdit(review.id)}
                            >
                              {t('admin:activity.save')}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={handleCancelEdit}
                            >
                              {t('admin:activity.cancel')}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="mt-2 text-muted-foreground">{review.content}</p>
                          <div className="flex space-x-2 mt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEdit(review)}
                            >
                              {t('admin:activity.edit')}
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => handleDelete(review.id)}
                            >
                              {t('admin:activity.delete')}
                            </Button>
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              onClick={() => window.open(`/book/${review.bookId}`, '_blank', 'noopener,noreferrer')}
                            >
                              {t('admin:activity.show')}
                            </Button>
                          </div>
                        </div>
                      )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {t('admin:activity.showing')} {((currentPage - 1) * itemsPerPage) + 1} {t('admin:activity.to')} {Math.min(currentPage * itemsPerPage, totalReviews)} {t('admin:activity.of')} {totalReviews}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t('admin:activity.previous')}
                </Button>
                <div className="text-sm text-muted-foreground px-2">
                  {t('admin:activity.page')} {currentPage} {t('admin:activity.of')} {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  {t('admin:activity.next')}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              {t('admin:reviews.noPendingReviews')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewsModeration;