ALTER TABLE `users` ADD `gender` enum('male','female','other') DEFAULT 'other';--> statement-breakpoint
ALTER TABLE `users` ADD `birth_date` date NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(15) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `university` varchar(255);