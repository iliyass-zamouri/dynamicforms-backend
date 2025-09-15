import nodemailer from 'nodemailer'

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

// Send form submission notification
export const sendSubmissionNotification = async (form, submission) => {
  try {
    if (!form.notificationEmail || !form.emailNotifications) {
      return false
    }

    const transporter = createTransporter()

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: form.notificationEmail,
      subject: `New Form Submission: ${form.title}`,
      html: `
        <h2>New Form Submission</h2>
        <p><strong>Form:</strong> ${form.title}</p>
        <p><strong>Submitted at:</strong> ${new Date(submission.submittedAt).toLocaleString()}</p>
        <p><strong>Submission ID:</strong> ${submission.id}</p>
        
        <h3>Submission Data:</h3>
        <pre>${JSON.stringify(submission.data, null, 2)}</pre>
        
        <hr>
        <p><small>This is an automated notification from Dynamic Forms.</small></p>
      `,
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Email notification error:', error)
    return false
  }
}

// Send welcome email
export const sendWelcomeEmail = async (user) => {
  try {
    const transporter = createTransporter()

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: 'Welcome to Dynamic Forms!',
      html: `
        <h2>Welcome to Dynamic Forms!</h2>
        <p>Hello ${user.name},</p>
        <p>Thank you for registering with Dynamic Forms. You can now start creating dynamic forms and collecting submissions.</p>
        
        <h3>Getting Started:</h3>
        <ul>
          <li>Create your first form</li>
          <li>Customize form fields and validation</li>
          <li>Set up email notifications</li>
          <li>Share your forms and collect responses</li>
        </ul>
        
        <p>If you have any questions, feel free to contact our support team.</p>
        
        <hr>
        <p><small>This is an automated email from Dynamic Forms.</small></p>
      `,
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Welcome email error:', error)
    return false
  }
}

// Send password reset email
export const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const transporter = createTransporter()
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${user.name},</p>
        <p>You have requested to reset your password. Click the link below to reset your password:</p>
        
        <p><a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        
        <p>If you didn't request this password reset, please ignore this email.</p>
        
        <p><strong>Note:</strong> This link will expire in 1 hour.</p>
        
        <hr>
        <p><small>This is an automated email from Dynamic Forms.</small></p>
      `,
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Password reset email error:', error)
    return false
  }
}
