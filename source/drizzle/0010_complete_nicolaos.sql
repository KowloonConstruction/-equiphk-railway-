CREATE TABLE `consumables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`brand` varchar(128),
	`model` varchar(128),
	`unit` varchar(64) NOT NULL DEFAULT 'each',
	`price` decimal(10,2),
	`imageUrl` text,
	`specs` text,
	`categoryTag` varchar(128),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `consumables_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `equipment_consumables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`equipmentItemId` int NOT NULL,
	`consumableId` int NOT NULL,
	`note` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `equipment_consumables_id` PRIMARY KEY(`id`)
);
