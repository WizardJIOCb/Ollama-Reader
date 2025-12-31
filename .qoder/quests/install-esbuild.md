# Esbuild Installation Solution Design

## Problem Statement
The build process fails in production with `ERR_MODULE_NOT_FOUND` for 'esbuild' despite it being listed in devDependencies. This occurs when running `npm run build` on the deployed server.

## Root Cause Analysis
The issue stems from the difference between development and production dependency installation:
- Local development: `npm install` installs both dependencies and devDependencies
- Production deployment: `npm ci --only=production` only installs dependencies, excluding devDependencies
- The build script (`script/build.ts`) requires `esbuild` which is in devDependencies
- During deployment, `esbuild` is not available causing the build to fail

## Solution Approach

### Option 1: Move esbuild to Dependencies (Recommended)
Move `esbuild` from `devDependencies` to `dependencies` since it's required for the build process to run.

**Pros:**
- Simple solution requiring minimal changes
- Ensures build tools are always available
- No changes needed to deployment scripts

**Cons:**
- Slightly increases production package size
- Build tools included in production dependencies

### Option 2: Modify Deployment Process
Change deployment to install devDependencies or use a multi-stage approach.

**Pros:**
- Keeps build tools separate from production dependencies
- Maintains cleaner separation of concerns

**Cons:**
- Requires changes to deployment scripts
- More complex deployment process
- Potential security considerations with dev tools in production

## Recommended Implementation

### Primary Solution: Move esbuild to Dependencies
1. Move `esbuild` from `devDependencies` to `dependencies` in `package.json`
2. Keep all other build-related tools in `devDependencies`
3. Update deployment documentation to reflect the change

### Secondary Enhancement: Optimize Build Process
Consider whether other build tools should also be moved to dependencies if they're required for production builds.

## Implementation Steps

### Step 1: Update package.json
```json
{
  "dependencies": {
    // ... existing dependencies ...
    "esbuild": "^0.25.0"
  },
  "devDependencies": {
    // Remove esbuild from here
    // ... other dev dependencies ...
  }
}
```

### Step 2: Test Locally
1. Run `npm install` to update dependencies
2. Execute `npm run build` to verify build works
3. Test production startup with `npm start`

### Step 3: Deploy Changes
1. Commit updated `package.json`
2. Deploy to production server
3. Run deployment script which will now include esbuild
4. Verify build succeeds on server

## Risk Assessment

### Low Risk Factors
- Moving build tools to dependencies is a common practice
- Minimal impact on application functionality
- Well-established pattern in Node.js ecosystem

### Mitigation Strategies
- Thorough testing in staging environment before production deployment
- Maintain version pinning to prevent unexpected updates
- Monitor application size and performance post-deployment

## Alternative Considerations

### Multi-stage Docker Build (Future Enhancement)
For containerized deployments, consider implementing multi-stage builds where:
- Build stage includes all devDependencies
- Production stage only includes runtime dependencies
- Build artifacts copied from build stage to production stage

### Selective Dependency Installation
Investigate if specific devDependencies can be installed selectively during deployment while maintaining the `--only=production` flag for runtime dependencies.

## Validation Criteria

Success will be measured by:
1. Build process completes without errors on production server
2. Application starts successfully with `npm start`
3. No increase in security vulnerabilities
4. Acceptable increase in deployment package size (<5MB)

## Timeline
- Implementation: 1 hour
- Testing: 2 hours  
- Deployment: 1 hour
- Total estimated time: 4 hours

## Next Steps
1. Implement primary solution (move esbuild to dependencies)
2. Conduct thorough testing in staging environment
3. Deploy to production with monitoring
4. Document any lessons learned for future reference- Deployment: 1 hour
- Total estimated time: 4 hours

## Next Steps
1. Implement primary solution (move esbuild to dependencies)
2. Conduct thorough testing in staging environment
3. Deploy to production with monitoring
4. Document any lessons learned for future reference- Deployment: 1 hour
- Total estimated time: 4 hours

## Next Steps
1. Implement primary solution (move esbuild to dependencies)
2. Conduct thorough testing in staging environment
3. Deploy to production with monitoring
