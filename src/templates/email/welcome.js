import { baseEmailTemplate } from './base.js'

/**
 * Welcome Email Template
 * Sent when a new user registers
 */
export const welcomeEmailTemplate = (user) => {
  const content = `
    <h1 class="email-title" style="font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 20px; line-height: 1.3; font-family: Arial, Helvetica, sans-serif;">Bienvenue sur Dynamic Forms, ${user.name} !</h1>

    <p class="email-text" style="font-size: 16px; color: #4b5563; margin-bottom: 20px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
      Merci d'avoir rejoint Dynamic Forms ! Nous sommes ravis de vous aider à créer de magnifiques 
      formulaires dynamiques qui rendent la collecte de données simple et efficace.
    </p>

    <div class="success-box" style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <p style="color: #065f46; margin: 0; font-size: 14px; font-family: Arial, Helvetica, sans-serif;"><strong style="color: #065f46;">Votre compte est prêt !</strong></p>
      <p style="color: #065f46; margin: 8px 0 0 0; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">Vous pouvez maintenant commencer à créer votre premier formulaire et collecter des réponses.</p>
    </div>

    <h3 style="color: #111827; margin: 30px 0 15px 0; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">Démarrez en 3 étapes simples</h3>

    <div class="info-box" style="background-color: #f3f4f6; border-left: 4px solid ${process.env.PRIMARY_COLOR || '#3b82f6'}; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <div style="margin-bottom: 15px;">
        <strong style="color: ${process.env.PRIMARY_COLOR || '#3b82f6'}; font-family: Arial, Helvetica, sans-serif;">1. Créez votre premier formulaire</strong>
        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">
          Utilisez notre constructeur intuitif pour créer des formulaires personnalisés avec des champs glisser-déposer.
        </p>
      </div>

      <div style="margin-bottom: 15px;">
        <strong style="color: ${process.env.PRIMARY_COLOR || '#3b82f6'}; font-family: Arial, Helvetica, sans-serif;">2. Personnalisez et marquez</strong>
        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">
          Ajoutez votre image de marque, choisissez les couleurs et configurez les notifications par email.
        </p>
      </div>

      <div>
        <strong style="color: ${process.env.PRIMARY_COLOR || '#3b82f6'}; font-family: Arial, Helvetica, sans-serif;">3. Partagez et collectez</strong>
        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">
          Partagez le lien de votre formulaire et commencez à collecter des réponses instantanément.
        </p>
      </div>
    </div>

    <!-- Button with table structure for better compatibility -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px auto;">
      <tr>
        <td style="border-radius: 8px; background-color: ${process.env.PRIMARY_COLOR || '#3b82f6'}; text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="display: inline-block; padding: 14px 32px; background-color: ${process.env.PRIMARY_COLOR || '#3b82f6'}; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; font-family: Arial, Helvetica, sans-serif; min-width: 200px; max-width: 100%; box-sizing: border-box;">
            Accéder au tableau de bord
          </a>
        </td>
      </tr>
    </table>

    <hr class="divider" style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <h3 style="color: #111827; margin: 20px 0 15px 0; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">Conseils pratiques</h3>

    <ul style="color: #4b5563; margin: 0 0 20px 20px; line-height: 1.8; font-family: Arial, Helvetica, sans-serif;">
      <li style="margin-bottom: 8px;">Activez les notifications par email pour recevoir des alertes instantanées lors de la soumission des formulaires</li>
      <li style="margin-bottom: 8px;">Utilisez la logique conditionnelle pour créer des formulaires intelligents et dynamiques</li>
      <li style="margin-bottom: 8px;">Consultez notre galerie de modèles pour vous inspirer</li>
      <li style="margin-bottom: 8px;">Surveillez vos analyses de formulaires pour comprendre votre audience</li>
    </ul>

    <div class="info-box" style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #075985; font-family: Arial, Helvetica, sans-serif;">
        <strong style="color: #075985;">Besoin d'aide ?</strong> Notre équipe d'assistance est là pour vous !
        Visitez notre <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/help" style="color: #0284c7; text-decoration: underline;">Centre d'aide</a>
        ou répondez à cet email.
      </p>
    </div>

    <p class="email-text" style="margin-top: 30px; font-size: 16px; color: #4b5563; margin-bottom: 20px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
      Merci encore d'avoir choisi Dynamic Forms. Nous avons hâte de voir ce que vous allez créer !
    </p>

    <p class="email-text" style="font-size: 16px; color: #4b5563; margin-bottom: 20px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
      Cordialement,<br>
      <strong style="color: #111827; font-family: Arial, Helvetica, sans-serif;">L'équipe Dynamic Forms</strong>
    </p>
  `

  return baseEmailTemplate({
    preheader: 'Bienvenue sur Dynamic Forms ! Commencez à créer de magnifiques formulaires dès aujourd\'hui.',
    title: 'Bienvenue sur Dynamic Forms',
    content,
  })
}
