import { baseEmailTemplate } from './base.js'

/**
 * Password Reset Email Template
 * Sent when user requests a password reset
 */
export const passwordResetEmailTemplate = (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`

  const content = `
    <h1 class="email-title" style="font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 20px; line-height: 1.3; font-family: Arial, Helvetica, sans-serif;">Demande de réinitialisation du mot de passe</h1>

    <p class="email-text" style="font-size: 16px; color: #4b5563; margin-bottom: 20px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
      Bonjour ${user.name},
    </p>

    <p class="email-text" style="font-size: 16px; color: #4b5563; margin-bottom: 20px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
      Nous avons reçu une demande de réinitialisation du mot de passe de votre compte Dynamic Forms.
      Si vous avez fait cette demande, cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
    </p>

    <!-- Button with table structure for better compatibility -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 35px auto;">
      <tr>
        <td style="border-radius: 8px; background-color: ${process.env.PRIMARY_COLOR || '#3b82f6'}; text-align: center;">
          <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: ${process.env.PRIMARY_COLOR || '#3b82f6'}; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; font-family: Arial, Helvetica, sans-serif; min-width: 200px; max-width: 100%; box-sizing: border-box;">
            Réinitialiser mon mot de passe
          </a>
        </td>
      </tr>
    </table>

    <div class="info-box" style="background-color: #f3f4f6; border-left: 4px solid ${process.env.PRIMARY_COLOR || '#3b82f6'}; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #4b5563; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">
        Ou copiez et collez ce lien dans votre navigateur :
      </p>
      <p style="margin: 10px 0 0 0; word-break: break-all;">
        <a href="${resetUrl}" style="color: #3b82f6; font-size: 13px; font-family: Arial, Helvetica, sans-serif;">${resetUrl}</a>
      </p>
    </div>

    <div class="warning-box" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <p style="color: #92400e; margin: 0; font-size: 14px; font-family: Arial, Helvetica, sans-serif;"><strong style="color: #92400e;">Informations de sécurité importantes :</strong></p>
      <ul style="margin: 10px 0 0 20px; padding: 0; color: #92400e; font-family: Arial, Helvetica, sans-serif;">
        <li style="margin-bottom: 5px;">Ce lien de réinitialisation expirera dans <strong>1 heure</strong></li>
        <li style="margin-bottom: 5px;">Pour votre sécurité, le lien ne peut être utilisé qu'une seule fois</li>
        <li style="margin-bottom: 5px;">Après la réinitialisation, vous devrez vous connecter avec votre nouveau mot de passe</li>
      </ul>
    </div>

    <hr class="divider" style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <p style="color: #991b1b; margin: 0; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">
        <strong style="color: #991b1b;">Vous n'avez pas demandé ceci ?</strong>
      </p>
      <p style="color: #991b1b; margin: 10px 0 0 0; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">
        Si vous n'avez pas demandé de réinitialisation de mot de passe, vous pouvez ignorer cet email en toute sécurité.
        Votre mot de passe restera inchangé et votre compte est sécurisé.
      </p>
      <p style="color: #991b1b; margin: 10px 0 0 0; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">
        Cependant, si vous êtes préoccupé par un accès non autorisé, veuillez contacter notre
        équipe d'assistance immédiatement.
      </p>
    </div>

    <h3 style="color: #111827; margin: 30px 0 15px 0; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">Conseils de sécurité</h3>

    <ul style="color: #4b5563; margin: 0 0 20px 20px; line-height: 1.8; font-family: Arial, Helvetica, sans-serif;">
      <li style="margin-bottom: 8px;">Utilisez un mot de passe fort et unique (au moins 8 caractères)</li>
      <li style="margin-bottom: 8px;">Incluez un mélange de majuscules, minuscules, chiffres et symboles</li>
      <li style="margin-bottom: 8px;">Ne réutilisez pas les mots de passe d'autres comptes</li>
      <li style="margin-bottom: 8px;">Envisagez d'utiliser un gestionnaire de mots de passe</li>
    </ul>

    <p class="email-text" style="font-size: 16px; color: #4b5563; margin-bottom: 20px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
      Si vous avez des questions ou besoin d'assistance, notre équipe d'assistance est là pour vous aider.
    </p>

    <p class="email-text" style="font-size: 16px; color: #4b5563; margin-bottom: 20px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
      Restez en sécurité,<br>
      <strong style="color: #111827; font-family: Arial, Helvetica, sans-serif;">L'équipe de sécurité Dynamic Forms</strong>
    </p>
  `

  return baseEmailTemplate({
    preheader: 'Réinitialisez votre mot de passe Dynamic Forms - expire dans 1 heure',
    title: 'Demande de réinitialisation du mot de passe',
    content,
  })
}
