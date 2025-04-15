ALTER TABLE `chat_history` MODIFY COLUMN `created_at` timestamp DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `user_financial_profile` ADD `total_income` decimal(16,2) DEFAULT '0.0';--> statement-breakpoint
ALTER TABLE `user_financial_profile` ADD `total_outcome` decimal(16,2) DEFAULT '0.0';