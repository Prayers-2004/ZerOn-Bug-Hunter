# ZerOn - Quick Start Guide

Get ZerOn running in under 5 minutes!

## Option 1: Quick Start (Development)

### 1. Install Dependencies
```bash
npm install
cd client && npm install && cd ..
```

### 2. Setup Environment
```bash
# Copy and edit .env files
cp .env.example .env
cd client && cp .env.example .env && cd ..
```

Update `.env` with:
- `GEMINI_API_KEY=AIzaSyAwDdHV9jF2PTF96BKjJeqez6OyXJJvko8` ✓ (already provided)
- `FIREBASE_PROJECT_ID=zeron-6b44c` ✓ (already configured)
- `JWT_SECRET=your-secret-key`

### 3. Start the Application

**Terminal 1 - Backend:**
```bash
npm run dev
```
Expected output:
```
Server is running on http://localhost:5000
✓ Connected to Firebase
Socket.io server ready
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```
Expected output:
```
webpack compiled...
Compiled successfully!
You can now view the app in the browser.
```

### 4. Access ZerOn
Open your browser and go to: **http://localhost:3000**

---

## Option 2: Docker Quick Start (Recommended for Production)

### 1. Build Image
```bash
docker build -t zeron:latest .
```

### 2. Run Container
```bash
docker run -p 5000:5000 -p 3000:3000 \
  -e GEMINI_API_KEY=AIzaSyAwDdHV9jF2PTF96BKjJeqez6OyXJJvko8 \
  -e FIREBASE_PROJECT_ID=zeron-6b44c \
  -e JWT_SECRET=your-secret-key \
  zeron:latest
```

### 3. Access ZerOn
Open your browser: **http://localhost:3000**

---

## Option 3: Docker Compose

### 1. Create `.env.docker`
```bash
FIREBASE_PROJECT_ID=zeron-6b44c
GEMINI_API_KEY=AIzaSyAwDdHV9jF2PTF96BKjJeqez6OyXJJvko8
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret
```

### 2. Start Services
```bash
docker-compose up -d
```

### 3. View Logs
```bash
docker-compose logs -f zeron
```

### 4. Stop Services
```bash
docker-compose down
```

---

## First Scan Tutorial

### Step 1: Enter Domain
1. Go to http://localhost:3000
2. Enter a domain: `example.com`

### Step 2: Select Plan
- **Basic (Free)**: Good for testing
- **Pro ($99)**: 100 endpoints, 1000 payloads
- **Enterprise ($999)**: Unlimited, all features

### Step 3: Configure Scope (Optional)
```
example.com
*.api.example.com
-staging.example.com    # Exclude with -
```

### Step 4: Start Scan
Click "Start Scan" and watch real-time progress:
- Phase 0: Scope ingestion
- Phase 1: Discovery
- Phase 2: Attack surface expansion
- Phase 3: Exploitation
- Phase 4: Reporting

### Step 5: View Results
- **Vulnerabilities**: Listed by severity
- **Remediation**: Click any vuln for Gemini AI suggestions
- **Export**: Send to HackerOne, Bugcrowd, Intigriti, or Synack

---

## Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or use different port
PORT=5001 npm run dev
```

### Firebase Error
- Verify `FIREBASE_PROJECT_ID` in `.env`
- Check Firebase Console for correct project
- Ensure Firestore is enabled

### Gemini API Error
- Verify API key in `.env`
- Check Google Cloud Console quotas
- Ensure billing is enabled

### Frontend Not Connecting
- Check backend is running: `curl http://localhost:5000/api/health`
- Clear browser cache: Ctrl+Shift+Delete
- Check browser console: F12

---

## Development Commands

```bash
# Start backend in dev mode (with auto-reload)
npm run dev

# Start frontend
cd client && npm start

# Build frontend for production
cd client && npm run build

# Run tests
npm test
cd client && npm test

# Lint code
npm run lint
cd client && npm run lint

# Format code
npm run format
cd client && npm run format
```

---

## API Testing

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Start Scan
```bash
curl -X POST http://localhost:5000/api/scan/start \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "plan": "basic",
    "scope": ["example.com"]
  }'
```

Response:
```json
{
  "scanId": "scan-12345",
  "status": "started",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Get Scan Status
```bash
curl http://localhost:5000/api/scan/{scanId}/status
```

### Get Results
```bash
curl http://localhost:5000/api/scan/{scanId}/results
```

---

## Feature Highlights

✅ **5-Phase Scanning**: Comprehensive vulnerability detection
✅ **Real-Time Progress**: Socket.io for live updates
✅ **Gemini AI Integration**: Smart remediation suggestions
✅ **Bug-Bounty Export**: Direct integration with 4 platforms
✅ **Multi-Plan Support**: Basic, Pro, Enterprise tiers
✅ **Production Ready**: Docker, logging, error handling
✅ **Beautiful UI**: Modern React dashboard
✅ **13+ Vuln Types**: SQL Injection, XSS, SSRF, XXE, and more

---

## Next Steps

1. **Configure Firebase** (if not already done)
2. **Add Bug-Bounty API Tokens** (optional)
3. **Customize Payloads** (in vulnerabilityTemplates.js)
4. **Set Up Email Notifications** (in server.js)
5. **Deploy to Cloud** (AWS, GCP, Azure)

---

## Need Help?

- Check **SETUP.md** for detailed setup instructions
- See **README.md** for comprehensive documentation
- Check browser console (F12) for frontend errors
- Check server logs for backend errors

---

**Happy scanning! 🔍**
