# Real-Time Comment Reaction Display on Last Actions Tab

## Problem Statement

On the `/stream` page in the Last Actions tab, when a user adds a reaction to a comment, the reaction does not appear in real-time. The reaction only becomes visible after manually refreshing the page.

### Current Behavior
- User clicks on a comment to add a reaction
- Reaction is successfully saved to the database
- Reaction does NOT appear in the UI immediately
- Reaction appears only after page reload
- Other users viewing the same stream do not see the reaction update

### Expected Behavior
- User clicks on a comment to add a reaction
- Reaction is successfully saved to the database
- Reaction appears in the UI immediately without requiring page reload
- All users viewing the stream see the reaction update in real-time across all tabs

## Root Cause Analysis

### Current Implementation Status

**Global Stream Tab**: Reaction updates work correctly via WebSocket
- ActivityCard component displays comments with reactions
- WebSocket handler `stream:reaction-update` exists in StreamPage
- Updates are properly applied to global stream query cache

**Last Actions Tab**: Reaction updates DO NOT work
- LastActionsActivityCard component renders user actions (navigation, events)
- Does NOT render comment content or reactions
- WebSocket updates are NOT applied to last-actions query cache for comment reactions

### Architecture Gap

The Last Actions tab has two types of entries:
1. **User Actions**: Navigation events, registration, shelf creation - displayed by LastActionsActivityCard
2. **Global Activities**: Comments, reviews, news - should potentially appear but currently not shown in Last Actions

The WebSocket event handler updates three stream caches:
- Global stream
- Personal stream  
- Shelves stream

But it does NOT update the **Last Actions cache** when reactions are modified.

## Solution Design

### Strategy Overview

Extend the existing WebSocket reaction update mechanism to include the Last Actions query cache, ensuring consistency across all stream tabs.

### Multi-User Real-Time Synchronization Analysis

**Current Implementation Status**: ✅ Already Working

The application already has full multi-user real-time synchronization infrastructure in place:

**1. Server-Side Broadcasting** (routes.ts line 2954-2960):
- When any user adds/removes a reaction via `/api/reactions` endpoint
- Server broadcasts WebSocket event to `stream:global` room
- Event payload includes: entityId, entityType, aggregated reactions, action type
- All connected clients subscribed to this room receive the update simultaneously

**2. Client-Side Room Subscription** (StreamPage.tsx line 211-212):
- Every user viewing `/stream` page automatically joins `stream:global` room
- Room is joined ALWAYS on page mount, regardless of which tab is active
- All users receive all reaction updates from any source in real-time
- WebSocket connection persists across tab switches

**3. WebSocket Event Handling** (StreamPage.tsx line 351-383):
- `handleReactionUpdate` function receives `stream:reaction-update` events
- Currently updates three query caches: Global, Personal, and Shelves
- **Missing**: Does not update Last Actions cache
- All users execute this handler when event is received

**4. React Query Cache Propagation**:
- Each client maintains their own local React Query cache
- WebSocket events trigger cache updates independently on each client
- React automatically re-renders components when cache changes
- State synchronization happens through shared server broadcast

**Conclusion**: 
Multi-user synchronization infrastructure is fully functional and battle-tested. The only missing piece is adding the Last Actions cache update to the existing `handleReactionUpdate` function. Once added, all users will automatically see reaction updates in Last Actions tab in real-time, just as they already do in Global, Personal, and Shelves tabs.

### Implementation Approach

#### Phase 1: WebSocket Event Handling Enhancement

**Location**: `client/src/pages/StreamPage.tsx`

**Current WebSocket Handler** (line 351-422):
```
handleReactionUpdate(data: { 
  commentId: string; 
  entityId: string; 
  entityType: string; 
  reactions: any[]; 
  action: string 
})
```

This handler currently updates:
- Global stream activities
- Personal stream activities  
- Shelves stream activities

**Required Enhancement**:
Add Last Actions cache update to the same handler.

#### Phase 2: Cache Update Logic

The handler must:

1. **Identify Matching Activities**: Find activities in Last Actions cache where:
   - `activity.entityId` matches `data.entityId`
   - `activity.type` matches `data.entityType`

2. **Update Reaction Data**: For matched activities:
   - Replace `activity.metadata.reactions` with `data.reactions`
   - Update `activity.metadata.reaction_count` to reflect total reaction count

3. **Preserve Activity Structure**: Maintain all other activity properties unchanged

#### Phase 3: Data Structure Mapping

**Last Actions Activity Structure**:
```
{
  id: string,
  type: 'comment' | 'review' | 'news' | 'book',
  entityId: string,
  userId: string,
  metadata: {
    reactions: Array<{emoji: string, count: number, userReacted: boolean}>,
    reaction_count: number,
    content_preview: string,
    book_title: string,
    author_name: string,
    ...other fields
  },
  createdAt: string,
  updatedAt: string
}
```

**WebSocket Event Data**:
```
{
  entityId: string,
  entityType: 'comment' | 'review' | 'news',
  reactions: Array<{emoji: string, count: number, userReacted: boolean}>,
  action: 'added' | 'removed'
}
```

### Technical Approach

#### QueryClient Cache Update Pattern

Use the same pattern already implemented for other stream caches:

```
queryClient.setQueryData<any>(['api', 'stream', 'last-actions'], (oldData: any) => {
  if (!oldData || !oldData.activities) {
    return oldData;
  }
  
  return {
    ...oldData,
    activities: oldData.activities.map(activity => {
      if (activity.entityId === data.entityId && activity.type === data.entityType) {
        return {
          ...activity,
          metadata: {
            ...activity.metadata,
            reactions: data.reactions,
            reaction_count: data.reactions.reduce((sum, r) => sum + r.count, 0)
          }
        };
      }
      return activity;
    })
  };
});
```

#### Integration with Existing Handler

Add this logic to the existing `handleReactionUpdate` function after the current stream cache updates. This ensures:
- Consistent behavior across all tabs
- Single source of truth for reaction data
- Minimal code duplication
- Reuse of existing WebSocket connection

### Scope Boundaries

**In Scope**:
- Update Last Actions cache when reactions are added/removed
- Maintain consistency with existing WebSocket event structure
- Preserve all existing Last Actions functionality

**Out of Scope**:
- Modifying LastActionsActivityCard component to display reactions (if not already doing so)
- Changing reaction API endpoints
- Modifying server-side WebSocket emission logic
- Adding new WebSocket event types
- Optimistic updates (rely on WebSocket for state sync)

### Edge Cases and Considerations

**Case 1: Activity Not in Last Actions Cache**
- Behavior: Update is silently ignored
- Rationale: Activity may have been removed or never loaded
- No error handling needed

**Case 2: Multiple Reactions in Quick Succession**
- Behavior: Each WebSocket event updates cache independently
- Rationale: React Query manages state reconciliation
- Last update wins

**Case 3: User Not on Last Actions Tab**
- Behavior: Cache still updates in background
- Rationale: Cache is shared, updates apply regardless of active tab
- Ensures fresh data when user switches back

**Case 4: Concurrent Cache Updates**
- Behavior: React Query serializes updates automatically
- Rationale: setQueryData is synchronous and atomic
- No race condition handling needed

### Verification Criteria

**Success Indicators**:

1. **Single User Scenarios**:
   - Add reaction to comment → Reaction appears immediately in Last Actions tab
   - Remove reaction from comment → Reaction disappears immediately in Last Actions tab
   - Switch between tabs → Reaction state remains consistent across all tabs
   - No page reload required to see updated reactions

2. **Multi-User Synchronization**:
   - User A adds reaction → User B (viewing Last Actions) sees it appear in real-time
   - User A removes reaction → User B sees it disappear in real-time
   - Multiple users add different reactions simultaneously → All users see all reactions
   - Users on different tabs (Global/Personal/Shelves/Last Actions) → All see same reaction state
   - New user opens `/stream` page after reactions added → Sees current state from server

**Testing Scenarios**:

*Single User Tests*:
- Add reaction while viewing Last Actions tab
- Remove own reaction from Last Actions tab
- Toggle reaction quickly (remove then add)
- Switch tabs while reaction updates occur
- Reaction persists after tab switches

*Multi-User Tests*:
- Open two browsers, both on `/stream` Last Actions tab
- Browser A: Add reaction to comment → Verify Browser B sees update
- Browser B: Add different reaction to same comment → Verify Browser A sees both reactions
- Browser A: Remove their reaction → Verify Browser B sees only remaining reaction
- Browser C: Open page fresh → Verify sees current server state (not cached)
- Mixed tabs: Browser A on Last Actions, Browser B on Global → Both see same reactions
- User A reacts to their own comment on Personal stream → Other users see it in Last Actions

### Performance Implications

**Impact**: Negligible
- Adds one additional cache update operation per reaction event
- Cache update is in-memory operation (O(n) where n = activities count)
- No additional network requests
- No additional WebSocket subscriptions

**Optimization**: None required at this scale

### Backward Compatibility

**No Breaking Changes**:
- Extends existing WebSocket handler
- Does not modify API contracts
- Does not alter data structures
- Maintains existing behavior for all other tabs

### Dependencies

**Prerequisites**:
- Existing WebSocket connection to stream rooms
- React Query cache infrastructure
- Current reaction API endpoints functional

**No New Dependencies Required**

## Implementation Summary

This design addresses the real-time reaction display issue by extending the existing WebSocket infrastructure to include the Last Actions query cache. The solution is minimal, non-invasive, and follows established patterns already proven in other stream tabs. No server-side changes are required, as the WebSocket events are already being emitted correctly.

**Multi-User Synchronization Confirmation**: The existing WebSocket broadcasting mechanism ensures that all connected users receive reaction updates simultaneously. The proposed change will extend this existing functionality to the Last Actions tab, providing the same real-time synchronization experience already working in Global, Personal, and Shelves tabs. When any user adds or removes a reaction, all other users viewing the `/stream` page (on any tab) will see the update in real-time without needing to reload the page.
The Last Actions tab has two types of entries:
1. **User Actions**: Navigation events, registration, shelf creation - displayed by LastActionsActivityCard
2. **Global Activities**: Comments, reviews, news - should potentially appear but currently not shown in Last Actions

The WebSocket event handler updates three stream caches:
- Global stream
- Personal stream  
- Shelves stream

But it does NOT update the **Last Actions cache** when reactions are modified.

## Solution Design

### Strategy Overview

Extend the existing WebSocket reaction update mechanism to include the Last Actions query cache, ensuring consistency across all stream tabs.

### Multi-User Real-Time Synchronization Analysis

**Current Implementation Status**: ✅ Already Working

The application already has full multi-user real-time synchronization infrastructure in place:

**1. Server-Side Broadcasting** (routes.ts line 2954-2960):
- When any user adds/removes a reaction via `/api/reactions` endpoint
- Server broadcasts WebSocket event to `stream:global` room
- Event payload includes: entityId, entityType, aggregated reactions, action type
- All connected clients subscribed to this room receive the update simultaneously

**2. Client-Side Room Subscription** (StreamPage.tsx line 211-212):
- Every user viewing `/stream` page automatically joins `stream:global` room
- Room is joined ALWAYS on page mount, regardless of which tab is active
- All users receive all reaction updates from any source in real-time
- WebSocket connection persists across tab switches

**3. WebSocket Event Handling** (StreamPage.tsx line 351-383):
- `handleReactionUpdate` function receives `stream:reaction-update` events
- Currently updates three query caches: Global, Personal, and Shelves
- **Missing**: Does not update Last Actions cache
- All users execute this handler when event is received

**4. React Query Cache Propagation**:
- Each client maintains their own local React Query cache
- WebSocket events trigger cache updates independently on each client
- React automatically re-renders components when cache changes
- State synchronization happens through shared server broadcast

**Conclusion**: 
Multi-user synchronization infrastructure is fully functional and battle-tested. The only missing piece is adding the Last Actions cache update to the existing `handleReactionUpdate` function. Once added, all users will automatically see reaction updates in Last Actions tab in real-time, just as they already do in Global, Personal, and Shelves tabs.

### Implementation Approach

#### Phase 1: WebSocket Event Handling Enhancement

**Location**: `client/src/pages/StreamPage.tsx`

**Current WebSocket Handler** (line 351-422):
```
handleReactionUpdate(data: { 
  commentId: string; 
  entityId: string; 
  entityType: string; 
  reactions: any[]; 
  action: string 
})
```

This handler currently updates:
- Global stream activities
- Personal stream activities  
- Shelves stream activities

**Required Enhancement**:
Add Last Actions cache update to the same handler.

#### Phase 2: Cache Update Logic

The handler must:

1. **Identify Matching Activities**: Find activities in Last Actions cache where:
   - `activity.entityId` matches `data.entityId`
   - `activity.type` matches `data.entityType`

2. **Update Reaction Data**: For matched activities:
   - Replace `activity.metadata.reactions` with `data.reactions`
   - Update `activity.metadata.reaction_count` to reflect total reaction count

3. **Preserve Activity Structure**: Maintain all other activity properties unchanged

#### Phase 3: Data Structure Mapping

**Last Actions Activity Structure**:
```
{
  id: string,
  type: 'comment' | 'review' | 'news' | 'book',
  entityId: string,
  userId: string,
  metadata: {
    reactions: Array<{emoji: string, count: number, userReacted: boolean}>,
    reaction_count: number,
    content_preview: string,
    book_title: string,
    author_name: string,
    ...other fields
  },
  createdAt: string,
  updatedAt: string
}
```

**WebSocket Event Data**:
```
{
  entityId: string,
  entityType: 'comment' | 'review' | 'news',
  reactions: Array<{emoji: string, count: number, userReacted: boolean}>,
  action: 'added' | 'removed'
}
```

### Technical Approach

#### QueryClient Cache Update Pattern

Use the same pattern already implemented for other stream caches:

```
queryClient.setQueryData<any>(['api', 'stream', 'last-actions'], (oldData: any) => {
  if (!oldData || !oldData.activities) {
    return oldData;
  }
  
  return {
    ...oldData,
    activities: oldData.activities.map(activity => {
      if (activity.entityId === data.entityId && activity.type === data.entityType) {
        return {
          ...activity,
          metadata: {
            ...activity.metadata,
            reactions: data.reactions,
            reaction_count: data.reactions.reduce((sum, r) => sum + r.count, 0)
          }
        };
      }
      return activity;
    })
  };
});
```

#### Integration with Existing Handler

Add this logic to the existing `handleReactionUpdate` function after the current stream cache updates. This ensures:
- Consistent behavior across all tabs
- Single source of truth for reaction data
- Minimal code duplication
- Reuse of existing WebSocket connection

### Scope Boundaries

**In Scope**:
- Update Last Actions cache when reactions are added/removed
- Maintain consistency with existing WebSocket event structure
- Preserve all existing Last Actions functionality

**Out of Scope**:
- Modifying LastActionsActivityCard component to display reactions (if not already doing so)
- Changing reaction API endpoints
- Modifying server-side WebSocket emission logic
- Adding new WebSocket event types
- Optimistic updates (rely on WebSocket for state sync)

### Edge Cases and Considerations

**Case 1: Activity Not in Last Actions Cache**
- Behavior: Update is silently ignored
- Rationale: Activity may have been removed or never loaded
- No error handling needed

**Case 2: Multiple Reactions in Quick Succession**
- Behavior: Each WebSocket event updates cache independently
- Rationale: React Query manages state reconciliation
- Last update wins

**Case 3: User Not on Last Actions Tab**
- Behavior: Cache still updates in background
- Rationale: Cache is shared, updates apply regardless of active tab
- Ensures fresh data when user switches back

**Case 4: Concurrent Cache Updates**
- Behavior: React Query serializes updates automatically
- Rationale: setQueryData is synchronous and atomic
- No race condition handling needed

### Verification Criteria

**Success Indicators**:

1. **Single User Scenarios**:
   - Add reaction to comment → Reaction appears immediately in Last Actions tab
   - Remove reaction from comment → Reaction disappears immediately in Last Actions tab
   - Switch between tabs → Reaction state remains consistent across all tabs
   - No page reload required to see updated reactions

2. **Multi-User Synchronization**:
   - User A adds reaction → User B (viewing Last Actions) sees it appear in real-time
   - User A removes reaction → User B sees it disappear in real-time
   - Multiple users add different reactions simultaneously → All users see all reactions
   - Users on different tabs (Global/Personal/Shelves/Last Actions) → All see same reaction state
   - New user opens `/stream` page after reactions added → Sees current state from server

**Testing Scenarios**:

*Single User Tests*:
- Add reaction while viewing Last Actions tab
- Remove own reaction from Last Actions tab
- Toggle reaction quickly (remove then add)
- Switch tabs while reaction updates occur
- Reaction persists after tab switches

*Multi-User Tests*:
- Open two browsers, both on `/stream` Last Actions tab
- Browser A: Add reaction to comment → Verify Browser B sees update
- Browser B: Add different reaction to same comment → Verify Browser A sees both reactions
- Browser A: Remove their reaction → Verify Browser B sees only remaining reaction
- Browser C: Open page fresh → Verify sees current server state (not cached)
- Mixed tabs: Browser A on Last Actions, Browser B on Global → Both see same reactions
- User A reacts to their own comment on Personal stream → Other users see it in Last Actions

### Performance Implications

**Impact**: Negligible
- Adds one additional cache update operation per reaction event
- Cache update is in-memory operation (O(n) where n = activities count)
- No additional network requests
- No additional WebSocket subscriptions

**Optimization**: None required at this scale

### Backward Compatibility

**No Breaking Changes**:
- Extends existing WebSocket handler
- Does not modify API contracts
- Does not alter data structures
- Maintains existing behavior for all other tabs

### Dependencies

**Prerequisites**:
- Existing WebSocket connection to stream rooms
- React Query cache infrastructure
- Current reaction API endpoints functional

**No New Dependencies Required**

## Implementation Summary

This design addresses the real-time reaction display issue by extending the existing WebSocket infrastructure to include the Last Actions query cache. The solution is minimal, non-invasive, and follows established patterns already proven in other stream tabs. No server-side changes are required, as the WebSocket events are already being emitted correctly.

**Multi-User Synchronization Confirmation**: The existing WebSocket broadcasting mechanism ensures that all connected users receive reaction updates simultaneously. The proposed change will extend this existing functionality to the Last Actions tab, providing the same real-time synchronization experience already working in Global, Personal, and Shelves tabs. When any user adds or removes a reaction, all other users viewing the `/stream` page (on any tab) will see the update in real-time without needing to reload the page.

The Last Actions tab has two types of entries:
1. **User Actions**: Navigation events, registration, shelf creation - displayed by LastActionsActivityCard
2. **Global Activities**: Comments, reviews, news - should potentially appear but currently not shown in Last Actions

The WebSocket event handler updates three stream caches:
- Global stream
- Personal stream  
- Shelves stream

But it does NOT update the **Last Actions cache** when reactions are modified.

## Solution Design

### Strategy Overview

Extend the existing WebSocket reaction update mechanism to include the Last Actions query cache, ensuring consistency across all stream tabs.

### Multi-User Real-Time Synchronization Analysis

**Current Implementation Status**: ✅ Already Working

The application already has full multi-user real-time synchronization infrastructure in place:

**1. Server-Side Broadcasting** (routes.ts line 2954-2960):
- When any user adds/removes a reaction via `/api/reactions` endpoint
- Server broadcasts WebSocket event to `stream:global` room
- Event payload includes: entityId, entityType, aggregated reactions, action type
- All connected clients subscribed to this room receive the update simultaneously

**2. Client-Side Room Subscription** (StreamPage.tsx line 211-212):
- Every user viewing `/stream` page automatically joins `stream:global` room
- Room is joined ALWAYS on page mount, regardless of which tab is active
- All users receive all reaction updates from any source in real-time
- WebSocket connection persists across tab switches

**3. WebSocket Event Handling** (StreamPage.tsx line 351-383):
- `handleReactionUpdate` function receives `stream:reaction-update` events
- Currently updates three query caches: Global, Personal, and Shelves
- **Missing**: Does not update Last Actions cache
- All users execute this handler when event is received

**4. React Query Cache Propagation**:
- Each client maintains their own local React Query cache
- WebSocket events trigger cache updates independently on each client
- React automatically re-renders components when cache changes
- State synchronization happens through shared server broadcast

**Conclusion**: 
Multi-user synchronization infrastructure is fully functional and battle-tested. The only missing piece is adding the Last Actions cache update to the existing `handleReactionUpdate` function. Once added, all users will automatically see reaction updates in Last Actions tab in real-time, just as they already do in Global, Personal, and Shelves tabs.

### Implementation Approach

#### Phase 1: WebSocket Event Handling Enhancement

**Location**: `client/src/pages/StreamPage.tsx`

**Current WebSocket Handler** (line 351-422):
```
handleReactionUpdate(data: { 
  commentId: string; 
  entityId: string; 
  entityType: string; 
  reactions: any[]; 
  action: string 
})
```

This handler currently updates:
- Global stream activities
- Personal stream activities  
- Shelves stream activities

**Required Enhancement**:
Add Last Actions cache update to the same handler.

#### Phase 2: Cache Update Logic

The handler must:

1. **Identify Matching Activities**: Find activities in Last Actions cache where:
   - `activity.entityId` matches `data.entityId`
   - `activity.type` matches `data.entityType`

2. **Update Reaction Data**: For matched activities:
   - Replace `activity.metadata.reactions` with `data.reactions`
   - Update `activity.metadata.reaction_count` to reflect total reaction count

3. **Preserve Activity Structure**: Maintain all other activity properties unchanged

#### Phase 3: Data Structure Mapping

**Last Actions Activity Structure**:
```
{
  id: string,
  type: 'comment' | 'review' | 'news' | 'book',
  entityId: string,
  userId: string,
  metadata: {
    reactions: Array<{emoji: string, count: number, userReacted: boolean}>,
    reaction_count: number,
    content_preview: string,
    book_title: string,
    author_name: string,
    ...other fields
  },
  createdAt: string,
  updatedAt: string
}
```

**WebSocket Event Data**:
```
{
  entityId: string,
  entityType: 'comment' | 'review' | 'news',
  reactions: Array<{emoji: string, count: number, userReacted: boolean}>,
  action: 'added' | 'removed'
}
```

### Technical Approach

#### QueryClient Cache Update Pattern

Use the same pattern already implemented for other stream caches:

```
queryClient.setQueryData<any>(['api', 'stream', 'last-actions'], (oldData: any) => {
  if (!oldData || !oldData.activities) {
    return oldData;
  }
  
  return {
    ...oldData,
    activities: oldData.activities.map(activity => {
      if (activity.entityId === data.entityId && activity.type === data.entityType) {
        return {
          ...activity,
          metadata: {
            ...activity.metadata,
            reactions: data.reactions,
            reaction_count: data.reactions.reduce((sum, r) => sum + r.count, 0)
          }
        };
      }
      return activity;
    })
  };
});
```

#### Integration with Existing Handler

Add this logic to the existing `handleReactionUpdate` function after the current stream cache updates. This ensures:
- Consistent behavior across all tabs
- Single source of truth for reaction data
- Minimal code duplication
- Reuse of existing WebSocket connection

### Scope Boundaries

**In Scope**:
- Update Last Actions cache when reactions are added/removed
- Maintain consistency with existing WebSocket event structure
- Preserve all existing Last Actions functionality

**Out of Scope**:
- Modifying LastActionsActivityCard component to display reactions (if not already doing so)
- Changing reaction API endpoints
- Modifying server-side WebSocket emission logic
- Adding new WebSocket event types
- Optimistic updates (rely on WebSocket for state sync)

### Edge Cases and Considerations

**Case 1: Activity Not in Last Actions Cache**
- Behavior: Update is silently ignored
- Rationale: Activity may have been removed or never loaded
- No error handling needed

**Case 2: Multiple Reactions in Quick Succession**
- Behavior: Each WebSocket event updates cache independently
- Rationale: React Query manages state reconciliation
- Last update wins

**Case 3: User Not on Last Actions Tab**
- Behavior: Cache still updates in background
- Rationale: Cache is shared, updates apply regardless of active tab
- Ensures fresh data when user switches back

**Case 4: Concurrent Cache Updates**
- Behavior: React Query serializes updates automatically
- Rationale: setQueryData is synchronous and atomic
- No race condition handling needed

### Verification Criteria

**Success Indicators**:

1. **Single User Scenarios**:
   - Add reaction to comment → Reaction appears immediately in Last Actions tab
   - Remove reaction from comment → Reaction disappears immediately in Last Actions tab
   - Switch between tabs → Reaction state remains consistent across all tabs
   - No page reload required to see updated reactions

2. **Multi-User Synchronization**:
   - User A adds reaction → User B (viewing Last Actions) sees it appear in real-time
   - User A removes reaction → User B sees it disappear in real-time
   - Multiple users add different reactions simultaneously → All users see all reactions
   - Users on different tabs (Global/Personal/Shelves/Last Actions) → All see same reaction state
   - New user opens `/stream` page after reactions added → Sees current state from server

**Testing Scenarios**:

*Single User Tests*:
- Add reaction while viewing Last Actions tab
- Remove own reaction from Last Actions tab
- Toggle reaction quickly (remove then add)
- Switch tabs while reaction updates occur
- Reaction persists after tab switches

*Multi-User Tests*:
- Open two browsers, both on `/stream` Last Actions tab
- Browser A: Add reaction to comment → Verify Browser B sees update
- Browser B: Add different reaction to same comment → Verify Browser A sees both reactions
- Browser A: Remove their reaction → Verify Browser B sees only remaining reaction
- Browser C: Open page fresh → Verify sees current server state (not cached)
- Mixed tabs: Browser A on Last Actions, Browser B on Global → Both see same reactions
- User A reacts to their own comment on Personal stream → Other users see it in Last Actions

### Performance Implications

**Impact**: Negligible
- Adds one additional cache update operation per reaction event
- Cache update is in-memory operation (O(n) where n = activities count)
- No additional network requests
- No additional WebSocket subscriptions

**Optimization**: None required at this scale

### Backward Compatibility

**No Breaking Changes**:
- Extends existing WebSocket handler
- Does not modify API contracts
- Does not alter data structures
- Maintains existing behavior for all other tabs

### Dependencies

**Prerequisites**:
- Existing WebSocket connection to stream rooms
- React Query cache infrastructure
- Current reaction API endpoints functional

**No New Dependencies Required**

## Implementation Summary

This design addresses the real-time reaction display issue by extending the existing WebSocket infrastructure to include the Last Actions query cache. The solution is minimal, non-invasive, and follows established patterns already proven in other stream tabs. No server-side changes are required, as the WebSocket events are already being emitted correctly.

**Multi-User Synchronization Confirmation**: The existing WebSocket broadcasting mechanism ensures that all connected users receive reaction updates simultaneously. The proposed change will extend this existing functionality to the Last Actions tab, providing the same real-time synchronization experience already working in Global, Personal, and Shelves tabs. When any user adds or removes a reaction, all other users viewing the `/stream` page (on any tab) will see the update in real-time without needing to reload the page.
