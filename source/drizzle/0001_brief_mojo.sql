CREATE TABLE `equipment_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(64),
	`segment` enum('b2c','b2b','both') NOT NULL DEFAULT 'both',
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `equipment_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `equipment_categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `equipment_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`brand` varchar(128),
	`model` varchar(128),
	`dailyRate` decimal(10,2),
	`weeklyRate` decimal(10,2),
	`monthlyRate` decimal(10,2),
	`pricingType` enum('fixed','negotiated') NOT NULL DEFAULT 'fixed',
	`imageUrl` text,
	`specs` text,
	`condition` enum('new','excellent','good','fair') NOT NULL DEFAULT 'good',
	`availability` enum('available','rented','maintenance','retired') NOT NULL DEFAULT 'available',
	`quantity` int NOT NULL DEFAULT 1,
	`availableQty` int NOT NULL DEFAULT 1,
	`location` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `equipment_items_id` PRIMARY KEY(`id`)
);
