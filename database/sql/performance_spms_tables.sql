CREATE DATABASE IF NOT EXISTS `db_neda_ipms`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE `db_neda_ipms`;

SET NAMES utf8mb4;
SET time_zone = '+00:00';

DROP TABLE IF EXISTS `performance_task_delegations`;
DROP TABLE IF EXISTS `performance_reviews`;
DROP TABLE IF EXISTS `performance_document_items`;
DROP TABLE IF EXISTS `performance_documents`;
DROP TABLE IF EXISTS `performance_library_items`;

CREATE TABLE `performance_library_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `item_type` varchar(50) NOT NULL,
  `parent_id` bigint unsigned DEFAULT NULL,
  `code` varchar(50) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `scope` varchar(20) DEFAULT NULL,
  `indicator_type` varchar(50) DEFAULT NULL,
  `target` text DEFAULT NULL,
  `unit` varchar(100) DEFAULT NULL,
  `sort_order` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint unsigned DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `performance_library_items_parent_id_index` (`parent_id`),
  KEY `performance_library_items_item_type_index` (`item_type`),
  KEY `performance_library_items_scope_index` (`scope`),
  CONSTRAINT `performance_library_items_parent_id_foreign`
    FOREIGN KEY (`parent_id`) REFERENCES `performance_library_items` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `performance_documents` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `doc_type` varchar(20) NOT NULL,
  `scope_id` bigint unsigned DEFAULT NULL,
  `employee_id` bigint unsigned DEFAULT NULL,
  `division_id` bigint unsigned DEFAULT NULL,
  `office_id` bigint unsigned DEFAULT NULL,
  `period_year` int NOT NULL,
  `period_from` date DEFAULT NULL,
  `period_to` date DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Draft',
  `remarks` text DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `performance_documents_doc_type_index` (`doc_type`),
  KEY `performance_documents_scope_id_index` (`scope_id`),
  KEY `performance_documents_employee_id_index` (`employee_id`),
  KEY `performance_documents_division_id_index` (`division_id`),
  KEY `performance_documents_office_id_index` (`office_id`),
  KEY `performance_documents_status_index` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `performance_document_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `performance_document_id` bigint unsigned NOT NULL,
  `library_item_id` bigint unsigned DEFAULT NULL,
  `item_type` varchar(50) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `target` text DEFAULT NULL,
  `actual` text DEFAULT NULL,
  `rating` decimal(5,2) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `sort_order` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `performance_document_items_performance_document_id_index` (`performance_document_id`),
  KEY `performance_document_items_library_item_id_index` (`library_item_id`),
  KEY `performance_document_items_item_type_index` (`item_type`),
  CONSTRAINT `performance_document_items_performance_document_id_foreign`
    FOREIGN KEY (`performance_document_id`) REFERENCES `performance_documents` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `performance_document_items_library_item_id_foreign`
    FOREIGN KEY (`library_item_id`) REFERENCES `performance_library_items` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `performance_reviews` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `performance_document_id` bigint unsigned NOT NULL,
  `review_level` varchar(20) NOT NULL,
  `reviewer_id` bigint unsigned DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'For Review',
  `remarks` text DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `performance_reviews_performance_document_id_index` (`performance_document_id`),
  KEY `performance_reviews_review_level_index` (`review_level`),
  KEY `performance_reviews_status_index` (`status`),
  CONSTRAINT `performance_reviews_performance_document_id_foreign`
    FOREIGN KEY (`performance_document_id`) REFERENCES `performance_documents` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `performance_task_delegations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `source_email_id` varchar(255) DEFAULT NULL,
  `subject` varchar(255) NOT NULL,
  `message_preview` text DEFAULT NULL,
  `assigned_to_user_id` bigint unsigned DEFAULT NULL,
  `assigned_to_employee_id` bigint unsigned DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Open',
  `due_date` date DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `performance_task_delegations_source_email_id_index` (`source_email_id`),
  KEY `performance_task_delegations_status_index` (`status`),
  KEY `performance_task_delegations_due_date_index` (`due_date`),
  KEY `performance_task_delegations_assigned_to_user_id_index` (`assigned_to_user_id`),
  KEY `performance_task_delegations_assigned_to_employee_id_index` (`assigned_to_employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
