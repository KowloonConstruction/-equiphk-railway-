CREATE TABLE `saved_carts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`items` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saved_carts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `rental_orders` ADD `deliverySlotDate` timestamp;--> statement-breakpoint
ALTER TABLE `rental_orders` ADD `deliverySlotTime` enum('morning','afternoon','evening');--> statement-breakpoint
ALTER TABLE `rental_orders` ADD `collectionSlotDate` timestamp;--> statement-breakpoint
ALTER TABLE `rental_orders` ADD `collectionSlotTime` enum('morning','afternoon','evening');--> statement-breakpoint
ALTER TABLE `rental_orders` ADD `depositStatus` enum('held','partially_returned','fully_returned','forfeited') DEFAULT 'held';--> statement-breakpoint
ALTER TABLE `rental_orders` ADD `depositReturnedAmount` decimal(12,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `rental_orders` ADD `depositDeductionReason` text;--> statement-breakpoint
ALTER TABLE `rental_orders` ADD `depositSettledAt` timestamp;