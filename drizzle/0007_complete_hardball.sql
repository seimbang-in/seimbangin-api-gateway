CREATE TABLE `user_financial_profile` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint NOT NULL,
	`monthly_income` decimal,
	`current_savings` decimal,
	`debt` decimal,
	`financial_goals` text,
	`risk_management` decimal,
	CONSTRAINT `user_financial_profile_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user_financial_profile` ADD CONSTRAINT `user_financial_profile_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;