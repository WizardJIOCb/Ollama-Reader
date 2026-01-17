import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiCall, commentsApi } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Comment {
  id: string;
  content: string;
  author: string;
  userId?: string;
  avatarUrl?: string | null;
  bookId?: string;
  newsId?: string;
  bookTitle?: string;
  newsTitle?: string;
  createdAt: string;
  updatedAt: string;
}

const CommentsModeration: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<{id: string, content: string} | null>(null);
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = localStorage.getItem('admin_comments_page');
    return saved ? parseInt(saved) : 1;
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const saved = localStorage.getItem('admin_comments_limit');
    return saved ? parseInt(saved) : 20;
  });
  const isInitialMount = useRef(true);

  // Save pagination settings to localStorage
  useEffect(() => {
    localStorage.setItem('admin_comments_page', currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    localStorage.setItem('admin_comments_limit', itemsPerPage.toString());
  }, [itemsPerPage]);

  useEffect(() => {
    fetchPendingComments();
  }, [currentPage, itemsPerPage]);

  const fetchPendingComments = async () => {
    try {
      setLoading(true);
      const response = await apiCall(`/api/admin/comments/pending?page=${currentPage}&limit=${itemsPerPage}`);
      const data = await response.json();
      
      // Handle both paginated response format and array format
      const items = data.items || data;
      const total = data.total || items.length;
      const totalPages = data.totalPages || Math.ceil(total / itemsPerPage);
      
      // Fetch book or news titles for each comment
      const commentsWithEntities = await Promise.all(items.map(async (comment: Comment) => {
        try {
          if (comment.bookId) {
            // This is a book comment
            const bookResponse = await apiCall(`/api/books/${comment.bookId}`);
            const bookData = await bookResponse.json();
            return {
              ...comment,
              bookTitle: bookData.title
            };
          } else if (comment.newsId) {
            // This is a news comment
            const newsResponse = await apiCall(`/api/news/${comment.newsId}`);
            const newsData = await newsResponse.json();
            return {
              ...comment,
              newsTitle: newsData.title
            };
          } else {
            // Neither book nor news - shouldn't happen but handle gracefully
            return {
              ...comment,
              bookTitle: t('admin:comments.unknownEntity'),
              newsTitle: t('admin:comments.unknownEntity')
            };
          }
        } catch (err) {
          console.error(`Error fetching entity for comment ${comment.id}:`, err);
          return {
            ...comment,
            bookTitle: comment.bookId ? t('admin:comments.unknownBook') : undefined,
            newsTitle: comment.newsId ? t('admin:comments.unknownNews') : undefined
          };
        }
      }));
      
      setComments(commentsWithEntities);
      setTotalComments(total);
      setTotalPages(totalPages);
      setError(null);
    } catch (err) {
      console.error('Error fetching pending comments:', err);
      setError('Failed to load pending comments');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('admin:comments.deleteConfirm'))) {
      return;
    }
    
    try {
      await commentsApi.adminDeleteComment(id);
      setComments(comments.filter(comment => comment.id !== id));
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Failed to delete comment');
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingComment({id: comment.id, content: comment.content});
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editingComment || editingComment.id !== commentId) return;
    
    try {
      await commentsApi.adminUpdateComment(commentId, {content: editingComment.content});
      setComments(comments.map(comment => 
        comment.id === commentId ? {...comment, content: editingComment.content} : comment
      ));
      setEditingComment(null);
    } catch (err) {
      console.error('Error updating comment:', err);
      setError('Failed to update comment');
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
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
        <h2 className="text-2xl font-bold">{t('admin:comments.title')}</h2>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {totalComments} {totalComments === 1 ? t('admin:comments.totalComments') : t('admin:comments.totalCommentsPlural')}
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
          <CardTitle>{t('admin:comments.awaitingModeration')}</CardTitle>
        </CardHeader>
        <CardContent>
          {comments.length > 0 ? (
            <>
              <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3 flex-1">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        {comment.avatarUrl ? (
                          <AvatarImage src={comment.avatarUrl} alt={comment.author} />
                        ) : null}
                        <AvatarFallback>
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center">
                          {comment.userId ? (
                            <a
                              href={`/profile/${comment.userId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-primary hover:underline"
                            >
                              {comment.author || t('admin:comments.anonymous')}
                            </a>
                          ) : (
                            <span className="font-medium">{comment.author || t('admin:comments.anonymous')}</span>
                          )}
                          <span className="mx-2 text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {comment.bookId ? (
                            <span>{t('admin:comments.book')} <span className="font-medium">{comment.bookTitle || t('admin:comments.unknownBook')}</span></span>
                          ) : comment.newsId ? (
                            <span>{t('admin:comments.news')} <span className="font-medium">{comment.newsTitle || t('admin:comments.unknownNews')}</span></span>
                          ) : (
                            <span>{t('admin:comments.entity')} <span className="font-medium">{t('admin:comments.unknown')}</span></span>
                          )}
                        </div>
                      {editingComment && editingComment.id === comment.id ? (
                        <div className="mt-2">
                          <textarea
                            value={editingComment.content}
                            onChange={(e) => setEditingComment({...editingComment, content: e.target.value})}
                            className="w-full p-2 border rounded"
                            rows={3}
                          />
                          <div className="flex space-x-2 mt-2">
                            <Button 
                              variant="default" 
                              size="sm" 
                              onClick={() => handleSaveEdit(comment.id)}
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
                          <p className="mt-2 text-muted-foreground">{comment.content}</p>
                          <div className="flex space-x-2 mt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEdit(comment)}
                            >
                              {t('admin:activity.edit')}
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => handleDelete(comment.id)}
                            >
                              {t('admin:activity.delete')}
                            </Button>
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              onClick={() => {
                                if (comment.bookId) {
                                  window.open(`/book/${comment.bookId}`, '_blank', 'noopener,noreferrer');
                                } else if (comment.newsId) {
                                  window.open(`/news/${comment.newsId}`, '_blank', 'noopener,noreferrer');
                                }
                              }}
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
                {t('admin:activity.showing')} {((currentPage - 1) * itemsPerPage) + 1} {t('admin:activity.to')} {Math.min(currentPage * itemsPerPage, totalComments)} {t('admin:activity.of')} {totalComments}
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
              {t('admin:comments.noPendingComments')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommentsModeration;