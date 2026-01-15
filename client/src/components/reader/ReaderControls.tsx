/**
 * ReaderControls - Navigation controls for the reader
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Chapter, BookContent } from './types';

interface ReaderControlsProps {
  content: BookContent | null;
  currentChapter: Chapter | null;
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onGoToChapter: (index: number) => void;
  className?: string;
}

export function ReaderControls({
  content,
  currentChapter,
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  onGoToChapter,
  className = '',
}: ReaderControlsProps) {
  const hasPrevPage = currentPage > 0 || (currentChapter?.index || 0) > 0;
  const hasNextPage =
    currentPage < totalPages - 1 ||
    (content && currentChapter && currentChapter.index < content.chapters.length - 1);

  const isFirstChapter = currentChapter?.index === 0;
  const isLastChapter = content ? currentChapter?.index === content.chapters.length - 1 : true;

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {/* First chapter */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onGoToChapter(0)}
        disabled={isFirstChapter && currentPage === 0}
        title="В начало"
      >
        <ChevronsLeft className="w-5 h-5" />
      </Button>

      {/* Previous page */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrevPage}
        disabled={!hasPrevPage}
        title="Предыдущая страница"
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>

      {/* Page indicator */}
      <div className="text-sm text-muted-foreground min-w-[120px] text-center">
        <span>
          {currentPage + 1} / {totalPages}
        </span>
        {content && content.chapters.length > 1 && (
          <span className="ml-2 text-xs">
            (Гл. {(currentChapter?.index || 0) + 1}/{content.chapters.length})
          </span>
        )}
      </div>

      {/* Next page */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onNextPage}
        disabled={!hasNextPage}
        title="Следующая страница"
      >
        <ChevronRight className="w-5 h-5" />
      </Button>

      {/* Last chapter */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => content && onGoToChapter(content.chapters.length - 1)}
        disabled={isLastChapter && currentPage === totalPages - 1}
        title="В конец"
      >
        <ChevronsRight className="w-5 h-5" />
      </Button>
    </div>
  );
}

/**
 * Side navigation zones (invisible clickable areas)
 */
interface NavigationZonesProps {
  onPrev: () => void;
  onNext: () => void;
  sidebarOpen?: boolean;
}

export function NavigationZones({ onPrev, onNext, sidebarOpen }: NavigationZonesProps) {
  return (
    <>
      {/* Left navigation zone */}
      <div
        className="fixed left-0 top-16 bottom-32 w-16 md:w-32 z-10 hidden lg:flex items-center justify-start pl-4 cursor-pointer opacity-0 hover:opacity-100 hover:bg-gradient-to-r hover:from-foreground/5 to-transparent transition-all duration-300 group"
        onClick={onPrev}
        title="Предыдущая страница"
      >
        <ChevronLeft className="w-10 h-10 text-muted-foreground/40 group-hover:-translate-x-2 transition-transform duration-300" />
      </div>

      {/* Right navigation zone */}
      <div
        className={`fixed right-0 top-16 bottom-32 w-16 md:w-32 z-10 hidden lg:flex items-center justify-end pr-4 cursor-pointer opacity-0 hover:opacity-100 hover:bg-gradient-to-l hover:from-foreground/5 to-transparent transition-all duration-300 group ${
          sidebarOpen ? 'mr-[400px]' : ''
        }`}
        onClick={onNext}
        title="Следующая страница"
        style={{ transitionProperty: 'margin-right, opacity, background-color' }}
      >
        <ChevronRight className="w-10 h-10 text-muted-foreground/40 group-hover:translate-x-2 transition-transform duration-300" />
      </div>
    </>
  );
}

export default ReaderControls;
