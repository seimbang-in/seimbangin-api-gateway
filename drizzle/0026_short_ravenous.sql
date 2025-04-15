CREATE TABLE `chat_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`message` varchar(1000) NOT NULL,
	`sender` enum('advisor','bot') NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `chat_history_id` PRIMARY KEY(`id`)
);
