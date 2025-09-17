-- Migration pour supprimer l'index problématique sur success_modal
-- Date: 2024-01-01
-- Description: Supprime l'index qui cause l'erreur de cast JSON

DROP INDEX IF EXISTS idx_forms_success_modal ON forms;
