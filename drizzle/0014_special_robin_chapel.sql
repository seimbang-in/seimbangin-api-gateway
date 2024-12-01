CREATE TABLE `transaction_items` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`transaction_id` bigint NOT NULL,
	`item_name` text NOT NULL,
	`category` enum('food','transportation','utilities','entertainment','shopping','healthcare','education','others') NOT NULL,
	`price` decimal NOT NULL,
	`quantity` int NOT NULL,
	`subtotal` decimal NOT NULL,
	CONSTRAINT `transaction_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `transaction_items` ADD CONSTRAINT `transaction_items_transaction_id_transactions_id_fk` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` DROP COLUMN `category`;