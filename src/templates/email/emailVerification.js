import { baseEmailTemplate } from './base.js'

/**
 * Email Verification Template
 * Sent when user needs to verify their email address
 */
export const emailVerificationTemplate = (user, verificationToken, verificationCode = null) => {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`

  const content = `
    <h1 class="email-title" style="font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 20px; line-height: 1.3; font-family: Arial, Helvetica, sans-serif;">Vérifiez votre adresse email</h1>

    <p class="email-text" style="font-size: 16px; color: #4b5563; margin-bottom: 20px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
      Bonjour ${user.name},
    </p>

    <p class="email-text" style="font-size: 16px; color: #4b5563; margin-bottom: 20px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
      Merci de vous être inscrit sur Dynamic Forms ! Pour finaliser votre inscription et
      accéder à toutes les fonctionnalités, veuillez vérifier votre adresse email.
    </p>

    <div class="success-box" style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <p style="color: #065f46; margin: 0; font-size: 14px; font-family: Arial, Helvetica, sans-serif;"><strong style="color: #065f46;">Choisissez votre méthode de vérification préférée :</strong></p>
    </div>

    ${
      verificationCode
        ? `
    <!-- Verification Code Method -->
    <div style="background-color: #f0fdf4; border: 2px solid #10b981; padding: 25px; margin: 25px 0; border-radius: 12px; text-align: center;">
      <h3 style="color: #065f46; margin: 0 0 10px 0; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">
        Méthode 1 : Code de vérification
      </h3>
      <p style="color: #047857; margin: 0 0 15px 0; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">
        Entrez ce code dans le formulaire de vérification
      </p>

      <div class="code-box" style="background-color: #ffffff; border: 3px solid #10b981; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
        <div class="code-value" style="font-size: 36px; font-weight: bold; color: #059669; letter-spacing: 6px; font-family: 'Courier New', Courier, monospace;">
          ${verificationCode}
        </div>
      </div>

      <p style="color: #065f46; font-size: 13px; margin: 10px 0 0 0; font-family: Arial, Helvetica, sans-serif;">
        Le code expire dans <strong>10 minutes</strong>
      </p>
    </div>
    `
        : ''
    }

    <!-- Verification Link Method -->
    <div style="background-color: #eff6ff; border: 2px solid #3b82f6; padding: 25px; margin: 25px 0; border-radius: 12px; text-align: center;">
      <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">
        ${verificationCode ? 'Méthode 2' : 'Méthode'} : Lien de vérification
      </h3>
      <p style="color: #1e3a8a; margin: 0 0 20px 0; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">
        Cliquez sur le bouton ci-dessous pour vérifier votre email
      </p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 20px auto;">
        <tr>
          <td style="border-radius: 8px; background-color: ${process.env.PRIMARY_COLOR || '#3b82f6'}; text-align: center;">
            <a href="${verificationUrl}" style="display: inline-block; padding: 14px 32px; background-color: ${process.env.PRIMARY_COLOR || '#3b82f6'}; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; font-family: Arial, Helvetica, sans-serif; min-width: 200px; max-width: 100%; box-sizing: border-box;">
              Vérifier l'adresse email
            </a>
          </td>
        </tr>
      </table>

      <p style="color: #1e40af; font-size: 13px; margin: 15px 0 0 0; font-family: Arial, Helvetica, sans-serif;">
        Le lien expire dans <strong>24 heures</strong>
      </p>
    </div>

    <div class="info-box" style="background-color: #f3f4f6; border-left: 4px solid ${process.env.PRIMARY_COLOR || '#3b82f6'}; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #4b5563; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">
        <strong>Problème avec le bouton ?</strong> Copiez et collez ce lien :
      </p>
      <p style="margin: 10px 0 0 0; word-break: break-all;">
        <a href="${verificationUrl}" style="color: #3b82f6; font-size: 13px; font-family: Arial, Helvetica, sans-serif;">${verificationUrl}</a>
      </p>
    </div>

    <hr class="divider" style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <h3 style="color: #111827; margin: 20px 0 15px 0; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">Que se passe-t-il ensuite ?</h3>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="width: 40px; vertical-align: top; padding: 10px 0;">
          <div style="background-color: #dbeafe; color: #1e40af; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">1</div>
        </td>
        <td style="vertical-align: top; padding: 10px 0;">
          <strong style="color: #111827; font-family: Arial, Helvetica, sans-serif;">Vérifiez votre email</strong>
          <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">
            Utilisez le code ou cliquez sur le lien ci-dessus
          </p>
        </td>
      </tr>
      <tr>
        <td style="width: 40px; vertical-align: top; padding: 10px 0;">
          <div style="background-color: #dbeafe; color: #1e40af; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">2</div>
        </td>
        <td style="vertical-align: top; padding: 10px 0;">
          <strong style="color: #111827; font-family: Arial, Helvetica, sans-serif;">Accédez à toutes les fonctionnalités</strong>
          <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">
            Obtenez un accès complet à toutes les fonctionnalités de Dynamic Forms
          </p>
        </td>
      </tr>
      <tr>
        <td style="width: 40px; vertical-align: top; padding: 10px 0;">
          <div style="background-color: #dbeafe; color: #1e40af; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">3</div>
        </td>
        <td style="vertical-align: top; padding: 10px 0;">
          <strong style="color: #111827; font-family: Arial, Helvetica, sans-serif;">Commencez à créer</strong>
          <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">
            Créez votre premier formulaire et commencez à collecter des réponses
          </p>
        </td>
      </tr>
    </table>

    <div class="warning-box" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 25px 0; border-radius: 4px;">
      <p style="color: #92400e; margin: 0; font-size: 14px; font-family: Arial, Helvetica, sans-serif;"><strong style="color: #92400e;">Vous n'avez pas créé de compte ?</strong></p>
      <p style="color: #92400e; margin: 8px 0 0 0; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">
        Si vous ne vous êtes pas inscrit sur Dynamic Forms, vous pouvez ignorer cet email en toute sécurité.
        Aucun compte ne sera créé sans vérification de l'email.
      </p>
    </div>

    <p class="email-text" style="margin-top: 25px; font-size: 16px; color: #4b5563; margin-bottom: 20px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
      Nous sommes ravis de vous accueillir !
    </p>

    <p class="email-text" style="font-size: 16px; color: #4b5563; margin-bottom: 20px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
      Cordialement,<br>
      <strong style="color: #111827; font-family: Arial, Helvetica, sans-serif;">L'équipe Dynamic Forms</strong>
    </p>
  `

  return baseEmailTemplate({
    preheader: 'Veuillez vérifier votre adresse email pour finaliser l\'inscription',
    title: 'Vérifiez votre email',
    content,
  })
}
