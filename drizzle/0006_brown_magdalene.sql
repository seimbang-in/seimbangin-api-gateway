ALTER TABLE `users` MODIFY COLUMN `id` bigint AUTO_INCREMENT NOT NULL;

-- TIDB

-- -- Langkah 1: Buat tabel sementara dengan kolom id bertipe BIGINT AUTO_INCREMENT
-- CREATE TABLE `users_temp` (
--     `id` BIGINT AUTO_INCREMENT NOT NULL,
--     `role` INT NOT NULL DEFAULT 0, -- 0 untuk user, 1 untuk admin
--     `full_name` VARCHAR(255) NOT NULL,
--     `age` INT NOT NULL DEFAULT 17,
--     `balance` INT NOT NULL DEFAULT 0,
--     `username` VARCHAR(255) NOT NULL,
--     `email` VARCHAR(255) NOT NULL,
--     `password` VARCHAR(255) NOT NULL,
--     `profilePicture` VARCHAR(256),
--     `createdAt` TIMESTAMP,
--     `updatedAt` TIMESTAMP,
--     CONSTRAINT `users_temp_id` PRIMARY KEY(`id`),
--     CONSTRAINT `users_temp_email_unique` UNIQUE(`email`)
-- );

-- -- Langkah 2: Salin data dari `users` ke `users_temp`
-- INSERT INTO `users_temp` (`id`, `role`, `full_name`, `age`, `balance`, `username`, `email`, `password`, `profilePicture`, `createdAt`, `updatedAt`)
-- SELECT `id`, `role`, `full_name`, `age`, `balance`, `username`, `email`, `password`, `profile_picture`, `created_at`, `updated_at`
-- FROM `users`;

-- -- Langkah 3: Hapus tabel lama `users`
-- DROP TABLE `users`;

-- -- Langkah 4: Ubah nama tabel sementara menjadi `users`
-- ALTER TABLE `users_temp` RENAME TO `users`;
