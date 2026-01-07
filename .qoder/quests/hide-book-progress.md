# Hide Book Reading Progress Display

## Overview

Temporarily hide or comment out the reading progress information displayed on all book cards throughout the application until a functional book reader is implemented that can properly track and update this progress.

## Background

Currently, book cards display reading progress information including:
- Progress percentage (e.g., "Прогресс 30%")
- Page information (e.g., "45 из 150 стр.")
- Last read date (e.g., "Читалось: 12.03.2024")

Since the book reader functionality is not yet fully implemented to accurately track and update this progress, displaying this information may be misleading or confusing to users. This information should be hidden until the reader module can properly maintain reading progress.

## Objectives

- Hide the reading progress section from all book cards
- Ensure the change is easily reversible when the reader module is ready
- Maintain all existing functionality except the progress display
- Keep the underlying data structure and API intact

## Scope

### In Scope

- Visual hiding of reading progress display in the BookCard component
- The progress section includes:
  - Progress label and percentage
  - Progress bar visualization
  - Current page vs total pages display
  - Last read date display

### Out of Scope

- Database schema changes (reading_progress table remains unchanged)
- Backend API modifications (endpoints remain functional)
- Data collection or storage logic
- Reader module implementation
- Removal of readingProgress prop from component interfaces

## Current Implementation Analysis

### Component Location

The reading progress is displayed in the `BookCard` component located at:
- File: `client/src/components/BookCard.tsx`
- Lines: 198-210

### Display Structure

The progress section renders when `readingProgress` prop is provided and includes:

1. Progress header row displaying label "Прогресс" and percentage value
2. Progress bar visual component
3. Bottom row with page count and last read date

### Component Usage

The BookCard component with reading progress is used across multiple pages:
- Library page (popular books, genre groups, user's books)
- Shelves page (books within user shelves)
- Search results
- Any location displaying book cards in detailed variant

### Data Flow

Reading progress data flows as:
1. Mock data provides progress information via `mockUser.readingProgress`
2. Parent components match progress to books by bookId
3. Progress passed as optional prop to BookCard
4. BookCard conditionally renders progress section when prop exists

## Proposed Solution

### Approach

Comment out the reading progress rendering block in the BookCard component while preserving the code structure for easy restoration.

### Implementation Strategy

Use HTML-style comments or conditional rendering to hide the progress section:

**Option 1: HTML Comments (Recommended)**
- Wrap the progress rendering block (lines 198-210) in JSX comments
- Maintains code readability
- Easy to uncomment when reader is ready
- No logic changes required

**Option 2: Conditional Flag**
- Add a feature flag constant to control progress visibility
- More programmatic approach
- Allows quick toggling during development
- Slightly more code overhead

### Recommendation

Use HTML-style JSX comments (Option 1) as it is the simplest, most straightforward approach for temporary hiding with clear intention to restore later.

## Component Changes

### BookCard Component

**Location**: `client/src/components/BookCard.tsx`

**Change**: Comment out the reading progress section

The section to be commented includes:
- Progress percentage display with label
- Progress bar component
- Page count information
- Last read date

This section is currently conditionally rendered based on the presence of the `readingProgress` prop. The entire conditional block should be commented out.

**Note**: The component interface remains unchanged - the `readingProgress` prop continues to be accepted but simply not used for rendering.

## Testing Considerations

### Visual Verification

After implementation, verify that reading progress is hidden on:
- Library page (all book card sections)
- Shelves page (shelf book listings)
- Search results page
- Any other page displaying BookCard components

### Functionality Verification

Ensure the following still work correctly:
- Book cards render properly without progress section
- Card layout and spacing remain appropriate
- "Читать" (Read) button functions normally
- "Подробнее" (Details) button navigates correctly
- Add to shelf functionality (if present) works as expected

### Regression Testing

Verify no unintended side effects:
- Book card dimensions and alignment
- Responsive behavior on different screen sizes
- Other book information displays correctly
- No console errors or warnings

## Future Restoration

### When to Restore

Restore the reading progress display when:
- Book reader module is fully implemented
- Progress tracking is functional and accurate
- Progress updates are saved and retrieved correctly
- Testing confirms reliable progress calculation

### Restoration Process

To restore the reading progress display:
1. Locate the commented section in BookCard.tsx
2. Remove the comment markers
3. Test that progress displays correctly with real data
4. Verify progress updates when user reads books
5. Conduct full regression testing

## Data Preservation

### No Data Loss

This change only affects the UI presentation layer. All backend functionality remains intact:
- Database table `reading_progress` remains unchanged
- API endpoints continue to function
- Data collection (when implemented) continues to work
- Historical progress data is preserved

### Backend Readiness

The backend infrastructure is ready for when the reader module is implemented:
- Schema supports all required progress fields
- APIs can retrieve and update progress
- Data model supports percentage, pages, and timestamps

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Code forgotten during restoration | Medium | Add TODO comment indicating temporary hiding |
| Confusion about feature status | Low | Document this decision in team communication |
| Breaking other components | Low | Progress prop is optional; no dependent logic |
| Layout shifts when restored | Low | CSS structure remains; minimal visual adjustment needed |

## Success Criteria

- Reading progress is not visible on any book cards
- All other book card functionality works normally
- Code is easily reversible with clear documentation
- No console errors or warnings
- Responsive design remains intact
- Backend data structures and APIs remain functional
