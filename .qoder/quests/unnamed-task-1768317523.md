# Profile Bookshelves Enhancement: Counter Display and Empty Shelf Filtering

## Overview

Enhance the user profile page to display a counter showing the number of bookshelves after the "Bookshelves" heading, and filter out empty shelves from visibility in other users' profiles while keeping them visible in the owner's profile.

## Business Context

The current profile page displays all bookshelves regardless of their content state, and does not provide a quick visual indicator of how many shelves a user has. This enhancement improves user experience by:

- Providing immediate visibility of shelf quantity through a numeric counter
- Reducing visual clutter by hiding empty shelves in public profile views
- Maintaining full shelf visibility for profile owners to manage their collections

## Requirements

### Functional Requirements

#### 1. Bookshelf Counter Display

The system must display a numeric counter after the "Bookshelves" heading in the format:

```
Bookshelves [N]
```

Where N represents the count of non-empty bookshelves (shelves containing at least one book).

**Counter Behavior:**
- Count only includes shelves that have one or more books
- Counter updates dynamically based on the filtered shelf list
- Display format: heading text followed by space and bracketed number

#### 2. Empty Shelf Filtering

The system must conditionally filter empty shelves based on profile ownership:

**In Other Users' Profiles (Public View):**
- Hide all shelves that contain zero books
- Only display shelves with at least one book

**In Own Profile (Owner View):**
- Display all shelves regardless of book count
- Show empty shelves to allow owner to manage and populate them
- Empty shelves display with "Shelf is empty" message (existing behavior)

**Definition of Empty Shelf:**
- A shelf is considered empty when `shelf.bookIds.length === 0`
- Deleted books or soft-deleted content still count as empty if bookIds array is empty

### Non-Functional Requirements

#### Performance
- Shelf filtering occurs on the client-side using existing data
- No additional API calls required for counting or filtering
- Filtering logic executes efficiently within the existing profile data fetch cycle

#### Compatibility
- Changes must maintain compatibility with existing shelf data structure
- Translation keys for "shelves" heading must remain functional
- Existing shelf display logic for books and empty states preserved

## Technical Approach

### Frontend Changes

#### Component: Profile.tsx

**Location:** `client/src/pages/Profile.tsx`

**Modification Areas:**

1. **Shelf Filtering Logic**
   - Add filtering step after shelves data is loaded
   - Filter condition based on `isOwnProfile` flag and `shelf.bookIds.length`
   - Apply filter before rendering shelf list

2. **Counter Calculation**
   - Calculate count from filtered shelf array
   - Display counter adjacent to heading translation

3. **Heading Update**
   - Modify the "Bookshelves" section heading (currently at line 840-842)
   - Append counter in square brackets after translation text
   - Maintain existing icon and styling

**Data Flow:**

```
Profile Data Fetch
    ↓
Shelves Array Received
    ↓
Apply Conditional Filter
    ├─ If isOwnProfile → Show All Shelves
    └─ If NOT isOwnProfile → Filter Out Empty Shelves
    ↓
Calculate Non-Empty Count
    ↓
Render Heading with Counter
    ↓
Render Filtered Shelf List
```

### Display Logic Specification

**Shelf Filtering Function:**

The system will evaluate each shelf in the profile.shelves array:
- Extract shelf.bookIds.length property
- For non-owner views: include shelf only if bookIds.length > 0
- For owner views: include all shelves unconditionally

**Counter Display Format:**

Template structure for heading:
- Base translation key: `t('profile:shelves')`
- Counter suffix: ` [${nonEmptyShelfCount}]`
- Full display: Translated heading + space + bracketed count

### Implementation Details

#### Section: User's Shelves Rendering

**Current Structure** (lines 838-870):
- Section header with icon and translated "shelves" text
- Map function iterating over profile.shelves array
- Individual shelf cards with books display

**Required Changes:**

1. **Before Rendering Section:**
   - Define filtered shelves array based on ownership
   - Calculate count of non-empty shelves from filtered array

2. **In Section Header:**
   - Append counter to heading display
   - Format: `{t('profile:shelves')} [{filteredShelvesCount}]`

3. **In Shelf List Rendering:**
   - Iterate over filtered shelves array instead of raw profile.shelves
   - Maintain existing BookCard rendering logic
   - Preserve empty shelf message for owner's view

#### Edge Cases

**No Shelves Scenario:**
- When user has zero shelves, counter displays `[0]`
- Empty shelf list renders without error

**All Empty Shelves in Public View:**
- If all shelves are empty and viewing other user's profile
- Counter displays `[0]`
- Section renders with no shelf cards (empty list)

**Mixed Empty and Non-Empty Shelves:**
- Counter reflects only non-empty shelves
- Display shows only shelves that pass filter criteria

## Translation Considerations

**Existing Translation Key:**
- Key: `profile:shelves`
- Current values:
  - English: "Bookshelves"
  - Russian: (verify actual translation in locale files)

**No New Translation Keys Required:**
- Counter is purely numeric, requires no translation
- Bracket formatting is language-agnostic

## Testing Considerations

### Functional Testing Scenarios

1. **Own Profile - All Shelves Have Books**
   - Verify all shelves display
   - Verify counter matches total shelf count

2. **Own Profile - Some Empty Shelves**
   - Verify all shelves display including empty ones
   - Verify empty shelves show "Shelf is empty" message
   - Verify counter shows count of non-empty shelves only

3. **Own Profile - All Shelves Empty**
   - Verify all empty shelves display
   - Verify counter shows `[0]`

4. **Other User Profile - All Shelves Have Books**
   - Verify all non-empty shelves display
   - Verify counter matches displayed shelf count

5. **Other User Profile - Some Empty Shelves**
   - Verify only non-empty shelves display
   - Verify empty shelves are hidden
   - Verify counter matches displayed shelf count

6. **Other User Profile - All Shelves Empty**
   - Verify no shelves display
   - Verify counter shows `[0]`
   - Verify section still renders (heading visible)

### UI Verification

- Counter displays immediately after "Bookshelves" text
- Counter uses consistent typography and styling with heading
- Counter format has space before opening bracket
- Numeric value is clearly legible

## Data Dependencies

**Existing Data Structure:**

The implementation relies on the current shelf data structure returned by the profile fetch logic:

```
profile.shelves: Array<ProfileShelf>

ProfileShelf {
  id: string
  name: string
  bookIds: string[]  // Array of book IDs on this shelf
  books?: Book[]     // Optional array of book details
  description?: string
  color?: string
  createdAt: Date
  updatedAt: Date
}
```

**Key Property:**
- `shelf.bookIds.length` - determines empty vs non-empty status

**No Backend Changes Required:**
- Shelf filtering occurs entirely on frontend
- Existing API endpoints continue to return all shelves
- Profile component applies filtering based on viewing context

## Success Criteria

1. **Counter Accuracy**
   - Counter displays correct count of non-empty shelves
   - Counter updates when viewing different profiles

2. **Filtering Correctness**
   - Own profile shows all shelves
   - Other profiles hide empty shelves
   - Book content displays correctly in non-empty shelves

3. **Visual Consistency**
   - Counter styling matches section heading
   - Layout remains clean and uncluttered
   - No visual regressions in shelf display

4. **Localization Compatibility**
   - Feature works correctly in both English and Russian
   - Counter format is culturally appropriate
   - No translation key errors

## Acceptance Criteria

- [ ] Bookshelves heading displays counter in format "Bookshelves [N]"
- [ ] Counter reflects count of non-empty shelves only
- [ ] Empty shelves are hidden when viewing other users' profiles
- [ ] Empty shelves are visible when viewing own profile
- [ ] Counter updates correctly across different profile views
- [ ] Existing shelf display functionality remains unchanged
- [ ] No console errors or warnings during profile navigation
- [ ] Feature works in both English and Russian language modes

**Definition of Empty Shelf:**
- A shelf is considered empty when `shelf.bookIds.length === 0`
- Deleted books or soft-deleted content still count as empty if bookIds array is empty

### Non-Functional Requirements

#### Performance
- Shelf filtering occurs on the client-side using existing data
- No additional API calls required for counting or filtering
- Filtering logic executes efficiently within the existing profile data fetch cycle

#### Compatibility
- Changes must maintain compatibility with existing shelf data structure
- Translation keys for "shelves" heading must remain functional
- Existing shelf display logic for books and empty states preserved

## Technical Approach

### Frontend Changes

#### Component: Profile.tsx

**Location:** `client/src/pages/Profile.tsx`

**Modification Areas:**

1. **Shelf Filtering Logic**
   - Add filtering step after shelves data is loaded
   - Filter condition based on `isOwnProfile` flag and `shelf.bookIds.length`
   - Apply filter before rendering shelf list

2. **Counter Calculation**
   - Calculate count from filtered shelf array
   - Display counter adjacent to heading translation

3. **Heading Update**
   - Modify the "Bookshelves" section heading (currently at line 840-842)
   - Append counter in square brackets after translation text
   - Maintain existing icon and styling

**Data Flow:**

```
Profile Data Fetch
    ↓
Shelves Array Received
    ↓
Apply Conditional Filter
    ├─ If isOwnProfile → Show All Shelves
    └─ If NOT isOwnProfile → Filter Out Empty Shelves
    ↓
Calculate Non-Empty Count
    ↓
Render Heading with Counter
    ↓
Render Filtered Shelf List
```

### Display Logic Specification

**Shelf Filtering Function:**

The system will evaluate each shelf in the profile.shelves array:
- Extract shelf.bookIds.length property
- For non-owner views: include shelf only if bookIds.length > 0
- For owner views: include all shelves unconditionally

**Counter Display Format:**

Template structure for heading:
- Base translation key: `t('profile:shelves')`
- Counter suffix: ` [${nonEmptyShelfCount}]`
- Full display: Translated heading + space + bracketed count

### Implementation Details

#### Section: User's Shelves Rendering

**Current Structure** (lines 838-870):
- Section header with icon and translated "shelves" text
- Map function iterating over profile.shelves array
- Individual shelf cards with books display

**Required Changes:**

1. **Before Rendering Section:**
   - Define filtered shelves array based on ownership
   - Calculate count of non-empty shelves from filtered array

2. **In Section Header:**
   - Append counter to heading display
   - Format: `{t('profile:shelves')} [{filteredShelvesCount}]`

3. **In Shelf List Rendering:**
   - Iterate over filtered shelves array instead of raw profile.shelves
   - Maintain existing BookCard rendering logic
   - Preserve empty shelf message for owner's view

#### Edge Cases

**No Shelves Scenario:**
- When user has zero shelves, counter displays `[0]`
- Empty shelf list renders without error

**All Empty Shelves in Public View:**
- If all shelves are empty and viewing other user's profile
- Counter displays `[0]`
- Section renders with no shelf cards (empty list)

**Mixed Empty and Non-Empty Shelves:**
- Counter reflects only non-empty shelves
- Display shows only shelves that pass filter criteria

## Translation Considerations

**Existing Translation Key:**
- Key: `profile:shelves`
- Current values:
  - English: "Bookshelves"
  - Russian: (verify actual translation in locale files)

**No New Translation Keys Required:**
- Counter is purely numeric, requires no translation
- Bracket formatting is language-agnostic

## Testing Considerations

### Functional Testing Scenarios

1. **Own Profile - All Shelves Have Books**
   - Verify all shelves display
   - Verify counter matches total shelf count

2. **Own Profile - Some Empty Shelves**
   - Verify all shelves display including empty ones
   - Verify empty shelves show "Shelf is empty" message
   - Verify counter shows count of non-empty shelves only

3. **Own Profile - All Shelves Empty**
   - Verify all empty shelves display
   - Verify counter shows `[0]`

4. **Other User Profile - All Shelves Have Books**
   - Verify all non-empty shelves display
   - Verify counter matches displayed shelf count

5. **Other User Profile - Some Empty Shelves**
   - Verify only non-empty shelves display
   - Verify empty shelves are hidden
   - Verify counter matches displayed shelf count

6. **Other User Profile - All Shelves Empty**
   - Verify no shelves display
   - Verify counter shows `[0]`
   - Verify section still renders (heading visible)

### UI Verification

- Counter displays immediately after "Bookshelves" text
- Counter uses consistent typography and styling with heading
- Counter format has space before opening bracket
- Numeric value is clearly legible

## Data Dependencies

**Existing Data Structure:**

The implementation relies on the current shelf data structure returned by the profile fetch logic:

```
profile.shelves: Array<ProfileShelf>

ProfileShelf {
  id: string
  name: string
  bookIds: string[]  // Array of book IDs on this shelf
  books?: Book[]     // Optional array of book details
  description?: string
  color?: string
  createdAt: Date
  updatedAt: Date
}
```

**Key Property:**
- `shelf.bookIds.length` - determines empty vs non-empty status

**No Backend Changes Required:**
- Shelf filtering occurs entirely on frontend
- Existing API endpoints continue to return all shelves
- Profile component applies filtering based on viewing context

## Success Criteria

1. **Counter Accuracy**
   - Counter displays correct count of non-empty shelves
   - Counter updates when viewing different profiles

2. **Filtering Correctness**
   - Own profile shows all shelves
   - Other profiles hide empty shelves
   - Book content displays correctly in non-empty shelves

3. **Visual Consistency**
   - Counter styling matches section heading
   - Layout remains clean and uncluttered
   - No visual regressions in shelf display

4. **Localization Compatibility**
   - Feature works correctly in both English and Russian
   - Counter format is culturally appropriate
   - No translation key errors

## Acceptance Criteria

- [ ] Bookshelves heading displays counter in format "Bookshelves [N]"
- [ ] Counter reflects count of non-empty shelves only
- [ ] Empty shelves are hidden when viewing other users' profiles
- [ ] Empty shelves are visible when viewing own profile
- [ ] Counter updates correctly across different profile views
- [ ] Existing shelf display functionality remains unchanged
- [ ] No console errors or warnings during profile navigation
- [ ] Feature works in both English and Russian language modes
- Empty shelves display with "Shelf is empty" message (existing behavior)

**Definition of Empty Shelf:**
- A shelf is considered empty when `shelf.bookIds.length === 0`
- Deleted books or soft-deleted content still count as empty if bookIds array is empty

### Non-Functional Requirements

#### Performance
- Shelf filtering occurs on the client-side using existing data
- No additional API calls required for counting or filtering
- Filtering logic executes efficiently within the existing profile data fetch cycle

#### Compatibility
- Changes must maintain compatibility with existing shelf data structure
- Translation keys for "shelves" heading must remain functional
- Existing shelf display logic for books and empty states preserved

## Technical Approach

### Frontend Changes

#### Component: Profile.tsx

**Location:** `client/src/pages/Profile.tsx`

**Modification Areas:**

1. **Shelf Filtering Logic**
   - Add filtering step after shelves data is loaded
   - Filter condition based on `isOwnProfile` flag and `shelf.bookIds.length`
   - Apply filter before rendering shelf list

2. **Counter Calculation**
   - Calculate count from filtered shelf array
   - Display counter adjacent to heading translation

3. **Heading Update**
   - Modify the "Bookshelves" section heading (currently at line 840-842)
   - Append counter in square brackets after translation text
   - Maintain existing icon and styling

**Data Flow:**

```
Profile Data Fetch
    ↓
Shelves Array Received
    ↓
Apply Conditional Filter
    ├─ If isOwnProfile → Show All Shelves
    └─ If NOT isOwnProfile → Filter Out Empty Shelves
    ↓
Calculate Non-Empty Count
    ↓
Render Heading with Counter
    ↓
Render Filtered Shelf List
```

### Display Logic Specification

**Shelf Filtering Function:**

The system will evaluate each shelf in the profile.shelves array:
- Extract shelf.bookIds.length property
- For non-owner views: include shelf only if bookIds.length > 0
- For owner views: include all shelves unconditionally

**Counter Display Format:**

Template structure for heading:
- Base translation key: `t('profile:shelves')`
- Counter suffix: ` [${nonEmptyShelfCount}]`
- Full display: Translated heading + space + bracketed count

### Implementation Details

#### Section: User's Shelves Rendering

**Current Structure** (lines 838-870):
- Section header with icon and translated "shelves" text
- Map function iterating over profile.shelves array
- Individual shelf cards with books display

**Required Changes:**

1. **Before Rendering Section:**
   - Define filtered shelves array based on ownership
   - Calculate count of non-empty shelves from filtered array

2. **In Section Header:**
   - Append counter to heading display
   - Format: `{t('profile:shelves')} [{filteredShelvesCount}]`

3. **In Shelf List Rendering:**
   - Iterate over filtered shelves array instead of raw profile.shelves
   - Maintain existing BookCard rendering logic
   - Preserve empty shelf message for owner's view

#### Edge Cases

**No Shelves Scenario:**
- When user has zero shelves, counter displays `[0]`
- Empty shelf list renders without error

**All Empty Shelves in Public View:**
- If all shelves are empty and viewing other user's profile
- Counter displays `[0]`
- Section renders with no shelf cards (empty list)

**Mixed Empty and Non-Empty Shelves:**
- Counter reflects only non-empty shelves
- Display shows only shelves that pass filter criteria

## Translation Considerations

**Existing Translation Key:**
- Key: `profile:shelves`
- Current values:
  - English: "Bookshelves"
  - Russian: (verify actual translation in locale files)

**No New Translation Keys Required:**
- Counter is purely numeric, requires no translation
- Bracket formatting is language-agnostic

## Testing Considerations

### Functional Testing Scenarios

1. **Own Profile - All Shelves Have Books**
   - Verify all shelves display
   - Verify counter matches total shelf count

2. **Own Profile - Some Empty Shelves**
   - Verify all shelves display including empty ones
   - Verify empty shelves show "Shelf is empty" message
   - Verify counter shows count of non-empty shelves only

3. **Own Profile - All Shelves Empty**
   - Verify all empty shelves display
   - Verify counter shows `[0]`

4. **Other User Profile - All Shelves Have Books**
   - Verify all non-empty shelves display
   - Verify counter matches displayed shelf count

5. **Other User Profile - Some Empty Shelves**
   - Verify only non-empty shelves display
   - Verify empty shelves are hidden
   - Verify counter matches displayed shelf count

6. **Other User Profile - All Shelves Empty**
   - Verify no shelves display
   - Verify counter shows `[0]`
   - Verify section still renders (heading visible)

### UI Verification

- Counter displays immediately after "Bookshelves" text
- Counter uses consistent typography and styling with heading
- Counter format has space before opening bracket
- Numeric value is clearly legible

## Data Dependencies

**Existing Data Structure:**

The implementation relies on the current shelf data structure returned by the profile fetch logic:

```
profile.shelves: Array<ProfileShelf>

ProfileShelf {
  id: string
  name: string
  bookIds: string[]  // Array of book IDs on this shelf
  books?: Book[]     // Optional array of book details
  description?: string
  color?: string
  createdAt: Date
  updatedAt: Date
}
```

**Key Property:**
- `shelf.bookIds.length` - determines empty vs non-empty status

**No Backend Changes Required:**
- Shelf filtering occurs entirely on frontend
- Existing API endpoints continue to return all shelves
- Profile component applies filtering based on viewing context

## Success Criteria

1. **Counter Accuracy**
   - Counter displays correct count of non-empty shelves
   - Counter updates when viewing different profiles

2. **Filtering Correctness**
   - Own profile shows all shelves
   - Other profiles hide empty shelves
   - Book content displays correctly in non-empty shelves

3. **Visual Consistency**
   - Counter styling matches section heading
   - Layout remains clean and uncluttered
   - No visual regressions in shelf display

4. **Localization Compatibility**
   - Feature works correctly in both English and Russian
   - Counter format is culturally appropriate
   - No translation key errors

## Acceptance Criteria

- [ ] Bookshelves heading displays counter in format "Bookshelves [N]"
- [ ] Counter reflects count of non-empty shelves only
- [ ] Empty shelves are hidden when viewing other users' profiles
- [ ] Empty shelves are visible when viewing own profile
- [ ] Counter updates correctly across different profile views
- [ ] Existing shelf display functionality remains unchanged
- [ ] No console errors or warnings during profile navigation
- [ ] Feature works in both English and Russian language modes
