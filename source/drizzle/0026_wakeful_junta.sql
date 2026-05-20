ALTER TABLE `rental_orders` MODIFY COLUMN `depositStatus` enum('none','pending','held','captured','partially_captured','released','expired') DEFAULT 'none';--> statement-breakpoint
ALTER TABLE `rental_orders` ADD `stripeDepositIntentId` varchar(128);--> statement-breakpoint
ALTER TABLE `rental_orders` ADD `stripeDepositClientSecret` varchar(256);--> statement-breakpoint
ALTER TABLE `rental_orders` ADD `depositHoldExpiresAt` timestamp;