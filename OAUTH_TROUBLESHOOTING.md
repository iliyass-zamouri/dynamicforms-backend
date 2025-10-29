# OAuth Integration Troubleshooting Guide

## Common Issues and Solutions

### Issue: `ERR_CONNECTION_REFUSED` when calling OAuth endpoints

This error means the backend server is not running or not accessible.

#### Solution 1: Start the Backend Server

**Make sure the backend server is running:**

```bash
# Navigate to backend directory
cd /Users/Shared/dynamic-forms-backend

# Start the server
npm start

# Or for development with hot-reload
npm run dev
```

**Verify the server is running:**
- Check terminal for: `🚀 Server started successfully!`
- Visit: `http://localhost:3000/health`
- Should see: `{"success":true,"message":"Le serveur fonctionne",...}`

#### Solution 2: Check Server Port

Ensure the backend server is running on port 3000 (or update your frontend API URL):

```javascript
// In your frontend config
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
```

**Check your backend `.env` file:**
```env
PORT=3000
```

#### Solution 3: Verify Database Connection

The server might fail to start if the database is not connected:

```bash
# Check if MySQL is running
mysql -u root -p

# Verify database exists
SHOW DATABASES LIKE 'dynamic_forms';

# Run migrations if needed
npm run migrate
```

#### Solution 4: Check for Port Conflicts

If port 3000 is already in use:

```bash
# On macOS/Linux - Find process using port 3000
lsof -i :3000

# Kill the process if needed
kill -9 <PID>

# Or change port in .env
PORT=3001
```

#### Solution 5: Verify OAuth Endpoints Are Registered

Check that routes are properly mounted in `src/server.js`:

```javascript
app.use('/api/auth', authLimiter, authRoutes)
```

The endpoints should be accessible at:
- `POST http://localhost:3000/api/auth/oauth/google`
- `POST http://localhost:3000/api/auth/oauth/linkedin`

### Issue: OAuth endpoints return 404

#### Check Route Registration

Verify in `src/routes/auth.js` that routes are defined:

```javascript
router.post('/oauth/google', async (req, res) => { ... })
router.post('/oauth/linkedin', async (req, res) => { ... })
```

### Issue: OAuth endpoints return 500 errors

#### Check Environment Variables

Ensure OAuth credentials are set in `.env`:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
```

**Verify the file exists:**
```bash
ls -la .env
```

**Check if variables are loaded:**
```bash
node -e "require('dotenv').config(); console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET')"
```

### Issue: CORS Errors

If you see CORS errors in the browser console, check `src/server.js`:

```javascript
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  // ... other origins
]
```

**Ensure your frontend URL is in the allowed list:**
```env
FRONTEND_URL=http://localhost:5173
```

### Issue: "Invalid Google ID token" or "Google token audience mismatch"

#### Verify Google Client ID

1. Check that `GOOGLE_CLIENT_ID` in `.env` matches your Google Cloud Console
2. Ensure the ID token is valid (not expired)
3. Verify the client ID in the token matches your environment variable

#### Verify Token Format

The frontend should send the token like this:

```javascript
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij..."
}
```

### Issue: LinkedIn authentication fails

#### Check LinkedIn App Configuration

1. Verify redirect URI in LinkedIn app matches exactly:
   - In LinkedIn app: `http://localhost:5173/auth/callback`
   - In frontend code: Same URI
   - Case-sensitive and must match exactly

2. Ensure required scopes are requested:
   - `openid`
   - `profile`
   - `email`

3. Verify Client ID and Secret in `.env`

### Testing OAuth Endpoints Manually

#### Test Google OAuth Endpoint

```bash
curl -X POST http://localhost:3000/api/auth/oauth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken":"YOUR_GOOGLE_ID_TOKEN_HERE"}'
```

#### Test LinkedIn OAuth Endpoint

```bash
curl -X POST http://localhost:3000/api/auth/oauth/linkedin \
  -H "Content-Type: application/json" \
  -d '{
    "code": "YOUR_LINKEDIN_CODE_HERE",
    "redirectUri": "http://localhost:5173/auth/callback"
  }'
```

### Quick Health Check Script

Create a file `check-server.js`:

```javascript
import fetch from 'node-fetch'

async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/health')
    const data = await response.json()
    console.log('✅ Server is running:', data)
    
    // Test OAuth endpoints exist
    const oauthResponse = await fetch('http://localhost:3000/api/auth/oauth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: 'test' })
    })
    console.log('✅ OAuth endpoint exists (may return 401/400, that\'s OK):', oauthResponse.status)
  } catch (error) {
    console.error('❌ Server is not running:', error.message)
    console.log('\n💡 Start the server with: npm start')
  }
}

checkServer()
```

Run it:
```bash
node check-server.js
```

### Common Console Commands

```bash
# Check if port 3000 is in use
lsof -i :3000

# View backend logs in real-time
tail -f logs/development/combined-*.log

# Test database connection
mysql -u root -p -e "USE dynamic_forms; SELECT COUNT(*) FROM users;"

# Check environment variables are loaded
node -e "require('dotenv').config(); console.log(process.env.GOOGLE_CLIENT_ID)"
```

### Debugging Steps

1. **Start backend server:**
   ```bash
   npm start
   ```

2. **Verify server is listening:**
   ```bash
   curl http://localhost:3000/health
   ```

3. **Check OAuth route exists:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/oauth/google \
     -H "Content-Type: application/json" \
     -d '{"idToken":"test"}'
   ```
   (Should return 400 or 401, not connection refused)

4. **Verify frontend API URL:**
   - Check browser Network tab
   - Verify request URL is correct
   - Check if using correct protocol (http vs hetps)

5. **Check browser console:**
   - Look for CORS errors
   - Check for network errors
   - Verify request payload

### Still Having Issues?

1. Check backend logs in `logs/development/` directory
2. Check browser Network tab for request details
3. Verify all environment variables are set
4. Ensure database is running and accessible
5. Check firewall settings aren't blocking port 3000

