USE `db_neda_sso`;

ALTER TABLE `messages`
  ADD COLUMN `attachment_path` varchar(255) NULL AFTER `body`,
  ADD COLUMN `attachment_name` varchar(255) NULL AFTER `attachment_path`,
  ADD COLUMN `attachment_type` varchar(100) NULL AFTER `attachment_name`,
  ADD COLUMN `attachment_size` bigint unsigned NULL AFTER `attachment_type`;
