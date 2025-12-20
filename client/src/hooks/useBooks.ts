import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';

export interface Book {
  id: string;
  title: string;
  author: string;
  description?: string;
  coverImageUrl?: string;
  filePath?: string;
  fileSize?: number;
  fileType?: string;
  genre?: string;
  publishedYear?: number;
  rating?: number;
  commentCount?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
  uploadedAt?: string;
  publishedAt?: string;
}

export function useBooks() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch books by IDs
  const fetchBooksByIds = async (bookIds: string[]) => {
    if (!user || bookIds.length === 0) {
      return [];
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/books/by-ids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ bookIds }),
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to fetch books: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (err) {
      console.error('Error fetching books:', err);
      throw err;
    }
  };

  return {
    books,
    loading,
    error,
    fetchBooksByIds,
  };
}

// Hook for fetching a single book
export function useBook(bookId: string | undefined) {
  const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBook = async () => {
      if (!bookId || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        const response = await fetch(`/api/books/${bookId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setBook(data);
        } else if (response.status === 404) {
          setError('Book not found');
        } else {
          const errorText = await response.text();
          throw new Error(`Failed to fetch book: ${response.status} ${response.statusText} - ${errorText}`);
        }
      } catch (err) {
        console.error('Error fetching book:', err);
        setError(err instanceof Error ? err.message : 'Failed to load book');
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [bookId, user]);

  return {
    book,
    loading,
    error,
  };
}