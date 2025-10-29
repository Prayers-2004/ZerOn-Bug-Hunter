# ZerOn - Setup Guide

This guide will help you set up and run the ZerOn vulnerability scanner project.

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14.0.0 or higher)
- **npm** (v6.0.0 or higher)
- **Git** (optional, for version control)

## Installation Steps

### Step 1: Clone or Extract the Project

```bash
# If you have the project as a ZIP file
unzip ZerOn.zip
cd "ZerOn Project"

# Or if using git
git clone <repository-url>
cd ZerOn
```

### Step 2: Install Backend Dependencies

```bash
# From the project root directory
npm install
```

This will install all server-side dependencies including:
- Express.js
- Firebase Admin SDK
- Puppeteer
- Socket.io
- Google Generative AI
- And other required packages

### Step 3: Install Frontend Dependencies

```bash
# Navigate to the client directory
cd client

# Install React and frontend dependencies
npm install

# Go back to project root
cd ..
```

### Step 4: Configure Environment Variables

#### Backend Configuration

1. Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your configuration:

   **Required Variables:**
   ```
   NODE_ENV=development
   PORT=5000
   FIREBASE_PROJECT_ID=zeron-6b44c
   GEMINI_API_KEY=AIzaSyAwDdHV9jF2PTF96BKjJeqez6OyXJJvko8
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   ```

   **Firebase Configuration:**
   - Update `FIREBASE_*` variables with your Firebase project credentials
   - The service account JSON can be obtained from Firebase Console

#### Frontend Configuration

1. Create a `.env` file in the client directory:
   ```bash
   cd client
   cp .env.example .env
   cd ..
   ```

2. Edit `client/.env`:
   ```
   REACT_APP_API_URL=http://localhost:5000
   REACT_APP_SOCKET_URL=http://localhost:5000
   REACT_APP_ENV=development
   ```

### Step 5: Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing one)
3. Enable Firestore Database
4. Create service account and download JSON key
5. Add the service account JSON to `config/firebase.js` or set `FIREBASE_SERVICE_ACCOUNT_KEY` in `.env`

### Step 6: Verify Installation

Test that everything is installed correctly:

```bash
# Check Node version
node --version

# Check npm version
npm --version

# Test backend
npm test

# Test frontend (from client directory)
cd client
npm test
cd ..
```

## Running the Application

### Development Mode

#### Terminal 1: Start Backend Server

```bash
# From project root
npm run dev
```

You should see:
```
Server is running on http://localhost:5000
Connected to Firebase
```

#### Terminal 2: Start Frontend Development Server

```bash
# From project root, in a new terminal
cd client
npm start
```

The frontend will automatically open at `http://localhost:3000`

### Production Mode

#### Build Frontend

```bash
cd client
npm run build
cd ..
```

#### Run Production Server

```bash
NODE_ENV=production npm start
```

## First Scan

1. Open `http://localhost:3000` in your browser
2. You should see the ZerOn homepage with:
   - Domain input field
   - Three plan options (Basic, Pro, Enterprise)
   - Scope configuration area

3. Enter a test domain (e.g., `example.com`)
4. Select a plan (Basic for testing)
5. Add optional scope exclusions
6. Click "Start Scan"

## Monitoring Scans

### Real-Time Dashboard

The scan dashboard shows:
- **Progress Bar**: Overall scan completion (0-100%)
- **Phase Timeline**: Current phase being executed (Phase 0-4)
- **Findings Counter**: Number of vulnerabilities found in real-time
- **Status Updates**: Current operation details

### View Results

After the scan completes:
- Vulnerabilities are displayed with severity levels
- Each vulnerability shows:
  - Type (SQL Injection, XSS, etc.)
  - Severity (Critical, High, Medium, Low, Info)
  - Description and affected parameter
  - Proof of Concept (PoC)

- Click any vulnerability for detailed remediation suggestions from Gemini AI

## Project Structure

```
ZerOn Project/
├── server.js                 # Main Express server
├── package.json             # Backend dependencies
├── .env.example             # Environment variables template
├── config/
│   └── firebase.js          # Firebase configuration
├── services/
│   ├── Phase0/              # Scope & Asset management
│   ├── Phase1/              # Discovery
│   ├── Phase2/              # Attack surface expansion
│   ├── Phase3/              # Exploitation & validation
│   ├── Phase4/              # Reporting & deduplication
│   └── geminiIntegration.js # AI-powered remediation
└── client/
    ├── package.json         # Frontend dependencies
    ├── public/
    │   └── index.html       # Main HTML file
    └── src/
        ├── App.js           # React main component
        ├── config.js        # Frontend configuration
        ├── api.js           # API client
        ├── socketService.js # Socket.io utilities
        ├── utils.js         # Helper functions
        ├── pages/           # Page components
        │   ├── Home.js
        │   ├── ScanDashboard.js
        │   └── Results.js
        ├── components/      # Reusable components
        │   ├── Navigation.js
        │   ├── PlanSelector.js
        │   ├── ScopeInput.js
        │   ├── ProgressDisplay.js
        │   ├── VulnerabilityList.js
        │   └── RemediationPanel.js
        └── styles/          # CSS files
```

## Troubleshooting

### Port 5000 Already in Use
```bash
# Kill process using port 5000
# On Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# On macOS/Linux
lsof -ti:5000 | xargs kill -9
```

### Firebase Connection Error
- Verify `FIREBASE_PROJECT_ID` is correct
- Check that Firestore is enabled in Firebase Console
- Ensure service account has proper permissions

### Gemini API Error
- Verify `GEMINI_API_KEY` is correct
- Check API quotas in Google Cloud Console
- Ensure API is enabled

### Frontend Not Connecting to Backend
- Ensure backend is running on port 5000
- Check `REACT_APP_API_URL` is set correctly
- Clear browser cache: Ctrl+Shift+Delete

### Dependencies Installation Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

## API Endpoints

### Start Scan
```bash
POST /api/scan/start
Content-Type: application/json

{
  "domain": "example.com",
  "plan": "pro",
  "scope": ["example.com", "*.api.example.com", "-internal.example.com"]
}
```

### Get Scan Status
```bash
GET /api/scan/{scanId}/status
```

### Get Scan Results
```bash
GET /api/scan/{scanId}/results
```

### Get Remediation Suggestion
```bash
POST /api/remediation/suggest
Content-Type: application/json

{
  "vulnerability": {
    "type": "SQL Injection",
    "parameter": "id",
    "endpoint": "/api/users",
    "description": "..."
  }
}
```

### Export to Bug Bounty Platform
```bash
POST /api/export/bug-bounty
Content-Type: application/json

{
  "scanId": "scan-123",
  "platform": "hackerone",
  "vulnerabilities": [...]
}
```

## Performance Optimization

### For Large Scopes

Adjust these variables in `.env`:
```
MAX_CONCURRENT_SCANS=10        # Increase concurrent scans
MAX_ENDPOINTS=1000             # Increase endpoints (Pro/Enterprise)
MAX_PAYLOADS=5000              # Increase payloads
CRAWL_DEPTH_LIMIT=5            # Increase crawl depth
WORKER_THREADS=8               # Increase worker threads
```

### Memory Management

```
MEMORY_LIMIT=2048              # Set memory limit in MB
NODE_OPTIONS=--max-old-space-size=2048
```

## Deployment

### Docker (Recommended)

```bash
# Build Docker image
docker build -t zeron:latest .

# Run container
docker run -p 5000:5000 -p 3000:3000 \
  -e GEMINI_API_KEY=your_key \
  -e FIREBASE_PROJECT_ID=your_project \
  zeron:latest
```

### AWS/Cloud Deployment

Refer to the main README.md for detailed cloud deployment instructions.

## Support & Troubleshooting

For issues:
1. Check the logs in `./logs` directory
2. Review error messages in browser console (F12)
3. Check backend server output
4. Verify all environment variables are set

## Next Steps

After installation:
1. Run a test scan on a small domain
2. Configure bug-bounty API tokens if needed
3. Customize vulnerability templates if required
4. Set up email notifications (optional)
5. Configure automated scheduling (optional)

---

For more information, see the main README.md file.
