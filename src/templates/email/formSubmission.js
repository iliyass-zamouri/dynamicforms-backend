import { baseEmailTemplate } from './base.js'

/**
 * Form Submission Notification Template
 * Sent to form owner when a new submission is received
 */
export const formSubmissionTemplate = (form, submission, submissionUrl = null) => {
  const formattedDate = new Date(submission.submittedAt).toLocaleString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  // Format submission data for display
  const formatSubmissionData = (data) => {
    let html = '<table style="width: 100%; border-collapse: collapse;">'

    for (const [key, value] of Object.entries(data)) {
      const displayValue = Array.isArray(value)
        ? value.join(', ')
        : typeof value === 'object' && value !== null
          ? JSON.stringify(value, null, 2)
          : String(value || '-')

      html += `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 8px; font-weight: 600; color: #374151; width: 35%; vertical-align: top;">
            ${key}
          </td>
          <td style="padding: 12px 8px; color: #6b7280; word-break: break-word;">
            ${displayValue}
          </td>
        </tr>
      `
    }

    html += '</table>'
    return html
  }

  const content = `
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-family: Arial, Helvetica, sans-serif;">Nouvelle soumission de formulaire !</h1>
    </div>

    <p class="email-text" style="font-size: 16px; color: #4b5563; margin-bottom: 20px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
      Bonne nouvelle ! Votre formulaire "<strong style="color: #111827;">${form.title}</strong>" a reçu une nouvelle soumission.
    </p>

    <div class="success-box" style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <p style="color: #065f46; margin: 0; font-size: 14px; font-family: Arial, Helvetica, sans-serif;"><strong style="color: #065f46;">Soumission reçue</strong></p>
      <p style="color: #065f46; margin: 8px 0 0 0; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">
        Les données ont été enregistrées en toute sécurité et sont prêtes pour votre examen.
      </p>
    </div>

    <!-- Submission Details -->
    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">
        <span style="background-color: #3b82f6; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-block; text-align: center; line-height: 24px; font-size: 14px; margin-right: 8px;">i</span>
        Détails de la soumission
      </h3>

      <div style="margin-bottom: 12px;">
        <span style="color: #6b7280; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">ID de soumission :</span>
        <br>
        <code style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 13px; color: #111827; margin-top: 4px; display: inline-block; font-family: 'Courier New', Courier, monospace;">${submission.id}</code>
      </div>

      <div style="margin-bottom: 12px;">
        <span style="color: #6b7280; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">Nom du formulaire :</span>
        <br>
        <strong style="color: #111827; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">${form.title}</strong>
      </div>

      <div style="margin-bottom: 12px;">
        <span style="color: #6b7280; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">Soumis le :</span>
        <br>
        <span style="color: #111827; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">${formattedDate}</span>
      </div>

      ${
        submission.userId
          ? `
      <div>
        <span style="color: #6b7280; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">Soumis par :</span>
        <br>
        <span style="color: #111827; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">Utilisateur enregistré</span>
      </div>
      `
          : `
      <div>
        <span style="color: #6b7280; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">Soumis par :</span>
        <br>
        <span style="color: #111827; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">Utilisateur anonyme</span>
      </div>
      `
      }
    </div>

    <!-- Submission Data -->
    <div style="margin: 25px 0;">
      <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">
        <span style="background-color: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-block; text-align: center; line-height: 24px; font-size: 14px; margin-right: 8px;">D</span>
        Données de réponse
      </h3>

      <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; overflow-x: auto;">
        ${formatSubmissionData(submission.data)}
      </div>
    </div>

     ${
       submissionUrl
         ? `
     <!-- Button with table structure for better compatibility -->
     <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px auto;">
       <tr>
         <td style="border-radius: 8px; background-color: ${process.env.PRIMARY_COLOR || '#3b82f6'}; text-align: center;">
           <a href="${submissionUrl}" style="display: inline-block; padding: 14px 32px; background-color: ${process.env.PRIMARY_COLOR || '#3b82f6'}; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; font-family: Arial, Helvetica, sans-serif; min-width: 200px; max-width: 100%; box-sizing: border-box;">
             Voir la soumission complète
           </a>
         </td>
       </tr>
     </table>
     `
         : ''
     }

    <hr class="divider" style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <!-- Quick Actions -->
    <h3 style="color: #111827; margin: 20px 0 15px 0; font-size: 18px; font-family: Arial, Helvetica, sans-serif;">Actions rapides</h3>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="width: 50%; padding: 0 6px 0 0; vertical-align: top;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/forms/${form.id}/submissions"
             style="background-color: #f3f4f6; color: #374151; padding: 12px 16px; text-decoration: none; border-radius: 6px; text-align: center; font-weight: 500; border: 1px solid #e5e7eb; display: block; font-family: Arial, Helvetica, sans-serif;">
            Voir toutes les soumissions
          </a>
        </td>
        <td style="width: 50%; padding: 0 0 0 6px; vertical-align: top;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/forms/${form.id}/analytics"
             style="background-color: #f3f4f6; color: #374151; padding: 12px 16px; text-decoration: none; border-radius: 6px; text-align: center; font-weight: 500; border: 1px solid #e5e7eb; display: block; font-family: Arial, Helvetica, sans-serif;">
            Voir les analyses
          </a>
        </td>
      </tr>
    </table>

    <div class="info-box" style="background-color: #f3f4f6; border-left: 4px solid ${process.env.PRIMARY_COLOR || '#3b82f6'}; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0; color: #4b5563; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">
        <strong style="color: #111827;">Conseil :</strong> Vous pouvez configurer les paramètres de notification pour ce formulaire dans votre tableau de bord.
        Choisissez quelles soumissions déclenchent des emails et personnalisez vos préférences de notification.
      </p>
    </div>

    <p class="email-text" style="margin-top: 25px; font-size: 16px; color: #4b5563; margin-bottom: 20px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
      Ceci est une notification automatique de votre compte Dynamic Forms.
    </p>
  `

  return baseEmailTemplate({
    preheader: `Nouvelle soumission reçue pour ${form.title}`,
    title: `Nouvelle soumission : ${form.title}`,
    content,
  })
}
