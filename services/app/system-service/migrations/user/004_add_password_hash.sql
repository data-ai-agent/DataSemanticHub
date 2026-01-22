-- Ensure password_hash column exists for registration/login.
-- Safe to run multiple times.

SET @table_exists := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
);

SET @add_sql := IF(
  @table_exists > 0,
  "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `password_hash` VARCHAR(60) NOT NULL DEFAULT '' COMMENT '密码哈希 (bcrypt)' AFTER `organization`",
  "SELECT 1"
);
PREPARE stmt FROM @add_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @password_col := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND column_name = 'password'
);

SET @update_sql := IF(
  @password_col > 0,
  "UPDATE `users` SET `password_hash` = `password` WHERE (`password_hash` = '' OR `password_hash` IS NULL) AND `password` IS NOT NULL",
  "SELECT 1"
);
PREPARE stmt2 FROM @update_sql;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
