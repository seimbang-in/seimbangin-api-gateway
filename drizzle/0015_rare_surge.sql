ALTER TABLE `transactions` MODIFY COLUMN `amount` decimal NOT NULL DEFAULT '0.0';--> statement-breakpoint
ALTER TABLE `transactions` ADD `name` varchar(255) DEFAULT 'Transaction' NOT NULL;