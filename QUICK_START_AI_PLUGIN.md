# Quick Start: AI Plugin Setup

## What Was Changed

Your API is now an AI plugin! Here's what's new:

### Files Created
1. `/.well-known/ai-plugin.json` - Plugin manifest for LLM discovery
2. `/src/routes/aiPlugin.js` - Plugin routes and endpoints
3. `/AI_PLUGIN_INTEGRATION_GUIDE.md` - Complete documentation
4. `/AI_PLUGIN_CONFIG.md` - Configuration reference

### Files Modified
1. `/src/server.js` - Added CORS for LLM origins + plugin routes
2. `/src/config/swagger.js` - Enhanced OpenAPI spec for AI

## Test It Now (5 Minutes)

### Step 1: Start Server
```bash
cd /Users/Shared/dynamic-forms-backend
npm start
```

### Step 2: Test Plugin Manifest
```bash
curl http://localhost:3000/.well-known/ai-plugin.json
```

Expected response: JSON with plugin details

### Step 3: Test OpenAPI Spec
```bash
curl http://localhost:3000/openapi.json
```

Expected response: Full OpenAPI specification

### Step 4: Test CORS
```bash
curl -H "Origin: https://chat.openai.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     http://localhost:3000/api/forms
```

Expected response: 200 OK with CORS headers

## Before Production

### Must Do:
1. **Update domain** in `.well-known/ai-plugin.json`:
   - Change `yourdomain.com` to your actual domain

2. **Enable HTTPS** (required):
   - LLMs require HTTPS for security
   - Use Let's Encrypt or your SSL provider

3. **Test endpoints** work remotely:
   - `https://yourdomain.com/.well-known/ai-plugin.json`
   - `https://yourdomain.com/openapi.json`

### Optional:
- Add logo at `/uploads/logo.png` (512x512 PNG)
- Customize legal info in `/src/routes/aiPlugin.js`
- Adjust rate limits for AI usage

## Use with ChatGPT

### Method 1: GPT Builder (Recommended)
1. Go to https://chat.openai.com/gpts/editor
2. Create new GPT
3. Configure → Actions → Add Action
4. Import from URL: `https://yourdomain.com/openapi.json`
5. Set authentication to Bearer token
6. Test your GPT!

### Method 2: ChatGPT Plugins (Legacy)
1. Submit plugin to OpenAI plugin store
2. Provide manifest URL: `https://yourdomain.com/.well-known/ai-plugin.json`

## Use with Claude

Claude uses function calling:
1. Provide OpenAPI spec in conversation context
2. Claude auto-discovers available functions
3. Or use Claude's MCP (Model Context Protocol)

## Use with Copilot

1. GitHub Copilot: Configure in IDE settings
2. Provide API URL and auth token
3. Copilot suggests code using your API

## API Capabilities for LLMs

Your plugin lets LLMs:

✅ **Generate forms** from natural language
✅ **Create & manage** forms
✅ **Handle submissions** 
✅ **Track analytics**
✅ **Manage users** and subscriptions
✅ **AI-powered analysis** with Gemini

## Example LLM Interactions

### User asks ChatGPT:
> "Create a registration form with email, password, name, and phone number"

ChatGPT will:
1. Call `POST /api/auth/login` (if needed)
2. Call `POST /api/gemini/generate` with description
3. Return the created form

### User asks Claude:
> "Show me analytics for all my forms"

Claude will:
1. Authenticate
2. Call `GET /api/analytics`
3. Present the data in readable format

## Troubleshooting

### "Can't access manifest"
- Check HTTPS is enabled
- Verify CORS headers
- Test with curl

### "CORS error"
- Verify origin is in allowed list (src/server.js)
- Check preflight requests work

### "Authentication failed"
- Test auth separately: `POST /api/auth/login`
- Verify JWT token format

## Get Help

- **Full docs:** `AI_PLUGIN_INTEGRATION_GUIDE.md`
- **Config guide:** `AI_PLUGIN_CONFIG.md`
- **API docs:** http://localhost:3000/api-docs

## Summary

✅ Your API is now AI plugin-ready!
✅ Works with ChatGPT, Claude, Copilot, Gemini
✅ CORS configured for all major LLM platforms
✅ OpenAPI spec optimized for AI consumption

**Next:** Update domain → Deploy → Test with LLMs → Go live!

---

**Questions?** Check the full guide: `AI_PLUGIN_INTEGRATION_GUIDE.md`

