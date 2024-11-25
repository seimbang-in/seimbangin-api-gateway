ALTER TABLE `users` ADD `full_name` VARCHAR(255) NOT NULL AFTER `role`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `first_name`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `last_name`;