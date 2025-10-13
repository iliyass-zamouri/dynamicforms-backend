# DynamicFormsGPT Setup Guide

This directory contains everything you need to create a custom GPT for the DynamicForms API.

## 📁 Files

### 1. `GPT_INSTRUCTIONS.md` (4,058 characters)
**Use this as**: Custom GPT Instructions in ChatGPT

This is a concise version optimized for the 8,000 character limit in ChatGPT's custom GPT instructions field.

**How to use**:
1. Go to ChatGPT → Create a GPT
2. Copy the entire contents of `GPT_INSTRUCTIONS.md`
3. Paste into the "Instructions" field
4. Configure the GPT name, description, and conversation starters

### 2. `DYNAMICFORMS_GPT_KNOWLEDGE.md` (detailed)
**Use this as**: Knowledge document attachment

This is a comprehensive reference document with examples, best practices, and detailed explanations.

**How to use**:
1. In your custom GPT configuration
2. Go to "Knowledge" section
3. Upload `DYNAMICFORMS_GPT_KNOWLEDGE.md`
4. The GPT will reference this for detailed information

## 🚀 Setup Steps

### Step 1: Create Custom GPT
1. Go to https://chat.openai.com/gpts/editor
2. Click "Create a GPT"
3. Switch to "Configure" tab

### Step 2: Basic Configuration
- **Name**: DynamicFormsGPT
- **Description**: "I help you create and manage dynamic forms using the DynamicForms API. Just describe the form you need, and I'll build it for you!"
- **Profile Picture**: Upload a form/document icon

### Step 3: Add Instructions
1. Copy the contents of `GPT_INSTRUCTIONS.md`
2. Paste into the "Instructions" field

### Step 4: Add Knowledge
1. Click "Upload files" under Knowledge
2. Upload `DYNAMICFORMS_GPT_KNOWLEDGE.md`

### Step 5: Configure Actions (Optional)
If you want the GPT to make API calls automatically:

1. Click "Create new action"
2. Import OpenAPI schema or manually configure endpoints:

**Authentication**:
- Type: Bearer
- Token: User provides their API token

**Key Actions**:
- `POST https://api.dynamicforms.fr/api/forms`
- `PUT https://api.dynamicforms.fr/api/forms/{id}`
- `PUT https://api.dynamicforms.fr/api/forms/{id}/steps`
- `POST https://api.dynamicforms.fr/api/forms/import`
- `GET https://api.dynamicforms.fr/api/forms/{id}`

### Step 6: Conversation Starters
Add these example prompts:
1. "Create a contact form with name, email, and message"
2. "Build a job application form"
3. "Make a customer feedback form with ratings"
4. "Create a multi-step registration form"

### Step 7: Test Your GPT
1. Save the GPT
2. Test with: "Create a simple contact form"
3. Verify it asks for API token
4. Check that it generates proper schemas

## 🔧 Advanced Configuration

### Enable Web Browsing
Turn OFF - not needed for this use case

### Enable DALL·E
Turn OFF - not needed for this use case

### Enable Code Interpreter
Turn OFF - not needed for this use case

### Capabilities
- **Web Browsing**: No
- **DALL·E Image Generation**: No
- **Code Interpreter**: Optional (can help with JSON formatting)

## 📋 API Token Setup

Users will need to:
1. Log into https://dynamicforms.fr/dashboard
2. Navigate to API settings
3. Generate a new API token
4. Provide it to the GPT when prompted

The GPT should store this token for the duration of the conversation.

## 🎯 Expected Behavior

When a user says: "Create a contact form"

The GPT should:
1. ✅ Check if it has the user's API token
2. ✅ If not, ask for it with a link to get one
3. ✅ Generate a proper JSON schema
4. ✅ Make POST request to `/api/forms`
5. ✅ Return shareable link: `https://dynamicforms.fr/forms/{slug}`

## 🐛 Troubleshooting

### GPT doesn't ask for API token
- Check that authentication is mentioned in instructions
- Ensure actions are configured with Bearer auth

### GPT generates invalid schemas
- Verify `GPT_INSTRUCTIONS.md` is in the instructions field
- Check that examples in knowledge document are correct

### API calls fail
- Verify base URL is correct: `https://api.dynamicforms.fr`
- Check that Bearer token is properly formatted
- Ensure required fields (title, steps) are present

## 📚 Additional Resources

- **API Documentation**: Available in `DYNAMICFORMS_GPT_KNOWLEDGE.md`
- **Main Backend README**: See `README.md` in parent directory
- **API Integration Guide**: See `FRONTEND_INTEGRATION_GUIDE.md`

## 🔄 Updating the GPT

When the API changes:
1. Update `DYNAMICFORMS_GPT_KNOWLEDGE.md` with new details
2. If instructions need updates, modify `GPT_INSTRUCTIONS.md` (keep under 8000 chars)
3. Re-upload the knowledge document to your GPT
4. Update the instructions field if changed

## 📞 Support

For issues with:
- **The API**: support@dynamicforms.fr
- **GPT Configuration**: Refer to OpenAI's custom GPT documentation
- **This Setup**: Check the knowledge document for examples

---

**Created**: 2025-10-13
**Last Updated**: 2025-10-13
**Version**: 1.0

