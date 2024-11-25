ALTER TABLE `users` ADD `role` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `password` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `profile_picture` varchar(256);--> statement-breakpoint
ALTER TABLE `users` ADD `created_at` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `updated_at` timestamp;