# Remove Book Details Header & Update Date Display Logic

## Overview
This design document outlines the changes needed to:
1. Remove the "Детали книги" header from the book detail page
2. Update date display logic in comments and reviews to show full date/time for posts older than 24 hours
3. Modify review display to show user's own review first and conditionally hide the "Write Review" section

## Current Implementation Analysis

### Book Detail Page Structure
The `BookDetail.tsx` component currently displays:
- Page header with title "Детали книги" using `PageHeader` component
- Book information card with cover image, metadata, and statistics
- Tabs for Table of Contents, Comments, and Reviews
- Comments section showing all comments with relative time display
- Reviews section showing all reviews with relative time display and a fixed "Write Review" form

### Date Formatting
Currently uses:
- `formatDistanceToNow()` from date-fns for relative time display ("about 1 hour ago")
- Tooltip showing full date/time on hover (`dd.MM.yyyy HH:mm`)

### Review Display Logic
- All reviews displayed in chronological order
- "Write Review" form always visible regardless of existing user reviews
- No prioritization of current user's reviews

## Requirements Specification

### Requirement 1: Remove Book Details Header
**Location**: `client/src/pages/BookDetail.tsx`, line 683
**Current Code**: `<PageHeader title="Детали книги" />`
**Change**: Remove this line entirely

### Requirement 2: Update Date Display Logic
**Scope**: Comments and Reviews sections in `BookDetail.tsx`
**Current Behavior**: Always shows relative time ("about 1 hour ago") with full date in tooltip
**Required Behavior**: 
- For posts less than 24 hours old: Show relative time ("about 1 hour ago")
- For posts 24 hours or older: Show full date/time immediately ("05.01.2026 14:30")

### Requirement 3: Review Display Priority and Conditional Form
**Scope**: Reviews tab in `BookDetail.tsx`
**Current Behavior**: 
- Reviews displayed chronologically
- "Write Review" form always visible
**Required Behavior**:
- Display current user's review first (if exists)
- Display other reviews sorted by date (newest first)
- Hide "Write Review" form when user has already submitted a review
- Show "Write Review" form only when user has no existing review

## Technical Design

### Component Modifications

#### 1. BookDetail Component Changes

**File**: `client/src/pages/BookDetail.tsx`

##### Header Removal
```typescript
// REMOVE this line completely:
<PageHeader title="Детали книги" />
```

##### Date Display Utility Function
Add a new helper function to determine date display format:

```typescript
const formatDateDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours >= 24) {
    // More than 24 hours old - show full date/time
    return format(date, 'dd.MM.yyyy HH:mm', { locale: ru });
  } else {
    // Less than 24 hours old - show relative time
    return formatDistanceToNow(date, { addSuffix: true, locale: ru });
  }
};
```

##### Review Sorting and Filtering Logic
Modify review rendering to prioritize user's review:

```typescript
// Sort reviews: user's review first, then others by date (newest first)
const sortedReviews = [...bookReviews].sort((a, b) => {
  // If one is user's review, it comes first
  if (a.userId === user?.id) return -1;
  if (b.userId === user?.id) return 1;
  
  // Both are user's or both are others - sort by date (newest first)
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
});

// Check if user has already reviewed
const userHasReviewed = bookReviews.some(review => review.userId === user?.id);
```

##### Conditional Review Form Rendering
```typescript
{/* Add Review Form - only show if user hasn't reviewed yet */}
{!userHasReviewed && (
  <div className="pt-4 border-t mt-4">
    <h4 className="font-medium mb-3">Написать рецензию</h4>
    {/* ... existing review form ... */}
  </div>
)}
```

### Data Flow Changes

#### Review Display Logic
1. Fetch all reviews for the book
2. Check if current user has submitted a review
3. Sort reviews with user's review appearing first
4. Conditionally render the "Write Review" form based on userHasReviewed flag

#### Date Display Logic
1. For each comment/review, calculate time difference from current time
2. If > 24 hours: display formatted date/time directly
3. If ≤ 24 hours: display relative time as before
4. Remove tooltip for posts > 24 hours since full date is already visible

## UI/UX Impact

### Visual Changes
- **Header**: Removal of "Детали книги" title creates more vertical space for content
- **Dates**: Older posts (≥24h) will show explicit date/time, improving clarity for archival content
- **Reviews**: User's review prominently displayed first, reducing need to scroll through others

### User Experience Improvements
- **Reduced cognitive load**: No redundant header taking up screen space
- **Better temporal context**: Clear timestamps for older content
- **Personalized experience**: Own reviews easily accessible at the top
- **Cleaner interface**: Write review form only appears when relevant

## Implementation Steps

### Phase 1: Header Removal
1. Remove `<PageHeader title="Детали книги" />` from BookDetail component
2. Adjust spacing/padding of adjacent elements if needed

### Phase 2: Date Display Logic
1. Implement `formatDateDisplay` utility function
2. Replace existing date display logic in both comments and reviews sections
3. Remove tooltip wrapper for posts ≥24 hours old
4. Retain tooltip for recent posts (<24 hours)

### Phase 3: Review Display Priority
1. Implement sorting logic to prioritize user's review
2. Add `userHasReviewed` state variable
3. Conditionally render the "Write Review" form
4. Update review rendering to use sorted array

## Testing Considerations

### Test Scenarios

#### Header Removal
- Verify header is completely removed from DOM
- Check that page layout remains consistent
- Ensure no accessibility issues introduced

#### Date Display Logic
- Posts <24 hours: Should display relative time ("about 1 hour ago")
- Posts ≥24 hours: Should display full date/time ("05.01.2026 14:30")
- Edge case: Exactly 24 hours - should show full date/time
- Tooltip behavior for recent posts should remain unchanged

#### Review Display Priority
- User with existing review: Their review appears first, no "Write Review" form
- User without review: "Write Review" form visible, reviews sorted by date
- Multiple users' reviews: Proper sorting with current user's review first
- Review deletion: Form should reappear when user deletes their review

### Test Data Requirements
- Comments/reviews with various timestamps (recent and old)
- Books with multiple reviews from different users
- User accounts with and without existing reviews

## Backward Compatibility
All changes are frontend-only modifications that don't affect:
- API contracts
- Database schema
- Existing data structures
- Other components/pages

The changes enhance user experience while maintaining full backward compatibility with existing functionality.

## Performance Considerations
- Sorting reviews is O(n log n) but n is typically small (few dozen reviews per book)
- Date calculations are minimal overhead
- No additional API calls required
- Client-side only changes - no server impact

## Accessibility
- Maintain proper heading hierarchy (removing H1 header)
- Ensure sufficient color contrast for date text
- Preserve keyboard navigation for interactive elements
- Screen reader compatibility maintained for date information- User without review: "Write Review" form visible, reviews sorted by date
- Multiple users' reviews: Proper sorting with current user's review first
- Review deletion: Form should reappear when user deletes their review

### Test Data Requirements
- Comments/reviews with various timestamps (recent and old)
- Books with multiple reviews from different users
- User accounts with and without existing reviews

## Backward Compatibility
All changes are frontend-only modifications that don't affect:
- API contracts
- Database schema
- Existing data structures
- Other components/pages

The changes enhance user experience while maintaining full backward compatibility with existing functionality.

## Performance Considerations
- Sorting reviews is O(n log n) but n is typically small (few dozen reviews per book)
- Date calculations are minimal overhead
- No additional API calls required
- Client-side only changes - no server impact

## Accessibility
- Maintain proper heading hierarchy (removing H1 header)
- Ensure sufficient color contrast for date text
- Preserve keyboard navigation for interactive elements
- Screen reader compatibility maintained for date information- User without review: "Write Review" form visible, reviews sorted by date
- Multiple users' reviews: Proper sorting with current user's review first
- Review deletion: Form should reappear when user deletes their review

### Test Data Requirements
- Comments/reviews with various timestamps (recent and old)
- Books with multiple reviews from different users
- User accounts with and without existing reviews

## Backward Compatibility
All changes are frontend-only modifications that don't affect:
- API contracts
- Database schema
- Existing data structures
- Other components/pages

The changes enhance user experience while maintaining full backward compatibility with existing functionality.

## Performance Considerations
- Sorting reviews is O(n log n) but n is typically small (few dozen reviews per book)
- Date calculations are minimal overhead
- No additional API calls required
- Client-side only changes - no server impact

## Accessibility
- Maintain proper heading hierarchy (removing H1 header)
- Ensure sufficient color contrast for date text
- Preserve keyboard navigation for interactive elements
