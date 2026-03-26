USE `db_neda_sso`;

CREATE TABLE IF NOT EXISTS `conversation_hidden_users` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `conversation_id` bigint unsigned NOT NULL,
    `user_id` bigint unsigned NOT NULL,
    `deleted_after_message_id` bigint unsigned NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `conversation_hidden_users_conversation_id_user_id_unique` (`conversation_id`, `user_id`),
    KEY `conversation_hidden_users_conversation_id_index` (`conversation_id`),
    KEY `conversation_hidden_users_user_id_index` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
