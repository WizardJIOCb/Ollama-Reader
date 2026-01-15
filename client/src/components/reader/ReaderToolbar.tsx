/**
 * ReaderToolbar - Top toolbar for reader page
 * 
 * Contains: back button, navigation, and action buttons for side panel
 */

import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Search,
  Bookmark,
  Brain,
  MessageCircle,
  Settings,
  List,
} from 'lucide-react';
import { BookContent, Chapter, Position } from './types';
import { ReaderSettings as ReaderSettingsType } from './types';

interface ReaderToolbarProps {
  book: {
    id: string;
    title: string;
    author: string;
  };
  content: BookContent | null;
  currentChapter: Chapter | null;
  position: Position | null;
  // Chapter progress
  currentPageInChapter?: number;
  totalPagesInChapter?: number;
  // Overall book progress
  overallPercentage?: number;
  currentPageOverall?: number;
  totalPagesOverall?: number;
  settings: ReaderSettingsType;
  onPrevPage: () => void;
  onNextPage: () => void;
  // Panel open handlers
  onOpenToc: () => void;
  onOpenSearch: () => void;
  onOpenBookmarks: () => void;
  onOpenSettings: () => void;
  onOpenAI: () => void;
  onOpenChat: () => void;
  // Active states
  isTocOpen?: boolean;
  isSearchOpen?: boolean;
  isBookmarksOpen?: boolean;
  isSettingsOpen?: boolean;
  isAIOpen?: boolean;
  isChatOpen?: boolean;
  activeReadersCount?: number;
}

export function ReaderToolbar({
  book,
  content,
  currentChapter,
  position,
  currentPageInChapter = 1,
  totalPagesInChapter = 1,
  overallPercentage = 0,
  currentPageOverall = 1,
  totalPagesOverall = 1,
  settings,
  onPrevPage,
  onNextPage,
  onOpenToc,
  onOpenSearch,
  onOpenBookmarks,
  onOpenSettings,
  onOpenAI,
  onOpenChat,
  isTocOpen = false,
  isSearchOpen = false,
  isBookmarksOpen = false,
  isSettingsOpen = false,
  isAIOpen = false,
  isChatOpen = false,
  activeReadersCount = 0,
}: ReaderToolbarProps) {
  const chapterNumber = currentChapter ? currentChapter.index + 1 : 1;
  const totalChapters = content?.chapters.length || 1;

  return (
    <div className="bg-card border-b sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 gap-2">
          {/* Left section: Back + Book info */}
          <div className="flex items-center gap-3 min-w-0 flex-shrink">
            <Link href={`/book/${book.id}`}>
              <Button variant="ghost" size="icon" className="flex-shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            
            <Link href={`/book/${book.id}`} className="min-w-0 hidden sm:block hover:opacity-80 transition-opacity cursor-pointer">
              <h1 className="text-sm font-medium truncate">{book.title}</h1>
              <p className="text-xs text-muted-foreground truncate">{book.author}</p>
            </Link>
          </div>

          {/* Center section: Navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrevPage}
              title="Предыдущая страница"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            {/* Progress indicator */}
            <div className="text-xs text-muted-foreground min-w-[160px] text-center leading-tight">
              <div className="font-medium">
                {Math.round(overallPercentage)}% книги, стр. {currentPageOverall}/{totalPagesOverall}
              </div>
              {/* Chapter info with chapter-specific page */}
              <div className="text-[10px] opacity-75">
                Глава {chapterNumber} из {totalChapters}, стр. {currentPageInChapter}/{totalPagesInChapter}
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onNextPage}
              title="Следующая страница"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Right section: Actions */}
          <div className="flex items-center gap-1">
            {/* Table of Contents */}
            <Button
              variant={isTocOpen ? 'default' : 'ghost'}
              size="icon"
              onClick={onOpenToc}
              title="Содержание"
            >
              <List className="w-5 h-5" />
            </Button>

            {/* Bookmarks */}
            <Button
              variant={isBookmarksOpen ? 'default' : 'ghost'}
              size="icon"
              onClick={onOpenBookmarks}
              title="Закладки"
            >
              <Bookmark className="w-5 h-5" />
            </Button>

            {/* Search */}
            <Button
              variant={isSearchOpen ? 'default' : 'ghost'}
              size="icon"
              onClick={onOpenSearch}
              title="Поиск"
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* AI */}
            <Button
              variant={isAIOpen ? 'default' : 'ghost'}
              size="icon"
              onClick={onOpenAI}
              title="AI Анализ"
            >
              <Brain className="w-5 h-5" />
            </Button>

            {/* Chat */}
            <Button
              variant={isChatOpen ? 'default' : 'ghost'}
              size="icon"
              onClick={onOpenChat}
              title="Чат книги"
              className="relative"
            >
              <MessageCircle className="w-5 h-5" />
              {activeReadersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-medium rounded-full w-4 h-4 flex items-center justify-center">
                  {activeReadersCount > 9 ? '9+' : activeReadersCount}
                </span>
              )}
            </Button>

            {/* Settings */}
            <Button
              variant={isSettingsOpen ? 'default' : 'ghost'}
              size="icon"
              onClick={onOpenSettings}
              title="Настройки"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {settings.showProgressBar !== false && (
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${overallPercentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default ReaderToolbar;
