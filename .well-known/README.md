# AI Plugin Manifest

This directory contains the AI plugin manifest file required for LLM integration.

## File: ai-plugin.json

This file is served statically at `/.well-known/ai-plugin.json`

### Current Configuration

Currently configured for **local development** with `localhost:3000`

### For Production Deployment

**IMPORTANT:** Before deploying to production, update all URLs in `ai-plugin.json`:

Replace:
- `http://localhost:3000/openapi.json`
- `http://localhost:3000/logo.png`
- `http://localhost:3000/legal`

With your production domain:
- `https://yourdomain.com/openapi.json`
- `https://yourdomain.com/logo.png`
- `https://yourdomain.com/legal`

**Note:** Production URLs MUST use HTTPS (not HTTP) for LLM integration to work.

### Testing

Test the manifest is accessible:

```bash
# Local
curl http://localhost:3000/.well-known/ai-plugin.json

# Production
curl https://yourdomain.com/.well-known/ai-plugin.json
```

### Documentation

For complete setup instructions, see:
- `/AI_PLUGIN_INTEGRATION_GUIDE.md` - Full guide
- `/QUICK_START_AI_PLUGIN.md` - Quick start
- `/AI_PLUGIN_CONFIG.md` - Configuration reference

