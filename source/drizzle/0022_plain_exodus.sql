CREATE TABLE `order_email_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`customerEmail` varchar(320) NOT NULL,
	`status` enum('confirmed','active','completed','cancelled') NOT NULL,
	`subject` varchar(255) NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`error` text,
	CONSTRAINT `order_email_logs_id` PRIMARY KEY(`id`)
);
