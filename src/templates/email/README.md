# Email Templates Documentation

## Overview

This directory contains professional, responsive email templates for Dynamic Forms. Each template is built with modern HTML/CSS and follows email best practices for maximum compatibility across email clients.

## Template Structure

```
email/
├── base.js                 # Base template with layout and styling
├── welcome.js              # Welcome email for new users
├── passwordReset.js        # Password reset email
├── emailVerification.js    # Email verification with code/link
├── verificationCode.js     # Verification code only
├── formSubmission.js       # Form submission notifications
├── index.js               # Central export file
└── README.md              # This file
```

## Features

### Professional Design

- Modern, clean layout with consistent branding
- Responsive design that works on all devices
- Professional color scheme with customizable primary color
- Clean typography using Arial/Helvetica for maximum compatibility

### Mobile Responsive

- Optimized for mobile, tablet, and desktop
- Fluid layout that adapts to screen size
- Touch-friendly buttons and links
- Readable font sizes on all devices

### Email Client Compatibility

- XHTML 1.0 Transitional DOCTYPE for maximum compatibility
- MSO (Microsoft Outlook) specific optimizations
- Inline CSS styles for reliable rendering
- Table-based layout for consistent display
- No emojis for universal compatibility

### Customizable Components

- **Info Boxes**: Blue-themed informational messages
- **Warning Boxes**: Yellow-themed warning/caution messages
- **Success Boxes**: Green-themed success messages
- **Code Boxes**: Display verification codes or tokens
- **Buttons**: Prominent call-to-action buttons
- **Dividers**: Clean section separators

### Security Features

- Clear expiration times for time-sensitive actions
- Warning messages for suspicious activity
- Security tips and best practices included
- Multiple verification methods (code + link)

## Usage

### Basic Usage

```javascript
import {
  welcomeEmailTemplate,
  passwordResetEmailTemplate,
  emailVerificationTemplate,
} from '../templates/email/index.js'

// Send welcome email
const welcomeHtml = welcomeEmailTemplate(user)

// Send password reset
const resetHtml = passwordResetEmailTemplate(user, resetToken)

// Send email verification
const verifyHtml = emailVerificationTemplate(user, token, code)
```

### Using the Email Utility

```javascript
import { sendWelcomeEmail, sendPasswordResetEmail } from '../utils/email.js'

// Automatically uses the new templates
await sendWelcomeEmail(user)
await sendPasswordResetEmail(user, resetToken)
```

## Template Details

### 1. Base Template (`base.js`)

The foundation for all emails with:

- Header with logo and tagline
- Content area
- Footer with links and social media
- Consistent styling and branding

**Parameters:**

- `preheader` - Preview text shown in email clients
- `title` - Email title (appears in title bar)
- `content` - Main email content (HTML)
- `primaryColor` - Brand color (default: #3b82f6)
- `companyName` - Company name (default: Dynamic Forms)
- `companyAddress` - Physical address for footer
- `year` - Copyright year (default: current year)

### 2. Welcome Email (`welcome.js`)

Sent when a new user registers.

**Features:**

- Friendly greeting with user's name
- 3-step getting started guide
- Pro tips for using the platform
- Call-to-action button to dashboard
- Help center link

**Parameters:**

- `user` - User object with `name` property

### 3. Password Reset (`passwordReset.js`)

Sent when user requests password reset.

**Features:**

- Clear reset button
- Alternative link for accessibility
- Security warnings
- 1-hour expiration notice
- Security tips for password creation
- Warning for unauthorized requests

**Parameters:**

- `user` - User object with `name` property
- `resetToken` - Password reset token

### 4. Email Verification (`emailVerification.js`)

Comprehensive email verification with multiple methods.

**Features:**

- Dual verification methods (code + link)
- Visual code display
- Step-by-step instructions
- Expiration times for both methods
- Troubleshooting help

**Parameters:**

- `user` - User object with `name` property
- `verificationToken` - Email verification token
- `verificationCode` - Optional 6-digit code

### 5. Verification Code (`verificationCode.js`)

Focused template for just sending verification codes.

**Features:**

- Large, prominent code display
- Quick tips for using the code
- 10-minute expiration warning
- Security warnings
- Help center link

**Parameters:**

- `user` - User object with `name` property
- `verificationCode` - 6-digit verification code

### 6. Form Submission (`formSubmission.js`)

Notification email when a form receives a submission.

**Features:**

- Submission details (ID, time, user)
- Formatted response data in table
- Quick action buttons
- Link to view full submission
- Link to analytics dashboard
- Notification settings tip

**Parameters:**

- `form` - Form object with `id`, `title` properties
- `submission` - Submission object with `id`, `data`, `submittedAt`, `userId`
- `submissionUrl` - Optional URL to view submission

## Customization

### Changing Colors

Update the primary color in your environment variables:

```env
PRIMARY_COLOR=#10b981  # Custom green color
```

Or pass it directly to the base template:

```javascript
baseEmailTemplate({
  content: '...',
  primaryColor: '#10b981',
})
```

### Modifying Templates

Each template is a JavaScript function that returns HTML. You can:

1. **Edit existing templates** - Modify the template files directly
2. **Create new templates** - Copy an existing template and customize
3. **Override styles** - Add custom styles in the content area

### Adding New Components

Common components you can add to any template:

```javascript
// Info Box
<div class="info-box">
  <p>Your information here</p>
</div>

// Warning Box
<div class="warning-box">
  <p>Warning message</p>
</div>

// Success Box
<div class="success-box">
  <p>Success message</p>
</div>

// Code Display
<div class="code-box">
  <div class="code-value">123456</div>
</div>

// Button
<a href="..." class="email-button">Click Me</a>

// Divider
<hr class="divider">
```

## Email Client Compatibility

These templates are tested and optimized for:

- Gmail (Web, iOS, Android)
- Outlook (2007-2021, Office 365, Web)
- Apple Mail (macOS, iOS)
- Yahoo Mail
- Thunderbird
- Samsung Mail
- Other major email clients

### Key Compatibility Features

- **XHTML 1.0 Transitional**: Ensures compatibility with older email clients
- **MSO Conditional Comments**: Optimized for Microsoft Outlook rendering
- **Inline CSS**: All styles are inline for maximum compatibility
- **Table-based Layout**: Uses tables for consistent cross-client rendering
- **Arial/Helvetica Font Stack**: Reliable fonts across all platforms
- **No Emojis**: Prevents rendering issues in clients that don't support emojis

## Best Practices

### Do's

- Keep subject lines under 50 characters
- Include clear call-to-action buttons
- Use alt text for images
- Test emails before deploying
- Include unsubscribe links for marketing emails
- Use responsive design
- Keep file size under 100KB
- Use inline CSS for maximum compatibility
- Test across multiple email clients

### Don'ts

- Don't use JavaScript
- Don't rely solely on images
- Don't use Flash or video embeds
- Don't use complex CSS (limited support)
- Don't forget to test on mobile devices
- Don't skip the preheader text
- Don't use emojis (incompatible with many clients)
- Don't use external CSS files
- Don't use flexbox or grid layouts

## Testing

Test your emails before sending:

```javascript
import { testEmailConnection } from '../utils/email.js'

// Test SMTP connection
await testEmailConnection()

// Send test email
import { sendEmail } from '../utils/email.js'

await sendEmail({
  to: 'your-email@example.com',
  subject: 'Test Email',
  html: welcomeEmailTemplate({ name: 'Test User' }),
})
```

## Environment Variables

Required environment variables for email functionality:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL (for links in emails)
FRONTEND_URL=http://localhost:5173

# Optional Customization
PRIMARY_COLOR=#3b82f6
COMPANY_NAME=Dynamic Forms
COMPANY_ADDRESS=123 Form Street, Tech City, TC 12345
```

## Support

For issues or questions about email templates:

1. Check the inline documentation in each template file
2. Review the base template for available CSS classes
3. Test your changes across different email clients
4. Refer to email HTML best practices documentation

## Contributing

When creating new email templates:

1. Use the base template as foundation
2. Follow the existing naming conventions
3. Include JSDoc comments
4. Add mobile-responsive styles
5. Test across major email clients
6. Update this README with new template documentation
7. Export new templates in `index.js`

## Resources

- [Email HTML Best Practices](https://www.campaignmonitor.com/dev-resources/guides/coding/)
- [Email Client CSS Support](https://www.caniemail.com/)
- [Litmus Email Testing](https://litmus.com/)
- [Email on Acid](https://www.emailonacid.com/)
