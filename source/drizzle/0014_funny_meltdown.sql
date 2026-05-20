CREATE TABLE `rental_bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`equipmentItemId` int NOT NULL,
	`customerName` varchar(255) NOT NULL,
	`customerEmail` varchar(320),
	`customerPhone` varchar(64),
	`company` varchar(255),
	`rentalStartDate` timestamp NOT NULL,
	`rentalEndDate` timestamp NOT NULL,
	`rentalDays` int NOT NULL,
	`dailyRate` decimal(10,2),
	`totalCost` decimal(12,2),
	`status` enum('pending','active','completed','cancelled') NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rental_bookings_id` PRIMARY KEY(`id`)
);
