import nodemailer from 'nodemailer'
import {
  welcomeEmailTemplate,
  passwordResetEmailTemplate,
  emailVerificationTemplate,
  verificationCodeTemplate,
  formSubmissionTemplate,
  adminNewUserTemplate,
  adminNewFormTemplate
} from '../templates/email/index.js'

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

/**
 * Send form submission notification
 * @param {Object} form - The form object
 * @param {Object} submission - The submission object
 * @returns {Promise<boolean>} Success status
 */
export const sendSubmissionNotification = async (form, submission) => {
  try {
    if (!form.notificationEmail || !form.emailNotifications) {
      return false
    }

    const transporter = createTransporter()
    const submissionUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/forms/${form.id}/submissions/${submission.id}`

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: form.notificationEmail,
      subject: `Nouvelle soumission : ${form.title}`,
      html: formSubmissionTemplate(form, submission, submissionUrl),
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Email notification error:', error)
    return false
  }
}

/**
 * Send welcome email to new user
 * @param {Object} user - The user object
 * @returns {Promise<boolean>} Success status
 */
export const sendWelcomeEmail = async (user) => {
  try {
    const transporter = createTransporter()

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: 'Bienvenue sur Dynamic Forms !',
      html: welcomeEmailTemplate(user),
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Welcome email error:', error)
    return false
  }
}

/**
 * Send password reset email
 * @param {Object} user - The user object
 * @param {string} resetToken - The password reset token
 * @returns {Promise<boolean>} Success status
 */
export const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const transporter = createTransporter()

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: 'Demande de réinitialisation du mot de passe',
      html: passwordResetEmailTemplate(user, resetToken),
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Password reset email error:', error)
    return false
  }
}

/**
 * Send email verification email with token and optional code
 * @param {Object} user - The user object
 * @param {string} verificationToken - The verification token
 * @param {string|null} verificationCode - Optional 6-digit verification code
 * @returns {Promise<boolean>} Success status
 */
export const sendEmailVerificationEmail = async (user, verificationToken, verificationCode = null) => {
  try {
    const transporter = createTransporter()

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: 'Vérifiez votre adresse email',
      html: emailVerificationTemplate(user, verificationToken, verificationCode),
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Email verification email error:', error)
    return false
  }
}

/**
 * Send email verification code only
 * @param {Object} user - The user object
 * @param {string} verificationCode - The 6-digit verification code
 * @returns {Promise<boolean>} Success status
 */
export const sendEmailVerificationCode = async (user, verificationCode) => {
  try {
    const transporter = createTransporter()

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: 'Votre code de vérification',
      html: verificationCodeTemplate(user, verificationCode),
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Email verification code error:', error)
    return false
  }
}

/**
 * Generic email sender for custom emails
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.from - Optional sender email (defaults to SMTP_USER)
 * @returns {Promise<boolean>} Success status
 */
export const sendEmail = async ({ to, subject, html, from = null }) => {
  try {
    const transporter = createTransporter()

    const mailOptions = {
      from: from || process.env.SMTP_USER,
      to,
      subject,
      html,
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Send email error:', error)
    return false
  }
}

/**
 * Send admin notification for new user registration
 * @param {Object} user - The user object
 * @returns {Promise<boolean>} Success status
 */
export const sendAdminNewUserNotification = async (user) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL
    
    if (!adminEmail) {
      console.warn('ADMIN_EMAIL not configured, skipping admin notification')
      return false
    }

    const transporter = createTransporter()

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: adminEmail,
      subject: `Nouvel utilisateur inscrit : ${user.name}`,
      html: adminNewUserTemplate(user),
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Admin new user notification error:', error)
    return false
  }
}

/**
 * Send admin notification for new form creation
 * @param {Object} form - The form object
 * @param {Object} user - The user who created the form
 * @returns {Promise<boolean>} Success status
 */
export const sendAdminNewFormNotification = async (form, user) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL
    
    if (!adminEmail) {
      console.warn('ADMIN_EMAIL not configured, skipping admin notification')
      return false
    }

    const transporter = createTransporter()

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: adminEmail,
      subject: `Nouveau formulaire créé : ${form.title}`,
      html: adminNewFormTemplate(form, user),
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Admin new form notification error:', error)
    return false
  }
}

/**
 * Test email connection
 * @returns {Promise<boolean>} Connection status
 */
export const testEmailConnection = async () => {
  try {
    const transporter = createTransporter()
    await transporter.verify()
    console.log('✓ Email server connection successful')
    return true
  } catch (error) {
    console.error('✗ Email server connection failed:', error.message)
    return false
  }
}
