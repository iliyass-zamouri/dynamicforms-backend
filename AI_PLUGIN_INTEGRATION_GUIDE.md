# AI Plugin Integration Guide

## Overview

Your Dynamic Forms API has been successfully transformed into an AI plugin compatible with major Large Language Models (LLMs) including:

- **OpenAI ChatGPT** (GPT-4, GPT-3.5)
- **Anthropic Claude** (Claude 3, Claude 2)
- **Microsoft Copilot** (GitHub Copilot, Bing Chat)
- **Google Gemini**

## What's Been Implemented

### 1. AI Plugin Manifest

**Location:** `/.well-known/ai-plugin.json`

This manifest file describes your API to LLMs, including:
- Plugin name and description
- Authentication requirements
- OpenAPI specification URL
- Contact information

**Access URL:** `https://yourdomain.com/.well-known/ai-plugin.json`

### 2. Enhanced OpenAPI Specification

**Endpoint:** `/openapi.json`

Your existing Swagger/OpenAPI specification has been enhanced with:
- AI-specific metadata (`x-ai-plugin`)
- Improved descriptions for AI understanding
- Organized tag groups for better categorization
- Dynamic server URLs

### 3. CORS Configuration

The server now accepts requests from all major LLM platforms:

**Allowed Origins:**
- `https://chat.openai.com` (ChatGPT)
- `https://chatgpt.com`
- `https://claude.ai` (Claude)
- `https://console.anthropic.com`
- `https://www.bing.com` (Copilot)
- `https://copilot.microsoft.com`
- `https://github.com` (GitHub Copilot)
- `https://gemini.google.com`
- Plus pattern matching for other AI service domains

**Additional Headers:**
- `OpenAI-Conversation-ID`
- `OpenAI-Ephemeral-User-ID`
- `X-OpenAI-User-Id`

### 4. Plugin Discovery Endpoints

**New Routes:**

#### `GET /.well-known/ai-plugin.json`
Returns the AI plugin manifest for LLM discovery.

#### `GET /openapi.json`
Returns the enhanced OpenAPI specification optimized for AI consumption.

#### `GET /legal`
Provides legal information and terms of service for AI plugin usage.

#### `GET /logo.png`
Endpoint for plugin logo (requires configuration - see below).

## Configuration Required

### 1. Update Domain in Manifest

Edit `.well-known/ai-plugin.json` and replace placeholder URLs:

```json
{
  "api": {
    "url": "https://YOUR_DOMAIN.com/openapi.json"
  },
  "logo_url": "https://YOUR_DOMAIN.com/logo.png",
  "legal_info_url": "https://YOUR_DOMAIN.com/legal"
}
```

### 2. Add Your Logo (Optional)

Place a logo image at:
- Path: `/uploads/logo.png` or
- Update the `/logo.png` endpoint in `src/routes/aiPlugin.js` to serve your logo

Recommended logo specs:
- Format: PNG
- Size: 512x512 pixels
- Transparent background

### 3. Environment Variables

No additional environment variables are required, but you can add:

```env
# Optional: Override base URL for plugin manifest
PLUGIN_BASE_URL=https://your-production-domain.com

# Optional: Enable/disable AI plugin features
AI_PLUGIN_ENABLED=true
```

## Testing Your AI Plugin

### 1. Local Testing

Start your server:

```bash
npm start
```

Test the endpoints:

```bash
# Test plugin manifest
curl http://localhost:3000/.well-known/ai-plugin.json

# Test OpenAPI spec
curl http://localhost:3000/openapi.json

# Test legal info
curl http://localhost:3000/legal

# Test CORS (replace with LLM origin)
curl -H "Origin: https://chat.openai.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:3000/api/forms
```

### 2. OpenAI ChatGPT Integration

#### For ChatGPT Plugins (GPT Builder):

1. Go to https://chat.openai.com/
2. Create a new GPT or edit existing one
3. Under "Actions", add a new action
4. Import from URL: `https://yourdomain.com/openapi.json`
5. Configure authentication (Bearer token)

#### For Custom GPTs:

1. Navigate to GPT Builder
2. Configure Actions
3. Import your OpenAPI spec
4. Add authentication using JWT tokens from your `/api/auth/login` endpoint

### 3. Claude Integration

Anthropic Claude currently uses a different integration method:

1. Use Claude's API with function calling
2. Provide your OpenAPI specification as context
3. Claude will automatically understand available endpoints

### 4. Microsoft Copilot / GitHub Copilot

For GitHub Copilot integration:

1. Use GitHub Copilot's plugin system
2. Reference your API via the OpenAPI spec
3. Configure authentication in Copilot settings

## Usage Examples

### Example 1: ChatGPT Using Your Plugin

User asks ChatGPT:
```
"Create a contact form with name, email, phone, and message fields using the Dynamic Forms plugin"
```

ChatGPT will:
1. Authenticate using your API
2. Call `POST /api/gemini/generate` with the description
3. Return the created form details to the user

### Example 2: Claude Analyzing Forms

User asks Claude:
```
"Analyze the performance of all my forms and suggest improvements"
```

Claude will:
1. Call `GET /api/analytics` to fetch analytics data
2. Analyze the data
3. Call `POST /api/gemini/analyze` for AI-powered insights
4. Provide comprehensive recommendations

## API Capabilities Available to LLMs

Your AI plugin exposes these key capabilities:

### Form Management
- **Generate forms** from natural language descriptions
- **Create, read, update, delete** forms
- **Modify forms** with AI assistance
- **Analyze form** performance and UX

### Submission Management
- **Submit** form data
- **Retrieve** submissions
- **Analyze** submission patterns

### Analytics
- **Track** form visits and conversions
- **Generate** KPI reports
- **Monitor** form performance

### User Management
- **Register** and **authenticate** users
- **Manage** user preferences
- **Handle** subscriptions

### AI Features (Gemini)
- **Generate** forms from descriptions
- **Modify** existing forms with AI
- **Analyze** forms for improvements
- **Get AI** recommendations

## Security Considerations

### Authentication

Your API uses JWT bearer tokens for authentication:

1. **Public endpoints** (no auth required):
   - `/.well-known/ai-plugin.json`
   - `/openapi.json`
   - `/legal`
   - `/health`
   - `GET /api/forms/slug/:slug`

2. **Protected endpoints** (auth required):
   - Most `/api/*` endpoints require valid JWT token
   - Pass token in `Authorization: Bearer <token>` header

### CORS Security

While the CORS configuration is permissive for LLM origins, it includes:
- Pattern matching to prevent unauthorized domains
- Explicit origin validation
- Credential support for authenticated requests

### Rate Limiting

Your existing rate limiters still apply:
- General limiter: All requests
- Auth limiter: Authentication endpoints
- API limiter: API endpoints
- Submission limiter: Form submissions

Consider adjusting rate limits for LLM usage:

```javascript
// Example: Increase limits for AI plugins
export const aiPluginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Allow more requests for AI agents
  message: 'Too many requests from AI plugin'
})
```

## Monitoring LLM Usage

### Track AI Plugin Usage

Add logging to monitor LLM requests:

```javascript
// In middleware/logger.js
export const aiPluginLogger = (req, res, next) => {
  const isAIRequest = req.headers['openai-conversation-id'] ||
                      req.headers['x-openai-user-id'] ||
                      req.headers.origin?.includes('claude.ai')
  
  if (isAIRequest) {
    console.log('AI Plugin Request:', {
      endpoint: req.path,
      method: req.method,
      origin: req.headers.origin,
      conversationId: req.headers['openai-conversation-id']
    })
  }
  next()
}
```

### Analytics

Consider tracking:
- Number of AI plugin requests
- Popular endpoints used by LLMs
- Success/failure rates
- Token usage (for your own API analytics)

## Troubleshooting

### Issue: LLM can't discover plugin

**Solutions:**
1. Ensure `/.well-known/ai-plugin.json` is accessible
2. Check CORS headers are set correctly
3. Verify SSL certificate (HTTPS required for production)
4. Test with `curl` to verify response

### Issue: CORS errors

**Solutions:**
1. Check origin is in allowed list
2. Verify preflight OPTIONS requests return 200
3. Ensure all required headers are allowed
4. Test with specific LLM origin

### Issue: Authentication failures

**Solutions:**
1. Verify JWT token format
2. Check token expiration
3. Ensure bearer token is properly formatted
4. Test authentication separately from LLM

### Issue: Rate limiting

**Solutions:**
1. Adjust rate limits for AI plugin usage
2. Implement separate rate limiter for LLM origins
3. Monitor request patterns

## Production Deployment

### Pre-deployment Checklist

- [ ] Update domain in `ai-plugin.json`
- [ ] Add production URLs to CORS whitelist
- [ ] Configure SSL/TLS (HTTPS required)
- [ ] Upload logo image
- [ ] Test all plugin endpoints
- [ ] Update legal information
- [ ] Set up monitoring/logging
- [ ] Review rate limits
- [ ] Test with actual LLM platforms

### Deployment Steps

1. **Deploy your API** to production server
2. **Update DNS** records if needed
3. **Configure SSL** certificate (Let's Encrypt recommended)
4. **Update environment variables** with production values
5. **Test plugin manifest** at `https://yourdomain.com/.well-known/ai-plugin.json`
6. **Verify CORS** works with LLM origins
7. **Register plugin** with LLM platforms:
   - OpenAI: Through GPT Builder
   - Claude: Via API integration
   - Copilot: Through GitHub/Microsoft settings

### Nginx Configuration Example

If using Nginx as reverse proxy:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Allow .well-known directory
    location /.well-known/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        add_header Access-Control-Allow-Origin *;
    }

    # Proxy to your Node.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Advanced Configuration

### Custom Plugin Behavior

Customize how LLMs interact with your API by editing:

**File:** `src/routes/aiPlugin.js`

Add custom logic:
```javascript
// Example: Different behavior for different LLMs
router.get('/.well-known/ai-plugin.json', (req, res) => {
  const userAgent = req.headers['user-agent']
  const isOpenAI = userAgent?.includes('OpenAI')
  const isClaude = userAgent?.includes('Claude')
  
  // Customize manifest per LLM
  const manifest = {
    // ... base config
    description_for_model: isOpenAI 
      ? 'OpenAI-optimized description'
      : 'Generic description'
  }
  
  res.json(manifest)
})
```

### Rate Limiting for AI Plugins

Create specialized rate limiters:

```javascript
// In src/middleware/rateLimiter.js
export const aiPluginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  skip: (req) => {
    // Skip rate limiting for AI plugin manifest
    return req.path === '/.well-known/ai-plugin.json'
  }
})
```

## Support & Resources

### Documentation
- OpenAI Plugin Documentation: https://platform.openai.com/docs/plugins
- OpenAPI Specification: https://swagger.io/specification/
- Claude API: https://docs.anthropic.com/

### Your API Documentation
- Main API Docs: `http://localhost:3000/api-docs`
- API Endpoints: `http://localhost:3000/api`
- Health Check: `http://localhost:3000/health`

### Contact
- Email: support@dynamicforms.com
- API Issues: Create ticket in your issue tracker

## Next Steps

1. **Test locally** with curl/Postman
2. **Deploy to staging** environment
3. **Test with actual LLMs** (ChatGPT, Claude)
4. **Monitor usage** and adjust as needed
5. **Deploy to production** when satisfied
6. **Register** your plugin with LLM platforms
7. **Share** your plugin URL with users

## Conclusion

Your Dynamic Forms API is now ready to be used as an AI plugin across multiple LLM platforms. The implementation follows best practices and latest standards for AI plugin integration.

For questions or issues, refer to the troubleshooting section or contact support.

---

**Generated:** October 2025
**Version:** 1.0.0
**API Version:** 1.0.0

