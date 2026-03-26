USE `db_neda_sso`;

CREATE TABLE IF NOT EXISTS `conversation_reads` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `conversation_id` bigint unsigned NOT NULL,
    `user_id` bigint unsigned NOT NULL,
    `last_read_message_id` bigint unsigned NULL,
    `last_read_at` datetime NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `conversation_reads_unique` (`conversation_id`, `user_id`),
    KEY `conversation_reads_conversation_idx` (`conversation_id`),
    KEY `conversation_reads_user_idx` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
