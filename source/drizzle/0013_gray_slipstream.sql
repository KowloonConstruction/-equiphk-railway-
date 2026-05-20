CREATE TABLE `enquiry_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('quote_request','whatsapp_click','phone_call','email_click','cart_enquiry') NOT NULL DEFAULT 'quote_request',
	`equipmentItemId` int,
	`equipmentName` varchar(255),
	`customerName` varchar(255),
	`customerEmail` varchar(320),
	`customerPhone` varchar(64),
	`company` varchar(255),
	`notes` text,
	`status` enum('new','contacted','quoted','won','lost') NOT NULL DEFAULT 'new',
	`source` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `enquiry_leads_id` PRIMARY KEY(`id`)
);
