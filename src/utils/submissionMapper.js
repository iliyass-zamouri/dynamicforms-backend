/**
 * Mappe les IDs des champs vers leurs labels correspondants
 * @param {Object} submissionData - Les données de soumission avec les IDs comme clés
 * @param {Object} form - Le schéma du formulaire contenant les définitions des champs
 * @returns {Object} Un objet avec les labels comme clés au lieu des IDs
 */
export function mapSubmissionDataToLabels(submissionData, form) {
  if (!form || !form.steps) {
    return submissionData
  }

  const mappedData = {}

  // Créer un mapping des IDs vers les labels
  const fieldIdToLabelMap = new Map()

  form.steps.forEach((step) => {
    if (step.fields) {
      step.fields.forEach((field) => {
        fieldIdToLabelMap.set(field.id, field.label)
      })
    }
  })

  // Mapper les données de soumission
  Object.entries(submissionData).forEach(([fieldId, value]) => {
    const label = fieldIdToLabelMap.get(fieldId)
    if (label) {
      mappedData[label] = value
    } else {
      // Si le champ n'est pas trouvé, garder l'ID original avec un préfixe pour indiquer qu'il s'agit d'un champ supprimé
      // mappedData[`[Champ supprimé: ${fieldId}]`] = value
      mappedData[`[Champ supprimé]`] = value
    }
  })

  return mappedData
}

/**
 * Trouve un formulaire par son ID dans une liste de formulaires
 * @param {string} formId - L'ID du formulaire à rechercher
 * @param {Array} forms - La liste des formulaires
 * @returns {Object|null} Le formulaire trouvé ou null
 */
export function findFormById(formId, forms) {
  return forms.find((form) => form.id === formId) || null
}
