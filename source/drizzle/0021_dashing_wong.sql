ALTER TABLE `equipment_items` ADD `fuelType` enum('none','petrol','diesel') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `rental_orders` ADD `fuelLitres` decimal(8,2);--> statement-breakpoint
ALTER TABLE `rental_orders` ADD `fuelPricePerLitre` decimal(8,2);--> statement-breakpoint
ALTER TABLE `rental_orders` ADD `fuelType` enum('none','petrol','diesel') DEFAULT 'none';--> statement-breakpoint
ALTER TABLE `rental_orders` ADD `fuelCost` decimal(10,2) DEFAULT '0';