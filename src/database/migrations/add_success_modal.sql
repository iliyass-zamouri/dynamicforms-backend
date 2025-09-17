-- Migration pour ajouter la colonne success_modal à la table forms
-- Date: 2024-01-01
-- Description: Ajoute la colonne success_modal de type JSON pour stocker les paramètres du modal de succès

ALTER TABLE forms ADD COLUMN success_modal JSON;

-- Note: Pas d'index sur les colonnes JSON pour éviter les problèmes de compatibilité MySQL

-- Commentaire sur la structure attendue du JSON
-- {
--   "title": "Félicitations !",
--   "description": "Votre formulaire a été soumis avec succès.",
--   "actions": [
--     {
--       "name": "Voir les résultats",
--       "url": "https://example.com/results"
--     }
--   ],
--   "closeEnabled": true,
--   "returnHomeEnabled": true,
--   "resubmitEnabled": false
-- }
