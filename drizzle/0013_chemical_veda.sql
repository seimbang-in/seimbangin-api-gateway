ALTER TABLE `user_financial_profile` MODIFY COLUMN `risk_management` enum('low','medium','high');


-- -- Hapus kolom lama jika tidak diperlukan
-- ALTER TABLE `user_financial_profile` DROP COLUMN `risk_management`;

-- -- Tambahkan kolom baru dengan tipe enum
-- ALTER TABLE `user_financial_profile` ADD COLUMN `risk_management` enum('low', 'medium', 'high');