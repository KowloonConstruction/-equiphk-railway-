CREATE TABLE `lead_replies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`sentBy` int NOT NULL,
	`sentByName` varchar(255),
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`toEmail` varchar(320) NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lead_replies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staff_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`permissions` text NOT NULL DEFAULT ('[]'),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staff_permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `staff_permissions_userId_unique` UNIQUE(`userId`)
);
