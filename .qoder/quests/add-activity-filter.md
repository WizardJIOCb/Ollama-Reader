# Activity Type Filter for Stream Page

## Overview

Add activity type filtering functionality to each tab on the `/stream` page, allowing users to filter displayed activities by type (news, books, comments, reviews, user actions).

## Current State

The Stream page has four tabs:
- **Global Tab**: Shows all public activities (news, books, comments, reviews)
- **My Shelves Tab**: Shows activities from user's shelves, currently has shelf and book filtering
- **My Activity Tab**: Shows current user's own activities
- **Last Actions Tab**: Shows combined stream of global activities and user navigation actions

Currently, only the "My Shelves" tab has filtering capability (ShelfFilters component) which filters by shelf and book. No tab has activity type filtering.

Activity types in the system:
- `news` - News articles posted
- `book` - Books uploaded
- `comment` - Comments on news or books
- `review` - Book reviews
- `user_action` - User navigation and interaction events (only in Last Actions tab)

## Design Goals

Add flexible, user-friendly activity type filtering to improve content discoverability and allow users to focus on specific activity types they're interested in.

## Functional Requirements

### Filter UI Component

Create a reusable ActivityTypeFilter component that:
- Displays checkboxes or toggle buttons for each activity type
- Shows activity count badge for each type (optional enhancement)
- Can be collapsed/expanded to save screen space
- Maintains selected state across tab switches within same session
- Provides "Clear All" / "Select All" quick actions
- Has responsive design for mobile and desktop

### Filter Behavior by Tab

**Global Tab**:
- Filter options: News, Books, Comments, Reviews
- Default: All types selected
- Frontend filtering on fetched data (no backend changes needed)

**My Shelves Tab**:
- Filter options: News, Books, Comments, Reviews
- Default: All types selected
- Works in combination with existing shelf/book filters
- Both activity type AND shelf/book filters applied together

**My Activity Tab**:
- Filter options: News, Books, Comments, Reviews
- Default: All types selected
- Shows only current user's activities of selected types

**Last Actions Tab**:
- Filter options: News, Books, Comments, Reviews, User Actions
- Default: All types selected
- User Actions filter controls visibility of navigation events
- Regular activity filters control content activities

### Filter Persistence

- Selected filters persist during session (stored in component state)
- Filters reset to default when user leaves and returns to stream page
- No server-side persistence required

### Filter UI Placement

- Position filter UI consistently across all tabs
- Place below tab headers, above activity feed
- On My Shelves tab: Activity type filter appears separately from existing ShelfFilters component
- Use consistent styling with existing ShelfFilters component

## UI Design Considerations

### Visual Structure

```
┌─────────────────────────────────────────┐
│  Stream Page Title                       │
├─────────────────────────────────────────┤
│  [Global] [My Shelves] [My] [Actions]   │
├─────────────────────────────────────────┤
│  ┌─ Activity Type Filter ─────────────┐ │
│  │ [Filter Icon] Activity Types (3)   │ │
│  │ ☑ News  ☑ Books  ☑ Comments  ...   │ │
│  └────────────────────────────────────┘ │
│                                          │
│  [On My Shelves tab only:]               │
│  ┌─ Shelf & Book Filter ──────────────┐ │
│  │ [Filter Icon] Shelves & Books      │ │
│  │ ... existing shelf filter UI ...   │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌─ Activity Card 1 ──────────────────┐ │
│  │ ...                                 │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Interaction Patterns

- Clicking checkbox toggles that activity type
- At least one type must remain selected (prevent empty results)
- Filter changes immediately update displayed activities
- Loading state shown during filter application
- "X Clear" button clears all selections and resets to default

## Technical Design

### Component Architecture

**New Component: ActivityTypeFilter**
- Props:
  - `availableTypes`: Array of activity types to show
  - `selectedTypes`: Currently selected types
  - `onFilterChange`: Callback when selection changes
  - `isCollapsible`: Whether filter can collapse (default: true)
- State:
  - `isOpen`: Collapsible open/closed state
  - Local selected types (synced with parent)
- Renders checkboxes for each activity type
- Styled consistently with ShelfFilters component

### Integration with StreamPage

**State Management**:
- Add new state: `activityTypeFilters` object with keys for each tab
- Structure: `{ global: ['news', 'book', 'comment', 'review'], personal: [...], ... }`
- Initialize with all types selected by default

**Filtering Logic**:
- Apply filtering in StreamPage component before rendering ActivityCard components
- Filter `currentActivities` array based on selected types
- Filtering happens client-side after data fetch
- Filter logic: `activities.filter(a => selectedTypes.includes(a.type))`

**Tab-specific Integration**:
- Each TabsContent renders ActivityTypeFilter component
- Pass tab-specific filter state and update handler
- On My Shelves tab: Render ActivityTypeFilter above existing ShelfFilters

### Data Flow

```
User selects/deselects activity type
        ↓
ActivityTypeFilter calls onFilterChange
        ↓
StreamPage updates activityTypeFilters state
        ↓
currentActivities filtered by selected types
        ↓
Filtered results rendered in activity feed
```

## Translation Keys

Add to stream namespace in i18n files:

- `activityTypeFilter.title` - "Activity Types"
- `activityTypeFilter.clearFilters` - "Clear"
- `activityTypeFilter.selectAll` - "Select All"
- `activityTypeFilter.news` - "News"
- `activityTypeFilter.books` - "Books"
- `activityTypeFilter.comments` - "Comments"
- `activityTypeFilter.reviews` - "Reviews"
- `activityTypeFilter.userActions` - "User Actions"
- `activityTypeFilter.noResults` - "No activities match your filters"

## Edge Cases and Considerations

### Empty Results
- When filters result in zero activities, show message: "No activities match your filters"
- Provide quick action to clear filters

### Mobile Responsiveness
- On small screens: Filters collapsed by default
- Use horizontal scrollable checkboxes if needed
- Ensure touch targets are adequate size

### WebSocket Real-time Updates
- New activities from WebSocket still added to cache
- Filter applied to both existing and new activities
- New activities of unselected types remain hidden

### Performance
- Client-side filtering is fast for typical activity counts
- No performance concerns expected with 100-500 activities
- Activities remain cached regardless of filter selection

### Accessibility
- Filter checkboxes have proper labels
- Keyboard navigation supported
- Screen reader friendly announcements for filter changes

## Success Criteria

- Users can filter activities by type on all stream tabs
- Filter UI is consistent and intuitive across tabs
- Filters work correctly in combination with existing shelf/book filters
- No performance degradation with filtering
- Mobile experience is usable and responsive
- Translations available in all supported languages

## Out of Scope

- Backend API changes (filtering happens client-side)
- Filter persistence across sessions or page reloads
- Advanced filter combinations (AND/OR logic)
- Date range filtering
- Saving filter presets
- Activity count badges per type (can be added later if needed)
Create a reusable ActivityTypeFilter component that:
- Displays checkboxes or toggle buttons for each activity type
- Shows activity count badge for each type (optional enhancement)
- Can be collapsed/expanded to save screen space
- Maintains selected state across tab switches within same session
- Provides "Clear All" / "Select All" quick actions
- Has responsive design for mobile and desktop

### Filter Behavior by Tab

**Global Tab**:
- Filter options: News, Books, Comments, Reviews
- Default: All types selected
- Frontend filtering on fetched data (no backend changes needed)

**My Shelves Tab**:
- Filter options: News, Books, Comments, Reviews
- Default: All types selected
- Works in combination with existing shelf/book filters
- Both activity type AND shelf/book filters applied together

**My Activity Tab**:
- Filter options: News, Books, Comments, Reviews
- Default: All types selected
- Shows only current user's activities of selected types

**Last Actions Tab**:
- Filter options: News, Books, Comments, Reviews, User Actions
- Default: All types selected
- User Actions filter controls visibility of navigation events
- Regular activity filters control content activities

### Filter Persistence

- Selected filters persist during session (stored in component state)
- Filters reset to default when user leaves and returns to stream page
- No server-side persistence required

### Filter UI Placement

- Position filter UI consistently across all tabs
- Place below tab headers, above activity feed
- On My Shelves tab: Activity type filter appears separately from existing ShelfFilters component
- Use consistent styling with existing ShelfFilters component

## UI Design Considerations

### Visual Structure

```
┌─────────────────────────────────────────┐
│  Stream Page Title                       │
├─────────────────────────────────────────┤
│  [Global] [My Shelves] [My] [Actions]   │
├─────────────────────────────────────────┤
│  ┌─ Activity Type Filter ─────────────┐ │
│  │ [Filter Icon] Activity Types (3)   │ │
│  │ ☑ News  ☑ Books  ☑ Comments  ...   │ │
│  └────────────────────────────────────┘ │
│                                          │
│  [On My Shelves tab only:]               │
│  ┌─ Shelf & Book Filter ──────────────┐ │
│  │ [Filter Icon] Shelves & Books      │ │
│  │ ... existing shelf filter UI ...   │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌─ Activity Card 1 ──────────────────┐ │
│  │ ...                                 │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Interaction Patterns

- Clicking checkbox toggles that activity type
- At least one type must remain selected (prevent empty results)
- Filter changes immediately update displayed activities
- Loading state shown during filter application
- "X Clear" button clears all selections and resets to default

## Technical Design

### Component Architecture

**New Component: ActivityTypeFilter**
- Props:
  - `availableTypes`: Array of activity types to show
  - `selectedTypes`: Currently selected types
  - `onFilterChange`: Callback when selection changes
  - `isCollapsible`: Whether filter can collapse (default: true)
- State:
  - `isOpen`: Collapsible open/closed state
  - Local selected types (synced with parent)
- Renders checkboxes for each activity type
- Styled consistently with ShelfFilters component

### Integration with StreamPage

**State Management**:
- Add new state: `activityTypeFilters` object with keys for each tab
- Structure: `{ global: ['news', 'book', 'comment', 'review'], personal: [...], ... }`
- Initialize with all types selected by default

**Filtering Logic**:
- Apply filtering in StreamPage component before rendering ActivityCard components
- Filter `currentActivities` array based on selected types
- Filtering happens client-side after data fetch
- Filter logic: `activities.filter(a => selectedTypes.includes(a.type))`

**Tab-specific Integration**:
- Each TabsContent renders ActivityTypeFilter component
- Pass tab-specific filter state and update handler
- On My Shelves tab: Render ActivityTypeFilter above existing ShelfFilters

### Data Flow

```
User selects/deselects activity type
        ↓
ActivityTypeFilter calls onFilterChange
        ↓
StreamPage updates activityTypeFilters state
        ↓
currentActivities filtered by selected types
        ↓
Filtered results rendered in activity feed
```

## Translation Keys

Add to stream namespace in i18n files:

- `activityTypeFilter.title` - "Activity Types"
- `activityTypeFilter.clearFilters` - "Clear"
- `activityTypeFilter.selectAll` - "Select All"
- `activityTypeFilter.news` - "News"
- `activityTypeFilter.books` - "Books"
- `activityTypeFilter.comments` - "Comments"
- `activityTypeFilter.reviews` - "Reviews"
- `activityTypeFilter.userActions` - "User Actions"
- `activityTypeFilter.noResults` - "No activities match your filters"

## Edge Cases and Considerations

### Empty Results
- When filters result in zero activities, show message: "No activities match your filters"
- Provide quick action to clear filters

### Mobile Responsiveness
- On small screens: Filters collapsed by default
- Use horizontal scrollable checkboxes if needed
- Ensure touch targets are adequate size

### WebSocket Real-time Updates
- New activities from WebSocket still added to cache
- Filter applied to both existing and new activities
- New activities of unselected types remain hidden

### Performance
- Client-side filtering is fast for typical activity counts
- No performance concerns expected with 100-500 activities
- Activities remain cached regardless of filter selection

### Accessibility
- Filter checkboxes have proper labels
- Keyboard navigation supported
- Screen reader friendly announcements for filter changes

## Success Criteria

- Users can filter activities by type on all stream tabs
- Filter UI is consistent and intuitive across tabs
- Filters work correctly in combination with existing shelf/book filters
- No performance degradation with filtering
- Mobile experience is usable and responsive
- Translations available in all supported languages

## Out of Scope

- Backend API changes (filtering happens client-side)
- Filter persistence across sessions or page reloads
- Advanced filter combinations (AND/OR logic)
- Date range filtering
- Saving filter presets
- Activity count badges per type (can be added later if needed)
## Functional Requirements

### Filter UI Component

Create a reusable ActivityTypeFilter component that:
- Displays checkboxes or toggle buttons for each activity type
- Shows activity count badge for each type (optional enhancement)
- Can be collapsed/expanded to save screen space
- Maintains selected state across tab switches within same session
- Provides "Clear All" / "Select All" quick actions
- Has responsive design for mobile and desktop

### Filter Behavior by Tab

**Global Tab**:
- Filter options: News, Books, Comments, Reviews
- Default: All types selected
- Frontend filtering on fetched data (no backend changes needed)

**My Shelves Tab**:
- Filter options: News, Books, Comments, Reviews
- Default: All types selected
- Works in combination with existing shelf/book filters
- Both activity type AND shelf/book filters applied together

**My Activity Tab**:
- Filter options: News, Books, Comments, Reviews
- Default: All types selected
- Shows only current user's activities of selected types

**Last Actions Tab**:
- Filter options: News, Books, Comments, Reviews, User Actions
- Default: All types selected
- User Actions filter controls visibility of navigation events
- Regular activity filters control content activities

### Filter Persistence

- Selected filters persist during session (stored in component state)
- Filters reset to default when user leaves and returns to stream page
- No server-side persistence required

### Filter UI Placement

- Position filter UI consistently across all tabs
- Place below tab headers, above activity feed
- On My Shelves tab: Activity type filter appears separately from existing ShelfFilters component
- Use consistent styling with existing ShelfFilters component

## UI Design Considerations

### Visual Structure

```
┌─────────────────────────────────────────┐
│  Stream Page Title                       │
├─────────────────────────────────────────┤
│  [Global] [My Shelves] [My] [Actions]   │
├─────────────────────────────────────────┤
│  ┌─ Activity Type Filter ─────────────┐ │
│  │ [Filter Icon] Activity Types (3)   │ │
│  │ ☑ News  ☑ Books  ☑ Comments  ...   │ │
│  └────────────────────────────────────┘ │
│                                          │
│  [On My Shelves tab only:]               │
│  ┌─ Shelf & Book Filter ──────────────┐ │
│  │ [Filter Icon] Shelves & Books      │ │
│  │ ... existing shelf filter UI ...   │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌─ Activity Card 1 ──────────────────┐ │
│  │ ...                                 │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Interaction Patterns

- Clicking checkbox toggles that activity type
- At least one type must remain selected (prevent empty results)
- Filter changes immediately update displayed activities
- Loading state shown during filter application
- "X Clear" button clears all selections and resets to default

## Technical Design

### Component Architecture

**New Component: ActivityTypeFilter**
- Props:
  - `availableTypes`: Array of activity types to show
  - `selectedTypes`: Currently selected types
  - `onFilterChange`: Callback when selection changes
  - `isCollapsible`: Whether filter can collapse (default: true)
- State:
  - `isOpen`: Collapsible open/closed state
  - Local selected types (synced with parent)
- Renders checkboxes for each activity type
- Styled consistently with ShelfFilters component

### Integration with StreamPage

**State Management**:
- Add new state: `activityTypeFilters` object with keys for each tab
- Structure: `{ global: ['news', 'book', 'comment', 'review'], personal: [...], ... }`
- Initialize with all types selected by default

**Filtering Logic**:
- Apply filtering in StreamPage component before rendering ActivityCard components
- Filter `currentActivities` array based on selected types
- Filtering happens client-side after data fetch
- Filter logic: `activities.filter(a => selectedTypes.includes(a.type))`

**Tab-specific Integration**:
- Each TabsContent renders ActivityTypeFilter component
- Pass tab-specific filter state and update handler
- On My Shelves tab: Render ActivityTypeFilter above existing ShelfFilters

### Data Flow

```
User selects/deselects activity type
        ↓
ActivityTypeFilter calls onFilterChange
        ↓
StreamPage updates activityTypeFilters state
        ↓
currentActivities filtered by selected types
        ↓
Filtered results rendered in activity feed
```

## Translation Keys

Add to stream namespace in i18n files:

- `activityTypeFilter.title` - "Activity Types"
- `activityTypeFilter.clearFilters` - "Clear"
- `activityTypeFilter.selectAll` - "Select All"
- `activityTypeFilter.news` - "News"
- `activityTypeFilter.books` - "Books"
- `activityTypeFilter.comments` - "Comments"
- `activityTypeFilter.reviews` - "Reviews"
- `activityTypeFilter.userActions` - "User Actions"
- `activityTypeFilter.noResults` - "No activities match your filters"

## Edge Cases and Considerations

### Empty Results
- When filters result in zero activities, show message: "No activities match your filters"
- Provide quick action to clear filters

### Mobile Responsiveness
- On small screens: Filters collapsed by default
- Use horizontal scrollable checkboxes if needed
- Ensure touch targets are adequate size

### WebSocket Real-time Updates
- New activities from WebSocket still added to cache
- Filter applied to both existing and new activities
- New activities of unselected types remain hidden

### Performance
- Client-side filtering is fast for typical activity counts
- No performance concerns expected with 100-500 activities
- Activities remain cached regardless of filter selection

### Accessibility
- Filter checkboxes have proper labels
- Keyboard navigation supported
- Screen reader friendly announcements for filter changes

## Success Criteria

- Users can filter activities by type on all stream tabs
- Filter UI is consistent and intuitive across tabs
- Filters work correctly in combination with existing shelf/book filters
- No performance degradation with filtering
- Mobile experience is usable and responsive
- Translations available in all supported languages

## Out of Scope

- Backend API changes (filtering happens client-side)
- Filter persistence across sessions or page reloads
- Advanced filter combinations (AND/OR logic)
- Date range filtering
- Saving filter presets
- Activity count badges per type (can be added later if needed)
