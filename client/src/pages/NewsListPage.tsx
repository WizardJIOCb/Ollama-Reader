import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { apiCall } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { formatAbsoluteDate } from '@/lib/dateUtils';
import { ru, enUS } from 'date-fns/locale';
import { Link } from 'wouter';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  avatarUrl?: string | null;
  createdAt: string;
  publishedAt: string | null;
  viewCount: number;
  commentCount: number;
  reactionCount: number;
}

export default function NewsListPage() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { t, i18n } = useTranslation(['common']);
  const dateLocale = i18n.language === 'ru' ? ru : enUS;
  
  const pageSize = 5;

  useEffect(() => {
    document.title = `${t('common:news')} - Reader.Market`;
  }, [t]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await apiCall('/api/news', { method: 'GET' });
        if (!response.ok) {
          throw new Error(`Failed to fetch news: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        
        // Calculate pagination
        const total = Math.ceil(data.length / pageSize);
        setTotalPages(total);
        
        // Get current page items
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedNews = data.slice(startIndex, endIndex);
        
        setNewsItems(paginatedNews);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching news:', err);
        setError(err.message || 'Failed to load news');
        setLoading(false);
      }
    };

    fetchNews();
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">{t('common:news')}</h1>
        <Card>
          <CardContent className="p-6 text-center">
            {t('common:loadingNews')}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">{t('common:news')}</h1>
        <Card>
          <CardContent className="p-6 text-center text-red-500">
            {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" className="mb-4 -ml-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common:backToHome')}
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">{t('common:news')}</h1>
      </div>

      <div className="space-y-6">
        {newsItems.length > 0 ? (
          newsItems.map((newsItem) => (
            <Card key={newsItem.id}>
              <CardHeader>
                <CardTitle>
                  <Link href={`/news/${newsItem.id}`}>
                    <a className="text-primary hover:underline">
                      {newsItem.title}
                    </a>
                  </Link>
                </CardTitle>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Avatar className="w-8 h-8">
                    {newsItem.avatarUrl ? (
                      <AvatarImage src={newsItem.avatarUrl} alt={newsItem.author} />
                    ) : null}
                    <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center">
                    <span>{t('common:by')}{' '}
                      <Link href={`/profile/${newsItem.authorId}`}>
                        <a 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {newsItem.author}
                        </a>
                      </Link>
                    </span>
                    <span className="mx-2">•</span>
                    <span>{formatAbsoluteDate(newsItem.createdAt, dateLocale)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line mb-3">{newsItem.content}</p>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    👁️ {newsItem.viewCount} {t('common:views')}
                  </span>
                  <span className="flex items-center gap-1">
                    💬 {newsItem.commentCount} {t('common:comments')}
                  </span>
                  <span className="flex items-center gap-1">
                    ❤️ {newsItem.reactionCount} {t('common:reactions')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">{t('common:noNews')}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? 'default' : 'outline'}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </Button>
          ))}
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
