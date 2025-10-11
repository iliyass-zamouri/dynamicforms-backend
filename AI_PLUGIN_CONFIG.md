# AI Plugin Configuration

## Environment Variables

Add these to your `.env` file if you want to customize AI plugin behavior:

```env
# Base URL for AI plugin manifest (production)
PLUGIN_BASE_URL=https://yourdomain.com

# Enable/disable AI plugin features
AI_PLUGIN_ENABLED=true

# Contact information
PLUGIN_CONTACT_EMAIL=support@dynamicforms.com

# URLs
PLUGIN_LEGAL_URL=https://yourdomain.com/legal
PLUGIN_LOGO_URL=https://yourdomain.com/logo.png

# Rate limiting for AI plugins (optional)
AI_PLUGIN_RATE_LIMIT_WINDOW_MS=900000
AI_PLUGIN_RATE_LIMIT_MAX_REQUESTS=200

# Logging (optional)
AI_PLUGIN_LOG_REQUESTS=true
```

## Quick Start

### 1. Local Testing

```bash
# Start your server
npm start

# Test the plugin manifest
curl http://localhost:3000/.well-known/ai-plugin.json

# Test OpenAPI spec
curl http://localhost:3000/openapi.json
```

### 2. Update Configuration

Edit `.well-known/ai-plugin.json` and replace `yourdomain.com` with your actual domain.

### 3. Deploy

Deploy your API with HTTPS enabled (required for production LLM integration).

### 4. Register with LLMs

#### ChatGPT (GPT Builder)
1. Go to https://chat.openai.com/
2. Create a GPT
3. Add Action → Import from URL
4. Use: `https://yourdomain.com/openapi.json`

#### Claude
- Use function calling with OpenAPI spec
- Claude will auto-discover endpoints

#### Microsoft Copilot
- Configure through GitHub Copilot settings
- Provide OpenAPI spec URL

## Key Endpoints

- `/.well-known/ai-plugin.json` - Plugin manifest
- `/openapi.json` - OpenAPI specification  
- `/legal` - Legal information
- `/health` - Health check

## CORS Origins Allowed

Your API now accepts requests from:
- `https://chat.openai.com`
- `https://claude.ai`
- `https://copilot.microsoft.com`
- `https://gemini.google.com`
- And other AI service domains

## Authentication

LLMs will use Bearer token authentication:
- Authenticate: `POST /api/auth/login`
- Use token: `Authorization: Bearer <token>`

## Next Steps

1. ✅ AI plugin files created
2. ✅ CORS configured for LLMs
3. ✅ OpenAPI spec enhanced
4. 📝 Update domain in manifest
5. 📝 Deploy to production
6. 📝 Test with LLM platforms

For detailed instructions, see `AI_PLUGIN_INTEGRATION_GUIDE.md`

