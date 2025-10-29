import { baseEmailTemplate } from './base.js'

export const adminNewUserTemplate = (user) => {
  const formattedDate = new Date(user.createdAt).toLocaleString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  const content = `
    <div style="padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-family: Arial, Helvetica, sans-serif;">Nouvel utilisateur inscrit</h1>
    </div>

    <p class="email-text" style="font-size: 16px; color: #4b5563; margin-bottom: 20px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
      Un nouvel utilisateur s'est inscrit sur la plateforme Dynamic Forms.
    </p>

    <div class="info-box" style="background-color: #f3f4f6; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <p style="color: #065f46; margin: 0; font-size: 14px; font-family: Arial, Helvetica, sans-serif;"><strong style="color: #111827;">Nouveau compte créé</strong></p>
      <p style="color: #4b5563; margin: 8px 0 0 0; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">
        Le compte utilisateur a été créé avec succès et un email de vérification a été envoyé.
      </p>
    </div>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">
        <span style="background-color: #3b82f6; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-block; text-align: center; line-height: 24px; font-size: 14px; margin-right: 8px;">i</span>
        Informations utilisateur
      </h3>

      <div style="margin-bottom: 12px;">
        <span style="color: #6b7280; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">ID utilisateur :</span>
        <br>
        <code style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 13px; color: #111827; margin-top: 4px; display: inline-block; font-family: 'Courier New', Courier, monospace;">${user.id}</code>
      </div>

      <div style="margin-bottom: 12px;">
        <span style="color: #6b7280; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">Nom :</span>
        <br>
        <strong style="color: #111827; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">${user.name}</strong>
      </div>

      <div style="margin-bottom: 12px;">
        <span style="color: #6b7280; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">Email :</span>
        <br>
        <a href="mailto:${user.email}" style="color: #3b82f6; font-size: 15px; text-decoration: none; font-family: Arial, Helvetica, sans-serif;">${user.email}</a>
      </div>

      <div style="margin-bottom: 12px;">
        <span style="color: #6b7280; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">Rôle :</span>
        <br>
        <span style="display: inline-block; padding: 4px 12px; background-color: ${user.role === 'admin' ? '#ef4444' : '#3b82f6'}; color: white; border-radius: 12px; font-size: 13px; font-weight: 600; margin-top: 4px; font-family: Arial, Helvetica, sans-serif;">${(user.role || 'user').toUpperCase()}</span>
      </div>

      <div>
        <span style="color: #6b7280; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">Date d'inscription :</span>
        <br>
        <span style="color: #111827; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">${formattedDate}</span>
      </div>
    </div>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px auto;">
      <tr>
        <td style="border-radius: 8px; background-color: ${process.env.PRIMARY_COLOR || '#3b82f6'}; text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/users" style="display: inline-block; padding: 14px 32px; background-color: ${process.env.PRIMARY_COLOR || '#3b82f6'}; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; font-family: Arial, Helvetica, sans-serif; min-width: 200px; max-width: 100%; box-sizing: border-box;">
            Voir tous les utilisateurs
          </a>
        </td>
      </tr>
    </table>

    <hr class="divider" style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p class="email-text" style="margin-top: 25px; font-size: 16px; color: #4b5563; margin-bottom: 20px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
      Ceci est une notification automatique d'administration de Dynamic Forms.
    </p>
  `

  return baseEmailTemplate({
    preheader: `Nouvel utilisateur inscrit : ${user.name}`,
    title: 'Nouvel utilisateur inscrit',
    content,
    primaryColor: '#3b82f6',
  })
}
