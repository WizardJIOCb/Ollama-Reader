import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { booksApi, readerApi } from '@/lib/api';
import { useBookSplash } from '@/lib/bookSplashContext';
import { Bookmark, Plus, Trash2, Brain, MessageCircle, Users, X, List, Search, Settings } from 'lucide-react';

// Reader Components
import {
  ReaderCore,
  ReaderCoreHandle,
  ReaderToolbar,
  DEFAULT_READER_SETTINGS,
  BookContent,
  Position,
  TextSelection,
  Chapter,
  SearchResult,
  THEME_COLORS,
} from '@/components/reader';
import type { ReaderSettings } from '@/components/reader/types';

// Legacy components
import { AISidebar } from '@/components/AISidebar';

// Book interface
interface Book {
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
  createdAt: string;
  updatedAt: string;
}

// Bookmark interface
interface BookmarkItem {
  id: string;
  title: string;
  chapterIndex: number;
  percentage: number;
  createdAt: Date;
  // Selected text info for highlighting on navigation
  selectedText?: string;
  pageInChapter?: number;
}

// Local storage keys
const READER_SETTINGS_KEY = 'reader-settings';
const BOOKMARKS_KEY = 'reader-bookmarks';

export default function Reader() {
  const [match, params] = useRoute('/read/:bookId/:position');
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const readerRef = useRef<ReaderCoreHandle>(null);
  const toastRef = useRef(toast);
  
  // Book state
  const [book, setBook] = useState<Book | null>(null);
  const [bookUrl, setBookUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Reader state
  const [bookContent, setBookContent] = useState<BookContent | null>(null);
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [selectedText, setSelectedText] = useState<TextSelection | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPageOverall, setCurrentPageOverall] = useState(1);
  const [totalPagesOverall, setTotalPagesOverall] = useState(1);
  
  // Global splash screen context
  const { showSplash, hideSplash, isVisible: isSplashVisible } = useBookSplash();
  const loadStartTimeRef = useRef<number>(Date.now());
  const isDirectLoadRef = useRef<boolean>(false); // Track if this is a direct page load (refresh)
  
  // Safety timeout to ensure splash screen is always hidden after max time
  useEffect(() => {
    if (!isSplashVisible) return;
    
    const maxSplashTime = 3000; // Maximum splash display time (3 seconds)
    const safetyTimeout = setTimeout(() => {
      hideSplash();
    }, maxSplashTime);
    
    return () => clearTimeout(safetyTimeout);
  }, [isSplashVisible, hideSplash]);
  
  // UI state - single panel, no multiple selection
  type PanelType = 'toc' | 'search' | 'bookmarks' | 'settings' | 'ai' | 'chat' | null;
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  
  // Store selection range to restore it if browser clears it
  const selectionRangeRef = useRef<Range | null>(null);
  // Control popover visibility separately to allow delayed rendering
  const [showSelectionPopover, setShowSelectionPopover] = useState(false);
  
  // Bookmark highlight state (for showing orange highlight when navigating to bookmark)
  const [bookmarkHighlight, setBookmarkHighlight] = useState<{
    text: string;
    context?: string; // Surrounding text to find the correct occurrence
    chapterIndex: number;
    pageInChapter: number;
    fading: boolean;
  } | null>(null);
  const [bookmarkHighlightRect, setBookmarkHighlightRect] = useState<DOMRect | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  
  // Debounce refs for saving progress and settings
  const lastProgressSaveRef = useRef<number>(0);
  const lastSettingsSaveRef = useRef<number>(0);
  const progressSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const settingsSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadDoneRef = useRef(false);
  
  // Settings
  const [settings, setSettings] = useState<ReaderSettings>(() => {
    try {
      const saved = localStorage.getItem(READER_SETTINGS_KEY);
      if (saved) {
        return { ...DEFAULT_READER_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load reader settings:', e);
    }
    return DEFAULT_READER_SETTINGS;
  });
  
  const bookId = params?.bookId || '';
  const positionParam = params?.position || '';
  
  // Load bookmarks from API (authenticated) or localStorage (guest)
  useEffect(() => {
    if (!bookId) return;
    
    const loadBookmarks = async () => {
      if (user) {
        // Authenticated: fetch from API
        try {
          const response = await readerApi.getBookmarks(bookId);
          if (response.ok) {
            const data = await response.json();
            setBookmarks(data.map((b: any) => ({
              ...b,
              createdAt: new Date(b.createdAt),
            })));
            // Cache to localStorage
            localStorage.setItem(`${BOOKMARKS_KEY}-${bookId}`, JSON.stringify(data));
            return;
          }
        } catch (e) {
          console.error('Failed to load bookmarks from API:', e);
        }
      }
      
      // Guest or API failed: load from localStorage
      try {
        const saved = localStorage.getItem(`${BOOKMARKS_KEY}-${bookId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setBookmarks(parsed.map((b: any) => ({ ...b, createdAt: new Date(b.createdAt) })));
        }
      } catch (e) {
        console.error('Failed to load bookmarks from localStorage:', e);
      }
    };
    
    loadBookmarks();
  }, [bookId, user]);
  
  // Load reading progress and settings on mount (for authenticated users)
  useEffect(() => {
    if (!bookId || !user || initialLoadDoneRef.current) return;
    
    const loadProgressAndSettings = async () => {
      try {
        // Load reading progress
        const progressResponse = await readerApi.getProgress(bookId);
        if (progressResponse.ok) {
          const progress = await progressResponse.json();
          // Store for later use when reader is ready
          localStorage.setItem(`reading-progress-${bookId}`, JSON.stringify(progress));
        }
        
        // Load settings
        const settingsResponse = await readerApi.getSettings(bookId);
        if (settingsResponse.ok) {
          const apiSettings = await settingsResponse.json();
          setSettings(prev => ({ ...prev, ...apiSettings }));
          localStorage.setItem(`${READER_SETTINGS_KEY}-${bookId}`, JSON.stringify(apiSettings));
        }
      } catch (e) {
        console.error('Failed to load progress/settings from API:', e);
      }
      initialLoadDoneRef.current = true;
    };
    
    loadProgressAndSettings();
  }, [bookId, user]);
  
  // Update settings (with API sync for authenticated users)
  const updateSettings = useCallback((newSettings: Partial<ReaderSettings>) => {
    setSettings((prev: ReaderSettings) => {
      const updated = { ...prev, ...newSettings };
      
      // Save to localStorage immediately
      try {
        localStorage.setItem(READER_SETTINGS_KEY, JSON.stringify(updated));
        if (bookId) {
          localStorage.setItem(`${READER_SETTINGS_KEY}-${bookId}`, JSON.stringify(updated));
        }
      } catch (e) {
        console.error('Failed to save settings to localStorage:', e);
      }
      
      // Debounced save to API for authenticated users
      if (user && bookId) {
        if (settingsSaveTimeoutRef.current) {
          clearTimeout(settingsSaveTimeoutRef.current);
        }
        settingsSaveTimeoutRef.current = setTimeout(async () => {
          try {
            await readerApi.updateSettings(bookId, updated);
          } catch (e) {
            console.error('Failed to sync settings to API:', e);
          }
        }, 2000);
      }
      
      return updated;
    });
  }, [user, bookId]);
  
  // Save reading progress on unmount and page unload
  useEffect(() => {
    const saveProgressToApi = () => {
      if (user && bookId) {
        const savedProgress = localStorage.getItem(`reading-progress-${bookId}`);
        if (savedProgress) {
          try {
            const progress = JSON.parse(savedProgress);
            const token = localStorage.getItem('authToken');
            if (token) {
              // Use fetch with keepalive for reliable delivery during page unload
              fetch(`/api/books/${bookId}/reading-progress`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(progress),
                keepalive: true,
              }).catch(() => {}); // Ignore errors on unload
            }
          } catch (e) {
            // Ignore errors on unload
          }
        }
      }
    };
    
    // Save on page unload (browser close, refresh, navigate away)
    window.addEventListener('beforeunload', saveProgressToApi);
    
    return () => {
      window.removeEventListener('beforeunload', saveProgressToApi);
      
      // Clear any pending timeouts
      if (progressSaveTimeoutRef.current) {
        clearTimeout(progressSaveTimeoutRef.current);
      }
      if (settingsSaveTimeoutRef.current) {
        clearTimeout(settingsSaveTimeoutRef.current);
      }
      
      // Final save to API on unmount (for SPA navigation)
      if (user && bookId) {
        const savedProgress = localStorage.getItem(`reading-progress-${bookId}`);
        if (savedProgress) {
          try {
            const progress = JSON.parse(savedProgress);
            readerApi.updateProgress(bookId, progress).catch(() => {});
          } catch (e) {
            // Ignore errors
          }
        }
      }
    };
  }, [user, bookId]);
  
  // Update bookUrl when book changes
  useEffect(() => {
    if (book?.filePath) {
      setBookUrl(`/${book.filePath}`);
    } else {
      setBookUrl('');
    }
  }, [book]);
  
  // Tracking refs
  const readerOpenTrackedRef = useRef<Set<string>>(new Set());
  const readerFetchInProgressRef = useRef<Set<string>>(new Set());
  const prevBookIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);
  
  // Fetch book data
  useEffect(() => {
    if (prevBookIdRef.current !== bookId) {
      readerOpenTrackedRef.current.delete(bookId);
      prevBookIdRef.current = bookId;
    }
    
    const fetchBook = async () => {
      if (!bookId) return;
      if (readerFetchInProgressRef.current.has(bookId)) return;
      
      readerFetchInProgressRef.current.add(bookId);
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await booksApi.getBookById(bookId);
        if (!response.ok) throw new Error('Failed to fetch book');
        
        const bookData = await response.json();
        setBook(bookData);
        
        // Show splash screen on direct page load (refresh or direct URL access)
        if (!isSplashVisible) {
          isDirectLoadRef.current = true; // Mark as direct load for longer splash display
          showSplash({
            id: bookData.id,
            title: bookData.title,
            author: bookData.author,
            coverImageUrl: bookData.coverImageUrl,
            description: bookData.description,
            rating: bookData.rating,
          });
        }
        
        // Track view
        const token = localStorage.getItem('authToken');
        if (token && !readerOpenTrackedRef.current.has(bookId)) {
          readerOpenTrackedRef.current.add(bookId);
          fetch(`/api/books/${bookId}/track-view`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ viewType: 'reader_open' }),
          }).catch(console.error);
        }
      } catch (err) {
        console.error('Error fetching book:', err);
        setError(err instanceof Error ? err.message : 'Failed to load book');
        // Hide splash screen immediately on error
        hideSplash();
        toastRef.current({
          title: "Ошибка",
          description: "Не удалось загрузить книгу",
          variant: "destructive",
        });
      } finally {
        readerFetchInProgressRef.current.delete(bookId);
        setLoading(false);
      }
    };
    
    fetchBook();
    return () => { readerFetchInProgressRef.current.delete(bookId); };
  }, [bookId]);
  
  // Reader callbacks
  const handleReaderReady = useCallback(async (content: BookContent) => {
    setBookContent(content);
    if (content.chapters.length > 0) {
      setCurrentChapter(content.chapters[0]);
    }
    
    // Restore reading progress - try API first (for authenticated users), then localStorage
    const restoreProgress = async () => {
      let progress = null;
      
      // Try to load from API for authenticated users
      if (user && bookId) {
        try {
          const response = await readerApi.getProgress(bookId);
          if (response.ok) {
            progress = await response.json();
            // Cache to localStorage
            localStorage.setItem(`reading-progress-${bookId}`, JSON.stringify(progress));
          }
        } catch (e) {
          console.error('Failed to load progress from API:', e);
        }
      }
      
      // Fallback to localStorage
      if (!progress) {
        try {
          const savedProgress = localStorage.getItem(`reading-progress-${bookId}`);
          if (savedProgress) {
            progress = JSON.parse(savedProgress);
          }
        } catch (e) {
          console.error('Failed to load progress from localStorage:', e);
        }
      }
      
      // Navigate to saved position
      if (progress && typeof progress.chapterIndex === 'number' && progress.chapterIndex >= 0) {
        // First go to chapter, then after pagination completes, go to specific page
        setTimeout(() => {
          readerRef.current?.goToChapter(progress.chapterIndex);
          
          // After chapter change and pagination, restore page position
          // currentPage is 1-based (from getCurrentPage), convert to 0-based for goToPosition
          if (typeof progress.currentPage === 'number' && progress.currentPage > 1) {
            setTimeout(() => {
              const position: Position = {
                charOffset: 0,
                chapterIndex: progress.chapterIndex,
                pageInChapter: progress.currentPage - 1, // Convert to 0-based
                totalPagesInChapter: progress.totalPages || 1,
                percentage: progress.percentage || 0,
              };
              readerRef.current?.goToPosition(position);
            }, 300);
          }
        }, 200);
      }
    };
    
    restoreProgress();
    
    // Hide global splash screen with animation
    // Use longer display time (1600ms) for direct page loads (refresh), shorter (800ms) for navigation
    const loadDuration = Date.now() - loadStartTimeRef.current;
    const minDisplayTime = isDirectLoadRef.current ? 1600 : 800;
    const remainingTime = Math.max(0, minDisplayTime - loadDuration);
    
    // Reset the direct load flag after using it
    isDirectLoadRef.current = false;
    
    // Wait for remaining time, then fade out
    setTimeout(() => {
      hideSplash();
    }, remainingTime);
  }, [bookId, user, hideSplash]);
  
  const handlePositionChange = useCallback((position: Position) => {
    setCurrentPosition(position);
    // Update page numbers from reader ref
    let currPage = 0;
    let totPages = 1;
    if (readerRef.current) {
      currPage = readerRef.current.getCurrentPage();
      totPages = readerRef.current.getTotalPages();
      setCurrentPage(currPage);
      setTotalPages(totPages);
      
      // Update overall page numbers (across all chapters)
      setCurrentPageOverall(readerRef.current.getEstimatedCurrentPageOverall());
      setTotalPagesOverall(readerRef.current.getEstimatedTotalPages());
    }
    
    // Save progress to localStorage immediately
    const progressData = {
      currentPage: currPage,
      totalPages: totPages,
      percentage: position.percentage,
      chapterIndex: position.chapterIndex,
    };
    localStorage.setItem(`reading-progress-${bookId}`, JSON.stringify(progressData));
    
    // Save to API for authenticated users with debouncing
    if (user && bookId) {
      // Clear any pending timeout
      if (progressSaveTimeoutRef.current) {
        clearTimeout(progressSaveTimeoutRef.current);
      }
      
      // Debounce: save after 2 seconds of no changes
      progressSaveTimeoutRef.current = setTimeout(async () => {
        try {
          await readerApi.updateProgress(bookId, progressData);
          lastProgressSaveRef.current = Date.now();
        } catch (e) {
          console.error('Failed to sync progress to API:', e);
        }
      }, 2000);
    }
  }, [user, bookId]);
  
  const handleTextSelect = useCallback((selection: TextSelection | null) => {
    if (selection?.range) {
      // Use the range from the selection (captured synchronously in ReaderCore)
      selectionRangeRef.current = selection.range;
    } else {
      selectionRangeRef.current = null;
    }
    // Hide popover first, will show after selection is restored
    setShowSelectionPopover(false);
    setSelectedText(selection);
  }, []);
  
  // Close selection popover when clicking outside
  const selectionPopoverRef = useRef<HTMLDivElement>(null);
  
  // Restore selection and show popover after delay
  // Use useLayoutEffect to run synchronously after DOM update, before browser paint
  useLayoutEffect(() => {
    if (!selectedText || !selectionRangeRef.current) {
      setShowSelectionPopover(false);
      return;
    }
    
    const storedRange = selectionRangeRef.current;
    
    const restoreSelection = () => {
      try {
        const currentSelection = window.getSelection();
        if (!currentSelection) return;
        
        // Always restore to ensure selection is visible
        currentSelection.removeAllRanges();
        currentSelection.addRange(storedRange.cloneRange());
      } catch (e) {
        console.debug('Could not restore selection:', e);
      }
    };
    
    // Restore immediately (synchronously)
    restoreSelection();
    
    // Also restore after microtask
    queueMicrotask(restoreSelection);
    
    // Show popover after selection has stabilized
    const showTimer = setTimeout(() => {
      restoreSelection();
      setShowSelectionPopover(true);
    }, 100);
    
    return () => {
      clearTimeout(showTimer);
    };
  }, [selectedText]);
  
  useEffect(() => {
    if (!showSelectionPopover || !selectedText) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      // Don't close if clicking on the popover itself
      if (selectionPopoverRef.current?.contains(e.target as Node)) {
        return;
      }
      // Clear selection and close popover
      window.getSelection()?.removeAllRanges();
      setShowSelectionPopover(false);
      setSelectedText(null);
    };
    
    // Add listener immediately since popover is already shown
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSelectionPopover, selectedText]);
  
  // Effect to find bookmark text and get its bounding rect
  useEffect(() => {
    if (!bookmarkHighlight) {
      setBookmarkHighlightRect(null);
      return;
    }
    
    // Wait a bit for the page to render after navigation
    const timer = setTimeout(() => {
      const textToFind = bookmarkHighlight.text;
      const contextToFind = bookmarkHighlight.context;
      if (!textToFind) return;
      
      // Find the text in the document
      const readerContent = document.querySelector('.reader-content');
      if (!readerContent) return;
      
      // Create a TreeWalker to find text nodes
      const walker = document.createTreeWalker(
        readerContent,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      // Collect all text nodes and build a map of positions
      const textNodes: { node: Node; start: number; end: number }[] = [];
      let totalOffset = 0;
      let node: Node | null;
      
      while ((node = walker.nextNode())) {
        const nodeText = node.textContent || '';
        textNodes.push({
          node,
          start: totalOffset,
          end: totalOffset + nodeText.length
        });
        totalOffset += nodeText.length;
      }
      
      // Get full text of the page
      const fullPageText = readerContent.textContent || '';
      
      // Find the context in the full text to locate the exact position
      let matchPosition = -1;
      if (contextToFind) {
        // Search for context (use a good portion of it for uniqueness)
        const searchContext = contextToFind.substring(0, 60);
        matchPosition = fullPageText.indexOf(searchContext);
        
        if (matchPosition !== -1) {
          // Find where the matched text appears within the context
          const matchInContext = contextToFind.indexOf(textToFind);
          if (matchInContext !== -1) {
            matchPosition += matchInContext;
          }
        }
      }
      
      // Fallback: just find the text directly
      if (matchPosition === -1) {
        matchPosition = fullPageText.indexOf(textToFind);
      }
      
      if (matchPosition === -1) return;
      
      // Find which text node contains this position
      for (const textNode of textNodes) {
        if (matchPosition >= textNode.start && matchPosition < textNode.end) {
          const localStart = matchPosition - textNode.start;
          const nodeText = textNode.node.textContent || '';
          const localEnd = Math.min(localStart + textToFind.length, nodeText.length);
          
          try {
            const range = document.createRange();
            range.setStart(textNode.node, localStart);
            range.setEnd(textNode.node, localEnd);
            const rect = range.getBoundingClientRect();
            
            if (rect.width > 0 && rect.height > 0) {
              setBookmarkHighlightRect(rect);
              return;
            }
          } catch (e) {
            console.debug('Could not create range for highlight:', e);
          }
          break;
        }
      }
    }, 200);
    
    return () => clearTimeout(timer);
  }, [bookmarkHighlight]);
  
  const handleChapterChange = useCallback((chapter: Chapter) => {
    setCurrentChapter(chapter);
  }, []);
  
  const handleReaderError = useCallback((err: Error) => {
    // Hide splash screen immediately on reader error
    hideSplash();
    toastRef.current({
      title: "Ошибка чтения",
      description: err.message,
      variant: "destructive",
    });
  }, [hideSplash]);
  
  // Navigation
  const handleNext = useCallback(() => readerRef.current?.nextPage(), []);
  const handlePrev = useCallback(() => readerRef.current?.prevPage(), []);
  const handleGoToChapter = useCallback((index: number) => {
    readerRef.current?.goToChapter(index);
  }, []);
  
  // Bookmarks
  const handleAddBookmark = useCallback(async () => {
    const position = readerRef.current?.getPosition();
    if (!position) return;
    
    // Use selected text as title if available, otherwise use chapter title
    const title = selectedText?.text 
      ? (selectedText.text.length > 50 ? selectedText.text.substring(0, 50) + '...' : selectedText.text)
      : (currentChapter?.title || `Страница ${Math.round(position.percentage)}%`);
    
    const bookmarkData = {
      title,
      chapterIndex: position.chapterIndex,
      percentage: position.percentage,
      selectedText: selectedText?.text,
      pageInChapter: position.pageInChapter,
    };
    
    if (user && bookId) {
      // Authenticated: create via API
      try {
        const response = await readerApi.createBookmark(bookId, bookmarkData);
        if (response.ok) {
          const created = await response.json();
          const newBookmark: BookmarkItem = {
            ...created,
            createdAt: new Date(created.createdAt),
          };
          setBookmarks((prev) => [newBookmark, ...prev]);
          // Update localStorage cache
          const updatedBookmarks = [newBookmark, ...bookmarks];
          localStorage.setItem(`${BOOKMARKS_KEY}-${bookId}`, JSON.stringify(updatedBookmarks));
          toastRef.current({
            title: "Закладка добавлена",
            description: title,
          });
          return;
        }
      } catch (e) {
        console.error('Failed to create bookmark via API:', e);
      }
    }
    
    // Guest or API failed: create locally
    const newBookmark: BookmarkItem = {
      id: `local-${Date.now()}`,
      ...bookmarkData,
      createdAt: new Date(),
    };
    
    setBookmarks((prev) => {
      const updated = [newBookmark, ...prev];
      localStorage.setItem(`${BOOKMARKS_KEY}-${bookId}`, JSON.stringify(updated));
      return updated;
    });
    toastRef.current({
      title: "Закладка добавлена",
      description: title,
    });
  }, [currentChapter, selectedText, user, bookId, bookmarks]);
  
  const handleRemoveBookmark = useCallback(async (id: string) => {
    if (user && bookId && !id.startsWith('local-')) {
      // Authenticated with server bookmark: delete via API
      try {
        const response = await readerApi.deleteBookmark(id);
        if (response.ok) {
          setBookmarks((prev) => {
            const updated = prev.filter((b) => b.id !== id);
            localStorage.setItem(`${BOOKMARKS_KEY}-${bookId}`, JSON.stringify(updated));
            return updated;
          });
          return;
        }
      } catch (e) {
        console.error('Failed to delete bookmark via API:', e);
        toastRef.current({
          title: "Ошибка",
          description: "Не удалось удалить закладку",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Guest or local bookmark: delete locally
    setBookmarks((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      localStorage.setItem(`${BOOKMARKS_KEY}-${bookId}`, JSON.stringify(updated));
      return updated;
    });
  }, [user, bookId]);
  
  const handleGoToBookmark = useCallback(async (bookmark: BookmarkItem) => {
    // If bookmark has selected text, use text search to find correct page
    // This works across different screen sizes (desktop/mobile)
    if (bookmark.selectedText) {
      await readerRef.current?.goToChapterAndFindText(
        bookmark.chapterIndex,
        bookmark.selectedText
      );
      
      // Show highlight with fade animation
      setBookmarkHighlight({
        text: bookmark.selectedText,
        chapterIndex: bookmark.chapterIndex,
        pageInChapter: bookmark.pageInChapter || 0,
        fading: false,
      });
      
      // Start fade after a short delay
      setTimeout(() => {
        setBookmarkHighlight(prev => prev ? { ...prev, fading: true } : null);
      }, 500);
      
      // Remove highlight after fade completes
      setTimeout(() => {
        setBookmarkHighlight(null);
      }, 1500);
    } else {
      // No selected text, just navigate to chapter
      readerRef.current?.goToChapter(bookmark.chapterIndex);
    }
    
    // Close bookmarks panel if setting is enabled OR on mobile (always close on mobile)
    const isMobile = window.innerWidth < 640;
    if (isMobile || settings.autoCloseBookmarksPanel !== false) {
      setActivePanel(null);
    }
  }, [settings.autoCloseBookmarksPanel]);
  
  // Search handlers
  const handleSearchInput = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim().length >= 2) {
      const results = readerRef.current?.search(query) || [];
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, []);
  
  const handleSearchResultClick = useCallback(async (result: SearchResult) => {
    // Navigate to chapter using character offset for precise positioning
    // Use context (without ... markers) to find the exact location
    const cleanContext = result.context
      .replace(/^\.\.\./, '')
      .replace(/\.\.\.$/, '')
      .trim();
    
    await readerRef.current?.goToChapterAtOffset(
      result.chapterIndex,
      result.charOffset,
      cleanContext // Use the full context for more precise page finding
    );
    
    // Show highlight with fade animation (reusing bookmark highlight state)
    // Store both matchedText and context for precise highlighting
    setBookmarkHighlight({
      text: result.matchedText,
      context: cleanContext, // Store context to find the correct occurrence
      chapterIndex: result.chapterIndex,
      pageInChapter: 0,
      fading: false,
    });
    
    // Start fade after a short delay
    setTimeout(() => {
      setBookmarkHighlight(prev => prev ? { ...prev, fading: true } : null);
    }, 500);
    
    // Remove highlight after fade completes
    setTimeout(() => {
      setBookmarkHighlight(null);
    }, 1500);
    
    // Close search panel on mobile for better visibility
    const isMobile = window.innerWidth < 640;
    if (isMobile) {
      setActivePanel(null);
    }
    // On desktop, don't close panel - user can continue searching
  }, []);
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка книги...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error || !book) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold mb-2">Ошибка загрузки</h2>
          <p className="text-muted-foreground mb-4">{error || 'Не удалось загрузить книгу'}</p>
          <Link href="/library">
            <Button>Вернуться в библиотеку</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Toolbar */}
      <ReaderToolbar
        book={{ id: book.id, title: book.title, author: book.author }}
        content={bookContent}
        currentChapter={currentChapter}
        position={currentPosition}
        currentPageInChapter={currentPage}
        totalPagesInChapter={totalPages}
        currentPageOverall={currentPageOverall}
        totalPagesOverall={totalPagesOverall}
        overallPercentage={currentPosition?.percentage || 0}
        settings={settings}
        onPrevPage={handlePrev}
        onNextPage={handleNext}
        onOpenToc={() => setActivePanel(activePanel === 'toc' ? null : 'toc')}
        onOpenSearch={() => setActivePanel(activePanel === 'search' ? null : 'search')}
        onOpenBookmarks={() => setActivePanel(activePanel === 'bookmarks' ? null : 'bookmarks')}
        onOpenSettings={() => setActivePanel(activePanel === 'settings' ? null : 'settings')}
        onOpenAI={() => setActivePanel(activePanel === 'ai' ? null : 'ai')}
        onOpenChat={() => setActivePanel(activePanel === 'chat' ? null : 'chat')}
        isTocOpen={activePanel === 'toc'}
        isSearchOpen={activePanel === 'search'}
        isBookmarksOpen={activePanel === 'bookmarks'}
        isSettingsOpen={activePanel === 'settings'}
        isAIOpen={activePanel === 'ai'}
        isChatOpen={activePanel === 'chat'}
        activeReadersCount={0}
      />
      
      {/* Main content - full height */}
      <div className="flex-1 relative overflow-x-hidden overflow-y-hidden">
        {/* External navigation zones - Outside mode */}
        {settings.viewMode === 'paginated' && settings.navigationZonePosition === 'outside' && (
          <>
            {/* Left navigation zone - from screen edge to book container */}
            <div
              className="absolute left-0 top-0 bottom-0 z-5 cursor-pointer flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200"
              style={{
                width: 'calc((100vw - 72rem) / 2)',
                minWidth: '40px',
                background: `linear-gradient(to right, ${THEME_COLORS[settings.theme].accent}40, transparent)`,
              }}
              onClick={() => handlePrev()}
              title="Предыдущая страница"
            >
              <svg 
                className="w-8 h-8 opacity-60" 
                style={{ color: THEME_COLORS[settings.theme].text }}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            
            {/* Right navigation zone - from book container to screen edge, hidden when panel is open */}
            {!activePanel && (
              <div
                className="absolute right-0 top-0 bottom-0 z-5 cursor-pointer flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200"
                style={{
                  width: 'calc((100vw - 72rem) / 2)',
                  minWidth: '40px',
                  background: `linear-gradient(to left, ${THEME_COLORS[settings.theme].accent}40, transparent)`,
                }}
                onClick={() => handleNext()}
                title="Следующая страница"
              >
                <svg 
                  className="w-8 h-8 opacity-60" 
                  style={{ color: THEME_COLORS[settings.theme].text }}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </>
        )}

        <div className="max-w-6xl mx-auto px-4 py-4 h-full">
          {/* Reader area - fixed size, not affected by panels */}
          <div 
            className="h-full"
            onClick={() => {
              // Close ToC and Search panels when clicking on book content
              if (activePanel === 'toc' || activePanel === 'search') {
                setActivePanel(null);
              }
            }}
          >
            <div className="bg-card border rounded-lg shadow-sm h-full">
              {bookUrl && (
                <ReaderCore
                  ref={readerRef}
                  bookUrl={bookUrl}
                  fileType={book.fileType || ''}
                  initialPosition={positionParam}
                  settings={settings}
                  onReady={handleReaderReady}
                  onPositionChange={handlePositionChange}
                  onTextSelect={handleTextSelect}
                  onChapterChange={handleChapterChange}
                  onError={handleReaderError}
                />
              )}
            </div>
          </div>
        </div>
        
        {/* Unified side panel - single container for all menus with slide animation */}
        <div 
          className={`absolute right-0 top-0 bottom-0 w-[400px] max-w-[90vw] border-l bg-background shadow-lg z-10 transition-transform duration-300 ease-in-out overflow-hidden ${
            activePanel ? 'translate-x-0' : 'translate-x-full pointer-events-none'
          }`}
        >
          {activePanel && (
            <div className="h-full flex flex-col">
              {/* Panel header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  {activePanel === 'toc' && <List className="w-5 h-5" />}
                  {activePanel === 'search' && <Search className="w-5 h-5" />}
                  {activePanel === 'bookmarks' && <Bookmark className="w-5 h-5" />}
                  {activePanel === 'settings' && <Settings className="w-5 h-5" />}
                  {activePanel === 'ai' && <Brain className="w-5 h-5" />}
                  {activePanel === 'chat' && <MessageCircle className="w-5 h-5" />}
                  <h3 className="font-semibold">
                    {activePanel === 'toc' && 'Содержание'}
                    {activePanel === 'search' && 'Поиск'}
                    {activePanel === 'bookmarks' && 'Закладки'}
                    {activePanel === 'settings' && 'Настройки'}
                    {activePanel === 'ai' && 'AI Анализ'}
                    {activePanel === 'chat' && 'Чат книги'}
                  </h3>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setActivePanel(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Panel content */}
              <ScrollArea className="flex-1">
                {/* Table of Contents Panel */}
                {activePanel === 'toc' && (
                  <div className="p-4">
                    {bookContent?.chapters.map((chapter, index) => (
                      <button
                        key={index}
                        className={`w-full text-left px-3 py-2 hover:bg-muted rounded-md text-sm ${
                          currentChapter?.index === index ? 'bg-primary/10 text-primary font-medium' : ''
                        }`}
                        onClick={() => handleGoToChapter(index)}
                      >
                        {chapter.title}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Search Panel */}
                {activePanel === 'search' && (
                  <div className="p-4 space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Поиск по книге..."
                        value={searchQuery}
                        onChange={(e) => handleSearchInput(e.target.value)}
                        className="pl-9"
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => {
                            setSearchQuery('');
                            setSearchResults([]);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    {searchResults.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground mb-2">
                          Найдено: {searchResults.length} {searchResults.length === 1 ? 'результат' : searchResults.length < 5 ? 'результата' : 'результатов'}
                        </p>
                        {searchResults.map((result, index) => {
                          // Highlight search query in context
                          const highlightText = (text: string, query: string) => {
                            if (!query.trim()) return text;
                            const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                            const parts = text.split(regex);
                            return parts.map((part, i) => 
                              regex.test(part) ? (
                                <mark key={i} className="bg-amber-200 dark:bg-amber-800 text-inherit rounded-sm px-0.5">
                                  {part}
                                </mark>
                              ) : part
                            );
                          };
                          
                          return (
                            <button
                              key={index}
                              className="w-full text-left p-2 hover:bg-muted rounded-md text-sm"
                              onClick={() => handleSearchResultClick(result)}
                            >
                              <p className="text-xs text-muted-foreground mb-1">
                                Глава {result.chapterIndex + 1}
                              </p>
                              <p className="line-clamp-2">{highlightText(result.context, searchQuery)}</p>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    
                    {searchQuery.length >= 2 && searchResults.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Ничего не найдено
                      </p>
                    )}
                  </div>
                )}
                
                {/* Bookmarks Panel */}
                {activePanel === 'bookmarks' && (
                  <div className="p-4">
                    <Button
                      variant="outline"
                      className="w-full mb-4"
                      onClick={handleAddBookmark}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Добавить закладку
                    </Button>
                    
                    {bookmarks.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Нет закладок</p>
                        <p className="text-sm">Добавьте закладку, чтобы вернуться к этому месту позже</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {bookmarks.map((bookmark) => (
                          <div
                            key={bookmark.id}
                            className="flex items-center gap-2 p-3 rounded-lg hover:bg-muted group"
                          >
                            <button
                              className="flex-1 text-left"
                              onClick={() => handleGoToBookmark(bookmark)}
                            >
                              <p className="font-medium text-sm line-clamp-1">{bookmark.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {Math.round(bookmark.percentage)}% • {bookmark.createdAt.toLocaleDateString()}
                              </p>
                            </button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveBookmark(bookmark.id)}
                            >
                              <Trash2 className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Settings Panel */}
                {activePanel === 'settings' && (
                  <div className="p-4 space-y-6">
                    {/* Font Family */}
                    <div className="space-y-2">
                      <Label>Шрифт</Label>
                      <Select
                        value={settings.fontFamily}
                        onValueChange={(value) => updateSettings({ fontFamily: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Georgia, serif">Georgia</SelectItem>
                          <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                          <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                          <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                          <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                          <SelectItem value="'PT Serif', serif">PT Serif</SelectItem>
                          <SelectItem value="'Open Sans', sans-serif">Open Sans</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Font Size */}
                    <div className="space-y-2">
                      <Label>Размер шрифта: {settings.fontSize}px</Label>
                      <Slider
                        value={[settings.fontSize]}
                        onValueChange={([value]) => updateSettings({ fontSize: value })}
                        min={12}
                        max={32}
                        step={1}
                      />
                    </div>
                    
                    {/* Line Height */}
                    <div className="space-y-2">
                      <Label>Межстрочный интервал: {settings.lineHeight}</Label>
                      <Slider
                        value={[settings.lineHeight]}
                        onValueChange={([value]) => updateSettings({ lineHeight: value })}
                        min={1}
                        max={2.5}
                        step={0.1}
                      />
                    </div>
                    
                    {/* Theme */}
                    <div className="space-y-2">
                      <Label>Тема</Label>
                      <Select
                        value={settings.theme}
                        onValueChange={(value: 'light' | 'dark' | 'sepia') => updateSettings({ theme: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Светлая</SelectItem>
                          <SelectItem value="dark">Тёмная</SelectItem>
                          <SelectItem value="sepia">Сепия</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Text Align */}
                    <div className="space-y-2">
                      <Label>Выравнивание текста</Label>
                      <Select
                        value={settings.textAlign}
                        onValueChange={(value: 'left' | 'justify' | 'center') => updateSettings({ textAlign: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">По левому краю</SelectItem>
                          <SelectItem value="justify">По ширине</SelectItem>
                          <SelectItem value="center">По центру</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Margins */}
                    <div className="space-y-2">
                      <Label>Поля: {settings.margins}px</Label>
                      <Slider
                        value={[settings.margins]}
                        onValueChange={([value]) => updateSettings({ margins: value })}
                        min={10}
                        max={60}
                        step={5}
                      />
                    </div>
                    
                    {/* Show Progress Bar */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showProgressBar"
                        checked={settings.showProgressBar !== false}
                        onCheckedChange={(checked) => updateSettings({ showProgressBar: checked === true })}
                      />
                      <Label htmlFor="showProgressBar" className="cursor-pointer">
                        Показывать полосу прогресса
                      </Label>
                    </div>
                    
                    {/* Auto-close Bookmarks Panel */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="autoCloseBookmarksPanel"
                        checked={settings.autoCloseBookmarksPanel !== false}
                        onCheckedChange={(checked) => updateSettings({ autoCloseBookmarksPanel: checked === true })}
                      />
                      <Label htmlFor="autoCloseBookmarksPanel" className="cursor-pointer">
                        Скрывать панель при переходе к закладке
                      </Label>
                    </div>
                    
                    {/* Navigation Zone Position */}
                    <div className="space-y-2">
                      <Label>Зоны перелистывания</Label>
                      <Select
                        value={settings.navigationZonePosition || 'inside'}
                        onValueChange={(value: 'inside' | 'outside') => updateSettings({ navigationZonePosition: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inside">Внутри книги</SelectItem>
                          <SelectItem value="outside">За пределами книги</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                
                {/* AI Panel */}
                {activePanel === 'ai' && (
                  <div className="p-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Выделите текст в книге для анализа с помощью AI.
                    </p>
                    {selectedText && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Выделенный текст:</p>
                        <p className="text-sm line-clamp-4">{selectedText.text}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Chat Panel */}
                {activePanel === 'chat' && (
                  <div className="p-4 flex flex-col items-center justify-center h-full text-center">
                    <Users className="w-12 h-12 text-muted-foreground/50 mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Чат для обсуждения книги с другими читателями.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Скоро будет доступно
                    </p>
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
      
      {/* Custom highlight overlay - shows selected text area independent of browser selection */}
      {selectedText && selectedText.rect && (
        <div
          className="fixed pointer-events-none z-40"
          style={{
            top: selectedText.rect.top,
            left: selectedText.rect.left,
            width: selectedText.rect.width,
            height: selectedText.rect.height,
            backgroundColor: 'rgba(59, 130, 246, 0.3)',
            borderRadius: '2px',
          }}
        />
      )}
      
      {/* Bookmark highlight overlay - orange color with fade animation */}
      {bookmarkHighlight && bookmarkHighlightRect && (
        <div
          className="fixed pointer-events-none z-40"
          style={{
            top: bookmarkHighlightRect.top,
            left: bookmarkHighlightRect.left,
            width: bookmarkHighlightRect.width,
            height: bookmarkHighlightRect.height,
            backgroundColor: 'rgba(249, 115, 22, 0.5)', // Orange like logo
            borderRadius: '2px',
            opacity: bookmarkHighlight.fading ? 0 : 1,
            transition: 'opacity 1s ease-out',
          }}
        />
      )}
      
      {/* Text selection popover - only show after delay to preserve selection */}
      {showSelectionPopover && selectedText && selectedText.rect && (
        <div
          ref={selectionPopoverRef}
          className="fixed z-50 bg-popover border rounded-lg shadow-lg p-2"
          style={{
            top: Math.min(selectedText.rect.bottom + 8, window.innerHeight - 60),
            left: Math.max(8, Math.min(selectedText.rect.left, window.innerWidth - 200)),
          }}
          tabIndex={-1}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onFocus={(e) => {
            e.preventDefault();
            // Restore selection if focus event cleared it
            if (selectionRangeRef.current) {
              const sel = window.getSelection();
              if (sel && sel.isCollapsed) {
                sel.removeAllRanges();
                sel.addRange(selectionRangeRef.current.cloneRange());
              }
            }
          }}
        >
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                handleAddBookmark();
                window.getSelection()?.removeAllRanges();
                setShowSelectionPopover(false);
                setSelectedText(null);
              }}
            >
              <Bookmark className="w-4 h-4 mr-1" />
              Закладка
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                navigator.clipboard.writeText(selectedText.text);
                toastRef.current({ title: "Скопировано" });
                window.getSelection()?.removeAllRanges();
                setShowSelectionPopover(false);
                setSelectedText(null);
              }}
            >
              Копировать
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
