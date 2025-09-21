import axios from 'axios'

/**
 * Service de validation reCAPTCHA v2
 */
class CaptchaService {
  constructor() {
    this.secretKey = process.env.RECAPTCHA_SECRET_KEY
    this.enabled = process.env.ENABLE_CAPTCHA === 'true'
    this.verifyUrl = 'https://www.google.com/recaptcha/api/siteverify'
  }

  /**
   * Valide un token reCAPTCHA
   * @param {string} token - Le token reCAPTCHA à valider
   * @param {string} remoteip - L'adresse IP du client (optionnel)
   * @returns {Promise<{success: boolean, score?: number, errors?: string[]}>}
   */
  async validateToken(token, remoteip = null) {
    // Si CAPTCHA est désactivé, retourner toujours true
    if (!this.enabled) {
      return { success: true }
    }

    // Vérifier que la clé secrète est configurée
    if (!this.secretKey) {
      console.error('RECAPTCHA_SECRET_KEY n\'est pas configurée')
      return { success: false, errors: ['Configuration CAPTCHA manquante'] }
    }

    // Vérifier que le token est fourni
    if (!token) {
      return { success: false, errors: ['Token CAPTCHA requis'] }
    }

    try {
      const response = await axios.post(this.verifyUrl, {
        secret: this.secretKey,
        response: token,
        remoteip: remoteip
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000 // 10 secondes de timeout
      })

      const data = response.data

      // Vérifier la réponse
      if (!data.success) {
        const errors = data['error-codes'] || ['Validation CAPTCHA échouée']
        return { success: false, errors }
      }

      // Pour reCAPTCHA v2, on n'a pas de score
      // Pour reCAPTCHA v3, on aurait un score entre 0 et 1
      return { 
        success: true, 
        score: data.score || 1.0 // Score par défaut de 1.0 pour v2
      }

    } catch (error) {
      console.error('Erreur lors de la validation CAPTCHA:', error.message)
      
      // En cas d'erreur réseau, on peut choisir de permettre ou refuser
      // Ici, on refuse par sécurité
      return { 
        success: false, 
        errors: ['Erreur de validation CAPTCHA'] 
      }
    }
  }

  /**
   * Vérifie si le CAPTCHA est activé
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled
  }

  /**
   * Valide un token avec un score minimum (pour reCAPTCHA v3)
   * @param {string} token - Le token reCAPTCHA à valider
   * @param {number} minScore - Score minimum requis (0-1)
   * @param {string} remoteip - L'adresse IP du client (optionnel)
   * @returns {Promise<{success: boolean, score?: number, errors?: string[]}>}
   */
  async validateTokenWithScore(token, minScore = 0.5, remoteip = null) {
    const result = await this.validateToken(token, remoteip)
    
    if (!result.success) {
      return result
    }

    // Vérifier le score minimum
    if (result.score < minScore) {
      return { 
        success: false, 
        errors: [`Score CAPTCHA trop faible: ${result.score} < ${minScore}`] 
      }
    }

    return result
  }
}

// Instance singleton
const captchaService = new CaptchaService()

export default captchaService
