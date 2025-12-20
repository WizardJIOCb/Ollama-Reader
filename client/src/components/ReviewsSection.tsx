import React, { useState, useEffect } from 'react';
import { Review } from '@/lib/mockData';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ReactionBar } from '@/components/ReactionBar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { formatDistanceToNow, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Star, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';

interface ReviewsProps {
  bookId: string;
  onReviewsCountChange?: (count: number) => void;
}

export function ReviewsSection({ bookId, onReviewsCountChange }: ReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReviewContent, setNewReviewContent] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const { user } = useAuth();

  // Fetch reviews when component mounts or bookId changes
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        
        // Fetch all reviews
        const response = await fetch(`/api/books/${bookId}/reviews`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        if (response.ok) {
          const fetchedReviews = await response.json();
          setReviews(fetchedReviews);
          
          // Find and set the user's review from the fetched reviews
          if (user) {
            const userReview = fetchedReviews.find((review: any) => review.userId === user.id);
            if (userReview) {
              setUserReview(userReview);
            } else {
              setUserReview(null);
            }
          }
          
          // Notify parent component of review count change
          if (onReviewsCountChange) {
            onReviewsCountChange(fetchedReviews.length);
          }
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
        // Even on error, notify parent with 0 count
        if (onReviewsCountChange) {
          onReviewsCountChange(0);
        }
      } finally {
        setLoading(false);
      }
    };

    if (bookId) {
      fetchReviews();
    }
  }, [bookId, user, onReviewsCountChange]);

  const handlePostReview = async () => {
    if (!newReviewContent.trim() || !user) return;
    
    try {
      const response = await fetch(`/api/books/${bookId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ rating: newRating, content: newReviewContent })
      });
      
      if (response.ok) {
        const newReviewObj = await response.json();
        
        setNewReviewContent('');
        setNewRating(5);
        setIsFormOpen(false);
        
        // Refresh reviews to get the newly added one
        const response2 = await fetch(`/api/books/${bookId}/reviews`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        if (response2.ok) {
          const fetchedReviews = await response2.json();
          setReviews(fetchedReviews);
          
          // Find and set the user's review from the fetched reviews
          const userReview = fetchedReviews.find((review: any) => review.userId === user.id);
          if (userReview) {
            setUserReview(userReview);
          }
        }
      } else {
        const error = await response.json();
        console.error('Failed to post review:', error.error);
      }
    } catch (error) {
      console.error('Error posting review:', error);
    }
  };

  const handleReact = (reviewId: string, emoji: string) => {
    setReviews(reviews.map(review => {
      if (review.id !== reviewId) return review;

      const existingReactionIndex = review.reactions.findIndex(r => r.emoji === emoji);
      let newReactions = [...review.reactions];

      if (existingReactionIndex >= 0) {
        const reaction = newReactions[existingReactionIndex];
        if (reaction.userReacted) {
          // Unlike
          newReactions[existingReactionIndex] = {
            ...reaction,
            count: reaction.count - 1,
            userReacted: false
          };
          if (newReactions[existingReactionIndex].count === 0) {
            newReactions.splice(existingReactionIndex, 1);
          }
        } else {
          // Like existing emoji
          newReactions[existingReactionIndex] = {
            ...reaction,
            count: reaction.count + 1,
            userReacted: true
          };
        }
      } else {
        // Add new reaction
        newReactions.push({
          emoji,
          count: 1,
          userReacted: true
        });
      }

      return { ...review, reactions: newReactions };
    }));
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        // Remove the review from the state
        setReviews(reviews.filter(review => review.id !== reviewId));
        // Also remove from userReview if it matches
        if (userReview && userReview.id === reviewId) {
          setUserReview(null);
        }
      } else {
        console.error('Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    if (rating >= 5) return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
  };

  return (
    <div className="space-y-8">
      {!userReview && !isFormOpen ? (
        <Button onClick={() => setIsFormOpen(true)} className="w-full gap-2" variant="outline" disabled={!user}>
          <Star className="w-4 h-4" />
          Написать рецензию
        </Button>
      ) : userReview ? (
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h3 className="font-serif font-bold text-lg">Ваша рецензия</h3>
          <div className="flex justify-between items-start">
            <div className="flex gap-3 items-center">
              <Avatar className="w-10 h-10">
                <AvatarFallback>{userReview.author[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold text-sm">{userReview.author}</h4>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-muted-foreground cursor-help">
                        {formatDistanceToNow(new Date(userReview.createdAt), { addSuffix: true, locale: ru })}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{format(new Date(userReview.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-lg font-bold px-3 py-1 ${getRatingColor(userReview.rating)}`}>
                {userReview.rating}/10
              </Badge>
              {user && userReview.userId === user.id && (
                <button 
                  onClick={() => handleDeleteReview(userReview.id)}
                  className="text-xs text-destructive hover:underline"
                >
                  Удалить
                </button>
              )}
            </div>
          </div>
          
          <p className="text-foreground/90 leading-relaxed whitespace-pre-line">
            {userReview.content}
          </p>
        </div>
      ) : (
        <div className="bg-card border rounded-lg p-6 space-y-6 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-serif font-bold text-lg">Ваша рецензия</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Оценка: {newRating}/10</label>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">0</span>
                <Slider
                  value={[newRating]}
                  onValueChange={(vals) => setNewRating(vals[0])}
                  min={0}
                  max={10}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">10</span>
              </div>
            </div>

            <Textarea
              placeholder="Поделитесь развернутым мнением о книге..."
              value={newReviewContent}
              onChange={(e) => setNewReviewContent(e.target.value)}
              className="min-h-[150px]"
            />

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsFormOpen(false)}>Отмена</Button>
              <Button onClick={handlePostReview} disabled={!newReviewContent.trim() || !user}>
                Опубликовать
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {loading ? (
          <div className="text-center py-8">
            <p>Загрузка рецензий...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Пока нет рецензий. Будьте первым!</p>
          </div>
        ) : (
          reviews
            .filter(review => !userReview || review.id !== userReview.id)
            .map((review) => (
              <div key={review.id} className="bg-card border rounded-xl p-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 items-center">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>{review.author[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-sm">{review.author}</h4>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs text-muted-foreground cursor-help">
                              {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true, locale: ru })}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{format(new Date(review.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-lg font-bold px-3 py-1 ${getRatingColor(review.rating)}`}>
                      {review.rating}/10
                    </Badge>
                    {user && review.userId === user.id && (
                      <button 
                        onClick={() => handleDeleteReview(review.id)}
                        className="text-xs text-destructive hover:underline"
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                </div>
                        
                <p className="text-foreground/90 leading-relaxed whitespace-pre-line">
                  {review.content}
                </p>
        
                <div className="pt-4 border-t border-border/50">
                  <ReactionBar 
                    reactions={review.reactions} 
                    onReact={(emoji) => handleReact(review.id, emoji)} 
                    reviewId={review.id}
                  />
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
