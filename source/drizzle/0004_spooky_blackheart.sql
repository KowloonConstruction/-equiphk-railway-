CREATE TABLE `equipment_manuals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`equipmentItemId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileSize` int,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `equipment_manuals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `support_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerName` varchar(255),
	`customerPhone` varchar(64),
	`issueType` varchar(64),
	`equipmentName` varchar(255),
	`summary` text,
	`conversationLog` text,
	`status` enum('open','in_progress','resolved') NOT NULL DEFAULT 'open',
	`whatsappSent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `support_tickets_id` PRIMARY KEY(`id`)
);
