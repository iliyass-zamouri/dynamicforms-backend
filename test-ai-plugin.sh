#!/bin/bash

# AI Plugin Test Script
# Tests all AI plugin endpoints and CORS configuration

echo "🤖 Testing AI Plugin Setup..."
echo "================================"
echo ""

BASE_URL=${1:-http://localhost:3000}

echo "📍 Base URL: $BASE_URL"
echo ""

# Test 1: Plugin Manifest
echo "1️⃣  Testing AI Plugin Manifest..."
MANIFEST_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/.well-known/ai-plugin.json")
MANIFEST_CODE=$(echo "$MANIFEST_RESPONSE" | tail -n1)
if [ "$MANIFEST_CODE" = "200" ]; then
    echo "✅ Plugin manifest accessible"
    echo "   Response preview:"
    echo "$MANIFEST_RESPONSE" | head -n -1 | jq -r '.name_for_human, .description_for_human' 2>/dev/null || echo "   (Install jq for pretty output)"
else
    echo "❌ Plugin manifest failed (HTTP $MANIFEST_CODE)"
fi
echo ""

# Test 2: OpenAPI Spec
echo "2️⃣  Testing OpenAPI Specification..."
OPENAPI_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/openapi.json")
OPENAPI_CODE=$(echo "$OPENAPI_RESPONSE" | tail -n1)
if [ "$OPENAPI_CODE" = "200" ]; then
    echo "✅ OpenAPI spec accessible"
    echo "   API Title:"
    echo "$OPENAPI_RESPONSE" | head -n -1 | jq -r '.info.title' 2>/dev/null || echo "   (Install jq for pretty output)"
else
    echo "❌ OpenAPI spec failed (HTTP $OPENAPI_CODE)"
fi
echo ""

# Test 3: Legal Endpoint
echo "3️⃣  Testing Legal Information..."
LEGAL_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/legal")
LEGAL_CODE=$(echo "$LEGAL_RESPONSE" | tail -n1)
if [ "$LEGAL_CODE" = "200" ]; then
    echo "✅ Legal endpoint accessible"
else
    echo "❌ Legal endpoint failed (HTTP $LEGAL_CODE)"
fi
echo ""

# Test 4: CORS - OpenAI
echo "4️⃣  Testing CORS for OpenAI..."
CORS_OPENAI=$(curl -s -w "\n%{http_code}" \
    -H "Origin: https://chat.openai.com" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type,Authorization" \
    -X OPTIONS \
    "$BASE_URL/api/forms")
CORS_OPENAI_CODE=$(echo "$CORS_OPENAI" | tail -n1)
if [ "$CORS_OPENAI_CODE" = "200" ]; then
    echo "✅ CORS enabled for OpenAI"
else
    echo "⚠️  CORS check returned HTTP $CORS_OPENAI_CODE (may still work)"
fi
echo ""

# Test 5: CORS - Claude
echo "5️⃣  Testing CORS for Claude..."
CORS_CLAUDE=$(curl -s -w "\n%{http_code}" \
    -H "Origin: https://claude.ai" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type,Authorization" \
    -X OPTIONS \
    "$BASE_URL/api/forms")
CORS_CLAUDE_CODE=$(echo "$CORS_CLAUDE" | tail -n1)
if [ "$CORS_CLAUDE_CODE" = "200" ]; then
    echo "✅ CORS enabled for Claude"
else
    echo "⚠️  CORS check returned HTTP $CORS_CLAUDE_CODE (may still work)"
fi
echo ""

# Test 6: CORS - Copilot
echo "6️⃣  Testing CORS for Microsoft Copilot..."
CORS_COPILOT=$(curl -s -w "\n%{http_code}" \
    -H "Origin: https://copilot.microsoft.com" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type,Authorization" \
    -X OPTIONS \
    "$BASE_URL/api/forms")
CORS_COPILOT_CODE=$(echo "$CORS_COPILOT" | tail -n1)
if [ "$CORS_COPILOT_CODE" = "200" ]; then
    echo "✅ CORS enabled for Copilot"
else
    echo "⚠️  CORS check returned HTTP $CORS_COPILOT_CODE (may still work)"
fi
echo ""

# Test 7: Health Check
echo "7️⃣  Testing Health Endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
if [ "$HEALTH_CODE" = "200" ]; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed (HTTP $HEALTH_CODE)"
fi
echo ""

# Test 8: API Documentation
echo "8️⃣  Testing API Documentation..."
DOCS_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api-docs.json")
DOCS_CODE=$(echo "$DOCS_RESPONSE" | tail -n1)
if [ "$DOCS_CODE" = "200" ]; then
    echo "✅ API documentation accessible"
else
    echo "❌ API documentation failed (HTTP $DOCS_CODE)"
fi
echo ""

# Summary
echo "================================"
echo "🎯 Test Summary"
echo "================================"

# Count successes
SUCCESS_COUNT=0
[ "$MANIFEST_CODE" = "200" ] && ((SUCCESS_COUNT++))
[ "$OPENAPI_CODE" = "200" ] && ((SUCCESS_COUNT++))
[ "$LEGAL_CODE" = "200" ] && ((SUCCESS_COUNT++))
[ "$CORS_OPENAI_CODE" = "200" ] && ((SUCCESS_COUNT++))
[ "$CORS_CLAUDE_CODE" = "200" ] && ((SUCCESS_COUNT++))
[ "$CORS_COPILOT_CODE" = "200" ] && ((SUCCESS_COUNT++))
[ "$HEALTH_CODE" = "200" ] && ((SUCCESS_COUNT++))
[ "$DOCS_CODE" = "200" ] && ((SUCCESS_COUNT++))

echo "✅ Passed: $SUCCESS_COUNT/8 tests"
echo ""

if [ $SUCCESS_COUNT -eq 8 ]; then
    echo "🎉 All tests passed! Your AI plugin is ready!"
    echo ""
    echo "Next steps:"
    echo "1. Update domain in .well-known/ai-plugin.json"
    echo "2. Deploy to production with HTTPS"
    echo "3. Test with LLM platforms"
elif [ $SUCCESS_COUNT -ge 6 ]; then
    echo "✓ Most tests passed. Check warnings above."
    echo "  Your plugin should work, but review any failures."
else
    echo "⚠️  Some tests failed. Please check:"
    echo "  - Is the server running?"
    echo "  - Are all routes configured correctly?"
    echo "  - Check logs for errors"
fi

echo ""
echo "For detailed setup instructions:"
echo "  - Quick start: QUICK_START_AI_PLUGIN.md"
echo "  - Full guide: AI_PLUGIN_INTEGRATION_GUIDE.md"
echo ""

