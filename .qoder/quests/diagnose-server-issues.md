# Diagnose Server Issues Design Document

## Problem Statement

There are currently two issues on the production server:

1. **Track View API Issue**: The endpoint `https://reader.market/api/books/d83311d7-c66b-4e91-a77e-346d7d7e7dda/track-view` is returning `{error: 'Failed to track book view'}`

2. **Cover Image Not Displaying**: Uploaded book cover images are not showing, with `coverImageUrl: null` for books at `https://reader.market/book/d83311d7-c66b-4e91-a77e-346d7d7e7dda`

Additionally, from the PM2 logs, we discovered the primary issue: The application is crashing with the error `TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must of type string or an instance of URL. Received undefined` at `/var/www/reader.market/dist/index.cjs:106:11026`. The server is experiencing unstable restarts and has been stopped by PM2 due to too many crashes.

Also, from the file system investigation, we discovered that no files exist matching the specific book ID `d83311d7-c66b-4e91-a77e-346d7d7e7dda`. However, the uploads directory does contain various book files and cover images with different naming patterns (coverImage-* and bookFile-*), indicating that the system has handled book uploads in the past, but there may be a mismatch between stored files and database references.

Furthermore, we confirmed the specific path error in the application logs: `TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string or an instance of URL. Received undefined`. This error occurs multiple times and is causing the application to crash repeatedly, preventing the server from operating stably.

Additionally, our investigation of the build configuration reveals:
- The distribution contains a single server file: `index.cjs` (1,214,785 bytes)
- The `vite.config.ts` is configured primarily for client-side builds (outputting to `dist/public`)
- The `tsconfig.json` specifies ES modules (`"module": "ESNext"`)
- There appears to be a mismatch between the build configuration (which seems to produce ESM) and the actual output (CJS file)

This suggests the build process may not be properly configured according to the project's expected ESM output specification, which could be contributing to the path resolution issues since `import.meta.url` is used in an ESM context but the final output is in CJS format.

During API testing, we discovered that the track-view endpoint requires a specific `viewType` parameter in the request body with values of either `card_view` or `reader_open`. When this parameter is missing, the endpoint returns `{"error":"Valid viewType is required (card_view or reader_open)"}`. However, even when providing the required parameter with a valid token, the endpoint still returns `{"error":"Failed to track book view"}` with a 500 status code, indicating there's likely an internal server error in the track-view implementation that is related to the overall server stability issues.

## Diagnostic Strategy

### Phase 1: Critical Server Issue Resolution
- Address the primary crash issue causing the application instability
- Fix the path-related error causing the repeated crashes
- Restore stable server operation

### Phase 2: System Health Check
- Verify server status and resource utilization after fixing the crash
- Check application logs for errors
- Validate database connectivity
- Confirm API endpoint availability

### Phase 3: Track View API Investigation
- Examine the track-view endpoint implementation
- Verify book ID existence in the database
- Check database write operations for view tracking
- Validate any authentication/authorization requirements
- Review error handling in the tracking mechanism

### Phase 4: Cover Image Issue Investigation
- Verify image upload functionality
- Check storage path configuration
- Validate image processing pipeline
- Examine database record for cover image URL field
- Test image serving from static paths
- Investigate the correlation between database entries and actual uploaded files

## Diagnostic Commands

### Server Health Verification
```bash
# Check if the server process is running
pm2 status

# Check system resources
top
df -h

# Check network connectivity
netstat -tuln

# Check application logs in detail
pm2 logs --lines 50
```

### Primary Crash Diagnosis
```bash
# Look specifically for the path error
pm2 logs ollama-reader --lines 100 | grep -i "path" | grep -i "undefined"

# Check the problematic file
ls -la /var/www/reader.market/dist/index.cjs

# Check the build output
ls -la /var/www/reader.market/dist/
```

### Build System Check
```bash
# Verify build configuration
cat vite.config.ts

cat tsconfig.json

# Check package.json scripts
npm run build

# Check for server build configuration differences
ls -la dist/

# Look for both CJS and ESM outputs
ls -la dist/ | grep -E '\.(c|m)js$'
```

### Database Diagnostics
```bash
# Connect to database and check book record
node -e "
const { db } = require('./server/storage');
// Query to check if book exists and has cover image
db.select().from(db.book).where('id', 'd83311d7-c66b-4e91-a77e-346d7d7e7dda').then(console.log);
"
```

### API Endpoint Testing (after server is stable)
```bash
# Test the failing track-view endpoint
curl -X POST https://reader.market/api/books/d83311d7-c66b-4e91-a77e-346d7d7e7dda/track-view -v

# Test with authentication headers if required
curl -X POST https://reader.market/api/books/d83311d7-c66b-4e91-a77e-346d7d7e7dda/track-view \
  -H "Authorization: Bearer [TOKEN]" -v

# Test with required viewType parameter
curl -X POST https://reader.market/api/books/d83311d7-c66b-4e91-a77e-346d7d7e7dda/track-view \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"viewType":"card_view"}' -v
```

### File System Check
```bash
# Check upload directory for images
ls -la uploads/
find . -name "*d83311d7-c66b-4e91-a77e-346d7d7e7dda*" -type f

# Check file permissions
ls -la uploads/ | head -20
```

### Application Configuration Check
```bash
# Check environment variables
printenv | grep -i upload
printenv | grep -i image

# Verify configuration files
cat .env
```

## Expected Outcomes

### For Server Stability Issue:
- Resolve the path-related crash causing application instability
- Successfully restart and maintain stable server operation
- Eliminate the repeated restart cycle

### For Track View Issue:
- Identify the root cause of the failure in the tracking mechanism
- Determine if it's a database constraint, missing record, or permission issue
- Implement appropriate fix based on diagnosis

### For Cover Image Issue:
- Locate why coverImageUrl remains null despite image upload
- Verify the image processing and storage pipeline
- Ensure proper database updates after image upload

## Success Criteria

- Server runs stably without crashing
- Track view API successfully records book views without error
- Cover images properly display on book pages after upload
- Both functionalities operate reliably in production environment- Cover images properly display on book pages after upload
- Both functionalities operate reliably in production environment
```

### Application Configuration Check
```bash
# Check environment variables
printenv | grep -i upload
printenv | grep -i image

# Verify configuration files
cat .env
```

## Expected Outcomes

### For Server Stability Issue:
- Resolve the path-related crash causing application instability
- Successfully restart and maintain stable server operation
- Eliminate the repeated restart cycle

### For Track View Issue:
- Identify the root cause of the failure in the tracking mechanism
- Determine if it's a database constraint, missing record, or permission issue
- Implement appropriate fix based on diagnosis

### For Cover Image Issue:
- Locate why coverImageUrl remains null despite image upload
- Verify the image processing and storage pipeline
- Ensure proper database updates after image upload

## Success Criteria

- Server runs stably without crashing
- Track view API successfully records book views without error
- Cover images properly display on book pages after upload
- Both functionalities operate reliably in production environment- Cover images properly display on book pages after upload
- Both functionalities operate reliably in production environment
- Cover images properly display on book pages after upload
- Both functionalities operate reliably in production environment- Cover images properly display on book pages after upload
- Both functionalities operate reliably in production environment
- Server runs stably without crashing
- Track view API successfully records book views without error
- Cover images properly display on book pages after upload
- Both functionalities operate reliably in production environment- Cover images properly display on book pages after upload
- Both functionalities operate reliably in production environment
- Cover images properly display on book pages after upload
- Both functionalities operate reliably in production environment- Cover images properly display on book pages after upload
- Both functionalities operate reliably in production environment
- Cover images properly display on book pages after upload
- Both functionalities operate reliably in production environment- Cover images properly display on book pages after upload
- Both functionalities operate reliably in production environment
- Cover images properly display on book pages after upload
- Both functionalities operate reliably in production environment- Cover images properly display on book pages after upload
- Both functionalities operate reliably in production environment
- Both functionalities operate reliably in production environment- Cover images properly display on book pages after upload
- Both functionalities operate reliably in production environment