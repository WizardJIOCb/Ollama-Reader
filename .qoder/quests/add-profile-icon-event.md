# Add User Registration Event to Last Actions Tab

## Overview

Add a new event type to the Last Actions tab on the /stream page that displays when new users register on the platform. The event will show the new user's profile icon, username, and allow navigation to their profile.

## Objectives

- Track user registration events and broadcast them to the Last Actions stream
- Display registration events with consistent UI patterns matching existing action types
- Enable navigation to newly registered user profiles from the event card
- Maintain real-time event delivery via WebSocket

## Functional Requirements

### User Registration Event Tracking

When a user successfully completes registration:
- Create a user action record in the `user_actions` table
- Broadcast the registration event via WebSocket to the global stream
- Include the new user's profile information (ID, username, avatar)

### Event Display

The registration event card must display:
- Profile icon representing the user action type
- Text label: "User registered" (English) / "Зарегистрировался пользователь" (Russian)
- User avatar with fallback to first letter of username
- Username as clickable link to profile
- Timestamp of registration (relative time format for recent, full date/time for older)
- Delete button for admin/moderator users

### Navigation Behavior

- Clicking the username navigates to the new user's profile page
- Profile link format: `/profile/{userId}`
- Navigation should be client-side routing

## Technical Design

### Database Schema

**Table**: `user_actions` (already exists)

No schema changes required. The existing table structure supports the new event type:
- `action_type`: Will use value `'user_registered'`
- `target_type`: Will be `'user'`
- `target_id`: Will contain the newly registered user's ID
- `metadata`: Will store username and any additional registration context

### Backend Changes

#### Registration Endpoint Enhancement

**File**: `server/routes.ts`  
**Endpoint**: `POST /api/auth/register`

After successful user creation and before returning the response:

1. Create user action record via `storage.createUserAction()`
   - actionType: `'user_registered'`
   - userId: New user's ID
   - targetType: `'user'`
   - targetId: New user's ID
   - metadata: `{ username: newUsername }`

2. Broadcast registration event via WebSocket
   - Use the Socket.IO instance attached to the app
   - Format event data to match existing Last Actions structure
   - Emit to the global stream room
   - Include user profile information (id, username, avatar_url)

**Event Broadcast Structure**:
```
{
  id: actionId,
  type: 'user_action',
  action_type: 'user_registered',
  entityId: actionId,
  userId: newUserId,
  user: {
    id: newUserId,
    username: newUsername,
    avatar_url: avatarUrl || null
  },
  target: {
    type: 'user',
    id: newUserId,
    username: newUsername,
    avatar_url: avatarUrl || null
  },
  metadata: { username: newUsername },
  createdAt: timestamp,
  timestamp: timestamp.toISOString()
}
```

#### Storage Layer Integration

**File**: `server/storage.ts`

The `getLastActions()` method already handles user action formatting and includes target resolution for user type. No changes required as it will automatically pick up the new action type.

### Frontend Changes

#### Event Icon Mapping

**File**: `client/src/components/stream/LastActionsActivityCard.tsx`  
**Function**: `getActionIcon()`

Add new case for registration event:
- Action type: `'user_registered'`
- Icon: User icon (already imported from lucide-react)
- Color: Distinct color to differentiate from navigate_profile action (e.g., text-green-500)

#### Event Text Labels

**File**: `client/src/locales/en/stream.json`

Add to `actionTypes` object:
- Key: `"user_registered"`
- Value: `"User registered"`

**File**: `client/src/locales/ru/stream.json`

Add to `actionTypes` object:
- Key: `"user_registered"`
- Value: `"Зарегистрировался пользователь"`

#### Event Rendering Logic

**File**: `client/src/components/stream/LastActionsActivityCard.tsx`

The component already handles:
- Icon rendering via `getActionIcon()`
- Text label via `getActionTypeLabel()` which uses translation keys
- User information display with avatar and username link
- Target link rendering via `renderActionDescription()`

No component logic changes required. The new action type will be automatically rendered using existing patterns.

### Real-Time Event Delivery

#### WebSocket Room

Events will be broadcast to the `'stream:global'` room, which is already established for Last Actions events.

#### Client-Side Subscription

The StreamPage component already subscribes to `'stream:new-activity'` and `'last-actions:new-action'` events. The registration event will be picked up automatically through the query invalidation mechanism.

### UI Consistency Rules

Following the existing specification from project memory:
- Every event icon must be followed by descriptive text label
- User avatar displayed with fallback to username initial
- Username shown as clickable link to profile
- Timestamp shown with relative formatting
- Admin/moderator delete functionality available

## Data Flow

### Registration Flow Sequence

1. User submits registration form
2. Backend validates username and creates user account
3. Backend creates user action record for registration event
4. Backend broadcasts registration event via WebSocket to 'stream:global' room
5. Connected clients receive real-time notification
6. StreamPage component invalidates Last Actions query cache
7. New registration event appears in Last Actions tab
8. Users can click on username to navigate to new profile

### Error Handling

- If user action creation fails: Log error but do not block registration response
- If WebSocket broadcast fails: Log error but do not block registration response
- Registration must succeed independently of event tracking

## UI Specifications

### Event Card Layout

```
┌─────────────────────────────────────────────────────┐
│ [Profile Icon] User registered          [timestamp] │
│ [Delete btn - admin only]                           │
│                                                      │
│ [Avatar] [Username - clickable]                     │
└─────────────────────────────────────────────────────┘
```

### Icon Specifications

- Icon component: User (from lucide-react)
- Size: w-5 h-5
- Color: text-green-500 (distinct from navigate_profile which uses text-pink-500)

### Text Labels

- Action header: "User registered" / "Зарегистрировался пользователь"
- No additional description text (no target link needed as the username itself is the target)

## Security Considerations

- User action creation does not expose sensitive information
- Only public profile data (username, avatar) is broadcast
- Password and email are never included in event data
- Delete functionality restricted to admin/moderator access levels

## Performance Considerations

- User action creation is asynchronous and non-blocking
- WebSocket broadcast is fire-and-forget
- Database indexes on user_actions table already optimize query performance
- Event broadcasting adds minimal overhead to registration process

## Internationalization

Both English and Russian translations required for:
- Action type label in stream.json files
- Both languages must display the same information structure

## Testing Scenarios

### Registration Event Creation
- New user registers → user action record created in database
- User action has correct action_type 'user_registered'
- Target references the new user's ID

### Real-Time Event Broadcast
- WebSocket clients connected to stream page receive event
- Event appears in Last Actions tab without page refresh
- Multiple connected clients all receive the event

### Event Display
- Registration event displays with profile icon
- Username shown correctly
- Avatar displays or shows fallback initial
- Timestamp shows relative time format

### Navigation
- Clicking username navigates to user profile page
- Profile page loads with correct user data

### Admin Functions
- Admin users see delete button
- Non-admin users do not see delete button
- Delete removes event from Last Actions tab

### Localization
- English interface shows "User registered"
- Russian interface shows "Зарегистрировался пользователь"
- Language switching updates event labels correctly

## Success Criteria

- [ ] Registration event created and stored on every successful user registration
- [ ] Event broadcast via WebSocket to all connected clients
- [ ] Event displays in Last Actions tab with profile icon and text label
- [ ] Username is clickable and navigates to profile
- [ ] Event appears in real-time without page refresh
- [ ] Admin users can delete registration events
- [ ] Both English and Russian translations functional
- [ ] No performance degradation to registration process
- [ ] No breaking changes to existing Last Actions functionality
   - metadata: `{ username: newUsername }`

2. Broadcast registration event via WebSocket
   - Use the Socket.IO instance attached to the app
   - Format event data to match existing Last Actions structure
   - Emit to the global stream room
   - Include user profile information (id, username, avatar_url)

**Event Broadcast Structure**:
```
{
  id: actionId,
  type: 'user_action',
  action_type: 'user_registered',
  entityId: actionId,
  userId: newUserId,
  user: {
    id: newUserId,
    username: newUsername,
    avatar_url: avatarUrl || null
  },
  target: {
    type: 'user',
    id: newUserId,
    username: newUsername,
    avatar_url: avatarUrl || null
  },
  metadata: { username: newUsername },
  createdAt: timestamp,
  timestamp: timestamp.toISOString()
}
```

#### Storage Layer Integration

**File**: `server/storage.ts`

The `getLastActions()` method already handles user action formatting and includes target resolution for user type. No changes required as it will automatically pick up the new action type.

### Frontend Changes

#### Event Icon Mapping

**File**: `client/src/components/stream/LastActionsActivityCard.tsx`  
**Function**: `getActionIcon()`

Add new case for registration event:
- Action type: `'user_registered'`
- Icon: User icon (already imported from lucide-react)
- Color: Distinct color to differentiate from navigate_profile action (e.g., text-green-500)

#### Event Text Labels

**File**: `client/src/locales/en/stream.json`

Add to `actionTypes` object:
- Key: `"user_registered"`
- Value: `"User registered"`

**File**: `client/src/locales/ru/stream.json`

Add to `actionTypes` object:
- Key: `"user_registered"`
- Value: `"Зарегистрировался пользователь"`

#### Event Rendering Logic

**File**: `client/src/components/stream/LastActionsActivityCard.tsx`

The component already handles:
- Icon rendering via `getActionIcon()`
- Text label via `getActionTypeLabel()` which uses translation keys
- User information display with avatar and username link
- Target link rendering via `renderActionDescription()`

No component logic changes required. The new action type will be automatically rendered using existing patterns.

### Real-Time Event Delivery

#### WebSocket Room

Events will be broadcast to the `'stream:global'` room, which is already established for Last Actions events.

#### Client-Side Subscription

The StreamPage component already subscribes to `'stream:new-activity'` and `'last-actions:new-action'` events. The registration event will be picked up automatically through the query invalidation mechanism.

### UI Consistency Rules

Following the existing specification from project memory:
- Every event icon must be followed by descriptive text label
- User avatar displayed with fallback to username initial
- Username shown as clickable link to profile
- Timestamp shown with relative formatting
- Admin/moderator delete functionality available

## Data Flow

### Registration Flow Sequence

1. User submits registration form
2. Backend validates username and creates user account
3. Backend creates user action record for registration event
4. Backend broadcasts registration event via WebSocket to 'stream:global' room
5. Connected clients receive real-time notification
6. StreamPage component invalidates Last Actions query cache
7. New registration event appears in Last Actions tab
8. Users can click on username to navigate to new profile

### Error Handling

- If user action creation fails: Log error but do not block registration response
- If WebSocket broadcast fails: Log error but do not block registration response
- Registration must succeed independently of event tracking

## UI Specifications

### Event Card Layout

```
┌─────────────────────────────────────────────────────┐
│ [Profile Icon] User registered          [timestamp] │
│ [Delete btn - admin only]                           │
│                                                      │
│ [Avatar] [Username - clickable]                     │
└─────────────────────────────────────────────────────┘
```

### Icon Specifications

- Icon component: User (from lucide-react)
- Size: w-5 h-5
- Color: text-green-500 (distinct from navigate_profile which uses text-pink-500)

### Text Labels

- Action header: "User registered" / "Зарегистрировался пользователь"
- No additional description text (no target link needed as the username itself is the target)

## Security Considerations

- User action creation does not expose sensitive information
- Only public profile data (username, avatar) is broadcast
- Password and email are never included in event data
- Delete functionality restricted to admin/moderator access levels

## Performance Considerations

- User action creation is asynchronous and non-blocking
- WebSocket broadcast is fire-and-forget
- Database indexes on user_actions table already optimize query performance
- Event broadcasting adds minimal overhead to registration process

## Internationalization

Both English and Russian translations required for:
- Action type label in stream.json files
- Both languages must display the same information structure

## Testing Scenarios

### Registration Event Creation
- New user registers → user action record created in database
- User action has correct action_type 'user_registered'
- Target references the new user's ID

### Real-Time Event Broadcast
- WebSocket clients connected to stream page receive event
- Event appears in Last Actions tab without page refresh
- Multiple connected clients all receive the event

### Event Display
- Registration event displays with profile icon
- Username shown correctly
- Avatar displays or shows fallback initial
- Timestamp shows relative time format

### Navigation
- Clicking username navigates to user profile page
- Profile page loads with correct user data

### Admin Functions
- Admin users see delete button
- Non-admin users do not see delete button
- Delete removes event from Last Actions tab

### Localization
- English interface shows "User registered"
- Russian interface shows "Зарегистрировался пользователь"
- Language switching updates event labels correctly

## Success Criteria

- [ ] Registration event created and stored on every successful user registration
- [ ] Event broadcast via WebSocket to all connected clients
- [ ] Event displays in Last Actions tab with profile icon and text label
- [ ] Username is clickable and navigates to profile
- [ ] Event appears in real-time without page refresh
- [ ] Admin users can delete registration events
- [ ] Both English and Russian translations functional
- [ ] No performance degradation to registration process
- [ ] No breaking changes to existing Last Actions functionality
   - targetId: New user's ID
   - metadata: `{ username: newUsername }`

2. Broadcast registration event via WebSocket
   - Use the Socket.IO instance attached to the app
   - Format event data to match existing Last Actions structure
   - Emit to the global stream room
   - Include user profile information (id, username, avatar_url)

**Event Broadcast Structure**:
```
{
  id: actionId,
  type: 'user_action',
  action_type: 'user_registered',
  entityId: actionId,
  userId: newUserId,
  user: {
    id: newUserId,
    username: newUsername,
    avatar_url: avatarUrl || null
  },
  target: {
    type: 'user',
    id: newUserId,
    username: newUsername,
    avatar_url: avatarUrl || null
  },
  metadata: { username: newUsername },
  createdAt: timestamp,
  timestamp: timestamp.toISOString()
}
```

#### Storage Layer Integration

**File**: `server/storage.ts`

The `getLastActions()` method already handles user action formatting and includes target resolution for user type. No changes required as it will automatically pick up the new action type.

### Frontend Changes

#### Event Icon Mapping

**File**: `client/src/components/stream/LastActionsActivityCard.tsx`  
**Function**: `getActionIcon()`

Add new case for registration event:
- Action type: `'user_registered'`
- Icon: User icon (already imported from lucide-react)
- Color: Distinct color to differentiate from navigate_profile action (e.g., text-green-500)

#### Event Text Labels

**File**: `client/src/locales/en/stream.json`

Add to `actionTypes` object:
- Key: `"user_registered"`
- Value: `"User registered"`

**File**: `client/src/locales/ru/stream.json`

Add to `actionTypes` object:
- Key: `"user_registered"`
- Value: `"Зарегистрировался пользователь"`

#### Event Rendering Logic

**File**: `client/src/components/stream/LastActionsActivityCard.tsx`

The component already handles:
- Icon rendering via `getActionIcon()`
- Text label via `getActionTypeLabel()` which uses translation keys
- User information display with avatar and username link
- Target link rendering via `renderActionDescription()`

No component logic changes required. The new action type will be automatically rendered using existing patterns.

### Real-Time Event Delivery

#### WebSocket Room

Events will be broadcast to the `'stream:global'` room, which is already established for Last Actions events.

#### Client-Side Subscription

The StreamPage component already subscribes to `'stream:new-activity'` and `'last-actions:new-action'` events. The registration event will be picked up automatically through the query invalidation mechanism.

### UI Consistency Rules

Following the existing specification from project memory:
- Every event icon must be followed by descriptive text label
- User avatar displayed with fallback to username initial
- Username shown as clickable link to profile
- Timestamp shown with relative formatting
- Admin/moderator delete functionality available

## Data Flow

### Registration Flow Sequence

1. User submits registration form
2. Backend validates username and creates user account
3. Backend creates user action record for registration event
4. Backend broadcasts registration event via WebSocket to 'stream:global' room
5. Connected clients receive real-time notification
6. StreamPage component invalidates Last Actions query cache
7. New registration event appears in Last Actions tab
8. Users can click on username to navigate to new profile

### Error Handling

- If user action creation fails: Log error but do not block registration response
- If WebSocket broadcast fails: Log error but do not block registration response
- Registration must succeed independently of event tracking

## UI Specifications

### Event Card Layout

```
┌─────────────────────────────────────────────────────┐
│ [Profile Icon] User registered          [timestamp] │
│ [Delete btn - admin only]                           │
│                                                      │
│ [Avatar] [Username - clickable]                     │
└─────────────────────────────────────────────────────┘
```

### Icon Specifications

- Icon component: User (from lucide-react)
- Size: w-5 h-5
- Color: text-green-500 (distinct from navigate_profile which uses text-pink-500)

### Text Labels

- Action header: "User registered" / "Зарегистрировался пользователь"
- No additional description text (no target link needed as the username itself is the target)

## Security Considerations

- User action creation does not expose sensitive information
- Only public profile data (username, avatar) is broadcast
- Password and email are never included in event data
- Delete functionality restricted to admin/moderator access levels

## Performance Considerations

- User action creation is asynchronous and non-blocking
- WebSocket broadcast is fire-and-forget
- Database indexes on user_actions table already optimize query performance
- Event broadcasting adds minimal overhead to registration process

## Internationalization

Both English and Russian translations required for:
- Action type label in stream.json files
- Both languages must display the same information structure

## Testing Scenarios

### Registration Event Creation
- New user registers → user action record created in database
- User action has correct action_type 'user_registered'
- Target references the new user's ID

### Real-Time Event Broadcast
- WebSocket clients connected to stream page receive event
- Event appears in Last Actions tab without page refresh
- Multiple connected clients all receive the event

### Event Display
- Registration event displays with profile icon
- Username shown correctly
- Avatar displays or shows fallback initial
- Timestamp shows relative time format

### Navigation
- Clicking username navigates to user profile page
- Profile page loads with correct user data

### Admin Functions
- Admin users see delete button
- Non-admin users do not see delete button
- Delete removes event from Last Actions tab

### Localization
- English interface shows "User registered"
- Russian interface shows "Зарегистрировался пользователь"
- Language switching updates event labels correctly

## Success Criteria

- [ ] Registration event created and stored on every successful user registration
- [ ] Event broadcast via WebSocket to all connected clients
- [ ] Event displays in Last Actions tab with profile icon and text label
- [ ] Username is clickable and navigates to profile
- [ ] Event appears in real-time without page refresh
- [ ] Admin users can delete registration events
- [ ] Both English and Russian translations functional
- [ ] No performance degradation to registration process
- [ ] No breaking changes to existing Last Actions functionality
