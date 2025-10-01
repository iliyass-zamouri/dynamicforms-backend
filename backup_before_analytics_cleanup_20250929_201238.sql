-- MySQL dump 10.13  Distrib 9.4.0, for macos15.4 (arm64)
--
-- Host: localhost    Database: dynamic_forms
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `account_types`
--

DROP TABLE IF EXISTS `account_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_types` (
  `id` varchar(36) NOT NULL,
  `name` varchar(50) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `description` text,
  `max_forms` int DEFAULT '5',
  `max_submissions_per_form` int DEFAULT '100',
  `can_export_forms` tinyint(1) DEFAULT '0',
  `can_export_submissions` tinyint(1) DEFAULT '0',
  `max_exports_per_form` int DEFAULT '0',
  `max_exports_per_submission` int DEFAULT '0',
  `features` json DEFAULT NULL,
  `price_monthly` decimal(10,2) DEFAULT '0.00',
  `price_yearly` decimal(10,2) DEFAULT '0.00',
  `currency` varchar(3) DEFAULT 'USD',
  `currency_symbol` varchar(10) DEFAULT '$',
  `is_active` tinyint(1) DEFAULT '1',
  `is_default` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_name` (`name`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_is_default` (`is_default`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_types`
--

LOCK TABLES `account_types` WRITE;
/*!40000 ALTER TABLE `account_types` DISABLE KEYS */;
INSERT INTO `account_types` VALUES ('d5258c00-9947-11f0-ac6d-b64d61fed635','free','Plan Gratuit','Plan de base avec des fonctionnalités limitées',1,20,0,0,0,0,'{\"support\": \"community\", \"analytics\": false, \"custom_domains\": 0}',0.00,0.00,'EUR','€',1,1,'2025-09-24 13:10:24','2025-09-25 17:00:43'),('d525afbe-9947-11f0-ac6d-b64d61fed635','basic','Plan de Base','Plan payant d\'entrée de gamme avec des fonctionnalités essentielles',5,100,1,1,10,10,'{\"support\": \"email\", \"analytics\": true, \"custom_domains\": 1}',9.99,99.99,'USD','$',0,0,'2025-09-24 13:10:24','2025-09-25 16:09:10'),('d525b23e-9947-11f0-ac6d-b64d61fed635','pro','Plan Pro','Plan avancé avec des fonctionnalités professionnelles',20,500,1,1,50,50,'{\"support\": \"priority\", \"analytics\": true, \"api_access\": true, \"custom_domains\": 1}',7.00,55.00,'EUR','€',1,0,'2025-09-24 13:10:24','2025-09-25 17:00:55'),('d525b37e-9947-11f0-ac6d-b64d61fed635','enterprise','Plan Entreprise','Plan complet pour les grandes organisations',999999,999999,1,1,999999,999999,'{\"sso\": true, \"support\": \"dedicated\", \"analytics\": true, \"api_access\": true, \"white_label\": true, \"custom_domains\": 999999}',35.00,300.00,'EUR','€',1,0,'2025-09-24 13:10:24','2025-09-25 17:01:10');
/*!40000 ALTER TABLE `account_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `export_tracking`
--

DROP TABLE IF EXISTS `export_tracking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `export_tracking` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `form_id` varchar(36) DEFAULT NULL,
  `submission_id` varchar(36) DEFAULT NULL,
  `export_type` enum('form','submission') NOT NULL,
  `export_format` enum('json','csv','xlsx','pdf') NOT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `file_size` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_form_id` (`form_id`),
  KEY `idx_submission_id` (`submission_id`),
  KEY `idx_export_type` (`export_type`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `export_tracking_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `export_tracking_ibfk_2` FOREIGN KEY (`form_id`) REFERENCES `forms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `export_tracking_ibfk_3` FOREIGN KEY (`submission_id`) REFERENCES `form_submissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `export_tracking`
--

LOCK TABLES `export_tracking` WRITE;
/*!40000 ALTER TABLE `export_tracking` DISABLE KEYS */;
/*!40000 ALTER TABLE `export_tracking` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `field_options`
--

DROP TABLE IF EXISTS `field_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `field_options` (
  `id` varchar(36) NOT NULL,
  `field_id` varchar(36) NOT NULL,
  `label` varchar(255) NOT NULL,
  `value` varchar(255) NOT NULL,
  `option_order` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_field_id` (`field_id`),
  KEY `idx_option_order` (`option_order`),
  CONSTRAINT `field_options_ibfk_1` FOREIGN KEY (`field_id`) REFERENCES `form_fields` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `field_options`
--

LOCK TABLES `field_options` WRITE;
/*!40000 ALTER TABLE `field_options` DISABLE KEYS */;
INSERT INTO `field_options` VALUES ('cf156080-9c9c-11f0-ac6d-b64d61fed635','feeb24c3-9262-4fbd-8b64-1386373de1ec','Site Web/Application','website',0,'2025-09-28 18:56:15'),('cf159456-9c9c-11f0-ac6d-b64d61fed635','feeb24c3-9262-4fbd-8b64-1386373de1ec','Service Client','customer-service',1,'2025-09-28 18:56:15'),('cf15ca02-9c9c-11f0-ac6d-b64d61fed635','feeb24c3-9262-4fbd-8b64-1386373de1ec','Produit Physique','physical-product',2,'2025-09-28 18:56:15'),('cf15f216-9c9c-11f0-ac6d-b64d61fed635','feeb24c3-9262-4fbd-8b64-1386373de1ec','Service de Consultation','consulting',3,'2025-09-28 18:56:15'),('cf1623ee-9c9c-11f0-ac6d-b64d61fed635','feeb24c3-9262-4fbd-8b64-1386373de1ec','Formation/Atelier','training',4,'2025-09-28 18:56:15'),('cf164aea-9c9c-11f0-ac6d-b64d61fed635','feeb24c3-9262-4fbd-8b64-1386373de1ec','Support Technique','technical-support',5,'2025-09-28 18:56:15'),('cf1664b2-9c9c-11f0-ac6d-b64d61fed635','feeb24c3-9262-4fbd-8b64-1386373de1ec','Autre','other',6,'2025-09-28 18:56:15'),('cf171254-9c9c-11f0-ac6d-b64d61fed635','b8b52a52-6085-42b8-951b-78dc5da59263','Très Satisfait ⭐⭐⭐⭐⭐','very-satisfied',0,'2025-09-28 18:56:15'),('cf173aae-9c9c-11f0-ac6d-b64d61fed635','b8b52a52-6085-42b8-951b-78dc5da59263','Satisfait ⭐⭐⭐⭐','satisfied',1,'2025-09-28 18:56:15'),('cf174f3a-9c9c-11f0-ac6d-b64d61fed635','b8b52a52-6085-42b8-951b-78dc5da59263','Neutre ⭐⭐⭐','neutral',2,'2025-09-28 18:56:15'),('cf177384-9c9c-11f0-ac6d-b64d61fed635','b8b52a52-6085-42b8-951b-78dc5da59263','Insatisfait ⭐⭐','dissatisfied',3,'2025-09-28 18:56:15'),('cf17b56a-9c9c-11f0-ac6d-b64d61fed635','b8b52a52-6085-42b8-951b-78dc5da59263','Très Insatisfait ⭐','very-dissatisfied',4,'2025-09-28 18:56:15'),('cf18089e-9c9c-11f0-ac6d-b64d61fed635','f985496e-8df1-4e65-abd5-4a80dd4f1d6c','Très Facile','very-easy',0,'2025-09-28 18:56:15'),('cf1823ec-9c9c-11f0-ac6d-b64d61fed635','f985496e-8df1-4e65-abd5-4a80dd4f1d6c','Facile','easy',1,'2025-09-28 18:56:15'),('cf1845d4-9c9c-11f0-ac6d-b64d61fed635','f985496e-8df1-4e65-abd5-4a80dd4f1d6c','Moyen','average',2,'2025-09-28 18:56:15'),('cf187770-9c9c-11f0-ac6d-b64d61fed635','f985496e-8df1-4e65-abd5-4a80dd4f1d6c','Difficile','difficult',3,'2025-09-28 18:56:15'),('cf18c162-9c9c-11f0-ac6d-b64d61fed635','f985496e-8df1-4e65-abd5-4a80dd4f1d6c','Très Difficile','very-difficult',4,'2025-09-28 18:56:15'),('cf198426-9c9c-11f0-ac6d-b64d61fed635','50b9b2c8-645a-4269-bc65-f551e7b8be4c','Excellente','excellent',0,'2025-09-28 18:56:15'),('cf19b3ce-9c9c-11f0-ac6d-b64d61fed635','50b9b2c8-645a-4269-bc65-f551e7b8be4c','Bonne','good',1,'2025-09-28 18:56:15'),('cf19ce18-9c9c-11f0-ac6d-b64d61fed635','50b9b2c8-645a-4269-bc65-f551e7b8be4c','Correcte','fair',2,'2025-09-28 18:56:15'),('cf19e70e-9c9c-11f0-ac6d-b64d61fed635','50b9b2c8-645a-4269-bc65-f551e7b8be4c','Lente','slow',3,'2025-09-28 18:56:15'),('cf1a03d8-9c9c-11f0-ac6d-b64d61fed635','50b9b2c8-645a-4269-bc65-f551e7b8be4c','Très Lente','very-slow',4,'2025-09-28 18:56:15'),('cf1a4596-9c9c-11f0-ac6d-b64d61fed635','820e32e4-f725-4af8-890e-1a41439f00b9','Très Probable (9-10/10)','very-likely',0,'2025-09-28 18:56:15'),('cf1a6490-9c9c-11f0-ac6d-b64d61fed635','820e32e4-f725-4af8-890e-1a41439f00b9','Probable (7-8/10)','likely',1,'2025-09-28 18:56:15'),('cf1a7d04-9c9c-11f0-ac6d-b64d61fed635','820e32e4-f725-4af8-890e-1a41439f00b9','Neutre (5-6/10)','neutral',2,'2025-09-28 18:56:15'),('cf1aa0c2-9c9c-11f0-ac6d-b64d61fed635','820e32e4-f725-4af8-890e-1a41439f00b9','Peu Probable (3-4/10)','unlikely',3,'2025-09-28 18:56:15'),('cf1aca66-9c9c-11f0-ac6d-b64d61fed635','820e32e4-f725-4af8-890e-1a41439f00b9','Très Peu Probable (0-2/10)','very-unlikely',4,'2025-09-28 18:56:15'),('cf1b0b48-9c9c-11f0-ac6d-b64d61fed635','b241700c-e3ac-4cd5-9c55-6abb4a5628d1','Interface claire et intuitive','clear-interface',0,'2025-09-28 18:56:15'),('cf1b1b88-9c9c-11f0-ac6d-b64d61fed635','b241700c-e3ac-4cd5-9c55-6abb4a5628d1','Réponse rapide','fast-response',1,'2025-09-28 18:56:15'),('cf1b2a38-9c9c-11f0-ac6d-b64d61fed635','b241700c-e3ac-4cd5-9c55-6abb4a5628d1','Personnel compétent','competent-staff',2,'2025-09-28 18:56:15'),('cf1b3a5a-9c9c-11f0-ac6d-b64d61fed635','b241700c-e3ac-4cd5-9c55-6abb4a5628d1','Bon rapport qualité-prix','good-value',3,'2025-09-28 18:56:15'),('cf1b4a4a-9c9c-11f0-ac6d-b64d61fed635','b241700c-e3ac-4cd5-9c55-6abb4a5628d1','Fonctionnalités utiles','useful-features',4,'2025-09-28 18:56:15'),('cf1b5828-9c9c-11f0-ac6d-b64d61fed635','b241700c-e3ac-4cd5-9c55-6abb4a5628d1','Service personnalisé','personalized-service',5,'2025-09-28 18:56:15'),('cf1b6cc8-9c9c-11f0-ac6d-b64d61fed635','b241700c-e3ac-4cd5-9c55-6abb4a5628d1','Résolution efficace des problèmes','problem-solving',6,'2025-09-28 18:56:15'),('cf1b7e02-9c9c-11f0-ac6d-b64d61fed635','b241700c-e3ac-4cd5-9c55-6abb4a5628d1','Communication professionnelle','professional-communication',7,'2025-09-28 18:56:15'),('cf1bac60-9c9c-11f0-ac6d-b64d61fed635','3f588ca4-8105-41c5-9aa7-08d88895a56c','Temps de réponse','response-time',0,'2025-09-28 18:56:15'),('cf1bbb4c-9c9c-11f0-ac6d-b64d61fed635','3f588ca4-8105-41c5-9aa7-08d88895a56c','Clarté des informations','information-clarity',1,'2025-09-28 18:56:15'),('cf1bc83a-9c9c-11f0-ac6d-b64d61fed635','3f588ca4-8105-41c5-9aa7-08d88895a56c','Facilité de navigation','navigation',2,'2025-09-28 18:56:15'),('cf1bd5fa-9c9c-11f0-ac6d-b64d61fed635','3f588ca4-8105-41c5-9aa7-08d88895a56c','Options de contact','contact-options',3,'2025-09-28 18:56:15'),('cf1be2ac-9c9c-11f0-ac6d-b64d61fed635','3f588ca4-8105-41c5-9aa7-08d88895a56c','Disponibilité du support','support-availability',4,'2025-09-28 18:56:15'),('cf1bf102-9c9c-11f0-ac6d-b64d61fed635','3f588ca4-8105-41c5-9aa7-08d88895a56c','Prix/Tarification','pricing',5,'2025-09-28 18:56:15'),('cf1c002a-9c9c-11f0-ac6d-b64d61fed635','3f588ca4-8105-41c5-9aa7-08d88895a56c','Fonctionnalités manquantes','missing-features',6,'2025-09-28 18:56:15'),('cf1c0de0-9c9c-11f0-ac6d-b64d61fed635','3f588ca4-8105-41c5-9aa7-08d88895a56c','Formation/Documentation','documentation',7,'2025-09-28 18:56:15'),('cf1c580e-9c9c-11f0-ac6d-b64d61fed635','8007110b-b7af-4bf3-85c0-3aead8f3c956','Aucun problème','no-issues',0,'2025-09-28 18:56:15'),('cf1c6402-9c9c-11f0-ac6d-b64d61fed635','8007110b-b7af-4bf3-85c0-3aead8f3c956','Problèmes mineurs','minor-issues',1,'2025-09-28 18:56:15'),('cf1c726c-9c9c-11f0-ac6d-b64d61fed635','8007110b-b7af-4bf3-85c0-3aead8f3c956','Problèmes modérés','moderate-issues',2,'2025-09-28 18:56:15'),('cf1c89a0-9c9c-11f0-ac6d-b64d61fed635','8007110b-b7af-4bf3-85c0-3aead8f3c956','Problèmes majeurs','major-issues',3,'2025-09-28 18:56:15'),('cf1cb18c-9c9c-11f0-ac6d-b64d61fed635','98e8b2de-ffee-4bcb-8ecc-fdb0a370bc20','Certainement','definitely',0,'2025-09-28 18:56:15'),('cf1cbdc6-9c9c-11f0-ac6d-b64d61fed635','98e8b2de-ffee-4bcb-8ecc-fdb0a370bc20','Probablement','probably',1,'2025-09-28 18:56:15'),('cf1cca00-9c9c-11f0-ac6d-b64d61fed635','98e8b2de-ffee-4bcb-8ecc-fdb0a370bc20','Peut-être','maybe',2,'2025-09-28 18:56:15'),('cf1cd612-9c9c-11f0-ac6d-b64d61fed635','98e8b2de-ffee-4bcb-8ecc-fdb0a370bc20','Probablement pas','probably-not',3,'2025-09-28 18:56:15'),('cf1ce210-9c9c-11f0-ac6d-b64d61fed635','98e8b2de-ffee-4bcb-8ecc-fdb0a370bc20','Certainement pas','definitely-not',4,'2025-09-28 18:56:15'),('cf1d0a10-9c9c-11f0-ac6d-b64d61fed635','ad49fdc1-cab9-4318-bb5d-027486cb01cd','J\'autorise l\'utilisation de mes commentaires à des fins d\'amélioration','allow-improvement-use',0,'2025-09-28 18:56:15'),('cf1d158c-9c9c-11f0-ac6d-b64d61fed635','ad49fdc1-cab9-4318-bb5d-027486cb01cd','Vous pouvez me contacter pour plus de détails sur mon retour','allow-contact',1,'2025-09-28 18:56:15'),('cf1d2298-9c9c-11f0-ac6d-b64d61fed635','ad49fdc1-cab9-4318-bb5d-027486cb01cd','J\'accepte de participer à de futures enquêtes','future-surveys',2,'2025-09-28 18:56:15');
/*!40000 ALTER TABLE `field_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `file_uploads`
--

DROP TABLE IF EXISTS `file_uploads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `file_uploads` (
  `id` varchar(36) NOT NULL,
  `submission_id` varchar(36) NOT NULL,
  `field_id` varchar(36) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` int NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_submission_id` (`submission_id`),
  KEY `idx_field_id` (`field_id`),
  CONSTRAINT `file_uploads_ibfk_1` FOREIGN KEY (`submission_id`) REFERENCES `form_submissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `file_uploads_ibfk_2` FOREIGN KEY (`field_id`) REFERENCES `form_fields` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `file_uploads`
--

LOCK TABLES `file_uploads` WRITE;
/*!40000 ALTER TABLE `file_uploads` DISABLE KEYS */;
/*!40000 ALTER TABLE `file_uploads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `form_analytics_overview`
--

DROP TABLE IF EXISTS `form_analytics_overview`;
/*!50001 DROP VIEW IF EXISTS `form_analytics_overview`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `form_analytics_overview` AS SELECT 
 1 AS `form_id`,
 1 AS `form_title`,
 1 AS `form_slug`,
 1 AS `total_visits`,
 1 AS `unique_logged_users`,
 1 AS `unique_sessions`,
 1 AS `completed_submissions`,
 1 AS `abandoned_sessions`,
 1 AS `avg_session_duration_ms`,
 1 AS `avg_steps_completed`,
 1 AS `avg_field_interactions`,
 1 AS `avg_validation_errors`,
 1 AS `conversion_rate`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `form_analytics_summary`
--

DROP TABLE IF EXISTS `form_analytics_summary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `form_analytics_summary` (
  `id` varchar(36) NOT NULL,
  `form_id` varchar(36) NOT NULL,
  `date` date NOT NULL,
  `total_visits` int DEFAULT '0',
  `unique_visitors` int DEFAULT '0',
  `total_sessions` int DEFAULT '0',
  `completed_sessions` int DEFAULT '0',
  `abandoned_sessions` int DEFAULT '0',
  `average_session_duration_ms` int DEFAULT '0',
  `average_steps_completed` decimal(5,2) DEFAULT '0.00',
  `average_field_interactions` int DEFAULT '0',
  `average_validation_errors` int DEFAULT '0',
  `conversion_rate` decimal(5,2) DEFAULT '0.00',
  `desktop_visits` int DEFAULT '0',
  `mobile_visits` int DEFAULT '0',
  `tablet_visits` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_form_date` (`form_id`,`date`),
  KEY `idx_form_id` (`form_id`),
  KEY `idx_date` (`date`),
  KEY `idx_form_date` (`form_id`,`date`),
  CONSTRAINT `form_analytics_summary_ibfk_1` FOREIGN KEY (`form_id`) REFERENCES `forms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_analytics_summary`
--

LOCK TABLES `form_analytics_summary` WRITE;
/*!40000 ALTER TABLE `form_analytics_summary` DISABLE KEYS */;
/*!40000 ALTER TABLE `form_analytics_summary` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `form_field_analytics_summary`
--

DROP TABLE IF EXISTS `form_field_analytics_summary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `form_field_analytics_summary` (
  `id` varchar(36) NOT NULL,
  `form_id` varchar(36) NOT NULL,
  `step_id` varchar(36) NOT NULL,
  `field_id` varchar(36) NOT NULL,
  `date` date NOT NULL,
  `field_type` varchar(50) NOT NULL,
  `total_interactions` int DEFAULT '0',
  `unique_interactors` int DEFAULT '0',
  `average_time_spent_ms` int DEFAULT '0',
  `average_value_length` int DEFAULT '0',
  `validation_error_rate` decimal(5,2) DEFAULT '0.00',
  `completion_rate` decimal(5,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_form_field_date` (`form_id`,`field_id`,`date`),
  KEY `idx_form_id` (`form_id`),
  KEY `idx_step_id` (`step_id`),
  KEY `idx_field_id` (`field_id`),
  KEY `idx_date` (`date`),
  KEY `idx_field_type` (`field_type`),
  KEY `idx_form_field_date` (`form_id`,`field_id`,`date`),
  CONSTRAINT `form_field_analytics_summary_ibfk_1` FOREIGN KEY (`form_id`) REFERENCES `forms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `form_field_analytics_summary_ibfk_2` FOREIGN KEY (`step_id`) REFERENCES `form_steps` (`id`) ON DELETE CASCADE,
  CONSTRAINT `form_field_analytics_summary_ibfk_3` FOREIGN KEY (`field_id`) REFERENCES `form_fields` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_field_analytics_summary`
--

LOCK TABLES `form_field_analytics_summary` WRITE;
/*!40000 ALTER TABLE `form_field_analytics_summary` DISABLE KEYS */;
/*!40000 ALTER TABLE `form_field_analytics_summary` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `form_field_interactions`
--

DROP TABLE IF EXISTS `form_field_interactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `form_field_interactions` (
  `id` varchar(36) NOT NULL,
  `form_id` varchar(36) NOT NULL,
  `step_id` varchar(36) NOT NULL,
  `field_id` varchar(36) NOT NULL,
  `session_id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `interaction_type` enum('focus','blur','input','validation_error','validation_success') NOT NULL,
  `field_value_length` int DEFAULT '0',
  `time_spent_ms` int DEFAULT '0',
  `interaction_data` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_form_id` (`form_id`),
  KEY `idx_step_id` (`step_id`),
  KEY `idx_field_id` (`field_id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_interaction_type` (`interaction_type`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_form_field_interactions_form_session` (`form_id`,`session_id`),
  CONSTRAINT `form_field_interactions_ibfk_1` FOREIGN KEY (`form_id`) REFERENCES `forms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `form_field_interactions_ibfk_2` FOREIGN KEY (`step_id`) REFERENCES `form_steps` (`id`) ON DELETE CASCADE,
  CONSTRAINT `form_field_interactions_ibfk_3` FOREIGN KEY (`field_id`) REFERENCES `form_fields` (`id`) ON DELETE CASCADE,
  CONSTRAINT `form_field_interactions_ibfk_4` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_field_interactions`
--

LOCK TABLES `form_field_interactions` WRITE;
/*!40000 ALTER TABLE `form_field_interactions` DISABLE KEYS */;
INSERT INTO `form_field_interactions` VALUES ('00548bf8-287c-4d4c-a943-e34a8d045a26','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','feeb24c3-9262-4fbd-8b64-1386373de1ec','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'validation_success',0,0,NULL,'2025-09-29 19:00:19'),('0b25ef18-c691-4a4c-aa0e-6248a50b823c','0c98e9a2-3ec3-45a6-ad6a-47750d385263','a9f00669-0496-4b4e-8c44-c755b275131f','60d16713-76ae-4205-a6ea-aefb0c04093e','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'validation_success',0,0,NULL,'2025-09-29 19:05:18'),('12e8e0b2-7954-4610-9f17-7b65c4531bf8','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','53e27271-5d07-4334-81b2-451e63dcc8df','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd','input',0,0,NULL,'2025-09-29 18:56:51'),('1394a71c-1f8f-4842-96d9-eb000edaf7a0','0c98e9a2-3ec3-45a6-ad6a-47750d385263','a9f00669-0496-4b4e-8c44-c755b275131f','3a51d86e-bc55-4244-a2bd-e322fbf8fc83','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'input',0,0,NULL,'2025-09-29 19:05:20'),('18720d6b-7847-4949-84d5-0d41688b5533','0c98e9a2-3ec3-45a6-ad6a-47750d385263','027816da-b1f7-466e-b165-23bbe64f801c','ad49fdc1-cab9-4318-bb5d-027486cb01cd','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'validation_success',0,0,NULL,'2025-09-29 19:05:32'),('19475fe1-e70b-4999-bf76-76b30d75410a','0c98e9a2-3ec3-45a6-ad6a-47750d385263','027816da-b1f7-466e-b165-23bbe64f801c','98e8b2de-ffee-4bcb-8ecc-fdb0a370bc20','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'validation_success',0,0,NULL,'2025-09-29 19:05:31'),('1a0f88fb-2869-4ae0-b777-3c0e78a13cdf','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','feeb24c3-9262-4fbd-8b64-1386373de1ec','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd','validation_success',0,0,NULL,'2025-09-29 18:56:46'),('1bc3f938-3fbf-424e-aefc-e357445f599e','0c98e9a2-3ec3-45a6-ad6a-47750d385263','027816da-b1f7-466e-b165-23bbe64f801c','e7d9d0b2-2df7-47dc-b504-1a7811c32df3','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'validation_success',0,0,NULL,'2025-09-29 19:05:30'),('203d8792-703b-4501-9b5b-9d8e9100f6ea','0c98e9a2-3ec3-45a6-ad6a-47750d385263','027816da-b1f7-466e-b165-23bbe64f801c','8007110b-b7af-4bf3-85c0-3aead8f3c956','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'input',0,0,NULL,'2025-09-29 19:05:24'),('20ff7599-9682-4001-9c59-a1a974744d25','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','2dd0de5e-9d28-4942-8ca9-6a820a912314','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd','validation_success',0,0,NULL,'2025-09-29 18:56:48'),('293677d8-be13-4fd9-8b81-b8d2cc6d10d9','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','feeb24c3-9262-4fbd-8b64-1386373de1ec','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd','input',0,0,NULL,'2025-09-29 18:43:17'),('30732821-a7c1-4140-9d45-26b82d46ace9','0c98e9a2-3ec3-45a6-ad6a-47750d385263','027816da-b1f7-466e-b165-23bbe64f801c','8007110b-b7af-4bf3-85c0-3aead8f3c956','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'input',0,0,NULL,'2025-09-29 19:05:27'),('31ab31b8-7ce3-4867-aa42-e6b0c06327b1','0c98e9a2-3ec3-45a6-ad6a-47750d385263','c1dc3965-08a8-47b3-b84e-cd38f9170414','b8b52a52-6085-42b8-951b-78dc5da59263','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'input',0,0,NULL,'2025-09-29 19:05:00'),('36bc1a71-7c0f-41f3-983c-6603a55df9d7','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','feeb24c3-9262-4fbd-8b64-1386373de1ec','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd','input',0,0,NULL,'2025-09-29 18:41:20'),('3d89a323-d0dc-4a64-9d1c-5dd1d7724e9f','0c98e9a2-3ec3-45a6-ad6a-47750d385263','c1dc3965-08a8-47b3-b84e-cd38f9170414','820e32e4-f725-4af8-890e-1a41439f00b9','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'validation_success',0,0,NULL,'2025-09-29 19:05:07'),('40c57bd9-795b-4e0b-ab38-06fa153bfe8a','0c98e9a2-3ec3-45a6-ad6a-47750d385263','a9f00669-0496-4b4e-8c44-c755b275131f','3a51d86e-bc55-4244-a2bd-e322fbf8fc83','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'validation_success',0,0,NULL,'2025-09-29 19:05:21'),('43eca882-08aa-481d-9806-6b8eb35aaf5f','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','53e27271-5d07-4334-81b2-451e63dcc8df','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd','validation_success',0,0,NULL,'2025-09-29 18:43:02'),('4d57f425-4428-48cb-9acc-aa700d1a8889','0c98e9a2-3ec3-45a6-ad6a-47750d385263','a9f00669-0496-4b4e-8c44-c755b275131f','b241700c-e3ac-4cd5-9c55-6abb4a5628d1','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'input',0,0,NULL,'2025-09-29 19:05:12'),('4da93f6a-99f1-43f5-8b50-2ff6a2685dd2','0c98e9a2-3ec3-45a6-ad6a-47750d385263','a9f00669-0496-4b4e-8c44-c755b275131f','60d16713-76ae-4205-a6ea-aefb0c04093e','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'input',0,0,NULL,'2025-09-29 19:05:18'),('502f5436-ed37-42a9-9fcb-f937c979da58','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','53e27271-5d07-4334-81b2-451e63dcc8df','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd','validation_success',0,0,NULL,'2025-09-29 18:56:54'),('603e3461-888b-4087-b41e-d66369a55c6a','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','ef9e5a99-5a67-4484-976f-e87f3ba06d90','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd','validation_success',0,0,NULL,'2025-09-29 16:23:13'),('627a987d-c5ac-45d0-bb89-b81ed7aee043','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','53e27271-5d07-4334-81b2-451e63dcc8df','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'validation_success',0,0,NULL,'2025-09-29 19:04:51'),('62e87d58-5b4c-4ab2-a41c-5196c1fbee90','0c98e9a2-3ec3-45a6-ad6a-47750d385263','a9f00669-0496-4b4e-8c44-c755b275131f','3f588ca4-8105-41c5-9aa7-08d88895a56c','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'input',0,0,NULL,'2025-09-29 19:05:11'),('75e955a4-e27d-4366-a3cc-69009c606448','0c98e9a2-3ec3-45a6-ad6a-47750d385263','027816da-b1f7-466e-b165-23bbe64f801c','8007110b-b7af-4bf3-85c0-3aead8f3c956','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'validation_success',0,0,NULL,'2025-09-29 19:05:27'),('7d9d5c95-8bad-46b2-a683-a2173db6f719','0c98e9a2-3ec3-45a6-ad6a-47750d385263','a9f00669-0496-4b4e-8c44-c755b275131f','3f588ca4-8105-41c5-9aa7-08d88895a56c','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'validation_success',0,0,NULL,'2025-09-29 19:05:16'),('80eddc49-0513-4425-bed0-9902aeb839c0','0c98e9a2-3ec3-45a6-ad6a-47750d385263','a9f00669-0496-4b4e-8c44-c755b275131f','b241700c-e3ac-4cd5-9c55-6abb4a5628d1','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'validation_success',0,0,NULL,'2025-09-29 19:05:14'),('8684c37e-7eaa-43ba-bbb5-53c3dc9caef6','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','feeb24c3-9262-4fbd-8b64-1386373de1ec','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd','validation_success',0,0,NULL,'2025-09-29 18:43:19'),('8bae2347-7de0-4228-b21c-79bcbf9605f8','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','53e27271-5d07-4334-81b2-451e63dcc8df','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd','validation_success',0,0,NULL,'2025-09-29 18:42:47'),('93ed9483-fad0-4ecd-aec6-7095bf0458b4','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','feeb24c3-9262-4fbd-8b64-1386373de1ec','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'validation_success',0,0,NULL,'2025-09-29 19:04:53'),('989f914e-bacd-4999-a35d-38a7587c44f3','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','53e27271-5d07-4334-81b2-451e63dcc8df','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd','validation_success',0,0,NULL,'2025-09-29 18:43:15'),('9b57e337-3bf9-433b-87ca-916bdd9ec0e6','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','feeb24c3-9262-4fbd-8b64-1386373de1ec','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'input',0,0,NULL,'2025-09-29 19:00:19'),('a9bf4be9-5dc8-4947-9bd5-91df562d38f1','0c98e9a2-3ec3-45a6-ad6a-47750d385263','c1dc3965-08a8-47b3-b84e-cd38f9170414','b8b52a52-6085-42b8-951b-78dc5da59263','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'validation_success',0,0,NULL,'2025-09-29 19:05:01'),('aaef2d38-62c0-4d9e-b0cd-b49f23791a91','0c98e9a2-3ec3-45a6-ad6a-47750d385263','027816da-b1f7-466e-b165-23bbe64f801c','8007110b-b7af-4bf3-85c0-3aead8f3c956','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'validation_success',0,0,NULL,'2025-09-29 19:05:27'),('abba50eb-adb2-4828-aaba-dca61ceaed7e','0c98e9a2-3ec3-45a6-ad6a-47750d385263','c1dc3965-08a8-47b3-b84e-cd38f9170414','820e32e4-f725-4af8-890e-1a41439f00b9','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'input',0,0,NULL,'2025-09-29 19:05:04'),('b40263cb-6cd0-4706-a8f2-d7d72004393b','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','ef9e5a99-5a67-4484-976f-e87f3ba06d90','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd','validation_success',0,0,NULL,'2025-09-29 18:42:43'),('b80ea4bf-fcf1-45b5-a292-d850e05d8a58','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','53e27271-5d07-4334-81b2-451e63dcc8df','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd','input',0,0,NULL,'2025-09-29 18:56:52'),('cac5c083-29bd-457f-af84-2316320d71f3','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','53e27271-5d07-4334-81b2-451e63dcc8df','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd','input',0,0,NULL,'2025-09-29 18:42:59'),('d0e71113-3a90-4295-92bc-15a0f2bb5049','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','53e27271-5d07-4334-81b2-451e63dcc8df','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd','input',0,0,NULL,'2025-09-29 18:43:00'),('d192ff24-b952-4cc0-b113-4959452e78b8','0c98e9a2-3ec3-45a6-ad6a-47750d385263','a9f00669-0496-4b4e-8c44-c755b275131f','3f588ca4-8105-41c5-9aa7-08d88895a56c','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'input',0,0,NULL,'2025-09-29 19:05:15'),('d2100321-26c7-41ff-a014-36af8108f409','0c98e9a2-3ec3-45a6-ad6a-47750d385263','c1dc3965-08a8-47b3-b84e-cd38f9170414','f985496e-8df1-4e65-abd5-4a80dd4f1d6c','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'input',0,0,NULL,'2025-09-29 19:05:08'),('d317329c-bc52-4fc8-94b2-cf06cc4292a1','0c98e9a2-3ec3-45a6-ad6a-47750d385263','c1dc3965-08a8-47b3-b84e-cd38f9170414','50b9b2c8-645a-4269-bc65-f551e7b8be4c','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'input',0,0,NULL,'2025-09-29 19:05:02'),('d87845a9-cf39-475e-b9e9-53455a447b17','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','ef9e5a99-5a67-4484-976f-e87f3ba06d90','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd','validation_success',0,0,NULL,'2025-09-29 18:56:43'),('dac7faaf-51d4-4baf-8711-2356984eded2','0c98e9a2-3ec3-45a6-ad6a-47750d385263','a9f00669-0496-4b4e-8c44-c755b275131f','3f588ca4-8105-41c5-9aa7-08d88895a56c','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'validation_success',0,0,NULL,'2025-09-29 19:05:12'),('dffe4fbe-7bc2-4c83-b64a-6e7ad839c833','0c98e9a2-3ec3-45a6-ad6a-47750d385263','c1dc3965-08a8-47b3-b84e-cd38f9170414','f985496e-8df1-4e65-abd5-4a80dd4f1d6c','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'validation_success',0,0,NULL,'2025-09-29 19:05:09'),('e6cb315e-80ee-4077-80b5-a4b7dd19d878','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','feeb24c3-9262-4fbd-8b64-1386373de1ec','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd','validation_success',0,0,NULL,'2025-09-29 18:43:25'),('e770097d-03d8-450e-a699-5c92b2bd0b34','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','feeb24c3-9262-4fbd-8b64-1386373de1ec','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'input',0,0,NULL,'2025-09-29 19:04:53'),('e855482d-00a2-4aba-98b2-83425ca9108b','0c98e9a2-3ec3-45a6-ad6a-47750d385263','a9f00669-0496-4b4e-8c44-c755b275131f','3a51d86e-bc55-4244-a2bd-e322fbf8fc83','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'input',0,0,NULL,'2025-09-29 19:05:21'),('f10c0603-12cc-44f3-acef-6449c819ef10','0c98e9a2-3ec3-45a6-ad6a-47750d385263','027816da-b1f7-466e-b165-23bbe64f801c','98e8b2de-ffee-4bcb-8ecc-fdb0a370bc20','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'input',0,0,NULL,'2025-09-29 19:05:31'),('f86f5880-5b0c-4882-ba76-66325a569cde','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','feeb24c3-9262-4fbd-8b64-1386373de1ec','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd','input',0,0,NULL,'2025-09-29 18:56:45'),('f8a9f611-335c-4d6e-b2bf-30055658f103','0c98e9a2-3ec3-45a6-ad6a-47750d385263','c1dc3965-08a8-47b3-b84e-cd38f9170414','50b9b2c8-645a-4269-bc65-f551e7b8be4c','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'validation_success',0,0,NULL,'2025-09-29 19:05:02'),('f8d42fe6-c30c-4488-bbdb-a84716b03d75','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','feeb24c3-9262-4fbd-8b64-1386373de1ec','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd','validation_success',0,0,NULL,'2025-09-29 18:41:21'),('f9476475-a7e5-4006-aab2-4bbd6331d85d','0c98e9a2-3ec3-45a6-ad6a-47750d385263','027816da-b1f7-466e-b165-23bbe64f801c','ad49fdc1-cab9-4318-bb5d-027486cb01cd','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'input',0,0,NULL,'2025-09-29 19:05:32');
/*!40000 ALTER TABLE `form_field_interactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `form_fields`
--

DROP TABLE IF EXISTS `form_fields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `form_fields` (
  `id` varchar(36) NOT NULL,
  `step_id` varchar(36) NOT NULL,
  `field_type` enum('text','email','password','number','tel','url','textarea','select','radio','checkbox','file','date','time','datetime-local') NOT NULL,
  `label` varchar(255) NOT NULL,
  `placeholder` varchar(255) DEFAULT NULL,
  `is_required` tinyint(1) DEFAULT '0',
  `field_order` int NOT NULL,
  `validation_config` json DEFAULT NULL,
  `file_config` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_step_id` (`step_id`),
  KEY `idx_field_type` (`field_type`),
  KEY `idx_field_order` (`field_order`),
  KEY `idx_form_fields_order` (`step_id`,`field_order`),
  CONSTRAINT `form_fields_ibfk_1` FOREIGN KEY (`step_id`) REFERENCES `form_steps` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_fields`
--

LOCK TABLES `form_fields` WRITE;
/*!40000 ALTER TABLE `form_fields` DISABLE KEYS */;
INSERT INTO `form_fields` VALUES ('2dd0de5e-9d28-4942-8ca9-6a820a912314','81dfe224-9498-4b1b-a56d-c5019d6a76a7','date','Date de l\'Expérience',NULL,0,4,'{}','{}','2025-09-28 18:56:15','2025-09-28 18:56:15'),('3a51d86e-bc55-4244-a2bd-e322fbf8fc83','a9f00669-0496-4b4e-8c44-c755b275131f','textarea','Suggestions d\'Amélioration','Comment pourrions-nous améliorer votre expérience ?',0,4,'{\"max\": 800, \"min\": 10, \"message\": \"Le commentaire doit contenir entre 10 et 800 caractères\"}','{}','2025-09-28 18:56:15','2025-09-28 18:56:15'),('3f588ca4-8105-41c5-9aa7-08d88895a56c','a9f00669-0496-4b4e-8c44-c755b275131f','checkbox','Aspects à Améliorer',NULL,0,2,'{}','{}','2025-09-28 18:56:15','2025-09-28 18:56:15'),('50b9b2c8-645a-4269-bc65-f551e7b8be4c','c1dc3965-08a8-47b3-b84e-cd38f9170414','radio','Vitesse/Performance',NULL,1,3,'{}','{}','2025-09-28 18:56:15','2025-09-28 18:56:15'),('53e27271-5d07-4334-81b2-451e63dcc8df','81dfe224-9498-4b1b-a56d-c5019d6a76a7','email','Adresse E-mail (Optionnel)','votre@email.com',0,2,'{\"message\": \"Veuillez entrer une adresse e-mail valide\"}','{}','2025-09-28 18:56:15','2025-09-28 18:56:15'),('60d16713-76ae-4205-a6ea-aefb0c04093e','a9f00669-0496-4b4e-8c44-c755b275131f','textarea','Ce Qui Vous a Le Plus Plu','Décrivez ce que vous avez le plus apprécié dans votre expérience...',0,3,'{\"max\": 800, \"min\": 10, \"message\": \"Le commentaire doit contenir entre 10 et 800 caractères\"}','{}','2025-09-28 18:56:15','2025-09-28 18:56:15'),('8007110b-b7af-4bf3-85c0-3aead8f3c956','027816da-b1f7-466e-b165-23bbe64f801c','radio','Avez-vous Rencontré des Problèmes ?',NULL,1,1,'{}','{}','2025-09-28 18:56:15','2025-09-28 18:56:15'),('820e32e4-f725-4af8-890e-1a41439f00b9','c1dc3965-08a8-47b3-b84e-cd38f9170414','radio','Probabilité de Recommandation',NULL,1,4,'{}','{}','2025-09-28 18:56:15','2025-09-28 18:56:15'),('98e8b2de-ffee-4bcb-8ecc-fdb0a370bc20','027816da-b1f7-466e-b165-23bbe64f801c','radio','Utiliserez-vous Nos Services à Nouveau ?',NULL,1,3,'{}','{}','2025-09-28 18:56:15','2025-09-28 18:56:15'),('99897b2c-751d-491a-8a97-f46793de129f','027816da-b1f7-466e-b165-23bbe64f801c','textarea','Commentaires Supplémentaires','Partagez tout autre commentaire, suggestion ou réflexion...',0,4,'{\"max\": 1500, \"min\": 10, \"message\": \"Le commentaire doit contenir entre 10 et 1500 caractères\"}','{}','2025-09-28 18:56:15','2025-09-28 18:56:15'),('ad49fdc1-cab9-4318-bb5d-027486cb01cd','027816da-b1f7-466e-b165-23bbe64f801c','checkbox','Autorisations',NULL,0,5,'{}','{}','2025-09-28 18:56:15','2025-09-28 18:56:15'),('b241700c-e3ac-4cd5-9c55-6abb4a5628d1','a9f00669-0496-4b4e-8c44-c755b275131f','checkbox','Aspects Positifs de Votre Expérience',NULL,0,1,'{}','{}','2025-09-28 18:56:15','2025-09-28 18:56:15'),('b8b52a52-6085-42b8-951b-78dc5da59263','c1dc3965-08a8-47b3-b84e-cd38f9170414','radio','Satisfaction Générale',NULL,1,1,'{}','{}','2025-09-28 18:56:15','2025-09-28 18:56:15'),('e7d9d0b2-2df7-47dc-b504-1a7811c32df3','027816da-b1f7-466e-b165-23bbe64f801c','textarea','Décrivez les Problèmes Rencontrés (Si Applicable)','Veuillez décrire les difficultés ou problèmes que vous avez rencontrés...',0,2,'{\"max\": 1000, \"min\": 10, \"message\": \"La description doit contenir entre 10 et 1000 caractères\"}','{}','2025-09-28 18:56:15','2025-09-28 18:56:15'),('ef9e5a99-5a67-4484-976f-e87f3ba06d90','81dfe224-9498-4b1b-a56d-c5019d6a76a7','text','Nom (Optionnel)','Entrez votre nom si vous le souhaitez',0,1,'{\"max\": 50, \"min\": 2, \"message\": \"Le nom doit contenir entre 2 et 50 caractères\"}','{}','2025-09-28 18:56:15','2025-09-28 18:56:15'),('f985496e-8df1-4e65-abd5-4a80dd4f1d6c','c1dc3965-08a8-47b3-b84e-cd38f9170414','radio','Facilité d\'Utilisation',NULL,1,2,'{}','{}','2025-09-28 18:56:15','2025-09-28 18:56:15'),('feeb24c3-9262-4fbd-8b64-1386373de1ec','81dfe224-9498-4b1b-a56d-c5019d6a76a7','select','Type de Service/Produit Utilisé',NULL,1,3,'{}','{}','2025-09-28 18:56:15','2025-09-28 18:56:15');
/*!40000 ALTER TABLE `form_fields` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `form_step_analytics_overview`
--

DROP TABLE IF EXISTS `form_step_analytics_overview`;
/*!50001 DROP VIEW IF EXISTS `form_step_analytics_overview`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `form_step_analytics_overview` AS SELECT 
 1 AS `form_id`,
 1 AS `form_title`,
 1 AS `step_id`,
 1 AS `step_title`,
 1 AS `step_order`,
 1 AS `total_step_visits`,
 1 AS `unique_logged_users`,
 1 AS `unique_sessions`,
 1 AS `avg_time_spent_ms`,
 1 AS `avg_field_interactions`,
 1 AS `avg_validation_errors`,
 1 AS `completed_steps`,
 1 AS `step_completion_rate`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `form_step_analytics_summary`
--

DROP TABLE IF EXISTS `form_step_analytics_summary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `form_step_analytics_summary` (
  `id` varchar(36) NOT NULL,
  `form_id` varchar(36) NOT NULL,
  `step_id` varchar(36) NOT NULL,
  `date` date NOT NULL,
  `step_order` int NOT NULL,
  `total_visits` int DEFAULT '0',
  `unique_visitors` int DEFAULT '0',
  `average_time_spent_ms` int DEFAULT '0',
  `average_field_interactions` int DEFAULT '0',
  `average_validation_errors` int DEFAULT '0',
  `completion_rate` decimal(5,2) DEFAULT '0.00',
  `abandonment_rate` decimal(5,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_form_step_date` (`form_id`,`step_id`,`date`),
  KEY `idx_form_id` (`form_id`),
  KEY `idx_step_id` (`step_id`),
  KEY `idx_date` (`date`),
  KEY `idx_form_step_date` (`form_id`,`step_id`,`date`),
  CONSTRAINT `form_step_analytics_summary_ibfk_1` FOREIGN KEY (`form_id`) REFERENCES `forms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `form_step_analytics_summary_ibfk_2` FOREIGN KEY (`step_id`) REFERENCES `form_steps` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_step_analytics_summary`
--

LOCK TABLES `form_step_analytics_summary` WRITE;
/*!40000 ALTER TABLE `form_step_analytics_summary` DISABLE KEYS */;
/*!40000 ALTER TABLE `form_step_analytics_summary` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `form_step_tracking`
--

DROP TABLE IF EXISTS `form_step_tracking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `form_step_tracking` (
  `id` varchar(36) NOT NULL,
  `form_id` varchar(36) NOT NULL,
  `step_id` varchar(36) NOT NULL,
  `session_id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `step_order` int NOT NULL,
  `time_spent_ms` int DEFAULT '0',
  `field_interactions` int DEFAULT '0',
  `validation_errors` int DEFAULT '0',
  `step_started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `step_completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_form_id` (`form_id`),
  KEY `idx_step_id` (`step_id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_step_started_at` (`step_started_at`),
  KEY `idx_form_step_tracking_form_session` (`form_id`,`session_id`),
  CONSTRAINT `form_step_tracking_ibfk_1` FOREIGN KEY (`form_id`) REFERENCES `forms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `form_step_tracking_ibfk_2` FOREIGN KEY (`step_id`) REFERENCES `form_steps` (`id`) ON DELETE CASCADE,
  CONSTRAINT `form_step_tracking_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_step_tracking`
--

LOCK TABLES `form_step_tracking` WRITE;
/*!40000 ALTER TABLE `form_step_tracking` DISABLE KEYS */;
INSERT INTO `form_step_tracking` VALUES ('00f36891-d130-46a6-84ad-30cef947a2cf','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd',0,0,0,0,'2025-09-29 18:50:16',NULL),('124ec07d-122d-420b-845c-9640989ccd85','0c98e9a2-3ec3-45a6-ad6a-47750d385263','c1dc3965-08a8-47b3-b84e-cd38f9170414','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd',1,0,0,0,'2025-09-29 18:43:25',NULL),('13b02b19-8bec-419f-94c7-c5ae0ae06d4b','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777',NULL,0,0,0,0,'2025-09-29 19:03:02',NULL),('19b95855-ec30-458a-b183-c561101d8046','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd',0,0,0,0,'2025-09-29 18:45:45',NULL),('23e405b5-a1c2-4752-ab09-37215282fc22','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd',0,0,0,0,'2025-09-29 18:42:19',NULL),('27db01bf-50ce-4fb9-8a2d-1c8840762e7a','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777',NULL,0,0,0,0,'2025-09-29 19:02:52',NULL),('28aab986-0ae9-41a8-9952-52bdf5f913d0','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd',0,0,0,0,'2025-09-29 18:46:18',NULL),('28f2e611-5702-4a14-a4de-02f96746011d','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd',0,0,0,0,'2025-09-29 18:45:09',NULL),('2a1a5f88-cda4-4b15-b0be-76d85178a3ce','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd',0,0,0,0,'2025-09-29 18:53:11',NULL),('2c389a1d-606a-47bd-92e6-04b05ec71c6d','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd',0,0,0,0,'2025-09-29 18:44:59',NULL),('3fae1ba4-4628-4e96-a9d3-1085fa60baac','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd',0,0,0,0,'2025-09-29 18:50:47',NULL),('41049dd1-dcb6-4f18-aaba-08be51ceb63d','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd',0,0,0,0,'2025-09-29 18:56:26',NULL),('43d25b6e-2072-4634-943d-328ca7c3808a','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd',0,0,0,0,'2025-09-29 18:53:07',NULL),('468e0461-b410-46ff-b6a2-9535faadebd1','0c98e9a2-3ec3-45a6-ad6a-47750d385263','a9f00669-0496-4b4e-8c44-c755b275131f','aba78df0-a801-4fd9-b216-389f9e039777',NULL,2,12393,11,0,'2025-09-29 19:05:09','2025-09-29 19:05:22'),('4a537bd2-01eb-4d2d-9ce0-8de4d96511d3','0c98e9a2-3ec3-45a6-ad6a-47750d385263','c1dc3965-08a8-47b3-b84e-cd38f9170414','aba78df0-a801-4fd9-b216-389f9e039777',NULL,1,0,0,0,'2025-09-29 19:00:19',NULL),('4cd80c1f-7bc6-428e-be1e-976f52ab93c3','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777',NULL,0,9103,3,0,'2025-09-29 19:04:44','2025-09-29 19:04:54'),('4f07b723-9d00-4e1e-8e20-3e5cf3cdb55a','0c98e9a2-3ec3-45a6-ad6a-47750d385263','c1dc3965-08a8-47b3-b84e-cd38f9170414','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd',1,0,0,0,'2025-09-29 18:41:21',NULL),('5564e6b7-6667-4336-ae46-49f5658c5c90','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd',0,0,0,0,'2025-09-29 18:44:45',NULL),('70743bc5-59c7-4cde-8697-04ddb7b0fccb','0c98e9a2-3ec3-45a6-ad6a-47750d385263','c1dc3965-08a8-47b3-b84e-cd38f9170414','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd',1,0,0,0,'2025-09-29 18:56:54',NULL),('7a95fd18-a72b-4778-ace1-536bfb70c5a8','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777',NULL,0,0,0,0,'2025-09-29 18:58:01',NULL),('7b45db19-c462-44a3-bf87-77f2ee0c14b3','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd',0,0,0,0,'2025-09-29 18:45:32',NULL),('9260a5c0-eac4-4244-a50e-bd30cd95debd','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd',0,0,0,0,'2025-09-29 18:45:22',NULL),('a82f7651-cc33-4495-acbc-9a11039b6e6f','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd',0,0,0,0,'2025-09-29 18:45:22',NULL),('a8f87e04-224a-48ba-a5af-6bdab398857a','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd',0,0,0,0,'2025-09-29 18:45:16',NULL),('aee37d81-bc11-45ea-bb22-1150b3197d6c','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd',0,0,0,0,'2025-09-29 18:46:18',NULL),('b09064e6-859e-4263-9581-ab0b6e90eb41','0c98e9a2-3ec3-45a6-ad6a-47750d385263','027816da-b1f7-466e-b165-23bbe64f801c','aba78df0-a801-4fd9-b216-389f9e039777',NULL,3,10757,9,0,'2025-09-29 19:05:21','2025-09-29 19:05:33'),('b6a0f95b-383b-40bb-9a8b-b66839d1fdf0','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd',0,0,0,0,'2025-09-29 18:46:42',NULL),('b6d5660b-d5e5-4ccb-9751-63d304fd5a64','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777',NULL,0,0,0,0,'2025-09-29 19:01:16',NULL),('b7898af1-33d6-490c-8243-1b7ecfb9fb72','0c98e9a2-3ec3-45a6-ad6a-47750d385263','c1dc3965-08a8-47b3-b84e-cd38f9170414','aba78df0-a801-4fd9-b216-389f9e039777',NULL,1,0,0,0,'2025-09-29 19:01:18',NULL),('c01a264b-0f4c-4f3d-806b-69bcaa86d967','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd',0,0,0,0,'2025-09-29 18:49:53',NULL),('c24cb2f2-7cc5-4f95-9423-78eb4440b929','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd',0,0,0,0,'2025-09-29 18:45:38',NULL),('c5fee11c-6a4f-4db4-94ef-1529114adf87','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd',0,0,0,0,'2025-09-29 18:50:02',NULL),('d2c5c063-dbea-4c81-92f4-8727a7209dc1','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd',0,0,0,0,'2025-09-29 18:44:51',NULL),('dbb4cb21-b9ea-4630-8b63-b3659a83f592','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd',0,0,0,0,'2025-09-29 18:45:56',NULL),('de710f37-5522-4053-a4a8-82930f8b9246','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd',0,0,0,0,'2025-09-29 18:46:05',NULL),('e4358454-4313-493f-8621-5b19f228d831','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777',NULL,0,0,0,0,'2025-09-29 19:03:26',NULL),('eb1b6e4c-f414-4780-804f-044b1a36d024','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd',0,0,0,0,'2025-09-29 18:50:25',NULL),('ec02baee-6cd9-4957-b337-2b3388cfabfe','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd',0,0,0,0,'2025-09-29 18:45:05',NULL),('eff35c3b-051d-40dd-8239-4d173db45cab','0c98e9a2-3ec3-45a6-ad6a-47750d385263','81dfe224-9498-4b1b-a56d-c5019d6a76a7','aba78df0-a801-4fd9-b216-389f9e039777','f2026360-8fbb-11f0-9263-dd12c08e88fd',0,15930,7,0,'2025-09-29 18:56:38','2025-09-29 19:00:42'),('f7a9fab0-b0a0-489c-a4bb-dd1123ceb6d6','0c98e9a2-3ec3-45a6-ad6a-47750d385263','c1dc3965-08a8-47b3-b84e-cd38f9170414','aba78df0-a801-4fd9-b216-389f9e039777',NULL,1,15361,8,0,'2025-09-29 19:04:54','2025-09-29 19:05:09');
/*!40000 ALTER TABLE `form_step_tracking` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `form_steps`
--

DROP TABLE IF EXISTS `form_steps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `form_steps` (
  `id` varchar(36) NOT NULL,
  `form_id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `step_order` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_form_id` (`form_id`),
  KEY `idx_step_order` (`step_order`),
  CONSTRAINT `form_steps_ibfk_1` FOREIGN KEY (`form_id`) REFERENCES `forms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_steps`
--

LOCK TABLES `form_steps` WRITE;
/*!40000 ALTER TABLE `form_steps` DISABLE KEYS */;
INSERT INTO `form_steps` VALUES ('027816da-b1f7-466e-b165-23bbe64f801c','0c98e9a2-3ec3-45a6-ad6a-47750d385263','Questions Finales',3,'2025-09-28 18:56:15','2025-09-28 18:56:15'),('81dfe224-9498-4b1b-a56d-c5019d6a76a7','0c98e9a2-3ec3-45a6-ad6a-47750d385263','Informations Générales',0,'2025-09-28 18:56:15','2025-09-28 18:56:15'),('a9f00669-0496-4b4e-8c44-c755b275131f','0c98e9a2-3ec3-45a6-ad6a-47750d385263','Détails de l\'Expérience',2,'2025-09-28 18:56:15','2025-09-28 18:56:15'),('c1dc3965-08a8-47b3-b84e-cd38f9170414','0c98e9a2-3ec3-45a6-ad6a-47750d385263','Évaluation de l\'Expérience',1,'2025-09-28 18:56:15','2025-09-28 18:56:15');
/*!40000 ALTER TABLE `form_steps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `form_submission_sessions`
--

DROP TABLE IF EXISTS `form_submission_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `form_submission_sessions` (
  `id` varchar(36) NOT NULL,
  `form_id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `session_id` varchar(36) NOT NULL,
  `submission_id` varchar(36) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `referrer` varchar(500) DEFAULT NULL,
  `country` varchar(2) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `device_type` enum('desktop','mobile','tablet') DEFAULT 'desktop',
  `browser` varchar(100) DEFAULT NULL,
  `os` varchar(100) DEFAULT NULL,
  `total_time_spent_ms` int DEFAULT '0',
  `total_steps_completed` int DEFAULT '0',
  `total_field_interactions` int DEFAULT '0',
  `total_validation_errors` int DEFAULT '0',
  `session_started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `session_completed_at` timestamp NULL DEFAULT NULL,
  `submission_completed` tinyint(1) DEFAULT '0',
  `abandoned_at_step` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_form_id` (`form_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_submission_id` (`submission_id`),
  KEY `idx_session_started_at` (`session_started_at`),
  KEY `idx_submission_completed` (`submission_completed`),
  KEY `idx_device_type` (`device_type`),
  KEY `idx_form_submission_sessions_form_date` (`form_id`,`session_started_at`),
  CONSTRAINT `form_submission_sessions_ibfk_1` FOREIGN KEY (`form_id`) REFERENCES `forms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `form_submission_sessions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `form_submission_sessions_ibfk_3` FOREIGN KEY (`submission_id`) REFERENCES `form_submissions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_submission_sessions`
--

LOCK TABLES `form_submission_sessions` WRITE;
/*!40000 ALTER TABLE `form_submission_sessions` DISABLE KEYS */;
INSERT INTO `form_submission_sessions` VALUES ('06b355ee-6f8e-4eb0-98f7-cac9e34c883c','0c98e9a2-3ec3-45a6-ad6a-47750d385263',NULL,'aba78df0-a801-4fd9-b216-389f9e039777',NULL,'::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','',NULL,NULL,'desktop','Chrome','macOS',0,0,0,0,'2025-09-29 19:04:44',NULL,0,NULL),('0ffe5711-d0e3-448d-b47b-cde6b575bd00','0c98e9a2-3ec3-45a6-ad6a-47750d385263',NULL,'21bba746-4d46-4f1c-80b8-d8ef2e37b996',NULL,'::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','http://localhost:5173/',NULL,NULL,'desktop','Chrome','macOS',0,0,0,0,'2025-09-29 19:05:32',NULL,0,NULL),('149c33b3-8c4a-41d6-91cf-7de1dc2d051f','0c98e9a2-3ec3-45a6-ad6a-47750d385263',NULL,'aba78df0-a801-4fd9-b216-389f9e039777',NULL,'::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','',NULL,NULL,'desktop','Chrome','macOS',0,0,0,0,'2025-09-29 19:03:26',NULL,0,NULL),('290b0a47-a6de-45c7-adc3-dce6573d898b','0c98e9a2-3ec3-45a6-ad6a-47750d385263',NULL,'aba78df0-a801-4fd9-b216-389f9e039777',NULL,'::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','',NULL,NULL,'desktop','Chrome','macOS',0,0,0,0,'2025-09-29 18:58:01',NULL,0,NULL),('5765adb6-0ff7-4e2e-b0c0-ca2eb3f82857','0c98e9a2-3ec3-45a6-ad6a-47750d385263',NULL,'aba78df0-a801-4fd9-b216-389f9e039777',NULL,'::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','',NULL,NULL,'desktop','Chrome','macOS',0,0,0,0,'2025-09-29 19:03:02',NULL,0,NULL),('8b26ad64-9dcd-433a-87f4-26f331c34ced','0c98e9a2-3ec3-45a6-ad6a-47750d385263',NULL,'aba78df0-a801-4fd9-b216-389f9e039777',NULL,'::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','',NULL,NULL,'desktop','Chrome','macOS',0,0,0,0,'2025-09-29 19:02:52',NULL,0,NULL),('b271ca43-298a-45d0-80ad-107d921d1ad6','0c98e9a2-3ec3-45a6-ad6a-47750d385263','f2026360-8fbb-11f0-9263-dd12c08e88fd','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','',NULL,NULL,'desktop','Chrome','macOS',0,0,0,0,'2025-09-29 18:53:11',NULL,0,NULL),('b2f6d4f0-c69a-4a5e-b608-ae0983f1b28a','0c98e9a2-3ec3-45a6-ad6a-47750d385263','f2026360-8fbb-11f0-9263-dd12c08e88fd','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','',NULL,NULL,'desktop','Chrome','macOS',0,0,0,0,'2025-09-29 18:50:01',NULL,0,NULL),('c1ad8c05-a966-4076-897b-ebcb333b162b','0c98e9a2-3ec3-45a6-ad6a-47750d385263','f2026360-8fbb-11f0-9263-dd12c08e88fd','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','',NULL,NULL,'desktop','Chrome','macOS',0,0,0,0,'2025-09-29 18:50:16',NULL,0,NULL),('d998a9df-04c7-4a78-81de-70c3d17da73b','0c98e9a2-3ec3-45a6-ad6a-47750d385263','f2026360-8fbb-11f0-9263-dd12c08e88fd','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','',NULL,NULL,'desktop','Chrome','macOS',0,0,0,0,'2025-09-29 18:50:47',NULL,0,NULL),('e649eb37-8d66-4063-a063-577447e630a2','0c98e9a2-3ec3-45a6-ad6a-47750d385263','f2026360-8fbb-11f0-9263-dd12c08e88fd','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','',NULL,NULL,'desktop','Chrome','macOS',0,0,0,0,'2025-09-29 18:56:38',NULL,0,NULL),('ea44d1f1-f65b-49a9-881a-4a4d100d472c','0c98e9a2-3ec3-45a6-ad6a-47750d385263','f2026360-8fbb-11f0-9263-dd12c08e88fd','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','',NULL,NULL,'desktop','Chrome','macOS',0,0,0,0,'2025-09-29 18:50:25',NULL,0,NULL),('f0a43d28-f1a4-4129-88c1-557351ea5f67','0c98e9a2-3ec3-45a6-ad6a-47750d385263','f2026360-8fbb-11f0-9263-dd12c08e88fd','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','',NULL,NULL,'desktop','Chrome','macOS',0,0,0,0,'2025-09-29 18:53:07',NULL,0,NULL),('f824654c-dec5-4186-ae6a-aa5ad23146f6','0c98e9a2-3ec3-45a6-ad6a-47750d385263','f2026360-8fbb-11f0-9263-dd12c08e88fd','aba78df0-a801-4fd9-b216-389f9e039777',NULL,'::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','http://localhost:5173/forms/feedback-form',NULL,NULL,'desktop','Chrome','macOS',0,0,0,0,'2025-09-29 18:56:26',NULL,0,NULL);
/*!40000 ALTER TABLE `form_submission_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `form_submissions`
--

DROP TABLE IF EXISTS `form_submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `form_submissions` (
  `id` varchar(36) NOT NULL,
  `form_id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `submission_data` json NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_form_id` (`form_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_submitted_at` (`submitted_at`),
  KEY `idx_submissions_submitted_at` (`submitted_at`),
  KEY `idx_submissions_form_submitted` (`form_id`,`submitted_at`),
  CONSTRAINT `form_submissions_ibfk_1` FOREIGN KEY (`form_id`) REFERENCES `forms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `form_submissions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_submissions`
--

LOCK TABLES `form_submissions` WRITE;
/*!40000 ALTER TABLE `form_submissions` DISABLE KEYS */;
INSERT INTO `form_submissions` VALUES ('3a4f1ab4-f55b-49e5-9201-7ea2aa830fde','0c98e9a2-3ec3-45a6-ad6a-47750d385263','f2026360-8fbb-11f0-9263-dd12c08e88fd','{\"3f588ca4-8105-41c5-9aa7-08d88895a56c\": \"pricing\", \"50b9b2c8-645a-4269-bc65-f551e7b8be4c\": \"slow\", \"8007110b-b7af-4bf3-85c0-3aead8f3c956\": \"minor-issues\", \"820e32e4-f725-4af8-890e-1a41439f00b9\": \"likely\", \"98e8b2de-ffee-4bcb-8ecc-fdb0a370bc20\": \"probably\", \"ad49fdc1-cab9-4318-bb5d-027486cb01cd\": \"allow-improvement-use\", \"b241700c-e3ac-4cd5-9c55-6abb4a5628d1\": \"competent-staff\", \"b8b52a52-6085-42b8-951b-78dc5da59263\": \"satisfied\", \"f985496e-8df1-4e65-abd5-4a80dd4f1d6c\": \"average\", \"feeb24c3-9262-4fbd-8b64-1386373de1ec\": \"customer-service\"}','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','2025-09-28 18:56:51'),('973d0078-f584-41f1-9c2d-7d5b4d6c2140','0c98e9a2-3ec3-45a6-ad6a-47750d385263',NULL,'{\"3a51d86e-bc55-4244-a2bd-e322fbf8fc83\": \"test\", \"3f588ca4-8105-41c5-9aa7-08d88895a56c\": \"missing-features\", \"50b9b2c8-645a-4269-bc65-f551e7b8be4c\": \"slow\", \"60d16713-76ae-4205-a6ea-aefb0c04093e\": \"start\", \"8007110b-b7af-4bf3-85c0-3aead8f3c956\": \"moderate-issues\", \"820e32e4-f725-4af8-890e-1a41439f00b9\": \"very-likely\", \"98e8b2de-ffee-4bcb-8ecc-fdb0a370bc20\": \"probably-not\", \"ad49fdc1-cab9-4318-bb5d-027486cb01cd\": \"allow-improvement-use\", \"b241700c-e3ac-4cd5-9c55-6abb4a5628d1\": \"personalized-service\", \"b8b52a52-6085-42b8-951b-78dc5da59263\": \"satisfied\", \"f985496e-8df1-4e65-abd5-4a80dd4f1d6c\": \"average\", \"feeb24c3-9262-4fbd-8b64-1386373de1ec\": \"physical-product\"}','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','2025-09-29 19:05:32');
/*!40000 ALTER TABLE `form_submissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `form_visits`
--

DROP TABLE IF EXISTS `form_visits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `form_visits` (
  `id` varchar(36) NOT NULL,
  `form_id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `session_id` varchar(36) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `referrer` varchar(500) DEFAULT NULL,
  `country` varchar(2) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `device_type` enum('desktop','mobile','tablet') DEFAULT 'desktop',
  `browser` varchar(100) DEFAULT NULL,
  `os` varchar(100) DEFAULT NULL,
  `visited_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_form_id` (`form_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_visited_at` (`visited_at`),
  KEY `idx_form_visited_at` (`form_id`,`visited_at`),
  KEY `idx_device_type` (`device_type`),
  KEY `idx_form_visits_form_date` (`form_id`,`visited_at`),
  CONSTRAINT `form_visits_ibfk_1` FOREIGN KEY (`form_id`) REFERENCES `forms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `form_visits_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_visits`
--

LOCK TABLES `form_visits` WRITE;
/*!40000 ALTER TABLE `form_visits` DISABLE KEYS */;
INSERT INTO `form_visits` VALUES ('33ca7d17-142f-4995-8cc0-a22e8c4b3cfb','0c98e9a2-3ec3-45a6-ad6a-47750d385263','f2026360-8fbb-11f0-9263-dd12c08e88fd','aba78df0-a801-4fd9-b216-389f9e039777','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','',NULL,NULL,'desktop','Chrome','macOS','2025-09-29 18:53:11'),('4174def7-cafe-4743-b84f-9eebe21d018a','0c98e9a2-3ec3-45a6-ad6a-47750d385263','f2026360-8fbb-11f0-9263-dd12c08e88fd','aba78df0-a801-4fd9-b216-389f9e039777','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','',NULL,NULL,'desktop','Chrome','macOS','2025-09-29 18:50:25'),('45ef3a83-96ee-4d66-8cdd-abc444f19abc','0c98e9a2-3ec3-45a6-ad6a-47750d385263','f2026360-8fbb-11f0-9263-dd12c08e88fd','aba78df0-a801-4fd9-b216-389f9e039777','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','',NULL,NULL,'desktop','Chrome','macOS','2025-09-29 18:53:07'),('53a52e51-0c4f-4036-822b-c1dc6a68c39c','0c98e9a2-3ec3-45a6-ad6a-47750d385263',NULL,'aba78df0-a801-4fd9-b216-389f9e039777','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','',NULL,NULL,'desktop','Chrome','macOS','2025-09-29 19:03:02'),('60742f0a-cb56-46f7-a8f6-49be0d821ddd','0c98e9a2-3ec3-45a6-ad6a-47750d385263','f2026360-8fbb-11f0-9263-dd12c08e88fd','aba78df0-a801-4fd9-b216-389f9e039777','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','',NULL,NULL,'desktop','Chrome','macOS','2025-09-29 18:50:16'),('8416efd4-c218-4548-aac9-085726e0bd0c','0c98e9a2-3ec3-45a6-ad6a-47750d385263',NULL,'aba78df0-a801-4fd9-b216-389f9e039777','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','',NULL,NULL,'desktop','Chrome','macOS','2025-09-29 19:03:26'),('92cd0347-d5cc-46ce-a885-ebb8500d6016','0c98e9a2-3ec3-45a6-ad6a-47750d385263',NULL,'aba78df0-a801-4fd9-b216-389f9e039777','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','',NULL,NULL,'desktop','Chrome','macOS','2025-09-29 19:02:51'),('954e0b77-3e59-4448-97f4-cee66f9fba4d','0c98e9a2-3ec3-45a6-ad6a-47750d385263',NULL,'aba78df0-a801-4fd9-b216-389f9e039777','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','',NULL,NULL,'desktop','Chrome','macOS','2025-09-29 19:04:44'),('b0829df0-6f27-4034-ae11-ecc7a96924ce','0c98e9a2-3ec3-45a6-ad6a-47750d385263','f2026360-8fbb-11f0-9263-dd12c08e88fd','aba78df0-a801-4fd9-b216-389f9e039777','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','',NULL,NULL,'desktop','Chrome','macOS','2025-09-29 18:50:47'),('cf7cc787-7560-4ce1-a0fb-c14934dc4dbc','0c98e9a2-3ec3-45a6-ad6a-47750d385263','f2026360-8fbb-11f0-9263-dd12c08e88fd','aba78df0-a801-4fd9-b216-389f9e039777','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','http://localhost:5173/forms/feedback-form',NULL,NULL,'desktop','Chrome','macOS','2025-09-29 18:56:25'),('d325e63e-7215-472c-b50f-c0fb1d7f427d','0c98e9a2-3ec3-45a6-ad6a-47750d385263',NULL,'aba78df0-a801-4fd9-b216-389f9e039777','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','',NULL,NULL,'desktop','Chrome','macOS','2025-09-29 18:58:01'),('d32e9924-d357-437c-a4d2-8fe7b67ce672','0c98e9a2-3ec3-45a6-ad6a-47750d385263','f2026360-8fbb-11f0-9263-dd12c08e88fd','aba78df0-a801-4fd9-b216-389f9e039777','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','',NULL,NULL,'desktop','Chrome','macOS','2025-09-29 18:56:38'),('ffe8575b-a298-41a9-b4c2-11461c166d8e','0c98e9a2-3ec3-45a6-ad6a-47750d385263','f2026360-8fbb-11f0-9263-dd12c08e88fd','aba78df0-a801-4fd9-b216-389f9e039777','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','',NULL,NULL,'desktop','Chrome','macOS','2025-09-29 18:50:01');
/*!40000 ALTER TABLE `form_visits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `forms`
--

DROP TABLE IF EXISTS `forms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forms` (
  `id` varchar(36) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `status` enum('active','inactive','draft') DEFAULT 'draft',
  `is_active` tinyint(1) DEFAULT '1',
  `allow_multiple_submissions` tinyint(1) DEFAULT '1',
  `require_authentication` tinyint(1) DEFAULT '0',
  `theme` varchar(50) DEFAULT 'default',
  `primary_color` varchar(7) DEFAULT '#3b82f6',
  `notification_email` varchar(255) DEFAULT NULL,
  `email_notifications` tinyint(1) DEFAULT '1',
  `user_id` varchar(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `success_modal` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_slug` (`slug`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_forms_created_at` (`created_at`),
  KEY `idx_forms_updated_at` (`updated_at`),
  CONSTRAINT `forms_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `forms`
--

LOCK TABLES `forms` WRITE;
/*!40000 ALTER TABLE `forms` DISABLE KEYS */;
INSERT INTO `forms` VALUES ('0c98e9a2-3ec3-45a6-ad6a-47750d385263','feedback-form','Formulaire de Retour d\'Expérience','Votre opinion compte ! Partagez votre expérience avec nous pour nous aider à améliorer nos services et mieux vous servir à l\'avenir.','active',1,1,0,'feedback','#7c3aed','feedback@votreentreprise.com',1,'f2026360-8fbb-11f0-9263-dd12c08e88fd','2025-09-28 18:56:15','2025-09-28 18:56:15','{\"title\": \"Merci pour Votre Retour !\", \"actions\": [{\"url\": \"https://votreentreprise.com/nouveautes\", \"name\": \"Découvrir Nos Nouveautés\"}, {\"url\": \"https://votreentreprise.com/communaute\", \"name\": \"Rejoindre Notre Communauté\"}, {\"url\": \"https://votreentreprise.com/reseaux-sociaux\", \"name\": \"Nous Suivre sur les Réseaux\"}], \"description\": \"Votre retour d\'expérience a été enregistré avec succès. Nous apprécions vraiment le temps que vous avez pris pour partager votre opinion avec nous. Votre feedback nous aidera à continuer à nous améliorer.\", \"closeEnabled\": true, \"resubmitEnabled\": true, \"returnHomeEnabled\": true}');
/*!40000 ALTER TABLE `forms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gemini_conversations`
--

DROP TABLE IF EXISTS `gemini_conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gemini_conversations` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `session_id` varchar(36) NOT NULL,
  `conversation_type` enum('generate','modify','analyze','chat') NOT NULL,
  `form_id` varchar(36) DEFAULT NULL,
  `user_message` text NOT NULL,
  `gemini_response` text NOT NULL,
  `prompt_used` text NOT NULL,
  `response_metadata` json DEFAULT NULL,
  `tokens_used` int DEFAULT '0',
  `processing_time_ms` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_conversation_type` (`conversation_type`),
  KEY `idx_form_id` (`form_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `gemini_conversations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `gemini_conversations_ibfk_2` FOREIGN KEY (`form_id`) REFERENCES `forms` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gemini_conversations`
--

LOCK TABLES `gemini_conversations` WRITE;
/*!40000 ALTER TABLE `gemini_conversations` DISABLE KEYS */;
INSERT INTO `gemini_conversations` VALUES ('0fbe7f06-ee0e-4633-ab4e-8cae4859265c','f2026360-8fbb-11f0-9263-dd12c08e88fd','71b58ace-d799-42d6-b61b-1b9674e2458d','generate',NULL,'Test de génération de formulaire','Réponse de test de Gemini','Prompt de test','{\"test\": true}',100,500,'2025-09-21 02:04:46','2025-09-21 02:04:46'),('213bd0f4-12f3-438d-9836-d881129fc598','f2026360-8fbb-11f0-9263-dd12c08e88fd','eab2a73f-517d-4ae7-a946-70f62ed859f7','generate',NULL,'Test de génération de formulaire','Réponse de test de Gemini','Prompt de test','{\"test\": true}',100,500,'2025-09-21 02:03:23','2025-09-21 02:03:23'),('33d9ba9e-3245-424c-ba51-ce2d9fd3d993','f2026360-8fbb-11f0-9263-dd12c08e88fd','ded476eb-d337-4b67-97bc-e9393d58f72f','generate',NULL,'Test de génération de formulaire','Réponse de test de Gemini','Prompt de test','{\"test\": true}',100,500,'2025-09-21 02:03:11','2025-09-21 02:03:11'),('4450afd6-701d-4aee-879e-12f76f9b3acb','f2026360-8fbb-11f0-9263-dd12c08e88fd','963cfe86-84a3-4082-b88d-01505b97197c','modify',NULL,'Ajouter un champ téléphone à ce formulaire','```json\n{\n  \"modifications\": {\n    \"title\": \"Formulaire généré automatiquement\",\n    \"description\": \"Formulaire généré automatiquement\",\n    \"theme\": \"default\",\n    \"primaryColor\": \"#3b82f6\",\n    \"steps\": [\n      {\n        \"id\": \"68678359-b30a-43d3-b5b4-195e0cfe897f\",\n        \"title\": \"Informations de base\",\n        \"fields\": [\n          {\n            \"id\": \"d3638331-b6b1-4933-8509-c3a292dce2c8\",\n            \"type\": \"email\",\n            \"label\": \"Email\",\n            \"order\": 1,\n            \"options\": [],\n            \"required\": 1,\n            \"fileConfig\": {},\n            \"validation\": {\n              \"pattern\": \"^[^@]+@[^@]+\\\\.[^@]+$\"\n            },\n            \"placeholder\": \"votre@email.com\"\n          },\n          {\n            \"id\": \"dd45fd1f-54f0-435a-a341-aeac29a4f567\",\n            \"type\": \"text\",\n            \"label\": \"Nom\",\n            \"order\": 0,\n            \"options\": [],\n            \"required\": 1,\n            \"fileConfig\": {},\n            \"validation\": {\n              \"maxLength\": 50,\n              \"minLength\": 2\n            },\n            \"placeholder\": \"Votre nom\"\n          },\n          {\n            \"id\": \"a1b2c3d4-e5f6-7890-1234-567890abcdef\",\n            \"type\": \"tel\",\n            \"label\": \"Téléphone\",\n            \"order\": 2,\n            \"options\": [],\n            \"required\": 0,\n            \"fileConfig\": {},\n            \"validation\": {},\n            \"placeholder\": \"Votre numéro de téléphone\"\n          }\n        ]\n      }\n    ],\n    \"marketing\": null,\n    \"successModal\": null\n  },\n  \"changes\": [\n    \"Ajout d\'un champ téléphone au formulaire.\"\n  ],\n  \"suggestions\": [\n    \"Considérer l\'ajout d\'une validation pour le champ téléphone (par exemple, format du numéro).\"\n  ]\n}\n```\n','\nTu es un expert en modification de formulaires web. Modifie le formulaire existant selon les instructions.\n\nFORMULAIRE EXISTANT:\n{\n  \"id\": \"e98f3f56-4958-41af-b6ee-0057aa6c7113\",\n  \"slug\": \"formulaire-genere-automatiquement\",\n  \"title\": \"Formulaire généré automatiquement\",\n  \"description\": \"Formulaire généré automatiquement\",\n  \"steps\": [\n    {\n      \"id\": \"68678359-b30a-43d3-b5b4-195e0cfe897f\",\n      \"title\": \"Informations de base\",\n      \"fields\": [\n        {\n          \"id\": \"d3638331-b6b1-4933-8509-c3a292dce2c8\",\n          \"type\": \"email\",\n          \"label\": \"Email\",\n          \"order\": 1,\n          \"options\": [],\n          \"required\": 1,\n          \"fileConfig\": {},\n          \"validation\": {\n            \"pattern\": \"^[^@]+@[^@]+\\\\.[^@]+$\"\n          },\n          \"placeholder\": \"votre@email.com\"\n        },\n        {\n          \"id\": \"dd45fd1f-54f0-435a-a341-aeac29a4f567\",\n          \"type\": \"text\",\n          \"label\": \"Nom\",\n          \"order\": 0,\n          \"options\": [],\n          \"required\": 1,\n          \"fileConfig\": {},\n          \"validation\": {\n            \"maxLength\": 50,\n            \"minLength\": 2\n          },\n          \"placeholder\": \"Votre nom\"\n        }\n      ]\n    }\n  ],\n  \"createdAt\": \"2025-09-21T02:00:11.000Z\",\n  \"updatedAt\": \"2025-09-21T02:00:11.000Z\",\n  \"status\": \"draft\",\n  \"submissionsCount\": 0,\n  \"allowMultipleSubmissions\": 1,\n  \"requireAuthentication\": 0,\n  \"theme\": \"default\",\n  \"primaryColor\": \"#3b82f6\",\n  \"notificationEmail\": null,\n  \"emailNotifications\": 0,\n  \"marketing\": null,\n  \"successModal\": null\n}\n\nINSTRUCTIONS DE MODIFICATION: Ajouter un champ téléphone à ce formulaire\n\nOPTIONS:\n- Langue: fr\n- Préserver les données: true\n\nGénère une réponse JSON avec la structure suivante:\n{\n  \"modifications\": {\n    \"title\": \"Nouveau titre (si modifié)\",\n    \"description\": \"Nouvelle description (si modifiée)\",\n    \"theme\": \"Nouveau thème (si modifié)\",\n    \"primaryColor\": \"Nouvelle couleur (si modifiée)\",\n    \"steps\": [\n      // Structure complète des étapes modifiées\n    ],\n    \"marketing\": {\n      // Configuration marketing modifiée\n    },\n    \"successModal\": {\n      // Modal de succès modifiée\n    }\n  },\n  \"changes\": [\n    \"Description des changements effectués\"\n  ],\n  \"suggestions\": [\n    \"Suggestions d\'amélioration\"\n  ]\n}\n\nIMPORTANT:\n- Préserve la structure existante autant que possible\n- Applique uniquement les modifications demandées\n- Assure-toi que le JSON est valide\n- Réponds uniquement avec le JSON, sans texte supplémentaire\n','{\"formId\": \"e98f3f56-4958-41af-b6ee-0057aa6c7113\", \"changes\": [\"Ajout d\'un champ téléphone au formulaire.\"], \"options\": {}, \"formTitle\": \"Formulaire généré automatiquement\"}',1051,4482,'2025-09-21 02:00:30','2025-09-21 02:00:30'),('4835ba52-99af-46ae-a77a-7ab46879a5be','f2026360-8fbb-11f0-9263-dd12c08e88fd','8781d277-455d-4500-9ea4-784335e6b9e6','modify',NULL,'Ajouter un champ pour l\'adresse postale.','```json\n{\n  \"modifications\": {\n    \"title\": \"Formulaire généré automatiquement (mis à jour)\",\n    \"description\": \"Formulaire généré automatiquement, mis à jour pour une meilleure expérience utilisateur.\",\n    \"theme\": \"default\",\n    \"primaryColor\": \"#3b82f6\",\n    \"steps\": [\n      {\n        \"id\": \"68678359-b30a-43d3-b5b4-195e0cfe897f\",\n        \"title\": \"Informations de base\",\n        \"fields\": [\n          {\n            \"id\": \"9a6d8de4-8f01-4222-9360-d9e49d8666f4\",\n            \"type\": \"tel\",\n            \"label\": \"Téléphone\",\n            \"order\": 0,\n            \"options\": [],\n            \"required\": 0,\n            \"fileConfig\": {},\n            \"validation\": {},\n            \"placeholder\": \"Votre numéro de téléphone\"\n          },\n          {\n            \"id\": \"d3638331-b6b1-4933-8509-c3a292dce2c8\",\n            \"type\": \"email\",\n            \"label\": \"Email\",\n            \"order\": 1,\n            \"options\": [],\n            \"required\": 1,\n            \"fileConfig\": {},\n            \"validation\": {\n              \"pattern\": \"^[^@]+@[^@]+\\\\.[^@]+$\"\n            },\n            \"placeholder\": \"votre@email.com\"\n          },\n          {\n            \"id\": \"dd45fd1f-54f0-435a-a341-aeac29a4f567\",\n            \"type\": \"text\",\n            \"label\": \"Nom\",\n            \"order\": 2,\n            \"options\": [],\n            \"required\": 1,\n            \"fileConfig\": {},\n            \"validation\": {\n              \"maxLength\": 50,\n              \"minLength\": 2\n            },\n            \"placeholder\": \"Votre nom\"\n          },\n          {\n            \"id\": \"a1b2c3d4-e5f6-7890-1234-567890abcdef\",\n            \"type\": \"text\",\n            \"label\": \"Adresse postale\",\n            \"order\": 3,\n            \"options\": [],\n            \"required\": 0,\n            \"fileConfig\": {},\n            \"validation\": {},\n            \"placeholder\": \"Votre adresse postale\"\n          }\n        ]\n      }\n    ],\n    \"marketing\": null,\n    \"successModal\": null\n  },\n  \"changes\": [\n    \"Ajout d\'un champ \\\"Adresse postale\\\" dans l\'étape \\\"Informations de base\\\".\"\n  ],\n  \"suggestions\": []\n}\n```\n','\nTu es un expert en modification de formulaires web. Modifie le formulaire existant selon les instructions.\n\nFORMULAIRE EXISTANT:\n{\n  \"id\": \"e98f3f56-4958-41af-b6ee-0057aa6c7113\",\n  \"slug\": \"formulaire-genere-automatiquement\",\n  \"title\": \"Formulaire généré automatiquement (mis à jour)\",\n  \"description\": \"Formulaire généré automatiquement, mis à jour pour une meilleure expérience utilisateur.\",\n  \"steps\": [\n    {\n      \"id\": \"68678359-b30a-43d3-b5b4-195e0cfe897f\",\n      \"title\": \"Informations de base\",\n      \"fields\": [\n        {\n          \"id\": \"9a6d8de4-8f01-4222-9360-d9e49d8666f4\",\n          \"type\": \"tel\",\n          \"label\": \"Téléphone\",\n          \"order\": 0,\n          \"options\": [],\n          \"required\": 0,\n          \"fileConfig\": {},\n          \"validation\": {},\n          \"placeholder\": \"Votre numéro de téléphone\"\n        },\n        {\n          \"id\": \"d3638331-b6b1-4933-8509-c3a292dce2c8\",\n          \"type\": \"email\",\n          \"label\": \"Email\",\n          \"order\": 1,\n          \"options\": [],\n          \"required\": 1,\n          \"fileConfig\": {},\n          \"validation\": {\n            \"pattern\": \"^[^@]+@[^@]+\\\\.[^@]+$\"\n          },\n          \"placeholder\": \"votre@email.com\"\n        },\n        {\n          \"id\": \"dd45fd1f-54f0-435a-a341-aeac29a4f567\",\n          \"type\": \"text\",\n          \"label\": \"Nom\",\n          \"order\": 2,\n          \"options\": [],\n          \"required\": 1,\n          \"fileConfig\": {},\n          \"validation\": {\n            \"maxLength\": 50,\n            \"minLength\": 2\n          },\n          \"placeholder\": \"Votre nom\"\n        }\n      ]\n    }\n  ],\n  \"createdAt\": \"2025-09-21T02:00:11.000Z\",\n  \"updatedAt\": \"2025-09-21T02:24:15.000Z\",\n  \"status\": \"draft\",\n  \"submissionsCount\": 0,\n  \"allowMultipleSubmissions\": 1,\n  \"requireAuthentication\": 0,\n  \"theme\": \"default\",\n  \"primaryColor\": \"#3b82f6\",\n  \"notificationEmail\": null,\n  \"emailNotifications\": 0,\n  \"marketing\": null,\n  \"successModal\": null\n}\n\nINSTRUCTIONS DE MODIFICATION: Ajouter un champ pour l\'adresse postale.\n\nOPTIONS:\n- Langue: fr\n- Préserver les données: true\n\nGénère une réponse JSON avec la structure suivante:\n{\n  \"modifications\": {\n    \"title\": \"Nouveau titre (si modifié)\",\n    \"description\": \"Nouvelle description (si modifiée)\",\n    \"theme\": \"Nouveau thème (si modifié)\",\n    \"primaryColor\": \"Nouvelle couleur (si modifiée)\",\n    \"steps\": [\n      // Structure complète des étapes modifiées\n    ],\n    \"marketing\": {\n      // Configuration marketing modifiée\n    },\n    \"successModal\": {\n      // Modal de succès modifiée\n    }\n  },\n  \"changes\": [\n    \"Description des changements effectués\"\n  ],\n  \"suggestions\": [\n    \"Suggestions d\'amélioration\"\n  ]\n}\n\nIMPORTANT:\n- Préserve la structure existante autant que possible\n- Applique uniquement les modifications demandées\n- Assure-toi que le JSON est valide\n- Réponds uniquement avec le JSON, sans texte supplémentaire\n','{\"formId\": \"e98f3f56-4958-41af-b6ee-0057aa6c7113\", \"changes\": [\"Ajout d\'un champ \\\"Adresse postale\\\" dans l\'étape \\\"Informations de base\\\".\"], \"options\": {\"language\": \"fr\", \"preserveData\": true}, \"formTitle\": \"Formulaire généré automatiquement (mis à jour)\"}',1231,5580,'2025-09-21 02:25:24','2025-09-21 02:25:24'),('4c0b7879-44fe-457c-abe0-8f95fc8dd6c9','f2026360-8fbb-11f0-9263-dd12c08e88fd','573c92f4-af97-4cdf-98ed-3da5bb5a803d','generate',NULL,'Test de génération de formulaire','Réponse de test de Gemini','Prompt de test','{\"test\": true}',100,500,'2025-09-21 02:00:39','2025-09-21 02:00:39'),('4d192e70-7ab9-46b3-8b60-4a33b0d17014','f2026360-8fbb-11f0-9263-dd12c08e88fd','79aa7f89-dc39-4a73-84a4-290cff75fab8','generate',NULL,'Test de génération de formulaire','Réponse de test de Gemini','Prompt de test','{\"test\": true}',100,500,'2025-09-21 02:03:00','2025-09-21 02:03:00'),('4e05a280-986d-468b-abe7-b211b236771e','f2026360-8fbb-11f0-9263-dd12c08e88fd','ade4c027-bdd1-495b-8a14-bd1da6dd85e8','modify',NULL,'generate the first step to get the personal information','```json\n{\n  \"modifications\": {\n    \"title\": \"Candidature Développeur Flutter (5 ans d\'expérience)\",\n    \"description\": \"Formulaire de candidature pour un poste de Développeur Flutter avec au moins 5 ans d\'expérience.\",\n    \"theme\": \"default\",\n    \"primaryColor\": \"#3b82f6\",\n    \"steps\": [\n      {\n        \"id\": \"446f4386-a715-4ace-bb7a-ff02248be4d6\",\n        \"title\": \"Informations Personnelles\",\n        \"fields\": [\n          {\n            \"id\": \"nom\",\n            \"type\": \"text\",\n            \"label\": \"Nom\",\n            \"required\": true\n          },\n          {\n            \"id\": \"prenom\",\n            \"type\": \"text\",\n            \"label\": \"Prénom\",\n            \"required\": true\n          },\n          {\n            \"id\": \"email\",\n            \"type\": \"email\",\n            \"label\": \"Email\",\n            \"required\": true\n          },\n          {\n            \"id\": \"telephone\",\n            \"type\": \"tel\",\n            \"label\": \"Téléphone\",\n            \"required\": true\n          },\n          {\n            \"id\": \"adresse\",\n            \"type\": \"textarea\",\n            \"label\": \"Adresse\",\n            \"required\": true\n          }\n        ]\n      }\n    ],\n    \"marketing\": {\n      \"sidebar\": {\n        \"title\": \"\",\n        \"description\": \"\",\n        \"logo\": \"\",\n        \"enabled\": true,\n        \"socialMedia\": {\n          \"enabled\": false,\n          \"title\": \"\",\n          \"buttons\": []\n        },\n        \"footer\": {\n          \"text\": \"\"\n        }\n      }\n    },\n    \"successModal\": {\n      \"title\": \"Félicitations !\",\n      \"actions\": [],\n      \"description\": \"Votre formulaire a été soumis avec succès.\",\n      \"closeEnabled\": true,\n      \"resubmitEnabled\": false,\n      \"returnHomeEnabled\": true\n    }\n  },\n  \"changes\": [\n    \"Ajout d\'une étape \'Informations Personnelles\' avec les champs Nom, Prénom, Email, Téléphone et Adresse.\"\n  ],\n  \"suggestions\": [\n    \"Ajouter des champs pour la date de naissance et le CV.\",\n    \"Considérer l\'ajout de validation côté client pour les champs requis.\",\n    \"Implémenter une meilleure gestion des erreurs.\"\n  ]\n}\n```\n','\nTu es un expert en modification de formulaires web. Modifie le formulaire existant selon les instructions.\n\nFORMULAIRE EXISTANT:\n{\n  \"id\": \"0fc5f058-60f0-4b2c-a3e0-6c7d94588ffb\",\n  \"slug\": \"candidature-dveloppeur-flutter-5-ans-dexprience\",\n  \"title\": \"Candidature Développeur Flutter (5 ans d\'expérience)\",\n  \"description\": \"Formulaire de candidature pour un poste de Développeur Flutter avec au moins 5 ans d\'expérience.\",\n  \"steps\": [\n    {\n      \"id\": \"446f4386-a715-4ace-bb7a-ff02248be4d6\",\n      \"title\": \"Étape 1\",\n      \"fields\": []\n    }\n  ],\n  \"createdAt\": \"2025-09-20T23:20:52.000Z\",\n  \"updatedAt\": \"2025-09-21T02:43:59.000Z\",\n  \"status\": \"active\",\n  \"submissionsCount\": 0,\n  \"allowMultipleSubmissions\": 1,\n  \"requireAuthentication\": 0,\n  \"theme\": \"default\",\n  \"primaryColor\": \"#3b82f6\",\n  \"notificationEmail\": \"@\",\n  \"emailNotifications\": 0,\n  \"marketing\": {\n    \"sidebar\": {\n      \"title\": \"\",\n      \"description\": \"\",\n      \"logo\": \"\",\n      \"enabled\": true,\n      \"socialMedia\": {\n        \"enabled\": false,\n        \"title\": \"\",\n        \"buttons\": []\n      },\n      \"footer\": {\n        \"text\": \"\"\n      }\n    }\n  },\n  \"successModal\": {\n    \"title\": \"Félicitations !\",\n    \"actions\": [],\n    \"description\": \"Votre formulaire a été soumis avec succès.\",\n    \"closeEnabled\": true,\n    \"resubmitEnabled\": false,\n    \"returnHomeEnabled\": true\n  }\n}\n\nINSTRUCTIONS DE MODIFICATION: generate the first step to get the personal information\n\nOPTIONS:\n- Langue: fr\n- Préserver les données: true\n\nGénère une réponse JSON avec la structure suivante:\n{\n  \"modifications\": {\n    \"title\": \"Nouveau titre (si modifié)\",\n    \"description\": \"Nouvelle description (si modifiée)\",\n    \"theme\": \"Nouveau thème (si modifié)\",\n    \"primaryColor\": \"Nouvelle couleur (si modifiée)\",\n    \"steps\": [\n      // Structure complète des étapes modifiées\n    ],\n    \"marketing\": {\n      // Configuration marketing modifiée\n    },\n    \"successModal\": {\n      // Modal de succès modifiée\n    }\n  },\n  \"changes\": [\n    \"Description des changements effectués\"\n  ],\n  \"suggestions\": [\n    \"Suggestions d\'amélioration\"\n  ]\n}\n\nIMPORTANT:\n- Préserve la structure existante autant que possible\n- Applique uniquement les modifications demandées\n- Assure-toi que le JSON est valide\n- Réponds uniquement avec le JSON, sans texte supplémentaire\n','{\"formId\": \"0fc5f058-60f0-4b2c-a3e0-6c7d94588ffb\", \"changes\": [\"Ajout d\'une étape \'Informations Personnelles\' avec les champs Nom, Prénom, Email, Téléphone et Adresse.\"], \"options\": {\"language\": \"fr\", \"preserveData\": true}, \"formTitle\": \"Candidature Développeur Flutter (5 ans d\'expérience)\"}',1092,5880,'2025-09-21 02:45:18','2025-09-21 02:45:18'),('4e545a54-10d4-4fac-a6e1-523bb45c2c83','f2026360-8fbb-11f0-9263-dd12c08e88fd','98b95190-64a8-446c-9d9f-4b3fb15c6b1e','generate',NULL,'Test de génération de formulaire','Réponse de test de Gemini','Prompt de test','{\"test\": true}',100,500,'2025-09-21 02:04:23','2025-09-21 02:04:23'),('4f79b02b-6d74-4472-9f7d-0bb082af54d6','f2026360-8fbb-11f0-9263-dd12c08e88fd','c9589c57-3525-43e6-815f-0961f4e2212e','generate',NULL,'Test de génération de formulaire','Réponse de test de Gemini','Prompt de test','{\"test\": true}',100,500,'2025-09-21 02:01:40','2025-09-21 02:01:40'),('5dd01e68-30d6-494b-b886-b201cc64a169','f2026360-8fbb-11f0-9263-dd12c08e88fd','c3ca39cb-9237-49b5-ad5e-b889fc88b3ea','generate',NULL,'Test de génération de formulaire','Réponse de test de Gemini','Prompt de test','{\"test\": true}',100,500,'2025-09-21 02:01:06','2025-09-21 02:01:06'),('668b84af-b7a0-434b-9787-5bb72e9f9377','f2026360-8fbb-11f0-9263-dd12c08e88fd','5fe415cd-e2b3-404d-b3f1-448ac3b38457','generate',NULL,'Test de génération de formulaire','Réponse de test de Gemini','Prompt de test','{\"test\": true}',100,500,'2025-09-21 02:02:01','2025-09-21 02:02:01'),('71bcafe9-d6ad-44f7-ac4d-3cbae5bb75cf','f2026360-8fbb-11f0-9263-dd12c08e88fd','10f59454-dfd5-4a3e-bfca-2f70f8604d59','generate',NULL,'Test de génération de formulaire','Réponse de test de Gemini','Prompt de test','{\"test\": true}',100,500,'2025-09-21 02:04:09','2025-09-21 02:04:09'),('79f2a67b-b94f-4ea2-bfc3-cc368b0a3a49','f2026360-8fbb-11f0-9263-dd12c08e88fd','e0ea71f1-9c78-469a-99a5-1c049deac67d','modify',NULL,'Comment puis-je vous aider ?','```json\n{\n  \"modifications\": {\n    \"title\": \"Formulaire généré automatiquement (mis à jour)\",\n    \"description\": \"Formulaire généré automatiquement, mis à jour pour une meilleure expérience utilisateur.\",\n    \"theme\": \"default\",\n    \"primaryColor\": \"#3b82f6\",\n    \"steps\": [\n      {\n        \"id\": \"68678359-b30a-43d3-b5b4-195e0cfe897f\",\n        \"title\": \"Informations de base\",\n        \"fields\": [\n          {\n            \"id\": \"9a6d8de4-8f01-4222-9360-d9e49d8666f4\",\n            \"type\": \"tel\",\n            \"label\": \"Téléphone\",\n            \"order\": 2,\n            \"options\": [],\n            \"required\": 0,\n            \"fileConfig\": {},\n            \"validation\": {},\n            \"placeholder\": \"Votre numéro de téléphone\"\n          },\n          {\n            \"id\": \"d3638331-b6b1-4933-8509-c3a292dce2c8\",\n            \"type\": \"email\",\n            \"label\": \"Email\",\n            \"order\": 0,\n            \"options\": [],\n            \"required\": 1,\n            \"fileConfig\": {},\n            \"validation\": {\n              \"pattern\": \"^[^@]+@[^@]+\\\\.[^@]+$\"\n            },\n            \"placeholder\": \"votre@email.com\"\n          },\n          {\n            \"id\": \"dd45fd1f-54f0-435a-a341-aeac29a4f567\",\n            \"type\": \"text\",\n            \"label\": \"Nom\",\n            \"order\": 1,\n            \"options\": [],\n            \"required\": 1,\n            \"fileConfig\": {},\n            \"validation\": {\n              \"maxLength\": 50,\n              \"minLength\": 2\n            },\n            \"placeholder\": \"Votre nom\"\n          }\n        ]\n      }\n    ],\n    \"marketing\": null,\n    \"successModal\": null\n  },\n  \"changes\": [\n    \"Titre et description du formulaire mis à jour.\",\n    \"Aucun autre changement n\'a été effectué car aucune autre instruction n\'a été fournie.\"\n  ],\n  \"suggestions\": [\n    \"Ajouter un champ pour l\'adresse postale.\",\n    \"Ajouter une validation pour le champ téléphone.\",\n    \"Implémenter un système de confirmation par email.\",\n    \"Configurer un modal de succès pour confirmer la soumission du formulaire.\"\n  ]\n}\n```\n','\nTu es un expert en modification de formulaires web. Modifie le formulaire existant selon les instructions.\n\nFORMULAIRE EXISTANT:\n{\n  \"id\": \"e98f3f56-4958-41af-b6ee-0057aa6c7113\",\n  \"slug\": \"formulaire-genere-automatiquement\",\n  \"title\": \"Formulaire généré automatiquement\",\n  \"description\": \"Formulaire généré automatiquement\",\n  \"steps\": [\n    {\n      \"id\": \"68678359-b30a-43d3-b5b4-195e0cfe897f\",\n      \"title\": \"Informations de base\",\n      \"fields\": [\n        {\n          \"id\": \"9a6d8de4-8f01-4222-9360-d9e49d8666f4\",\n          \"type\": \"tel\",\n          \"label\": \"Téléphone\",\n          \"order\": 2,\n          \"options\": [],\n          \"required\": 0,\n          \"fileConfig\": {},\n          \"validation\": {},\n          \"placeholder\": \"Votre numéro de téléphone\"\n        },\n        {\n          \"id\": \"d3638331-b6b1-4933-8509-c3a292dce2c8\",\n          \"type\": \"email\",\n          \"label\": \"Email\",\n          \"order\": 0,\n          \"options\": [],\n          \"required\": 1,\n          \"fileConfig\": {},\n          \"validation\": {\n            \"pattern\": \"^[^@]+@[^@]+\\\\.[^@]+$\"\n          },\n          \"placeholder\": \"votre@email.com\"\n        },\n        {\n          \"id\": \"dd45fd1f-54f0-435a-a341-aeac29a4f567\",\n          \"type\": \"text\",\n          \"label\": \"Nom\",\n          \"order\": 1,\n          \"options\": [],\n          \"required\": 1,\n          \"fileConfig\": {},\n          \"validation\": {\n            \"maxLength\": 50,\n            \"minLength\": 2\n          },\n          \"placeholder\": \"Votre nom\"\n        }\n      ]\n    }\n  ],\n  \"createdAt\": \"2025-09-21T02:00:11.000Z\",\n  \"updatedAt\": \"2025-09-21T02:00:30.000Z\",\n  \"status\": \"draft\",\n  \"submissionsCount\": 0,\n  \"allowMultipleSubmissions\": 1,\n  \"requireAuthentication\": 0,\n  \"theme\": \"default\",\n  \"primaryColor\": \"#3b82f6\",\n  \"notificationEmail\": null,\n  \"emailNotifications\": 0,\n  \"marketing\": null,\n  \"successModal\": null\n}\n\nINSTRUCTIONS DE MODIFICATION: Comment puis-je vous aider ?\n\nOPTIONS:\n- Langue: fr\n- Préserver les données: true\n\nGénère une réponse JSON avec la structure suivante:\n{\n  \"modifications\": {\n    \"title\": \"Nouveau titre (si modifié)\",\n    \"description\": \"Nouvelle description (si modifiée)\",\n    \"theme\": \"Nouveau thème (si modifié)\",\n    \"primaryColor\": \"Nouvelle couleur (si modifiée)\",\n    \"steps\": [\n      // Structure complète des étapes modifiées\n    ],\n    \"marketing\": {\n      // Configuration marketing modifiée\n    },\n    \"successModal\": {\n      // Modal de succès modifiée\n    }\n  },\n  \"changes\": [\n    \"Description des changements effectués\"\n  ],\n  \"suggestions\": [\n    \"Suggestions d\'amélioration\"\n  ]\n}\n\nIMPORTANT:\n- Préserve la structure existante autant que possible\n- Applique uniquement les modifications demandées\n- Assure-toi que le JSON est valide\n- Réponds uniquement avec le JSON, sans texte supplémentaire\n','{\"formId\": \"e98f3f56-4958-41af-b6ee-0057aa6c7113\", \"changes\": [\"Titre et description du formulaire mis à jour.\", \"Aucun autre changement n\'a été effectué car aucune autre instruction n\'a été fournie.\"], \"options\": {\"language\": \"fr\", \"preserveData\": true}, \"formTitle\": \"Formulaire généré automatiquement (mis à jour)\"}',1203,4876,'2025-09-21 02:24:15','2025-09-21 02:24:15'),('7f24ffda-205e-4159-9f66-b4c0f5939311','f2026360-8fbb-11f0-9263-dd12c08e88fd','14125478-6f10-48e7-aec7-cf686986c06f','generate',NULL,'Test de génération de formulaire','Réponse de test de Gemini','Prompt de test','{\"test\": true}',100,500,'2025-09-21 02:02:23','2025-09-21 02:02:23'),('818638d4-4bee-4736-8f67-0a48c7d598f9','f2026360-8fbb-11f0-9263-dd12c08e88fd','5101643f-3f3d-42f4-b900-c96679dfc3be','generate',NULL,'Test de génération de formulaire','Réponse de test de Gemini','Prompt de test','{\"test\": true}',100,500,'2025-09-21 02:05:32','2025-09-21 02:05:32'),('9bbe74c4-b9fd-4a80-a1cf-1cab8a1f16ac','f2026360-8fbb-11f0-9263-dd12c08e88fd','36b95469-cece-4b7f-b438-bcd79fe9f6f0','modify',NULL,'i want a form for getting condidates for a job role flutter developer with 5 years exeprience','```json\n{\n  \"modifications\": {\n    \"title\": \"Candidature Développeur Flutter (5 ans d\'expérience)\",\n    \"description\": \"Formulaire de candidature pour un poste de Développeur Flutter avec au moins 5 ans d\'expérience.\",\n    \"steps\": [\n      {\n        \"id\": \"446f4386-a715-4ace-bb7a-ff02248be4d6\",\n        \"title\": \"Informations personnelles et expérience\",\n        \"fields\": [\n          {\n            \"type\": \"text\",\n            \"label\": \"Nom\",\n            \"name\": \"nom\",\n            \"required\": true\n          },\n          {\n            \"type\": \"text\",\n            \"label\": \"Prénom\",\n            \"name\": \"prenom\",\n            \"required\": true\n          },\n          {\n            \"type\": \"email\",\n            \"label\": \"Email\",\n            \"name\": \"email\",\n            \"required\": true\n          },\n          {\n            \"type\": \"text\",\n            \"label\": \"Téléphone\",\n            \"name\": \"telephone\"\n          },\n          {\n            \"type\": \"textarea\",\n            \"label\": \"Expérience professionnelle (détaillez vos 5 années d\'expérience en développement Flutter)\",\n            \"name\": \"experience\",\n            \"required\": true\n          },\n          {\n            \"type\": \"file\",\n            \"label\": \"CV\",\n            \"name\": \"cv\",\n            \"required\": true\n          },\n          {\n            \"type\": \"file\",\n            \"label\": \"Lettre de motivation\",\n            \"name\": \"lettreMotivation\"\n          }\n        ]\n      }\n    ]\n  },\n  \"changes\": [\n    \"Titre du formulaire modifié.\",\n    \"Description du formulaire modifiée.\",\n    \"Ajout d\'une étape avec des champs pour collecter les informations des candidats (nom, prénom, email, téléphone, expérience, CV, lettre de motivation).\",\n    \"Champs \'nom\', \'prénom\', \'email\', \'expérience\' et \'cv\' rendus obligatoires.\"\n  ],\n  \"suggestions\": [\n    \"Ajouter une section pour les compétences techniques (ex: liste de technologies maîtrisées).\",\n    \"Ajouter une section pour les projets réalisés.\",\n    \"Ajouter une section pour les références.\",\n    \"Envisager l\'ajout d\'une étape de validation des informations avant soumission.\",\n    \"Implémenter une validation côté serveur pour vérifier la validité des données saisies.\"\n  ]\n}\n```\n','\nTu es un expert en modification de formulaires web. Modifie le formulaire existant selon les instructions.\n\nFORMULAIRE EXISTANT:\n{\n  \"id\": \"0fc5f058-60f0-4b2c-a3e0-6c7d94588ffb\",\n  \"slug\": \"nouveau-formulaire\",\n  \"title\": \"Nouveau formulaire\",\n  \"description\": \"Description du formulaire\",\n  \"steps\": [\n    {\n      \"id\": \"446f4386-a715-4ace-bb7a-ff02248be4d6\",\n      \"title\": \"Étape 1\",\n      \"fields\": []\n    }\n  ],\n  \"createdAt\": \"2025-09-20T23:20:52.000Z\",\n  \"updatedAt\": \"2025-09-21T00:34:17.000Z\",\n  \"status\": \"active\",\n  \"submissionsCount\": 0,\n  \"allowMultipleSubmissions\": 1,\n  \"requireAuthentication\": 0,\n  \"theme\": \"default\",\n  \"primaryColor\": \"#3b82f6\",\n  \"notificationEmail\": \"@\",\n  \"emailNotifications\": 0,\n  \"marketing\": {\n    \"sidebar\": {\n      \"title\": \"\",\n      \"description\": \"\",\n      \"logo\": \"\",\n      \"enabled\": true,\n      \"socialMedia\": {\n        \"enabled\": false,\n        \"title\": \"\",\n        \"buttons\": []\n      },\n      \"footer\": {\n        \"text\": \"\"\n      }\n    }\n  },\n  \"successModal\": {\n    \"title\": \"Félicitations !\",\n    \"actions\": [],\n    \"description\": \"Votre formulaire a été soumis avec succès.\",\n    \"closeEnabled\": true,\n    \"resubmitEnabled\": false,\n    \"returnHomeEnabled\": true\n  }\n}\n\nINSTRUCTIONS DE MODIFICATION: i want a form for getting condidates for a job role flutter developer with 5 years exeprience\n\nOPTIONS:\n- Langue: fr\n- Préserver les données: true\n\nGénère une réponse JSON avec la structure suivante:\n{\n  \"modifications\": {\n    \"title\": \"Nouveau titre (si modifié)\",\n    \"description\": \"Nouvelle description (si modifiée)\",\n    \"theme\": \"Nouveau thème (si modifié)\",\n    \"primaryColor\": \"Nouvelle couleur (si modifiée)\",\n    \"steps\": [\n      // Structure complète des étapes modifiées\n    ],\n    \"marketing\": {\n      // Configuration marketing modifiée\n    },\n    \"successModal\": {\n      // Modal de succès modifiée\n    }\n  },\n  \"changes\": [\n    \"Description des changements effectués\"\n  ],\n  \"suggestions\": [\n    \"Suggestions d\'amélioration\"\n  ]\n}\n\nIMPORTANT:\n- Préserve la structure existante autant que possible\n- Applique uniquement les modifications demandées\n- Assure-toi que le JSON est valide\n- Réponds uniquement avec le JSON, sans texte supplémentaire\n','{\"formId\": \"0fc5f058-60f0-4b2c-a3e0-6c7d94588ffb\", \"changes\": [\"Titre du formulaire modifié.\", \"Description du formulaire modifiée.\", \"Ajout d\'une étape avec des champs pour collecter les informations des candidats (nom, prénom, email, téléphone, expérience, CV, lettre de motivation).\", \"Champs \'nom\', \'prénom\', \'email\', \'expérience\' et \'cv\' rendus obligatoires.\"], \"options\": {\"language\": \"fr\", \"preserveData\": true}, \"formTitle\": \"Candidature Développeur Flutter (5 ans d\'expérience)\"}',1104,4635,'2025-09-21 02:28:54','2025-09-21 02:28:54'),('9e6a04dd-9b9d-4858-8005-ff63fb48f6b3','f2026360-8fbb-11f0-9263-dd12c08e88fd','63e7c8d3-a698-4d7f-9a1a-b3097c4bd100','modify',NULL,'regenerate the form data','```json\n{\n  \"modifications\": {\n    \"title\": \"Candidature Développeur Flutter (5 ans d\'expérience)\",\n    \"description\": \"Formulaire de candidature pour un poste de Développeur Flutter avec au moins 5 ans d\'expérience.\",\n    \"theme\": \"default\",\n    \"primaryColor\": \"#3b82f6\",\n    \"steps\": [\n      {\n        \"id\": \"446f4386-a715-4ace-bb7a-ff02248be4d6\",\n        \"title\": \"Étape 1\",\n        \"fields\": [\n          {\n            \"label\": \"Nom\",\n            \"type\": \"text\",\n            \"required\": true\n          },\n          {\n            \"label\": \"Email\",\n            \"type\": \"email\",\n            \"required\": true\n          },\n          {\n            \"label\": \"Téléphone\",\n            \"type\": \"tel\"\n          },\n          {\n            \"label\": \"Expérience Flutter (en années)\",\n            \"type\": \"number\",\n            \"min\": 5,\n            \"required\": true\n          },\n          {\n            \"label\": \"CV\",\n            \"type\": \"file\",\n            \"accept\": \".pdf,.doc,.docx\"\n          },\n          {\n            \"label\": \"Lettre de motivation\",\n            \"type\": \"textarea\"\n          }\n        ]\n      }\n    ],\n    \"marketing\": {\n      \"sidebar\": {\n        \"title\": \"\",\n        \"description\": \"\",\n        \"logo\": \"\",\n        \"enabled\": true,\n        \"socialMedia\": {\n          \"enabled\": false,\n          \"title\": \"\",\n          \"buttons\": []\n        },\n        \"footer\": {\n          \"text\": \"\"\n        }\n      }\n    },\n    \"successModal\": {\n      \"title\": \"Félicitations !\",\n      \"actions\": [],\n      \"description\": \"Votre formulaire a été soumis avec succès.\",\n      \"closeEnabled\": true,\n      \"resubmitEnabled\": false,\n      \"returnHomeEnabled\": true\n    }\n  },\n  \"changes\": [\n    \"Ajout de champs dans l\'étape 1 pour collecter des informations pertinentes pour la candidature (Nom, Email, Téléphone, Expérience Flutter, CV, Lettre de motivation).\"\n  ],\n  \"suggestions\": [\n    \"Ajouter des validations supplémentaires aux champs pour assurer la qualité des données.\",\n    \"Considérer l\'ajout d\'étapes supplémentaires pour une meilleure organisation du formulaire.\",\n    \"Implémenter une confirmation de soumission avant l\'envoi final.\",\n    \"Personnaliser le message de succès avec des informations supplémentaires (ex: numéro de référence).\"\n  ]\n}\n```\n','\nTu es un expert en modification de formulaires web. Modifie le formulaire existant selon les instructions.\n\nFORMULAIRE EXISTANT:\n{\n  \"id\": \"0fc5f058-60f0-4b2c-a3e0-6c7d94588ffb\",\n  \"slug\": \"candidature-dveloppeur-flutter-5-ans-dexprience\",\n  \"title\": \"Candidature Développeur Flutter (5 ans d\'expérience)\",\n  \"description\": \"Formulaire de candidature pour un poste de Développeur Flutter avec au moins 5 ans d\'expérience.\",\n  \"steps\": [\n    {\n      \"id\": \"446f4386-a715-4ace-bb7a-ff02248be4d6\",\n      \"title\": \"Étape 1\",\n      \"fields\": []\n    }\n  ],\n  \"createdAt\": \"2025-09-20T23:20:52.000Z\",\n  \"updatedAt\": \"2025-09-21T02:29:02.000Z\",\n  \"status\": \"active\",\n  \"submissionsCount\": 0,\n  \"allowMultipleSubmissions\": 1,\n  \"requireAuthentication\": 0,\n  \"theme\": \"default\",\n  \"primaryColor\": \"#3b82f6\",\n  \"notificationEmail\": \"@\",\n  \"emailNotifications\": 0,\n  \"marketing\": {\n    \"sidebar\": {\n      \"title\": \"\",\n      \"description\": \"\",\n      \"logo\": \"\",\n      \"enabled\": true,\n      \"socialMedia\": {\n        \"enabled\": false,\n        \"title\": \"\",\n        \"buttons\": []\n      },\n      \"footer\": {\n        \"text\": \"\"\n      }\n    }\n  },\n  \"successModal\": {\n    \"title\": \"Félicitations !\",\n    \"actions\": [],\n    \"description\": \"Votre formulaire a été soumis avec succès.\",\n    \"closeEnabled\": true,\n    \"resubmitEnabled\": false,\n    \"returnHomeEnabled\": true\n  }\n}\n\nINSTRUCTIONS DE MODIFICATION: regenerate the form data\n\nOPTIONS:\n- Langue: fr\n- Préserver les données: true\n\nGénère une réponse JSON avec la structure suivante:\n{\n  \"modifications\": {\n    \"title\": \"Nouveau titre (si modifié)\",\n    \"description\": \"Nouvelle description (si modifiée)\",\n    \"theme\": \"Nouveau thème (si modifié)\",\n    \"primaryColor\": \"Nouvelle couleur (si modifiée)\",\n    \"steps\": [\n      // Structure complète des étapes modifiées\n    ],\n    \"marketing\": {\n      // Configuration marketing modifiée\n    },\n    \"successModal\": {\n      // Modal de succès modifiée\n    }\n  },\n  \"changes\": [\n    \"Description des changements effectués\"\n  ],\n  \"suggestions\": [\n    \"Suggestions d\'amélioration\"\n  ]\n}\n\nIMPORTANT:\n- Préserve la structure existante autant que possible\n- Applique uniquement les modifications demandées\n- Assure-toi que le JSON est valide\n- Réponds uniquement avec le JSON, sans texte supplémentaire\n','{\"formId\": \"0fc5f058-60f0-4b2c-a3e0-6c7d94588ffb\", \"changes\": [\"Ajout de champs dans l\'étape 1 pour collecter des informations pertinentes pour la candidature (Nom, Email, Téléphone, Expérience Flutter, CV, Lettre de motivation).\"], \"options\": {\"language\": \"fr\", \"preserveData\": true}, \"formTitle\": \"Candidature Développeur Flutter (5 ans d\'expérience)\"}',1135,5030,'2025-09-21 02:43:45','2025-09-21 02:43:45'),('d5754ce9-f8a1-4c57-b39b-be96ef5fa89a','f2026360-8fbb-11f0-9263-dd12c08e88fd','12423beb-c48d-4279-a774-e27655e4e893','generate',NULL,'Test de génération de formulaire','Réponse de test de Gemini','Prompt de test','{\"test\": true}',100,500,'2025-09-21 02:03:26','2025-09-21 02:03:26'),('f5189e47-bf25-4e6e-8b47-4fae13c82b32','f2026360-8fbb-11f0-9263-dd12c08e88fd','9d743ccd-c252-4361-98a8-388286cd47a1','modify',NULL,'genarate the first step to get the user information','```json\n{\n  \"modifications\": {\n    \"title\": \"Candidature Développeur Flutter (5 ans d\'expérience)\",\n    \"description\": \"Formulaire de candidature pour un poste de Développeur Flutter avec au moins 5 ans d\'expérience.\",\n    \"theme\": \"default\",\n    \"primaryColor\": \"#3b82f6\",\n    \"steps\": [\n      {\n        \"id\": \"446f4386-a715-4ace-bb7a-ff02248be4d6\",\n        \"title\": \"Étape 1: Informations personnelles\",\n        \"fields\": [\n          {\n            \"type\": \"text\",\n            \"label\": \"Nom\",\n            \"name\": \"nom\",\n            \"required\": true\n          },\n          {\n            \"type\": \"text\",\n            \"label\": \"Prénom\",\n            \"name\": \"prenom\",\n            \"required\": true\n          },\n          {\n            \"type\": \"email\",\n            \"label\": \"Adresse email\",\n            \"name\": \"email\",\n            \"required\": true\n          },\n          {\n            \"type\": \"tel\",\n            \"label\": \"Numéro de téléphone\",\n            \"name\": \"telephone\"\n          },\n          {\n            \"type\": \"textarea\",\n            \"label\": \"Adresse\",\n            \"name\": \"adresse\"\n          }\n        ]\n      }\n    ],\n    \"marketing\": {\n      \"sidebar\": {\n        \"title\": \"\",\n        \"description\": \"\",\n        \"logo\": \"\",\n        \"enabled\": true,\n        \"socialMedia\": {\n          \"enabled\": false,\n          \"title\": \"\",\n          \"buttons\": []\n        },\n        \"footer\": {\n          \"text\": \"\"\n        }\n      }\n    },\n    \"successModal\": {\n      \"title\": \"Félicitations !\",\n      \"actions\": [],\n      \"description\": \"Votre formulaire a été soumis avec succès.\",\n      \"closeEnabled\": true,\n      \"resubmitEnabled\": false,\n      \"returnHomeEnabled\": true\n    }\n  },\n  \"changes\": [\n    \"Ajout d\'une étape 1 avec des champs pour les informations personnelles (Nom, Prénom, Email, Téléphone, Adresse).\"\n  ],\n  \"suggestions\": [\n    \"Ajouter des champs pour la validation de l\'email et du numéro de téléphone.\",\n    \"Ajouter des champs pour l\'expérience professionnelle et les compétences.\",\n    \"Considérer l\'ajout de champs pour le CV et la lettre de motivation (type fichier).\"\n  ]\n}\n```\n','\nTu es un expert en modification de formulaires web. Modifie le formulaire existant selon les instructions.\n\nFORMULAIRE EXISTANT:\n{\n  \"id\": \"0fc5f058-60f0-4b2c-a3e0-6c7d94588ffb\",\n  \"slug\": \"candidature-dveloppeur-flutter-5-ans-dexprience\",\n  \"title\": \"Candidature Développeur Flutter (5 ans d\'expérience)\",\n  \"description\": \"Formulaire de candidature pour un poste de Développeur Flutter avec au moins 5 ans d\'expérience.\",\n  \"steps\": [\n    {\n      \"id\": \"446f4386-a715-4ace-bb7a-ff02248be4d6\",\n      \"title\": \"Étape 1\",\n      \"fields\": []\n    }\n  ],\n  \"createdAt\": \"2025-09-20T23:20:52.000Z\",\n  \"updatedAt\": \"2025-09-21T02:45:18.000Z\",\n  \"status\": \"active\",\n  \"submissionsCount\": 0,\n  \"allowMultipleSubmissions\": 1,\n  \"requireAuthentication\": 0,\n  \"theme\": \"default\",\n  \"primaryColor\": \"#3b82f6\",\n  \"notificationEmail\": \"@\",\n  \"emailNotifications\": 0,\n  \"marketing\": {\n    \"sidebar\": {\n      \"title\": \"\",\n      \"description\": \"\",\n      \"logo\": \"\",\n      \"enabled\": true,\n      \"socialMedia\": {\n        \"enabled\": false,\n        \"title\": \"\",\n        \"buttons\": []\n      },\n      \"footer\": {\n        \"text\": \"\"\n      }\n    }\n  },\n  \"successModal\": {\n    \"title\": \"Félicitations !\",\n    \"actions\": [],\n    \"description\": \"Votre formulaire a été soumis avec succès.\",\n    \"closeEnabled\": true,\n    \"resubmitEnabled\": false,\n    \"returnHomeEnabled\": true\n  }\n}\n\nINSTRUCTIONS DE MODIFICATION: genarate the first step to get the user information\n\nOPTIONS:\n- Langue: fr\n- Préserver les données: true\n\nGénère une réponse JSON avec la structure suivante:\n{\n  \"modifications\": {\n    \"title\": \"Nouveau titre (si modifié)\",\n    \"description\": \"Nouvelle description (si modifiée)\",\n    \"theme\": \"Nouveau thème (si modifié)\",\n    \"primaryColor\": \"Nouvelle couleur (si modifiée)\",\n    \"steps\": [\n      // Structure complète des étapes modifiées\n    ],\n    \"marketing\": {\n      // Configuration marketing modifiée\n    },\n    \"successModal\": {\n      // Modal de succès modifiée\n    }\n  },\n  \"changes\": [\n    \"Description des changements effectués\"\n  ],\n  \"suggestions\": [\n    \"Suggestions d\'amélioration\"\n  ]\n}\n\nIMPORTANT:\n- Préserve la structure existante autant que possible\n- Applique uniquement les modifications demandées\n- Assure-toi que le JSON est valide\n- Réponds uniquement avec le JSON, sans texte supplémentaire\n','{\"formId\": \"0fc5f058-60f0-4b2c-a3e0-6c7d94588ffb\", \"changes\": [\"Ajout d\'une étape 1 avec des champs pour les informations personnelles (Nom, Prénom, Email, Téléphone, Adresse).\"], \"options\": {\"language\": \"fr\", \"preserveData\": true}, \"formTitle\": \"Candidature Développeur Flutter (5 ans d\'expérience)\"}',1103,4685,'2025-09-21 02:47:48','2025-09-21 02:47:48');
/*!40000 ALTER TABLE `gemini_conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gemini_sessions`
--

DROP TABLE IF EXISTS `gemini_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gemini_sessions` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `gemini_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gemini_sessions`
--

LOCK TABLES `gemini_sessions` WRITE;
/*!40000 ALTER TABLE `gemini_sessions` DISABLE KEYS */;
INSERT INTO `gemini_sessions` VALUES ('10f59454-dfd5-4a3e-bfca-2f70f8604d59','f2026360-8fbb-11f0-9263-dd12c08e88fd','Test de sauvegarde','Session de test pour vérifier la sauvegarde des conversations',1,'2025-09-21 02:04:09','2025-09-21 02:04:09'),('12423beb-c48d-4279-a774-e27655e4e893','f2026360-8fbb-11f0-9263-dd12c08e88fd','Test de sauvegarde','Session de test pour vérifier la sauvegarde des conversations',1,'2025-09-21 02:03:26','2025-09-21 02:03:26'),('14125478-6f10-48e7-aec7-cf686986c06f','f2026360-8fbb-11f0-9263-dd12c08e88fd','Test de sauvegarde','Session de test pour vérifier la sauvegarde des conversations',1,'2025-09-21 02:02:23','2025-09-21 02:02:23'),('36b95469-cece-4b7f-b438-bcd79fe9f6f0','f2026360-8fbb-11f0-9263-dd12c08e88fd','Modification: Candidature Développeur Flutter (5 ans d\'expérience)','Session de modification de formulaire - i want a form for getting condidates for a job role flutter developer with 5 years exeprience...',1,'2025-09-21 02:28:54','2025-09-21 02:28:54'),('5101643f-3f3d-42f4-b900-c96679dfc3be','f2026360-8fbb-11f0-9263-dd12c08e88fd','Test de sauvegarde','Session de test pour vérifier la sauvegarde des conversations',1,'2025-09-21 02:05:32','2025-09-21 02:05:32'),('573c92f4-af97-4cdf-98ed-3da5bb5a803d','f2026360-8fbb-11f0-9263-dd12c08e88fd','Test de sauvegarde','Session de test pour vérifier la sauvegarde des conversations',1,'2025-09-21 02:00:39','2025-09-21 02:00:39'),('5fe415cd-e2b3-404d-b3f1-448ac3b38457','f2026360-8fbb-11f0-9263-dd12c08e88fd','Test de sauvegarde','Session de test pour vérifier la sauvegarde des conversations',1,'2025-09-21 02:02:01','2025-09-21 02:02:01'),('63e7c8d3-a698-4d7f-9a1a-b3097c4bd100','f2026360-8fbb-11f0-9263-dd12c08e88fd','Modification: Candidature Développeur Flutter (5 ans d\'expérience)','Session de modification de formulaire - regenerate the form data...',1,'2025-09-21 02:43:45','2025-09-21 02:43:45'),('71b58ace-d799-42d6-b61b-1b9674e2458d','f2026360-8fbb-11f0-9263-dd12c08e88fd','Test de sauvegarde','Session de test pour vérifier la sauvegarde des conversations',1,'2025-09-21 02:04:46','2025-09-21 02:04:46'),('79aa7f89-dc39-4a73-84a4-290cff75fab8','f2026360-8fbb-11f0-9263-dd12c08e88fd','Test de sauvegarde','Session de test pour vérifier la sauvegarde des conversations',1,'2025-09-21 02:03:00','2025-09-21 02:03:00'),('8781d277-455d-4500-9ea4-784335e6b9e6','f2026360-8fbb-11f0-9263-dd12c08e88fd','Modification: Formulaire généré automatiquement (mis à jour)','Session de modification de formulaire - Ajouter un champ pour l\'adresse postale....',1,'2025-09-21 02:25:24','2025-09-21 02:25:24'),('963cfe86-84a3-4082-b88d-01505b97197c','f2026360-8fbb-11f0-9263-dd12c08e88fd','Modification: Formulaire généré automatiquement','Session de modification de formulaire - Ajouter un champ téléphone à ce formulaire...',1,'2025-09-21 02:00:30','2025-09-21 02:00:30'),('98b95190-64a8-446c-9d9f-4b3fb15c6b1e','f2026360-8fbb-11f0-9263-dd12c08e88fd','Test de sauvegarde','Session de test pour vérifier la sauvegarde des conversations',1,'2025-09-21 02:04:23','2025-09-21 02:04:23'),('9d743ccd-c252-4361-98a8-388286cd47a1','f2026360-8fbb-11f0-9263-dd12c08e88fd','Modification: Candidature Développeur Flutter (5 ans d\'expérience)','Session de modification de formulaire - genarate the first step to get the user information...',1,'2025-09-21 02:47:48','2025-09-21 02:47:48'),('ade4c027-bdd1-495b-8a14-bd1da6dd85e8','f2026360-8fbb-11f0-9263-dd12c08e88fd','Modification: Candidature Développeur Flutter (5 ans d\'expérience)','Session de modification de formulaire - generate the first step to get the personal information...',1,'2025-09-21 02:45:18','2025-09-21 02:45:18'),('c3ca39cb-9237-49b5-ad5e-b889fc88b3ea','f2026360-8fbb-11f0-9263-dd12c08e88fd','Test de sauvegarde','Session de test pour vérifier la sauvegarde des conversations',1,'2025-09-21 02:01:06','2025-09-21 02:01:06'),('c9589c57-3525-43e6-815f-0961f4e2212e','f2026360-8fbb-11f0-9263-dd12c08e88fd','Test de sauvegarde','Session de test pour vérifier la sauvegarde des conversations',1,'2025-09-21 02:01:40','2025-09-21 02:01:40'),('ded476eb-d337-4b67-97bc-e9393d58f72f','f2026360-8fbb-11f0-9263-dd12c08e88fd','Test de sauvegarde','Session de test pour vérifier la sauvegarde des conversations',1,'2025-09-21 02:03:11','2025-09-21 02:03:11'),('e0ea71f1-9c78-469a-99a5-1c049deac67d','f2026360-8fbb-11f0-9263-dd12c08e88fd','Modification: Formulaire généré automatiquement (mis à jour)','Session de modification de formulaire - Comment puis-je vous aider ?...',1,'2025-09-21 02:24:15','2025-09-21 02:24:15'),('eab2a73f-517d-4ae7-a946-70f62ed859f7','f2026360-8fbb-11f0-9263-dd12c08e88fd','Test de sauvegarde','Session de test pour vérifier la sauvegarde des conversations',1,'2025-09-21 02:03:23','2025-09-21 02:03:23');
/*!40000 ALTER TABLE `gemini_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `marketing_settings`
--

DROP TABLE IF EXISTS `marketing_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `marketing_settings` (
  `id` varchar(36) NOT NULL,
  `form_id` varchar(36) NOT NULL,
  `sidebar_title` varchar(255) DEFAULT NULL,
  `sidebar_description` text,
  `sidebar_logo` varchar(500) DEFAULT NULL,
  `sidebar_enabled` tinyint(1) DEFAULT '1',
  `footer_text` text,
  `social_media_enabled` tinyint(1) DEFAULT '0',
  `social_media_title` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `sidebar_is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_form_marketing` (`form_id`),
  CONSTRAINT `marketing_settings_ibfk_1` FOREIGN KEY (`form_id`) REFERENCES `forms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `marketing_settings`
--

LOCK TABLES `marketing_settings` WRITE;
/*!40000 ALTER TABLE `marketing_settings` DISABLE KEYS */;
INSERT INTO `marketing_settings` VALUES ('66f229b5-d4bc-4ba1-a130-a34aac0f8a7a','0c98e9a2-3ec3-45a6-ad6a-47750d385263','Votre Avis Compte','Chaque retour d\'expérience nous aide à grandir et à mieux vous servir. Votre opinion est précieuse pour nous et contribue à améliorer l\'expérience de tous nos utilisateurs.','',1,'© 2024 Votre Nom d\'Entreprise. Merci pour votre confiance.',1,'Partagez Votre Expérience','2025-09-28 18:56:15','2025-09-28 18:56:15',1);
/*!40000 ALTER TABLE `marketing_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `social_media_buttons`
--

DROP TABLE IF EXISTS `social_media_buttons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `social_media_buttons` (
  `id` varchar(36) NOT NULL,
  `marketing_id` varchar(36) NOT NULL,
  `platform` varchar(50) NOT NULL,
  `url` varchar(500) NOT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `is_enabled` tinyint(1) DEFAULT '1',
  `button_order` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_marketing_id` (`marketing_id`),
  KEY `idx_button_order` (`button_order`),
  CONSTRAINT `social_media_buttons_ibfk_1` FOREIGN KEY (`marketing_id`) REFERENCES `marketing_settings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `social_media_buttons`
--

LOCK TABLES `social_media_buttons` WRITE;
/*!40000 ALTER TABLE `social_media_buttons` DISABLE KEYS */;
INSERT INTO `social_media_buttons` VALUES ('cf208d70-9c9c-11f0-ac6d-b64d61fed635','66f229b5-d4bc-4ba1-a130-a34aac0f8a7a','twitter','https://twitter.com/votreentreprise','bi bi-twitter',1,1,'2025-09-28 18:56:15'),('cf20bbd8-9c9c-11f0-ac6d-b64d61fed635','66f229b5-d4bc-4ba1-a130-a34aac0f8a7a','linkedin','https://linkedin.com/company/votreentreprise','bi bi-linkedin',1,2,'2025-09-28 18:56:15'),('cf20d2c6-9c9c-11f0-ac6d-b64d61fed635','66f229b5-d4bc-4ba1-a130-a34aac0f8a7a','facebook','https://facebook.com/votreentreprise','bi bi-facebook',1,3,'2025-09-28 18:56:15'),('cf20eb94-9c9c-11f0-ac6d-b64d61fed635','66f229b5-d4bc-4ba1-a130-a34aac0f8a7a','google','https://g.page/votreentreprise/review','bi bi-google',1,4,'2025-09-28 18:56:15');
/*!40000 ALTER TABLE `social_media_buttons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_history`
--

DROP TABLE IF EXISTS `subscription_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_history` (
  `id` varchar(36) NOT NULL,
  `subscription_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `action` enum('created','activated','upgraded','downgraded','cancelled','renewed','expired','suspended','reactivated','payment_failed','payment_succeeded') NOT NULL,
  `previous_account_type_id` varchar(36) DEFAULT NULL,
  `new_account_type_id` varchar(36) DEFAULT NULL,
  `previous_status` varchar(50) DEFAULT NULL,
  `new_status` varchar(50) DEFAULT NULL,
  `previous_amount` decimal(10,2) DEFAULT NULL,
  `new_amount` decimal(10,2) DEFAULT NULL,
  `previous_billing_cycle` varchar(20) DEFAULT NULL,
  `new_billing_cycle` varchar(20) DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `changed_by` varchar(36) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `previous_account_type_id` (`previous_account_type_id`),
  KEY `new_account_type_id` (`new_account_type_id`),
  KEY `changed_by` (`changed_by`),
  KEY `idx_subscription_id` (`subscription_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action` (`action`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `subscription_history_ibfk_1` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `subscription_history_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `subscription_history_ibfk_3` FOREIGN KEY (`previous_account_type_id`) REFERENCES `account_types` (`id`) ON DELETE SET NULL,
  CONSTRAINT `subscription_history_ibfk_4` FOREIGN KEY (`new_account_type_id`) REFERENCES `account_types` (`id`) ON DELETE SET NULL,
  CONSTRAINT `subscription_history_ibfk_5` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_history`
--

LOCK TABLES `subscription_history` WRITE;
/*!40000 ALTER TABLE `subscription_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `subscription_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_notifications`
--

DROP TABLE IF EXISTS `subscription_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_notifications` (
  `id` varchar(36) NOT NULL,
  `subscription_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `type` enum('trial_ending','payment_due','payment_failed','subscription_expired','limit_reached','upgrade_available','downgrade_warning') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `status` enum('pending','sent','failed','read') DEFAULT 'pending',
  `delivery_method` enum('email','in_app','sms') DEFAULT 'email',
  `scheduled_for` timestamp NULL DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_subscription_id` (`subscription_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  KEY `idx_scheduled_for` (`scheduled_for`),
  CONSTRAINT `subscription_notifications_ibfk_1` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `subscription_notifications_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_notifications`
--

LOCK TABLES `subscription_notifications` WRITE;
/*!40000 ALTER TABLE `subscription_notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `subscription_notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_usage`
--

DROP TABLE IF EXISTS `subscription_usage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_usage` (
  `id` varchar(36) NOT NULL,
  `subscription_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `period_start` timestamp NOT NULL,
  `period_end` timestamp NOT NULL,
  `forms_created` int DEFAULT '0',
  `submissions_received` int DEFAULT '0',
  `exports_performed` int DEFAULT '0',
  `max_forms` int NOT NULL,
  `max_submissions_per_form` int NOT NULL,
  `max_exports_per_form` int NOT NULL,
  `is_over_limit` tinyint(1) DEFAULT '0',
  `over_limit_details` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_subscription_period` (`subscription_id`,`period_start`,`period_end`),
  KEY `idx_subscription_id` (`subscription_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_period` (`period_start`,`period_end`),
  KEY `idx_is_over_limit` (`is_over_limit`),
  CONSTRAINT `subscription_usage_ibfk_1` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `subscription_usage_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_usage`
--

LOCK TABLES `subscription_usage` WRITE;
/*!40000 ALTER TABLE `subscription_usage` DISABLE KEYS */;
/*!40000 ALTER TABLE `subscription_usage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscriptions`
--

DROP TABLE IF EXISTS `subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscriptions` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `account_type_id` varchar(36) NOT NULL,
  `status` enum('active','inactive','cancelled','expired','suspended','pending') DEFAULT 'pending',
  `billing_cycle` enum('monthly','yearly') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'USD',
  `start_date` timestamp NOT NULL,
  `end_date` timestamp NULL DEFAULT NULL,
  `next_billing_date` timestamp NULL DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `payment_provider` varchar(50) DEFAULT NULL,
  `payment_provider_subscription_id` varchar(255) DEFAULT NULL,
  `payment_method_id` varchar(255) DEFAULT NULL,
  `trial_start_date` timestamp NULL DEFAULT NULL,
  `trial_end_date` timestamp NULL DEFAULT NULL,
  `is_trial` tinyint(1) DEFAULT '0',
  `auto_renew` tinyint(1) DEFAULT '1',
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_active_user_subscription` (`user_id`,`status`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_account_type_id` (`account_type_id`),
  KEY `idx_status` (`status`),
  KEY `idx_billing_cycle` (`billing_cycle`),
  KEY `idx_next_billing_date` (`next_billing_date`),
  KEY `idx_payment_provider` (`payment_provider`),
  CONSTRAINT `subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `subscriptions_ibfk_2` FOREIGN KEY (`account_type_id`) REFERENCES `account_types` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscriptions`
--

LOCK TABLES `subscriptions` WRITE;
/*!40000 ALTER TABLE `subscriptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_preferences`
--

DROP TABLE IF EXISTS `user_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_preferences` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `account_type` enum('free','basic','premium','enterprise') DEFAULT 'free',
  `max_forms` int DEFAULT '5',
  `max_submissions_per_form` int DEFAULT '100',
  `can_export_forms` tinyint(1) DEFAULT '0',
  `can_export_submissions` tinyint(1) DEFAULT '0',
  `max_exports_per_form` int DEFAULT '0',
  `max_exports_per_submission` int DEFAULT '0',
  `additional_preferences` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `subscription_id` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_preferences` (`user_id`),
  KEY `idx_account_type` (`account_type`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_subscription_id` (`subscription_id`),
  CONSTRAINT `user_preferences_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_preferences_ibfk_2` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_preferences`
--

LOCK TABLES `user_preferences` WRITE;
/*!40000 ALTER TABLE `user_preferences` DISABLE KEYS */;
INSERT INTO `user_preferences` VALUES ('82fcaab2-992e-11f0-ac6d-b64d61fed635','f2026360-8fbb-11f0-9263-dd12c08e88fd','enterprise',999999,999999,1,1,999999,999999,NULL,'2025-09-24 10:09:09','2025-09-24 10:09:09',NULL),('82fcac60-992e-11f0-ac6d-b64d61fed635','3b05e8c4-9490-11f0-ac6d-b64d61fed635','free',5,100,0,0,0,0,NULL,'2025-09-24 10:09:09','2025-09-24 10:09:09',NULL),('82fcacce-992e-11f0-ac6d-b64d61fed635','549fe664-968d-11f0-ac6d-b64d61fed635','free',5,100,0,0,0,0,NULL,'2025-09-24 10:09:09','2025-09-24 10:09:09',NULL),('82fcad1e-992e-11f0-ac6d-b64d61fed635','6e5293fc-94eb-11f0-ac6d-b64d61fed635','free',5,100,0,0,0,0,NULL,'2025-09-24 10:09:09','2025-09-24 10:09:09',NULL);
/*!40000 ALTER TABLE `user_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','user') DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `blocked_at` timestamp NULL DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `email_verification_token` varchar(255) DEFAULT NULL,
  `password_reset_token` varchar(255) DEFAULT NULL,
  `password_reset_expires_at` timestamp NULL DEFAULT NULL,
  `email_verification_code` varchar(6) DEFAULT NULL,
  `email_verification_code_expires_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_users_blocked_at` (`blocked_at`),
  KEY `idx_users_email_verified_at` (`email_verified_at`),
  KEY `idx_email_verification_token` (`email_verification_token`),
  KEY `idx_users_password_reset_token` (`password_reset_token`),
  KEY `idx_users_password_reset_expires_at` (`password_reset_expires_at`),
  KEY `idx_users_email_verification_token` (`email_verification_token`),
  KEY `idx_users_email_verification_code` (`email_verification_code`),
  KEY `idx_users_email_verification_code_expires_at` (`email_verification_code_expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('3b05e8c4-9490-11f0-ac6d-b64d61fed635','test@dynamicforms.fr','Test account','$2a$10$akmdaWLegcCm.YGeVwGblOFyE1BpbEUC03Y9jrNArnOfNvs.paCsW','user','2025-09-18 13:06:03','2025-09-29 16:05:03',NULL,'2025-09-29 16:05:03','1cbebe85641f46ef1c66dc003d76bc55241802eb3e1d0bb9109980b958175b8d','bf1088f5c5753f0ad28057ab9e6577dd262a1030ef8cf4b9bbc0747f2d235882','2025-09-29 16:58:43',NULL,NULL),('549fe664-968d-11f0-ac6d-b64d61fed635','test2@example.com','Test User','$2a$10$z4dNqTfyQ/M5i6WpMdp/q..W63t0yJ3f54fCo3Kna2aj/aeBeP2KW','user','2025-09-21 01:50:20','2025-09-21 01:50:20',NULL,NULL,NULL,NULL,NULL,NULL,NULL),('6e5293fc-94eb-11f0-ac6d-b64d61fed635','test@example.com','Test User','$2a$10$TTalRVkITv3OXloYOCGVb.ozeQQQodmsnsTNQMIfUksXCjNnGD6Yi','user','2025-09-18 23:58:53','2025-09-29 15:56:54',NULL,NULL,NULL,'2941ac8f94a6c2d4874ca888019daab7b736fff9caf05b62bfbe95cb24946bd7','2025-09-29 16:56:54','838047','2025-09-29 16:06:54'),('f2026360-8fbb-11f0-9263-dd12c08e88fd','iliyasszamouri@gmail.com','Iliyass Zamouri','$2a$10$i7xT4376dIhXYJw4W5cvf.zHeKywrGgZ62w2QPRibkRQPwhVawvG6','admin','2025-09-12 09:36:23','2025-09-29 15:04:07',NULL,'2025-09-29 15:04:06',NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Final view structure for view `form_analytics_overview`
--

/*!50001 DROP VIEW IF EXISTS `form_analytics_overview`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `form_analytics_overview` AS select `f`.`id` AS `form_id`,`f`.`title` AS `form_title`,`f`.`slug` AS `form_slug`,count(distinct `fv`.`id`) AS `total_visits`,count(distinct `fv`.`user_id`) AS `unique_logged_users`,count(distinct `fv`.`session_id`) AS `unique_sessions`,count(distinct (case when (`fss`.`submission_completed` = true) then `fss`.`id` end)) AS `completed_submissions`,count(distinct (case when (`fss`.`submission_completed` = false) then `fss`.`id` end)) AS `abandoned_sessions`,avg(`fss`.`total_time_spent_ms`) AS `avg_session_duration_ms`,avg(`fss`.`total_steps_completed`) AS `avg_steps_completed`,avg(`fss`.`total_field_interactions`) AS `avg_field_interactions`,avg(`fss`.`total_validation_errors`) AS `avg_validation_errors`,(case when (count(distinct `fss`.`id`) > 0) then ((count(distinct (case when (`fss`.`submission_completed` = true) then `fss`.`id` end)) * 100.0) / count(distinct `fss`.`id`)) else 0 end) AS `conversion_rate` from ((`forms` `f` left join `form_visits` `fv` on((`f`.`id` = `fv`.`form_id`))) left join `form_submission_sessions` `fss` on((`f`.`id` = `fss`.`form_id`))) group by `f`.`id`,`f`.`title`,`f`.`slug` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `form_step_analytics_overview`
--

/*!50001 DROP VIEW IF EXISTS `form_step_analytics_overview`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `form_step_analytics_overview` AS select `f`.`id` AS `form_id`,`f`.`title` AS `form_title`,`fs`.`id` AS `step_id`,`fs`.`title` AS `step_title`,`fs`.`step_order` AS `step_order`,count(distinct `fst`.`id`) AS `total_step_visits`,count(distinct `fst`.`user_id`) AS `unique_logged_users`,count(distinct `fst`.`session_id`) AS `unique_sessions`,avg(`fst`.`time_spent_ms`) AS `avg_time_spent_ms`,avg(`fst`.`field_interactions`) AS `avg_field_interactions`,avg(`fst`.`validation_errors`) AS `avg_validation_errors`,count(distinct (case when (`fst`.`step_completed_at` is not null) then `fst`.`id` end)) AS `completed_steps`,(case when (count(distinct `fst`.`id`) > 0) then ((count(distinct (case when (`fst`.`step_completed_at` is not null) then `fst`.`id` end)) * 100.0) / count(distinct `fst`.`id`)) else 0 end) AS `step_completion_rate` from ((`forms` `f` join `form_steps` `fs` on((`f`.`id` = `fs`.`form_id`))) left join `form_step_tracking` `fst` on((`fs`.`id` = `fst`.`step_id`))) group by `f`.`id`,`f`.`title`,`fs`.`id`,`fs`.`title`,`fs`.`step_order` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-29 20:12:39
