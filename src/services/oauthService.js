import crypto from 'crypto'
import { User } from '../models/User.js'
import logger from '../utils/logger.js'

// Helper to create or fetch a user by email from a social profile
async function findOrCreateUserFromProfile(profile) {
  const { email, name } = profile
  if (!email) {
    throw new Error('Email not available from provider')
  }

  let user = await User.findByEmail(email)
  if (user) {
    return user
  }

  // Create a random password since local login isn't used for social accounts
  const randomPassword = crypto.randomBytes(16).toString('hex')
  user = await User.create({ name: name || email.split('@')[0], email, password: randomPassword, role: 'user' })
  if (!user) {
    throw new Error('Failed to create user from social profile')
  }

  // Mark email as verified for social logins
  try {
    await user.verifyEmail()
  } catch (e) {
    logger.logError(e, { action: 'oauth_verify_email', userId: user.id })
  }

  return user
}

export async function loginWithGoogleIdToken(idToken) {
  if (!idToken) {
    throw new Error('Missing Google idToken')
  }

  // Validate using Google tokeninfo endpoint to avoid extra dependencies
  const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  const resp = await fetch(tokenInfoUrl)
  if (!resp.ok) {
    throw new Error('Invalid Google ID token')
  }
  const data = await resp.json()

  const aud = data.aud
  if (process.env.GOOGLE_CLIENT_ID && aud !== process.env.GOOGLE_CLIENT_ID) {
    throw new Error('Google token audience mismatch')
  }

  const emailVerified = data.email_verified === 'true' || data.email_verified === true
  const email = data.email
  const name = data.name || data.given_name || ''

  const user = await findOrCreateUserFromProfile({ email, name })

  // If Google confirms email verification, ensure stored flag is set
  if (emailVerified && !user.isEmailVerified()) {
    try { await user.verifyEmail() } catch {}
  }

  return user
}

export async function loginWithLinkedInCode(code, redirectUri) {
  if (!code || !redirectUri) {
    throw new Error('Missing LinkedIn code or redirectUri')
  }

  const params = new URLSearchParams()
  params.set('grant_type', 'authorization_code')
  params.set('code', code)
  params.set('redirect_uri', redirectUri)
  params.set('client_id', process.env.LINKEDIN_CLIENT_ID || '')
  params.set('client_secret', process.env.LINKEDIN_CLIENT_SECRET || '')

  const tokenResp = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  })

  if (!tokenResp.ok) {
    const text = await tokenResp.text()
    throw new Error(`LinkedIn token exchange failed: ${text}`)
  }

  const tokenData = await tokenResp.json()
  const accessToken = tokenData.access_token
  if (!accessToken) {
    throw new Error('LinkedIn access token missing')
  }

  // Try OpenID userinfo first (if scopes include openid)
  let email = null
  let name = null

  try {
    const userinfoResp = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    if (userinfoResp.ok) {
      const u = await userinfoResp.json()
      email = u.email || email
      name = u.name || [u.given_name, u.family_name].filter(Boolean).join(' ')
    }
  } catch {}

  // Fallback to v2/me and emailAddress endpoints
  if (!name) {
    try {
      const meResp = await fetch('https://api.linkedin.com/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (meResp.ok) {
        const me = await meResp.json()
        const localizedFirst = me.localizedFirstName || (me.firstName && me.firstName.localized && Object.values(me.firstName.localized)[0]) || ''
        const localizedLast = me.localizedLastName || (me.lastName && me.lastName.localized && Object.values(me.lastName.localized)[0]) || ''
        name = [localizedFirst, localizedLast].filter(Boolean).join(' ').trim() || null
      }
    } catch {}
  }

  if (!email) {
    try {
      const emailResp = await fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (emailResp.ok) {
        const em = await emailResp.json()
        const elements = em.elements || []
        if (elements.length > 0) {
          email = elements[0]['handle~']?.emailAddress || null
        }
      }
    } catch {}
  }

  const user = await findOrCreateUserFromProfile({ email, name })
  if (!user.isEmailVerified()) {
    try { await user.verifyEmail() } catch {}
  }
  return user
}


