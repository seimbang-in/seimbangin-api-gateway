CREATE TABLE `transactions` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint NOT NULL,
	`type` int NOT NULL DEFAULT 0,
	`category` enum('food','transportation','utilities','entertainment','shopping','healthcare','education') NOT NULL,
	`amount` decimal NOT NULL,
	`description` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;