# Feature Design: Hide My Actions Toggle Filter

## Overview

Add a global toggle filter "Don't show my actions" ("Не показывать мои действия") to the Stream page that allows users to hide all activities associated with their own account, showing only activities from other users. This filter will be enabled by default and positioned below the "Activity Stream" title.

## Requirements

### Functional Requirements

1. **Toggle Position and Visibility**
   - The toggle must appear immediately below the "Activity Stream" page title
   - Must be visible on all tabs: Social, My Shelves, My Activity, and Last Actions
   - Position: Between the page title and the tab navigation (TabsList)

2. **Default State**
   - The toggle must be enabled (checked) by default
   - When enabled, user's own activities are hidden from the stream
   - When disabled, all activities including user's own are displayed

3. **Filter Logic**
   - When enabled, filter out any activity where `activity.userId` matches the current authenticated user's ID
   - Apply this filter across all tab contexts:
     - **Social tab**: Hide user's own news, books, comments, reviews
     - **My Shelves tab**: Hide user's own activities related to shelved books
     - **My Activity tab**: This tab becomes empty when filter is enabled (as it shows only user's activities)
     - **Last Actions tab**: Hide user's own navigation actions and content interactions

4. **Filter Priority**
   - This filter operates after Activity Type filters are applied
   - Works in combination with other existing filters (shelf filters, book filters)
   - Filter chain: Activity Type → Hide My Actions → Shelf/Book Filters

5. **Persistence**
   - Filter state must persist during the session (in component state)
   - Does not need to persist across browser sessions
   - Resets to default (enabled) when page is refreshed

6. **Unauthenticated Users**
   - Toggle must not be visible for unauthenticated users
   - Filter logic only applies when user is authenticated

### UI/UX Requirements

1. **Visual Design**
   - Display as a checkbox with label text
   - Label text: "Don't show my actions" (EN) / "Не показывать мои действия" (RU)
   - Styling consistent with existing filter checkboxes
   - Small, subtle appearance to avoid overwhelming the interface

2. **Layout**
   - Horizontal layout: checkbox on left, label text on right
   - Aligned to the left side of the page
   - Margin bottom to create visual separation from tabs below
   - Margin top to create visual separation from title above

3. **Interaction**
   - Single click on checkbox or label toggles the state
   - Visual feedback on hover (cursor pointer)
   - Immediate effect when toggled (no apply button needed)

4. **Empty State Handling**
   - When filter results in zero activities, show appropriate empty state message
   - Message must distinguish between:
     - No activities exist vs. All activities are filtered out
   - Consider special message for My Activity tab when filter is enabled

## Data Model

### State Management

```
Component State Addition:
- hideMyActions: boolean (default: true)

Filter State Structure:
{
  activityTypeFilters: Record<string, ActivityType[]>,
  hideMyActions: boolean,
  shelfFilters: ShelfFiltersData
}
```

### Activity Filtering Flow

```
Current Activities (from API)
  ↓
Apply Activity Type Filters
  ↓
Apply Hide My Actions Filter (if enabled and user authenticated)
  ↓
Apply Shelf/Book Filters (if on My Shelves tab)
  ↓
Filtered Activities (displayed)
```

## Component Architecture

### Modified Components

1. **StreamPage.tsx**
   - Add `hideMyActions` state
   - Add toggle UI below page title
   - Modify filtering logic to incorporate hideMyActions filter
   - Pass current user ID for comparison

2. **Translation Files**
   - Add new translation keys for toggle label
   - Location: `client/src/locales/en/stream.json` and `client/src/locales/ru/stream.json`

### New Translation Keys

```
stream.json additions:
{
  "hideMyActions": "Don't show my actions",
  "hideMyActionsDescription": "When enabled, only shows activities from other users"
}
```

Russian translations:
```
{
  "hideMyActions": "Не показывать мои действия",
  "hideMyActionsDescription": "Если включено, показываются только действия других пользователей"
}
```

## Technical Considerations

### Performance
- Filter operation is client-side only
- Filtering happens on already fetched data
- No additional API calls required
- Minimal performance impact (simple ID comparison)

### Accessibility
- Checkbox must be keyboard accessible
- Label must be associated with checkbox via htmlFor attribute
- Sufficient color contrast for text
- Clear focus indicator on keyboard navigation

### Responsive Design
- Toggle must be visible and functional on mobile devices
- Text label must not wrap on small screens (or wrap gracefully)
- Touch target size must meet minimum accessibility requirements (44x44px)

### Edge Cases

1. **My Activity Tab with Filter Enabled**
   - Expected behavior: Empty state (all activities filtered)
   - Show informative message explaining why tab is empty
   - Provide hint to disable filter to see own activities

2. **No Other Users' Activities**
   - When filter is enabled and only user's own activities exist
   - Show empty state indicating no other users' activities available

3. **Real-time Updates**
   - Newly received activities via WebSocket must respect filter state
   - Activities added to cache must be filtered before display if filter enabled

4. **Tab Switching**
   - Filter state persists when switching between tabs
   - Each tab respects the global hideMyActions setting

## Integration Points

### Existing Filter System
- Integrates with existing `activityTypeFilters` state
- Works alongside `ShelfFilters` component on My Shelves tab
- Does not interfere with `ActivityTypeFilter` component behavior

### WebSocket Real-time Updates
- Real-time activity updates must respect hideMyActions filter
- Activities added via `stream:new-activity` event must be filtered
- Activities added via `stream:last-action` event must be filtered

### Query Cache Updates
- When filter state changes, apply filter to cached data
- No need to refetch from API when toggling filter
- Cached data remains unchanged, only display filtering changes

## User Workflow

### Scenario 1: Default Experience (Filter Enabled)
1. Authenticated user navigates to /stream
2. Toggle is enabled by default
3. User sees only activities from other users
4. User's own activities are hidden from view

### Scenario 2: Viewing Own Activities
1. User wants to see their own activities in Social tab
2. User unchecks "Don't show my actions" toggle
3. Stream immediately updates to show all activities including user's own
4. User can see their own posts, comments, reviews alongside others'

### Scenario 3: My Activity Tab with Filter Enabled
1. User navigates to My Activity tab
2. Filter is enabled (default state)
3. Tab shows empty state with message
4. Message explains that filter is hiding user's own activities
5. User can disable filter to see content or switch to another tab

## Validation Criteria

### Functional Validation
- ✓ Toggle appears below "Activity Stream" title on all tabs
- ✓ Toggle is enabled by default
- ✓ Toggle is hidden for unauthenticated users
- ✓ When enabled, user's activities are filtered from all tabs
- ✓ When disabled, user's activities are visible
- ✓ Filter state persists during session
- ✓ Filter state resets on page refresh

### UI Validation
- ✓ Checkbox and label are properly aligned
- ✓ Label text matches translations
- ✓ Hover states work correctly
- ✓ Visual feedback on toggle action

### Integration Validation
- ✓ Works correctly with Activity Type filters
- ✓ Works correctly with Shelf/Book filters
- ✓ Real-time updates respect filter state
- ✓ Empty states display appropriate messages
- ✓ No console errors or warnings

### Accessibility Validation
- ✓ Keyboard navigation works
- ✓ Screen reader announces checkbox state
- ✓ Focus indicator visible
- ✓ Touch targets meet minimum size

## Implementation Notes

### Filter Implementation Location
The hideMyActions filter should be applied in StreamPage.tsx after activity type filtering:

```
Current implementation (line 159-163):
const selectedTypeFilters = activityTypeFilters[activeTab] || [];
const filteredActivities = currentActivities.filter(activity => 
  selectedTypeFilters.includes(activity.type as ActivityType)
);

Enhanced implementation:
const selectedTypeFilters = activityTypeFilters[activeTab] || [];
let filteredActivities = currentActivities.filter(activity => 
  selectedTypeFilters.includes(activity.type as ActivityType)
);

// Apply hideMyActions filter if enabled and user is authenticated
if (hideMyActions && currentUser) {
  filteredActivities = filteredActivities.filter(activity => 
    activity.userId !== currentUser.id
  );
}
```

### Toggle UI Placement
Position the toggle between the page title (line 563-565) and the Tabs component (line 567):

```
Structure:
<div className="container mx-auto px-4 py-8 max-w-4xl">
  <div className="mb-6">
    <h1 className="text-3xl font-bold mb-2">{t('stream:title')}</h1>
  </div>

  {/* NEW: Hide My Actions Toggle - Insert here */}
  {isAuthenticated && (
    <div className="mb-4 flex items-center space-x-2">
      <Checkbox 
        id="hide-my-actions"
        checked={hideMyActions}
        onCheckedChange={setHideMyActions}
      />
      <Label htmlFor="hide-my-actions" className="text-sm cursor-pointer">
        {t('stream:hideMyActions')}
      </Label>
    </div>
  )}

  <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
    ...
  </Tabs>
</div>
```

### My Activity Tab Special Handling
For the My Activity tab, consider showing a helpful empty state message when filter is enabled:

```
When on personal tab and hideMyActions is enabled:
- Show custom empty state message
- Include instruction to disable filter
- Provide visual hint (icon or illustration)
```

### Real-time Update Handling
Ensure WebSocket handlers respect the filter (lines 261-499):
- Activities added to cache in `handleNewActivity` are unaffected
- Filtering happens during display, not during cache updates
- No changes needed to WebSocket event handlers
- Filtering logic in render path handles real-time updates automatically

## Risk Assessment

### Low Risk Areas
- UI implementation (standard React patterns)
- Translation integration (follows existing pattern)
- State management (simple boolean flag)

### Medium Risk Areas
- Empty state messaging clarity
- My Activity tab user experience when filter enabled
- Performance impact on large activity lists (mitigated by client-side filtering)

### Mitigation Strategies
- Provide clear, informative empty state messages
- Include tooltips or help text for My Activity tab behavior
- Test with large activity datasets
- Consider debouncing if performance issues arise

## Future Enhancements

### Potential Improvements
1. **Filter Persistence**
   - Store preference in user profile/settings
   - Remember state across sessions using localStorage

2. **Filter Options Expansion**
   - Show only activities from followed users
   - Show only activities from specific user groups
   - Time-based filtering (last hour, day, week)

3. **Visual Indicators**
   - Badge showing number of hidden activities
   - Temporary toast notification when activities are filtered
   - Filter summary panel

4. **Granular Control**
   - Hide specific activity types from self (e.g., hide my comments but show my reviews)
   - Per-tab filter settings
   - Quick toggle in activity cards

## Conclusion

This feature adds a straightforward yet valuable filtering capability to the Stream page, allowing users to focus on content from other users by default. The implementation is minimal, non-invasive, and follows existing patterns in the codebase. The default-enabled state encourages social discovery while maintaining user control through a simple toggle mechanism.     - **My Activity tab**: This tab becomes empty when filter is enabled (as it shows only user's activities)
     - **Last Actions tab**: Hide user's own navigation actions and content interactions

4. **Filter Priority**
   - This filter operates after Activity Type filters are applied
   - Works in combination with other existing filters (shelf filters, book filters)
   - Filter chain: Activity Type → Hide My Actions → Shelf/Book Filters

5. **Persistence**
   - Filter state must persist during the session (in component state)
   - Does not need to persist across browser sessions
   - Resets to default (enabled) when page is refreshed

6. **Unauthenticated Users**
   - Toggle must not be visible for unauthenticated users
   - Filter logic only applies when user is authenticated

### UI/UX Requirements

1. **Visual Design**
   - Display as a checkbox with label text
   - Label text: "Don't show my actions" (EN) / "Не показывать мои действия" (RU)
   - Styling consistent with existing filter checkboxes
   - Small, subtle appearance to avoid overwhelming the interface

2. **Layout**
   - Horizontal layout: checkbox on left, label text on right
   - Aligned to the left side of the page
   - Margin bottom to create visual separation from tabs below
   - Margin top to create visual separation from title above

3. **Interaction**
   - Single click on checkbox or label toggles the state
   - Visual feedback on hover (cursor pointer)
   - Immediate effect when toggled (no apply button needed)

4. **Empty State Handling**
   - When filter results in zero activities, show appropriate empty state message
   - Message must distinguish between:
     - No activities exist vs. All activities are filtered out
   - Consider special message for My Activity tab when filter is enabled

## Data Model

### State Management

```
Component State Addition:
- hideMyActions: boolean (default: true)

Filter State Structure:
{
  activityTypeFilters: Record<string, ActivityType[]>,
  hideMyActions: boolean,
  shelfFilters: ShelfFiltersData
}
```

### Activity Filtering Flow

```
Current Activities (from API)
  ↓
Apply Activity Type Filters
  ↓
Apply Hide My Actions Filter (if enabled and user authenticated)
  ↓
Apply Shelf/Book Filters (if on My Shelves tab)
  ↓
Filtered Activities (displayed)
```

## Component Architecture

### Modified Components

1. **StreamPage.tsx**
   - Add `hideMyActions` state
   - Add toggle UI below page title
   - Modify filtering logic to incorporate hideMyActions filter
   - Pass current user ID for comparison

2. **Translation Files**
   - Add new translation keys for toggle label
   - Location: `client/src/locales/en/stream.json` and `client/src/locales/ru/stream.json`

### New Translation Keys

```
stream.json additions:
{
  "hideMyActions": "Don't show my actions",
  "hideMyActionsDescription": "When enabled, only shows activities from other users"
}
```

Russian translations:
```
{
  "hideMyActions": "Не показывать мои действия",
  "hideMyActionsDescription": "Если включено, показываются только действия других пользователей"
}
```

## Technical Considerations

### Performance
- Filter operation is client-side only
- Filtering happens on already fetched data
- No additional API calls required
- Minimal performance impact (simple ID comparison)

### Accessibility
- Checkbox must be keyboard accessible
- Label must be associated with checkbox via htmlFor attribute
- Sufficient color contrast for text
- Clear focus indicator on keyboard navigation

### Responsive Design
- Toggle must be visible and functional on mobile devices
- Text label must not wrap on small screens (or wrap gracefully)
- Touch target size must meet minimum accessibility requirements (44x44px)

### Edge Cases

1. **My Activity Tab with Filter Enabled**
   - Expected behavior: Empty state (all activities filtered)
   - Show informative message explaining why tab is empty
   - Provide hint to disable filter to see own activities

2. **No Other Users' Activities**
   - When filter is enabled and only user's own activities exist
   - Show empty state indicating no other users' activities available

3. **Real-time Updates**
   - Newly received activities via WebSocket must respect filter state
   - Activities added to cache must be filtered before display if filter enabled

4. **Tab Switching**
   - Filter state persists when switching between tabs
   - Each tab respects the global hideMyActions setting

## Integration Points

### Existing Filter System
- Integrates with existing `activityTypeFilters` state
- Works alongside `ShelfFilters` component on My Shelves tab
- Does not interfere with `ActivityTypeFilter` component behavior

### WebSocket Real-time Updates
- Real-time activity updates must respect hideMyActions filter
- Activities added via `stream:new-activity` event must be filtered
- Activities added via `stream:last-action` event must be filtered

### Query Cache Updates
- When filter state changes, apply filter to cached data
- No need to refetch from API when toggling filter
- Cached data remains unchanged, only display filtering changes

## User Workflow

### Scenario 1: Default Experience (Filter Enabled)
1. Authenticated user navigates to /stream
2. Toggle is enabled by default
3. User sees only activities from other users
4. User's own activities are hidden from view

### Scenario 2: Viewing Own Activities
1. User wants to see their own activities in Social tab
2. User unchecks "Don't show my actions" toggle
3. Stream immediately updates to show all activities including user's own
4. User can see their own posts, comments, reviews alongside others'

### Scenario 3: My Activity Tab with Filter Enabled
1. User navigates to My Activity tab
2. Filter is enabled (default state)
3. Tab shows empty state with message
4. Message explains that filter is hiding user's own activities
5. User can disable filter to see content or switch to another tab

## Validation Criteria

### Functional Validation
- ✓ Toggle appears below "Activity Stream" title on all tabs
- ✓ Toggle is enabled by default
- ✓ Toggle is hidden for unauthenticated users
- ✓ When enabled, user's activities are filtered from all tabs
- ✓ When disabled, user's activities are visible
- ✓ Filter state persists during session
- ✓ Filter state resets on page refresh

### UI Validation
- ✓ Checkbox and label are properly aligned
- ✓ Label text matches translations
- ✓ Hover states work correctly
- ✓ Visual feedback on toggle action

### Integration Validation
- ✓ Works correctly with Activity Type filters
- ✓ Works correctly with Shelf/Book filters
- ✓ Real-time updates respect filter state
- ✓ Empty states display appropriate messages
- ✓ No console errors or warnings

### Accessibility Validation
- ✓ Keyboard navigation works
- ✓ Screen reader announces checkbox state
- ✓ Focus indicator visible
- ✓ Touch targets meet minimum size

## Implementation Notes

### Filter Implementation Location
The hideMyActions filter should be applied in StreamPage.tsx after activity type filtering:

```
Current implementation (line 159-163):
const selectedTypeFilters = activityTypeFilters[activeTab] || [];
const filteredActivities = currentActivities.filter(activity => 
  selectedTypeFilters.includes(activity.type as ActivityType)
);

Enhanced implementation:
const selectedTypeFilters = activityTypeFilters[activeTab] || [];
let filteredActivities = currentActivities.filter(activity => 
  selectedTypeFilters.includes(activity.type as ActivityType)
);

// Apply hideMyActions filter if enabled and user is authenticated
if (hideMyActions && currentUser) {
  filteredActivities = filteredActivities.filter(activity => 
    activity.userId !== currentUser.id
  );
}
```

### Toggle UI Placement
Position the toggle between the page title (line 563-565) and the Tabs component (line 567):

```
Structure:
<div className="container mx-auto px-4 py-8 max-w-4xl">
  <div className="mb-6">
    <h1 className="text-3xl font-bold mb-2">{t('stream:title')}</h1>
  </div>

  {/* NEW: Hide My Actions Toggle - Insert here */}
  {isAuthenticated && (
    <div className="mb-4 flex items-center space-x-2">
      <Checkbox 
        id="hide-my-actions"
        checked={hideMyActions}
        onCheckedChange={setHideMyActions}
      />
      <Label htmlFor="hide-my-actions" className="text-sm cursor-pointer">
        {t('stream:hideMyActions')}
      </Label>
    </div>
  )}

  <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
    ...
  </Tabs>
</div>
```

### My Activity Tab Special Handling
For the My Activity tab, consider showing a helpful empty state message when filter is enabled:

```
When on personal tab and hideMyActions is enabled:
- Show custom empty state message
- Include instruction to disable filter
- Provide visual hint (icon or illustration)
```

### Real-time Update Handling
Ensure WebSocket handlers respect the filter (lines 261-499):
- Activities added to cache in `handleNewActivity` are unaffected
- Filtering happens during display, not during cache updates
- No changes needed to WebSocket event handlers
- Filtering logic in render path handles real-time updates automatically

## Risk Assessment

### Low Risk Areas
- UI implementation (standard React patterns)
- Translation integration (follows existing pattern)
- State management (simple boolean flag)

### Medium Risk Areas
- Empty state messaging clarity
- My Activity tab user experience when filter enabled
- Performance impact on large activity lists (mitigated by client-side filtering)

### Mitigation Strategies
- Provide clear, informative empty state messages
- Include tooltips or help text for My Activity tab behavior
- Test with large activity datasets
- Consider debouncing if performance issues arise

## Future Enhancements

### Potential Improvements
1. **Filter Persistence**
   - Store preference in user profile/settings
   - Remember state across sessions using localStorage

2. **Filter Options Expansion**
   - Show only activities from followed users
   - Show only activities from specific user groups
   - Time-based filtering (last hour, day, week)

3. **Visual Indicators**
   - Badge showing number of hidden activities
   - Temporary toast notification when activities are filtered
   - Filter summary panel

4. **Granular Control**
   - Hide specific activity types from self (e.g., hide my comments but show my reviews)
   - Per-tab filter settings
   - Quick toggle in activity cards

## Conclusion

This feature adds a straightforward yet valuable filtering capability to the Stream page, allowing users to focus on content from other users by default. The implementation is minimal, non-invasive, and follows existing patterns in the codebase. The default-enabled state encourages social discovery while maintaining user control through a simple toggle mechanism.     - **My Activity tab**: This tab becomes empty when filter is enabled (as it shows only user's activities)
     - **Last Actions tab**: Hide user's own navigation actions and content interactions

4. **Filter Priority**
   - This filter operates after Activity Type filters are applied
   - Works in combination with other existing filters (shelf filters, book filters)
   - Filter chain: Activity Type → Hide My Actions → Shelf/Book Filters

5. **Persistence**
   - Filter state must persist during the session (in component state)
   - Does not need to persist across browser sessions
   - Resets to default (enabled) when page is refreshed

6. **Unauthenticated Users**
   - Toggle must not be visible for unauthenticated users
   - Filter logic only applies when user is authenticated

### UI/UX Requirements

1. **Visual Design**
   - Display as a checkbox with label text
   - Label text: "Don't show my actions" (EN) / "Не показывать мои действия" (RU)
   - Styling consistent with existing filter checkboxes
   - Small, subtle appearance to avoid overwhelming the interface

2. **Layout**
   - Horizontal layout: checkbox on left, label text on right
   - Aligned to the left side of the page
   - Margin bottom to create visual separation from tabs below
   - Margin top to create visual separation from title above

3. **Interaction**
   - Single click on checkbox or label toggles the state
   - Visual feedback on hover (cursor pointer)
   - Immediate effect when toggled (no apply button needed)

4. **Empty State Handling**
   - When filter results in zero activities, show appropriate empty state message
   - Message must distinguish between:
     - No activities exist vs. All activities are filtered out
   - Consider special message for My Activity tab when filter is enabled

## Data Model

### State Management

```
Component State Addition:
- hideMyActions: boolean (default: true)

Filter State Structure:
{
  activityTypeFilters: Record<string, ActivityType[]>,
  hideMyActions: boolean,
  shelfFilters: ShelfFiltersData
}
```

### Activity Filtering Flow

```
Current Activities (from API)
  ↓
Apply Activity Type Filters
  ↓
Apply Hide My Actions Filter (if enabled and user authenticated)
  ↓
Apply Shelf/Book Filters (if on My Shelves tab)
  ↓
Filtered Activities (displayed)
```

## Component Architecture

### Modified Components

1. **StreamPage.tsx**
   - Add `hideMyActions` state
   - Add toggle UI below page title
   - Modify filtering logic to incorporate hideMyActions filter
   - Pass current user ID for comparison

2. **Translation Files**
   - Add new translation keys for toggle label
   - Location: `client/src/locales/en/stream.json` and `client/src/locales/ru/stream.json`

### New Translation Keys

```
stream.json additions:
{
  "hideMyActions": "Don't show my actions",
  "hideMyActionsDescription": "When enabled, only shows activities from other users"
}
```

Russian translations:
```
{
  "hideMyActions": "Не показывать мои действия",
  "hideMyActionsDescription": "Если включено, показываются только действия других пользователей"
}
```

## Technical Considerations

### Performance
- Filter operation is client-side only
- Filtering happens on already fetched data
- No additional API calls required
- Minimal performance impact (simple ID comparison)

### Accessibility
- Checkbox must be keyboard accessible
- Label must be associated with checkbox via htmlFor attribute
- Sufficient color contrast for text
- Clear focus indicator on keyboard navigation

### Responsive Design
- Toggle must be visible and functional on mobile devices
- Text label must not wrap on small screens (or wrap gracefully)
- Touch target size must meet minimum accessibility requirements (44x44px)

### Edge Cases

1. **My Activity Tab with Filter Enabled**
   - Expected behavior: Empty state (all activities filtered)
   - Show informative message explaining why tab is empty
   - Provide hint to disable filter to see own activities

2. **No Other Users' Activities**
   - When filter is enabled and only user's own activities exist
   - Show empty state indicating no other users' activities available

3. **Real-time Updates**
   - Newly received activities via WebSocket must respect filter state
   - Activities added to cache must be filtered before display if filter enabled

4. **Tab Switching**
   - Filter state persists when switching between tabs
   - Each tab respects the global hideMyActions setting

## Integration Points

### Existing Filter System
- Integrates with existing `activityTypeFilters` state
- Works alongside `ShelfFilters` component on My Shelves tab
- Does not interfere with `ActivityTypeFilter` component behavior

### WebSocket Real-time Updates
- Real-time activity updates must respect hideMyActions filter
- Activities added via `stream:new-activity` event must be filtered
- Activities added via `stream:last-action` event must be filtered

### Query Cache Updates
- When filter state changes, apply filter to cached data
- No need to refetch from API when toggling filter
- Cached data remains unchanged, only display filtering changes

## User Workflow

### Scenario 1: Default Experience (Filter Enabled)
1. Authenticated user navigates to /stream
2. Toggle is enabled by default
3. User sees only activities from other users
4. User's own activities are hidden from view

### Scenario 2: Viewing Own Activities
1. User wants to see their own activities in Social tab
2. User unchecks "Don't show my actions" toggle
3. Stream immediately updates to show all activities including user's own
4. User can see their own posts, comments, reviews alongside others'

### Scenario 3: My Activity Tab with Filter Enabled
1. User navigates to My Activity tab
2. Filter is enabled (default state)
3. Tab shows empty state with message
4. Message explains that filter is hiding user's own activities
5. User can disable filter to see content or switch to another tab

## Validation Criteria

### Functional Validation
- ✓ Toggle appears below "Activity Stream" title on all tabs
- ✓ Toggle is enabled by default
- ✓ Toggle is hidden for unauthenticated users
- ✓ When enabled, user's activities are filtered from all tabs
- ✓ When disabled, user's activities are visible
- ✓ Filter state persists during session
- ✓ Filter state resets on page refresh

### UI Validation
- ✓ Checkbox and label are properly aligned
- ✓ Label text matches translations
- ✓ Hover states work correctly
- ✓ Visual feedback on toggle action

### Integration Validation
- ✓ Works correctly with Activity Type filters
- ✓ Works correctly with Shelf/Book filters
- ✓ Real-time updates respect filter state
- ✓ Empty states display appropriate messages
- ✓ No console errors or warnings

### Accessibility Validation
- ✓ Keyboard navigation works
- ✓ Screen reader announces checkbox state
- ✓ Focus indicator visible
- ✓ Touch targets meet minimum size

## Implementation Notes

### Filter Implementation Location
The hideMyActions filter should be applied in StreamPage.tsx after activity type filtering:

```
Current implementation (line 159-163):
const selectedTypeFilters = activityTypeFilters[activeTab] || [];
const filteredActivities = currentActivities.filter(activity => 
  selectedTypeFilters.includes(activity.type as ActivityType)
);

Enhanced implementation:
const selectedTypeFilters = activityTypeFilters[activeTab] || [];
let filteredActivities = currentActivities.filter(activity => 
  selectedTypeFilters.includes(activity.type as ActivityType)
);

// Apply hideMyActions filter if enabled and user is authenticated
if (hideMyActions && currentUser) {
  filteredActivities = filteredActivities.filter(activity => 
    activity.userId !== currentUser.id
  );
}
```

### Toggle UI Placement
Position the toggle between the page title (line 563-565) and the Tabs component (line 567):

```
Structure:
<div className="container mx-auto px-4 py-8 max-w-4xl">
  <div className="mb-6">
    <h1 className="text-3xl font-bold mb-2">{t('stream:title')}</h1>
  </div>

  {/* NEW: Hide My Actions Toggle - Insert here */}
  {isAuthenticated && (
    <div className="mb-4 flex items-center space-x-2">
      <Checkbox 
        id="hide-my-actions"
        checked={hideMyActions}
        onCheckedChange={setHideMyActions}
      />
      <Label htmlFor="hide-my-actions" className="text-sm cursor-pointer">
        {t('stream:hideMyActions')}
      </Label>
    </div>
  )}

  <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
    ...
  </Tabs>
</div>
```

### My Activity Tab Special Handling
For the My Activity tab, consider showing a helpful empty state message when filter is enabled:

```
When on personal tab and hideMyActions is enabled:
- Show custom empty state message
- Include instruction to disable filter
- Provide visual hint (icon or illustration)
```

### Real-time Update Handling
Ensure WebSocket handlers respect the filter (lines 261-499):
- Activities added to cache in `handleNewActivity` are unaffected
- Filtering happens during display, not during cache updates
- No changes needed to WebSocket event handlers
- Filtering logic in render path handles real-time updates automatically

## Risk Assessment

### Low Risk Areas
- UI implementation (standard React patterns)
- Translation integration (follows existing pattern)
- State management (simple boolean flag)

### Medium Risk Areas
- Empty state messaging clarity
- My Activity tab user experience when filter enabled
- Performance impact on large activity lists (mitigated by client-side filtering)

### Mitigation Strategies
- Provide clear, informative empty state messages
- Include tooltips or help text for My Activity tab behavior
- Test with large activity datasets
- Consider debouncing if performance issues arise

## Future Enhancements

### Potential Improvements
1. **Filter Persistence**
   - Store preference in user profile/settings
   - Remember state across sessions using localStorage

2. **Filter Options Expansion**
   - Show only activities from followed users
   - Show only activities from specific user groups
   - Time-based filtering (last hour, day, week)

3. **Visual Indicators**
   - Badge showing number of hidden activities
   - Temporary toast notification when activities are filtered
   - Filter summary panel

4. **Granular Control**
   - Hide specific activity types from self (e.g., hide my comments but show my reviews)
   - Per-tab filter settings
   - Quick toggle in activity cards

## Conclusion

