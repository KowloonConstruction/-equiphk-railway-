CREATE TABLE `bundle_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bundleId` int NOT NULL,
	`equipmentItemId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`note` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bundle_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `equipment_bundles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`imageUrl` text,
	`dailyRate` decimal(10,2),
	`weeklyRate` decimal(10,2),
	`monthlyRate` decimal(10,2),
	`savingsPercent` int,
	`categoryTag` varchar(64),
	`isActive` boolean NOT NULL DEFAULT true,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `equipment_bundles_id` PRIMARY KEY(`id`),
	CONSTRAINT `equipment_bundles_slug_unique` UNIQUE(`slug`)
);
