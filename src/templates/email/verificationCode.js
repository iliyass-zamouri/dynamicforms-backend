import { baseEmailTemplate } from './base.js'

/**
 * Email Verification Code Template
 * Sent when user requests a new verification code
 */
export const verificationCodeTemplate = (user, verificationCode) => {
  const content = `
    <h1 class="email-title" style="font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 20px; line-height: 1.3; font-family: Arial, Helvetica, sans-serif;">Votre code de vérification</h1>

    <p class="email-text" style="font-size: 16px; color: #4b5563; margin-bottom: 20px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
      Bonjour ${user.name},
    </p>

    <p class="email-text" style="font-size: 16px; color: #4b5563; margin-bottom: 20px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
      Vous avez demandé un nouveau code de vérification par email. Utilisez le code ci-dessous pour vérifier votre adresse email.
    </p>

    <div style="background-color: #f0fdf4; border: 3px solid #10b981; padding: 30px; margin: 30px 0; border-radius: 12px; text-align: center;">
      <div style="margin-bottom: 15px;">
        <div style="width: 60px; height: 60px; background-color: #10b981; border-radius: 50%; display: inline-block; position: relative;">
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 24px; font-weight: bold;">✓</div>
        </div>
      </div>

      <h3 style="color: #065f46; margin: 0 0 20px 0; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">
        Votre code de vérification
      </h3>

      <div class="code-box" style="background-color: #ffffff; border: 3px solid #10b981; margin: 0; padding: 20px; text-align: center; border-radius: 8px;">
        <div class="code-value" style="font-size: 36px; font-weight: bold; color: #059669; letter-spacing: 6px; font-family: 'Courier New', Courier, monospace;">
          ${verificationCode}
        </div>
      </div>

      <p style="color: #065f46; font-size: 14px; margin: 20px 0 0 0; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
        Entrez ce code dans le formulaire de vérification pour<br>finaliser votre vérification d'email
      </p>
    </div>

    <div class="info-box" style="background-color: #fef9c3; border-left: 4px solid #eab308; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #713f12; font-family: Arial, Helvetica, sans-serif;">
        <strong style="color: #713f12;">Urgent :</strong> Ce code de vérification expirera dans <strong>10 minutes</strong>
      </p>
    </div>

    <hr class="divider" style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <h3 style="color: #111827; margin: 20px 0 15px 0; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">Conseils rapides</h3>

    <ul style="color: #4b5563; margin: 0 0 20px 20px; line-height: 1.8; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">
      <li style="margin-bottom: 8px;">Le code est <strong>sensible à la casse</strong> - entrez-le exactement comme indiqué</li>
      <li style="margin-bottom: 8px;">Chaque code ne peut être utilisé qu'<strong>une seule fois</strong></li>
      <li style="margin-bottom: 8px;">Besoin d'un nouveau code ? Demandez-en un autre depuis la page de vérification</li>
      <li style="margin-bottom: 8px;">Assurez-vous de finaliser la vérification dans les 10 minutes</li>
    </ul>

    <div class="warning-box" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <p style="color: #92400e; margin: 0; font-size: 14px; font-family: Arial, Helvetica, sans-serif;"><strong style="color: #92400e;">Vous n'avez pas demandé ce code ?</strong></p>
      <p style="color: #92400e; margin: 8px 0 0 0; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">
        Si vous n'avez pas demandé de code de vérification, quelqu'un essaie peut-être d'utiliser votre
        adresse email. Pour votre sécurité, veuillez ignorer cet email et envisagez de changer
        votre mot de passe si vous avez un compte chez nous.
      </p>
    </div>

    <div class="info-box" style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; margin-top: 25px; padding: 20px; border-radius: 4px;">
      <p style="margin: 0; color: #075985; font-family: Arial, Helvetica, sans-serif;">
        <strong style="color: #075985;">Besoin d'aide ?</strong> Si vous avez des difficultés à vérifier votre email,
        notre équipe d'assistance est prête à vous aider. Répondez simplement à cet email ou visitez notre
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/help" style="color: #0284c7; text-decoration: underline;">Centre d'aide</a>.
      </p>
    </div>

    <p class="email-text" style="margin-top: 25px; font-size: 16px; color: #4b5563; margin-bottom: 20px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
      Merci de vérifier votre email !
    </p>

    <p class="email-text" style="font-size: 16px; color: #4b5563; margin-bottom: 20px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
      Cordialement,<br>
      <strong style="color: #111827; font-family: Arial, Helvetica, sans-serif;">L'équipe Dynamic Forms</strong>
    </p>
  `

  return baseEmailTemplate({
    preheader: `Votre code de vérification : ${verificationCode} - expire dans 10 minutes`,
    title: 'Code de vérification d\'email',
    content,
  })
}
