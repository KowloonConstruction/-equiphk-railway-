CREATE TABLE `equipment_sub_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(64),
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `equipment_sub_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `equipment_sub_categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `equipment_items` ADD `subCategoryId` int;