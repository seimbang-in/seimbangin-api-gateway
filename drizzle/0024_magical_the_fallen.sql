ALTER TABLE `users` MODIFY COLUMN `password` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `googleId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_googleId_unique` UNIQUE(`googleId`);