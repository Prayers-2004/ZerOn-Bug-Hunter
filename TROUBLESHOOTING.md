# ZerOn - Troubleshooting Guide

This guide helps you resolve common issues with ZerOn.

## Installation Issues

### Issue: npm install fails

**Error:**
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solution:**
```bash
# Try with legacy peer deps
npm install --legacy-peer-deps

# Or clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Issue: Node version mismatch

**Error:**
```
The engine "node" is incompatible with this package
```

**Solution:**
```bash
# Check your Node version
node --version

# Install Node 14+ from https://nodejs.org/

# Or use nvm (Node Version Manager)
nvm install 18
nvm use 18
```

### Issue: Port 5000 already in use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution (Windows):**
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use different port
PORT=5001 npm run dev
```

**Solution (macOS/Linux):**
```bash
# Find process
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port
PORT=5001 npm run dev
```

## Firebase Issues

### Issue: Firebase connection error

**Error:**
```
Error: Failed to initialize Firebase
FirebaseError: auth/invalid-api-key
```

**Troubleshooting:**
1. Verify `FIREBASE_PROJECT_ID` in `.env`:
   ```bash
   echo $FIREBASE_PROJECT_ID
   ```

2. Check Firebase Console for correct project ID

3. Verify Firestore is enabled:
   - Go to Firebase Console
   - Select your project
   - Go to Firestore Database
   - Ensure it's created and active

4. Update service account if needed:
   - Firebase Console → Project Settings
   - Service Accounts tab
   - Generate new private key
   - Update in `config/firebase.js`

### Issue: Firestore permission denied

**Error:**
```
FirebaseError: Missing or insufficient permissions
```

**Solution:**
```javascript
// In Firebase Console, update Firestore rules:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow development
    match /{document=**} {
      allow read, write: if true;
    }
  }
}

// For production, use proper authentication
```

### Issue: Firebase quota exceeded

**Error:**
```
Error: Quota exceeded
```

**Solution:**
- Check Firebase Console for quota limits
- Upgrade billing if needed
- Optimize database queries
- Use caching

## Gemini API Issues

### Issue: Gemini API key invalid

**Error:**
```
Error: Invalid API key provided
API key not valid for use with this API
```

**Solution:**
1. Verify API key in `.env`:
   ```bash
   echo $GEMINI_API_KEY
   ```

2. Check API key is valid:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Verify API key exists
   - Check it's for Generative AI API

3. Regenerate if needed:
   ```bash
   # In Google Cloud Console
   # APIs & Services → Credentials
   # Click on your API key → Regenerate
   ```

### Issue: Gemini API quota exceeded

**Error:**
```
Error: Resource exhausted
Quota exceeded
```

**Solution:**
- Check quota usage in Google Cloud Console
- Implement rate limiting in code
- Cache responses
- Upgrade to paid tier if needed

## Frontend Issues

### Issue: Blank white page

**Causes:**
1. Backend not running
2. API_BASE_URL incorrect
3. Port mismatch

**Troubleshooting:**
1. Check backend is running:
   ```bash
   curl http://localhost:5000/api/health
   ```

2. Verify `client/.env`:
   ```bash
   cat client/.env
   # Should show: REACT_APP_API_URL=http://localhost:5000
   ```

3. Check browser console (F12):
   - Look for network errors
   - Check WebSocket connection

4. Restart frontend:
   ```bash
   cd client
   npm start
   ```

### Issue: "Cannot GET /"

**Causes:**
- Frontend not running
- Wrong port
- Build files not found

**Solution:**
```bash
# Kill existing process
lsof -i :3000 | awk 'NR!=1 {print $2}' | xargs kill -9

# Rebuild
cd client
npm run build

# Start
npm start
```

### Issue: Real-time updates not working

**Error:**
- Scan progress not updating
- Vulnerabilities not appearing in real-time

**Causes:**
1. Socket.io not connected
2. Scan ID mismatch
3. CORS issues

**Troubleshooting:**
1. Check Socket.io connection in browser console:
   ```javascript
   // In console
   window.io  // Should show Socket.io object
   ```

2. Check network tab for WebSocket:
   - Should see `ws://localhost:5000/socket.io/`
   - Status should be "101 Switching Protocols"

3. Check for CORS errors
4. Verify `REACT_APP_SOCKET_URL` in `.env`

### Issue: Styling looks broken

**Causes:**
- CSS files not loading
- CSS modules issue
- Browser cache

**Solution:**
```bash
# Clear browser cache
# Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
# Select "All time" → Clear data

# Rebuild CSS
cd client
npm start

# Hard refresh
Ctrl+F5 (or Cmd+Shift+R on Mac)
```

## Backend Issues

### Issue: Scan starts but never progresses

**Causes:**
1. Crawler timeout
2. API endpoint unreachable
3. Memory issues

**Troubleshooting:**
1. Check server logs for errors
2. Increase timeout in `.env`:
   ```
   CRAWL_TIMEOUT=60000
   REQUEST_TIMEOUT=30000
   ```

3. Test target domain:
   ```bash
   curl https://example.com
   ```

4. Check memory:
   ```bash
   # Windows: Check Task Manager
   # macOS/Linux: top or htop
   ```

### Issue: High memory usage

**Error:**
```
JavaScript heap out of memory
```

**Solution:**
```bash
# Increase Node memory limit
NODE_OPTIONS=--max-old-space-size=4096 npm run dev

# Or set in .env
NODE_OPTIONS=--max-old-space-size=4096
```

### Issue: Crawler getting blocked

**Error:**
- 403 Forbidden responses
- 429 Too Many Requests

**Solution:**
```javascript
// In crawlerService.js, add delays:
await new Promise(r => setTimeout(r, 1000)); // 1 second delay

// Add user agent rotation
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X)...'
];
```

### Issue: Payload detection not working

**Causes:**
1. Payload not reaching endpoint
2. Detection strings incorrect
3. Response encoding issue

**Troubleshooting:**
1. Enable debug logging:
   ```javascript
   // In exploitationEngine.js
   console.log('Sending payload:', payload);
   console.log('Response:', response);
   ```

2. Test manually:
   ```bash
   curl 'http://example.com/api/users?id=1%27%20OR%20%271%27=%271'
   ```

3. Check response encoding:
   ```javascript
   console.log(response.headers['content-encoding']);
   ```

## Docker Issues

### Issue: Docker build fails

**Error:**
```
Error: Cannot find module 'express'
```

**Solution:**
```bash
# Clean build
docker build --no-cache -t zeron:latest .

# Check Dockerfile
cat Dockerfile

# Verify package.json exists
ls -la package.json
```

### Issue: Container exits immediately

**Error:**
```
docker: Error response
```

**Troubleshooting:**
```bash
# Check logs
docker logs <container_id>

# Run with terminal
docker run -it zeron:latest bash

# Check startup command
docker inspect zeron:latest | grep -A 5 "Cmd"
```

### Issue: Port mapping not working

**Error:**
```
Cannot access localhost:5000
```

**Solution:**
```bash
# Check port mapping
docker port <container_id>

# Expose in docker-compose
ports:
  - "5000:5000"
  - "3000:3000"

# Run with ports
docker run -p 5000:5000 -p 3000:3000 zeron:latest
```

## Performance Issues

### Issue: Scan is very slow

**Causes:**
1. Too many concurrent requests
2. Network latency
3. Large target scope

**Solutions:**
```bash
# Reduce concurrent scans in .env
MAX_CONCURRENT_SCANS=2

# Reduce crawl depth
CRAWL_DEPTH_LIMIT=2

# Reduce timeout
CRAWL_TIMEOUT=15000

# Use faster DNS
# Windows: Configure in Network Settings
# macOS: System Preferences → Network → DNS
# Linux: Edit /etc/resolv.conf
```

### Issue: Memory leak detected

**Error:**
```
heap out of memory
heap size exceeds limits
```

**Solution:**
1. Monitor with top/htop
2. Add garbage collection hints:
   ```javascript
   global.gc() // If Node run with --expose-gc
   ```

3. Restart periodically:
   ```bash
   pm2 start server.js --restart-delay=3600000
   ```

## Database Issues

### Issue: Database connection timeout

**Error:**
```
FirebaseError: Timeout
```

**Solution:**
- Check internet connection
- Verify firewall rules
- Check Firebase service status
- Retry with exponential backoff

### Issue: Duplicate vulnerabilities

**Causes:**
- Deduplication not working
- Same scan running twice

**Solution:**
```bash
# Check Firestore for duplicates
# Firebase Console → Firestore → vulnerabilities collection

# Clear if needed (be careful!)
# Select documents → Delete
```

## Networking Issues

### Issue: CORS error in browser

**Error:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Troubleshooting:**
1. Check `FRONTEND_URL` in `.env`
2. Update CORS in `server.js`:
   ```javascript
   app.use(cors({
     origin: 'http://localhost:3000',
     credentials: true
   }));
   ```

3. Verify headers:
   ```bash
   curl -i http://localhost:5000/api/health
   ```

### Issue: API not accessible from Docker

**Causes:**
- Container networking issue
- Port not exposed

**Solution:**
```bash
# Use host network (macOS/Linux)
docker run --network host zeron:latest

# Or map ports properly
docker run -p 5000:5000 zeron:latest
```

## Debugging Tips

### Enable Verbose Logging

```bash
# Set log level
LOG_LEVEL=debug npm run dev

# Or in code
process.env.LOG_LEVEL = 'debug';
```

### Check Environment Variables

```bash
# List all vars
npm run env

# Check specific var
echo $GEMINI_API_KEY
```

### Monitor Processes

```bash
# Windows Task Manager
Get-Process node | Format-List

# macOS/Linux
ps aux | grep node
```

### Test Connectivity

```bash
# Test backend
curl http://localhost:5000/api/health

# Test API endpoint
curl -X POST http://localhost:5000/api/scan/start \
  -H "Content-Type: application/json" \
  -d '{"domain":"example.com","plan":"basic"}'

# Test database
nc -zv localhost 5432  # If using database
```

## Getting Help

If you can't resolve the issue:

1. **Check Documentation**
   - README.md - Overview and features
   - SETUP.md - Detailed setup
   - API.md - API reference

2. **Check Logs**
   ```bash
   # Backend logs
   cat logs/app.log
   
   # Browser console (F12)
   # Network tab
   # Console tab for errors
   ```

3. **Search Issues**
   - GitHub Issues
   - StackOverflow tagged with "zeron"

4. **Create Issue**
   - Include error message
   - Include environment info
   - Include steps to reproduce
   - Include logs/screenshots

5. **Contact Support**
   - Email: support@zeron.io
   - Discord: [Link in README]

---

Good luck! Happy scanning! 🔍
