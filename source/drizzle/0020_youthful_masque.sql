CREATE TABLE `referral_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`code` varchar(16) NOT NULL,
	`totalReferrals` int NOT NULL DEFAULT 0,
	`totalCreditsEarned` decimal(10,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referral_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `referral_codes_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `referral_codes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `referral_credits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`balance` decimal(10,2) NOT NULL DEFAULT '0',
	`lifetimeEarned` decimal(10,2) NOT NULL DEFAULT '0',
	`lifetimeRedeemed` decimal(10,2) NOT NULL DEFAULT '0',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referral_credits_id` PRIMARY KEY(`id`),
	CONSTRAINT `referral_credits_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `referral_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referralCodeId` int NOT NULL,
	`referrerId` int NOT NULL,
	`referredUserId` int NOT NULL,
	`referredEmail` varchar(320),
	`orderId` int,
	`orderAmount` decimal(12,2),
	`creditAwarded` decimal(10,2) NOT NULL DEFAULT '0',
	`status` enum('pending','awarded','expired','reversed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`awardedAt` timestamp,
	CONSTRAINT `referral_events_id` PRIMARY KEY(`id`)
);
