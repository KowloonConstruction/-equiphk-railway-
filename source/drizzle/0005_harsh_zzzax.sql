CREATE TABLE `user_favourites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`equipmentItemId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_favourites_id` PRIMARY KEY(`id`)
);
