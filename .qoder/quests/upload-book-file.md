# Book File Upload Enhancement Design

## 1. Problem Statement

The current book upload functionality encounters a 413 Content Too Large error when users attempt to upload large book files to the endpoint `https://reader.market/api/books/upload`. This issue prevents users from adding substantial ebook files to their library, limiting the platform's functionality for larger books.

## 2. Root Cause Analysis

After investigating the system configuration, the 413 error is caused by nginx's `client_max_body_size` directive, which is currently set to 50M in the deployment configuration. This limit is enforced at the nginx proxy level before requests reach the application server.

The multer configuration in `server/routes.ts` already supports 50MB file uploads:
```typescript
const upload = multer({ 
  storage: storageEngine,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // ... file type validation
  }
});
```

However, the nginx configuration in the deployment script limits uploads to 50MB as well:
```
client_max_body_size 50M;
```

## 3. Requirements

### 3.1 Functional Requirements
- Support upload of large book files up to an increased maximum size (e.g., 100MB)
- Maintain upload functionality for smaller files without degradation
- Provide appropriate user feedback during the upload process
- Ensure file integrity after upload
- Maintain compatibility with existing file upload workflows

### 3.2 Non-Functional Requirements
- Maintain system performance during large file uploads
- Ensure security measures remain effective
- Preserve existing API contract compatibility
- Optimize resource utilization during upload process
- Minimize impact on server resources during large uploads

## 4. Proposed Solutions

### 4.1 Increase Nginx Upload Limits
Modify the `client_max_body_size` directive in nginx configuration to allow larger file uploads (e.g., 100MB).

### 4.2 Align Server-Side Configuration
Update multer configuration to match the new nginx limit to ensure consistency.

### 4.3 Client-Side Validation
Add file size validation on the client side to provide immediate feedback to users about the upload limit.

### 4.4 Implementation Strategy
- Update deployment configuration to increase nginx upload limits
- Adjust multer file size limits to match
- Add user-facing documentation about upload limits

## 5. Technical Approach

### 5.1 Nginx Configuration Changes
Update all instances of `client_max_body_size 50M;` to `client_max_body_size 100M;` in:
- deploy-ollama-reader.sh
- shared/reader.maket.deploy.md
- Any other nginx configuration files

### 5.2 Server Configuration Changes
Update the multer limits in `server/routes.ts` to match the new nginx limit:
```typescript
limits: {
  fileSize: 100 * 1024 * 1024, // 100MB limit
},
```

### 5.3 Client-Side Validation
Add file size validation in the upload form to warn users before attempting upload.

## 6. Implementation Considerations

### 6.1 Security
- Validate file types to prevent malicious uploads
- Implement appropriate rate limiting
- Sanitize file names and paths
- Consider virus scanning for uploaded files

### 6.2 Performance
- Monitor server resource usage with larger uploads
- Optimize memory usage during file processing
- Consider temporary storage strategies
- Implement proper cleanup mechanisms
- Evaluate impact on concurrent upload handling

### 6.3 Infrastructure
- Ensure sufficient disk space for larger files
- Consider bandwidth implications
- Plan for CDN or file storage scaling if needed

## 7. Risk Assessment

- Increased server resource consumption during large uploads
- Potential for abuse if limits are too generous
- Storage capacity considerations
- Network bandwidth impact
- Increased time for processing large files

## 8. Success Metrics

- Successful upload of book files up to the new size limit (100MB)
- Maintained system performance during uploads
- Reduced 413 error reports from users
- Positive user feedback on upload functionality
- No degradation in system stability

## 9. Deployment Plan

1. Update nginx configuration in deployment scripts
2. Update multer configuration in server code
3. Test upload functionality with files approaching the new limit
4. Deploy changes to production
5. Monitor system performance and error logs

## 10. Rollback Plan

If issues arise after deployment:
1. Revert nginx configuration to 50MB limit
2. Revert multer configuration to 50MB limit
3. Restart services to apply previous configuration