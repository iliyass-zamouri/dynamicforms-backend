/**
 * Base Email Template
 * Provides a professional, responsive email layout with consistent branding
 * Optimized for maximum email client compatibility
 */

export const baseEmailTemplate = ({
  preheader = '',
  title,
  content,
  primaryColor = '#3b82f6',
  companyName = 'Dynamic Forms',
  companyAddress = '9th Arrondissement in Paris, Paris, FR',
  companyLogo = 'https://dynamicforms.fr/logo.png',
  year = new Date().getFullYear(),
}) => {
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    /* Reset styles for email clients */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }

    /* Reset styles */
    body, p, h1, h2, h3, h4, h5, h6 {
      margin: 0;
      padding: 0;
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f9fafb;
      width: 100% !important;
      min-width: 100%;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }

    /* Container */
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-collapse: collapse;
    }

    /* Header */
    .email-header {
      background-color: ${primaryColor};
      padding: 40px 30px;
      text-align: center;
    }

    .email-logo {
      max-width: 200px;
      height: auto;
      display: block;
      margin: 0 auto;
    }
    
    .email-logo-text {
      font-size: 28px;
      font-weight: bold;
      color: #ffffff;
      text-decoration: none;
      letter-spacing: -0.5px;
      font-family: Arial, Helvetica, sans-serif;
    }

    .email-tagline {
      color: #ffffff;
      font-size: 14px;
      margin-top: 8px;
      opacity: 0.9;
      font-family: Arial, Helvetica, sans-serif;
    }

    /* Content */
    .email-content {
      padding: 40px 30px;
    }

    .email-title {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 20px;
      line-height: 1.3;
      font-family: Arial, Helvetica, sans-serif;
    }

    .email-text {
      font-size: 16px;
      color: #4b5563;
      margin-bottom: 20px;
      line-height: 1.6;
      font-family: Arial, Helvetica, sans-serif;
    }

      /* Button - MSO compatible */
      .email-button {
        display: inline-block;
        padding: 14px 32px;
        background-color: ${primaryColor};
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 16px;
        margin: 20px 0;
        font-family: Arial, Helvetica, sans-serif;
        mso-padding-alt: 0;
        min-width: 200px;
        max-width: 100%;
        box-sizing: border-box;
      }

      .email-button:hover {
        background-color: #2563eb;
      }
      
      /* Button table wrapper */
      .button-wrapper {
        margin: 20px auto;
      }

    /* Info Box */
    .info-box {
      background-color: #f3f4f6;
      border-left: 4px solid ${primaryColor};
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }

    .info-box-title {
      font-weight: 600;
      color: #111827;
      margin-bottom: 10px;
      font-size: 16px;
      font-family: Arial, Helvetica, sans-serif;
    }

    /* Warning Box */
    .warning-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }

    .warning-box p {
      color: #92400e;
      margin: 0;
      font-size: 14px;
      font-family: Arial, Helvetica, sans-serif;
    }

    /* Success Box */
    .success-box {
      background-color: #d1fae5;
      border-left: 4px solid #10b981;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }

    .success-box p {
      color: #065f46;
      margin: 0;
      font-size: 14px;
      font-family: Arial, Helvetica, sans-serif;
    }

    /* Code Box */
    .code-box {
      background-color: #f9fafb;
      border: 2px solid #e5e7eb;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
      border-radius: 8px;
    }

    .code-value {
      font-size: 36px;
      font-weight: bold;
      color: #111827;
      letter-spacing: 6px;
      font-family: 'Courier New', Courier, monospace;
    }

    /* Divider */
    .divider {
      border: 0;
      border-top: 1px solid #e5e7eb;
      margin: 30px 0;
    }

    /* Footer */
    .email-footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }

    .footer-links {
      margin: 15px 0;
    }

    .footer-link {
      color: ${primaryColor};
      text-decoration: none;
      margin: 0 10px;
      font-size: 14px;
      font-family: Arial, Helvetica, sans-serif;
    }

    .footer-text {
      color: #6b7280;
      font-size: 13px;
      line-height: 1.5;
      margin-top: 15px;
      font-family: Arial, Helvetica, sans-serif;
    }

    .social-links {
      margin: 20px 0;
    }

    .social-link {
      display: inline-block;
      margin: 0 8px;
      width: 36px;
      height: 36px;
      background-color: #e5e7eb;
      border-radius: 50%;
      line-height: 36px;
      text-align: center;
      text-decoration: none;
      color: #4b5563;
      font-family: Arial, Helvetica, sans-serif;
    }

    .social-link:hover {
      background-color: ${primaryColor};
      color: #ffffff;
    }

      /* Responsive */
      @media only screen and (max-width: 600px) {
        .email-header {
          padding: 30px 20px !important;
        }
        
        .email-logo {
          max-width: 150px !important;
        }

        .email-content {
          padding: 30px 20px !important;
        }

        .email-title {
          font-size: 20px !important;
        }

        .email-text {
          font-size: 15px !important;
        }

        .email-button {
          display: block !important;
          text-align: center !important;
          width: 100% !important;
          padding: 14px 20px !important;
          min-width: auto !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          word-wrap: break-word !important;
        }
        
        .button-wrapper {
          width: 100% !important;
        }

        .code-value {
          font-size: 28px !important;
          letter-spacing: 4px !important;
        }

        .email-footer {
          padding: 20px !important;
        }
        
        table[class="button-wrapper"] {
          width: 100% !important;
        }
        
        table[class="button-wrapper"] td {
          width: 100% !important;
        }
      }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .email-container {
        background-color: #1f2937 !important;
      }
      .email-title {
        color: #f9fafb !important;
      }
      .email-text {
        color: #d1d5db !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb;">
  <!-- Preheader text -->
  <div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; color: #ffffff; line-height: 1px; max-width: 0px; opacity: 0;">
    ${preheader}
  </div>

  <!-- Email Wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb; padding: 20px 0;">
    <tr>
      <td align="center" style="padding: 0;">
        <!-- Email Container -->
        <table role="presentation" class="email-container" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td class="email-header" style="padding: 40px 30px; text-align: center;">
              <img src="${companyLogo}" alt="${companyName}" class="email-logo" style="max-width: 200px; height: auto; display: block; margin: 0 auto; border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic;" />
              <div class="email-tagline" style="color: #ffffff; font-size: 14px; margin-top: 12px; font-family: Arial, Helvetica, sans-serif;">Créez de magnifiques formulaires, sans effort</div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="email-content" style="padding: 40px 30px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="email-footer" style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <div class="footer-links" style="margin: 15px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="footer-link" style="color: ${primaryColor}; text-decoration: none; margin: 0 10px; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">Dashboard</a>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/help" class="footer-link" style="color: ${primaryColor}; text-decoration: none; margin: 0 10px; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">Help Center</a>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/contact" class="footer-link" style="color: ${primaryColor}; text-decoration: none; margin: 0 10px; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">Contact Us</a>
              </div>

              <div class="social-links" style="margin: 20px 0;">
                <a href="#" class="social-link" style="display: inline-block; margin: 0 8px; width: 36px; height: 36px; background-color: #e5e7eb; border-radius: 50%; line-height: 36px; text-align: center; text-decoration: none; color: #4b5563; font-family: Arial, Helvetica, sans-serif;">X</a>
                <a href="#" class="social-link" style="display: inline-block; margin: 0 8px; width: 36px; height: 36px; background-color: #e5e7eb; border-radius: 50%; line-height: 36px; text-align: center; text-decoration: none; color: #4b5563; font-family: Arial, Helvetica, sans-serif;">in</a>
                <a href="#" class="social-link" style="display: inline-block; margin: 0 8px; width: 36px; height: 36px; background-color: #e5e7eb; border-radius: 50%; line-height: 36px; text-align: center; text-decoration: none; color: #4b5563; font-family: Arial, Helvetica, sans-serif;">f</a>
              </div>

              <div class="footer-text" style="color: #6b7280; font-size: 13px; line-height: 1.5; margin-top: 15px; font-family: Arial, Helvetica, sans-serif;">
                <p style="margin: 0; color: #6b7280; font-size: 13px; font-family: Arial, Helvetica, sans-serif;">${companyName}</p>
                <p style="margin: 5px 0; color: #6b7280; font-size: 13px; font-family: Arial, Helvetica, sans-serif;">${companyAddress}</p>
                <p style="margin-top: 10px; color: #6b7280; font-size: 13px; font-family: Arial, Helvetica, sans-serif;">
                  © ${year} ${companyName}. All rights reserved.
                </p>
                <p style="margin-top: 10px; color: #6b7280; font-size: 13px; font-family: Arial, Helvetica, sans-serif;">
                  You received this email because you signed up for ${companyName}.
                  <br>
                  <a href="#" style="color: ${primaryColor}; text-decoration: none;">Unsubscribe</a> |
                  <a href="#" style="color: ${primaryColor}; text-decoration: none;">Preferences</a>
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
