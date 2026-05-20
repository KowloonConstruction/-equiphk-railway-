CREATE TABLE `equipment_return_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`returnedAt` timestamp NOT NULL DEFAULT (now()),
	`condition` enum('excellent','good','fair','damaged','missing_items') NOT NULL,
	`overallNotes` text,
	`completedByUserId` int NOT NULL,
	`totalCharges` decimal(10,2) NOT NULL DEFAULT '0',
	`chargeSentToCustomer` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `equipment_return_logs_id` PRIMARY KEY(`id`),
	CONSTRAINT `equipment_return_logs_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `return_charges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`returnLogId` int NOT NULL,
	`chargeType` enum('damage','repair','cleaning','missing_item','other') NOT NULL,
	`description` varchar(500) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`photoUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `return_charges_id` PRIMARY KEY(`id`)
);
