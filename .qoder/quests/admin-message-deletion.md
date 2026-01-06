# Admin Message Deletion and Content Moderation Feature Design

## 1. Overview

This document outlines the design for implementing admin and moderator content management functionality. This feature will allow administrators and moderators to delete messages between users in the messaging system, as well as edit and delete comments and reviews within books. This complements the existing user permissions for managing their own content.

## 2. Problem Statement

Currently, the system allows users to send and receive private messages, and users can manage their own comments and reviews. However, there is no functionality for administrators or moderators to delete messages for moderation purposes or to edit and delete comments and reviews within books. This limitation prevents effective content moderation and management of inappropriate content within the platform.

## 3. Requirements

### 3.1 Functional Requirements
- Admins and moderators must be able to delete any message in the system
- Admins and moderators must be able to edit and delete any comment or review within books
- Regular users should continue to only be able to delete their own content (reviews, comments)
- The message deletion should be permanent
- Deleted messages should be removed from the conversation view for all participants
- The system should maintain the same access control patterns as other admin operations
- Edit and delete options for comments and reviews should be visible to moderators and administrators in the book interface

### 3.2 Non-Functional Requirements
- The deletion and editing operations should be secure and follow the same authentication patterns as other admin endpoints
- The feature should have minimal impact on system performance
- The implementation should follow the existing code patterns and architecture

## 4. System Architecture

### 4.1 Current Message System Components
- **Database**: PostgreSQL with Drizzle ORM
- **Message Schema**: Contains id, senderId, recipientId, content, createdAt, updatedAt, readStatus
- **Storage Layer**: DBStorage class with messaging operations
- **API Layer**: Express.js routes with authentication middleware

### 4.2 Current Content System Components
- **Database**: PostgreSQL with Drizzle ORM
- **Comment Schema**: Contains id, userId, bookId, content, createdAt, updatedAt
- **Review Schema**: Contains id, userId, bookId, content, rating, createdAt, updatedAt
- **Storage Layer**: DBStorage class with comment/review operations
- **API Layer**: Express.js routes with authentication middleware

### 4.3 Proposed Architecture Changes

#### 4.3.1 Storage Layer Enhancement
Add a new method to the IStorage interface and DBStorage class:
- `deleteMessage(id: string, userId: string | null): Promise<boolean>`

The method will follow the same pattern as `deleteComment` and `deleteReview`, where:
- When `userId` is null, deletion is allowed (admin/moderator action)
- When `userId` is provided, verify the message belongs to the user (regular user action)

#### 4.3.2 Content Moderation Enhancement
The existing `deleteComment` and `deleteReview` methods already support admin/moderator functionality by accepting a `userId` parameter that can be null for admin actions:
- `deleteComment(id: string, userId: string | null): Promise<boolean>`
- `deleteReview(id: string, userId: string | null): Promise<boolean>`

When `userId` is null, the deletion is performed by an admin/moderator and bypasses ownership checks.

#### 4.3.3 API Layer Enhancement
Add a new admin endpoint:
- `DELETE /api/admin/messages/:id` with `requireAdminOrModerator` middleware

For content moderation, the existing admin endpoints already exist:
- `DELETE /api/admin/comments/:id` with `requireAdminOrModerator` middleware
- `PUT /api/admin/comments/:id` with `requireAdminOrModerator` middleware
- `DELETE /api/admin/reviews/:id` with `requireAdminOrModerator` middleware
- `PUT /api/admin/reviews/:id` with `requireAdminOrModerator` middleware

## 5. Implementation Strategy

### 5.1 Storage Layer Implementation
```typescript
// In IStorage interface
deleteMessage(id: string, userId: string | null): Promise<boolean>;

// In DBStorage class
async deleteMessage(id: string, userId: string | null): Promise<boolean> {
  try {
    // Get the message to check if it exists
    const message = await db.select().from(messages).where(eq(messages.id, id));
    if (!message.length) {
      return false; // Message not found
    }
    
    // If userId is provided, verify it's the sender (for regular users)
    // If userId is null, allow deletion (for admin/moderators)
    if (userId !== null && message[0].senderId !== userId) {
      return false; // Not the sender and not an admin action
    }
    
    // Delete the message
    await db.delete(messages).where(eq(messages.id, id));
    return true;
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
}
```

### 5.2 Content Moderation Implementation
The existing content moderation functionality is already implemented in the storage layer:
- `deleteComment(id: string, userId: string | null): Promise<boolean>`
- `deleteReview(id: string, userId: string | null): Promise<boolean>`
- `updateComment(id: string, commentData: any): Promise<any>`
- `updateReview(id: string, reviewData: any): Promise<any>`

These methods support admin/moderator functionality by accepting a `userId` parameter that can be null for admin actions. When `userId` is null, ownership checks are bypassed.

### 5.3 API Layer Implementation
Add the following endpoint to routes.ts:
```typescript
// Admin: Delete any message
app.delete("/api/admin/messages/:id", authenticateToken, requireAdminOrModerator, async (req, res) => {
  console.log("Admin delete message endpoint called");
  try {
    const { id } = req.params;
    
    // Admins can delete any message
    const success = await storage.deleteMessage(id, null);
    
    if (!success) {
      return res.status(404).json({ error: "Message not found" });
    }
    
    res.status(204).send(); // No content response for successful deletion
  } catch (error) {
    console.error("Admin delete message error:", error);
    res.status(500).json({ error: "Failed to delete message" });
  }
});
```

The existing admin endpoints for content moderation already exist:
- `DELETE /api/admin/comments/:id`
- `PUT /api/admin/comments/:id` 
- `DELETE /api/admin/reviews/:id`
- `PUT /api/admin/reviews/:id`

### 5.4 Frontend Considerations
- Add API functions to the client-side API layer similar to admin comment/review deletion
- Implement UI elements in admin dashboard if needed for message moderation
- Follow the same patterns as existing admin deletion functionality

## 6. Security & Access Control

### 6.1 Authentication
- All admin endpoints use `authenticateToken` middleware to verify JWT token
- Admin-specific endpoints use `requireAdminOrModerator` middleware to check user access level

### 6.2 Authorization
- Admin access is determined by user's `accessLevel` field in the database
- Valid access levels: 'admin', 'moder', 'user'
- Only users with 'admin' or 'moder' access levels can perform message deletion
- Only users with 'admin' or 'moder' access levels can edit or delete comments and reviews within books

## 7. Data Flow

### 7.1 Admin Message Deletion Flow
1. Admin/moderator makes DELETE request to `/api/admin/messages/:id`
2. Request passes through `authenticateToken` middleware
3. Request passes through `requireAdminOrModerator` middleware
4. Storage layer `deleteMessage` method is called with userId=null (indicating admin action)
5. Database record is permanently deleted
6. Response returns 204 No Content on success or appropriate error code

### 7.2 Admin Content Moderation Flow
1. Admin/moderator makes DELETE or PUT request to `/api/admin/comments/:id` or `/api/admin/reviews/:id`
2. Request passes through `authenticateToken` middleware
3. Request passes through `requireAdminOrModerator` middleware
4. Storage layer `deleteComment`/`deleteReview` or `updateComment`/`updateReview` method is called with userId=null (indicating admin action)
5. Database record is modified/deleted
6. Response returns appropriate success or error code

## 8. Error Handling

### 8.1 Expected Error Scenarios
- **401 Unauthorized**: User not authenticated
- **403 Forbidden**: User not admin or moderator
- **404 Not Found**: Message, comment, or review with specified ID does not exist
- **500 Internal Server Error**: Database or server error during deletion or update

### 8.2 Error Response Format
- Standard error responses with descriptive messages
- Server-side logging for debugging purposes
- Client-side error handling following existing patterns

## 9. Testing Considerations

### 9.1 Unit Tests
- Test storage layer method with different user permissions
- Test API endpoint with authenticated and unauthorized users
- Test edge cases like non-existent messages, comments, and reviews
- Test admin vs regular user access patterns

### 9.2 Integration Tests
- End-to-end test of admin message deletion flow
- End-to-end test of admin comment and review deletion and editing
- Verify that regular users cannot access admin endpoints
- Confirm that admin users can delete any message, comment, or review
- Confirm that admin users can edit any comment or review

## 10. Migration Impact

This feature requires no database schema changes as it only uses existing message tables. The implementation will add new methods to the storage layer and new API endpoints without affecting existing functionality.

## 11. Performance Considerations

- Message deletion is a simple database operation with minimal performance impact
- No complex joins or operations required
- Follows the same patterns as existing deletion operations
- Caching is not required for this operation

## 12. Monitoring & Observability

- Log all admin message deletion operations for audit purposes
- Monitor API endpoint performance and error rates
- Track usage patterns for administrative actions