drop database if exists sack_v01;
create database sack_v01;
use sack_v01;


CREATE TABLE `municipalities` (
  `municipality_id` int PRIMARY KEY AUTO_INCREMENT,
  `postal_code` int,
  `municipality_name` varchar(255),
  `municipality_image` varchar(255),
  `municipality_description` varchar(255)
);

CREATE TABLE `addresses` (
  `address_id` int PRIMARY KEY AUTO_INCREMENT,
  `address_street` varchar(255),
  `address_number` varchar(255),
  `municipality_id` int
);

CREATE TABLE `humans` (
  `human_id` int PRIMARY KEY AUTO_INCREMENT,
  `first_name` varchar(255),
  `last_name` varchar(255),
  `image` varchar(255),
  `psw` varchar(255),
  `created_at` timestamp DEFAULT current_timestamp,
  `address_id` int,
  `mail` varchar(255),
  `verified_mail` boolean,
  `verification_mail_code` int,
  `prefix` integer DEFAULT 39,
  `telephone` bigint,
  `verified_telephone` boolean,
  `verification_telephone_code` varchar(255)
);

CREATE TABLE `shops` (
  `shop_id` int PRIMARY KEY AUTO_INCREMENT,
  `shop_cathegory_id` int,
  `name` varchar(255),
  `mail` varchar(255),
  `prefix` integer DEFAULT 39,
  `telephone` bigint,
  `description` varchar(255),
  `image` varchar(255),
  `min_purchase` double,
  `delivery_from_dow` varchar(255),
  `delivery_to_dow` varchar(255),
  `open_from_dow` varchar(255),
  `open_to_dow` varchar(255),
  `delivery_from_time` time,
  `delivery_to_time` time,
  `open_from_time` time,
  `open_to_time` time,
  `delivery_cost` double,
  `created_at` timestamp DEFAULT current_timestamp,
  `address_id` int
);

CREATE TABLE `shop_cathegories` (
  `shop_cathegory_id` int PRIMARY KEY AUTO_INCREMENT,
  `shop_cathegory_text` varchar(255)
);

CREATE TABLE `deliver_to` (
  `deliver_to_id` int PRIMARY KEY AUTO_INCREMENT,
  `shop_id` int,
  `municipality_id` int
);

CREATE TABLE `human_tokens` (
  `human_token_id` int PRIMARY KEY AUTO_INCREMENT,
  `uuid` varchar(255),
  `device_uuid` varchar(255),
  `creation` timestamp DEFAULT current_timestamp,
  `human_id` int
);

CREATE TABLE `items` (
  `item_id` int PRIMARY KEY AUTO_INCREMENT,
  `item_name` varchar(255),
  `item_vendor` varchar(255),
  `image` varchar(255),
  `description` varchar(255),
  `inventory_applies` boolean,
  `quantity` int,
  `price` double,
  `measurement_id` int,
  `shop_id` int,
  `item_cathegory_id` int
);

CREATE TABLE `item_cathegories` (
  `item_cathegory_id` int PRIMARY KEY AUTO_INCREMENT,
  `item_cathegory_text` varchar(255)
);

CREATE TABLE `measurements` (
  `measurement_id` int PRIMARY KEY,
  `measurement_name` varchar(255)
);

CREATE TABLE `carts` (
  `cart_shop_id` int,
  `cart_human_id` int,
  `cart_item_quantity` int,
  `cart_item_id` int,
  PRIMARY KEY (`cart_shop_id`, `cart_human_id`)
);

CREATE TABLE `orders` (
  `order_id` int PRIMARY KEY AUTO_INCREMENT,
  `created_at` timestamp DEFAULT current_timestamp,
  `shop_id` int,
  `human_id` int,
  `seen` boolean,
  `scheduled` boolean,
  `received` boolean
);

CREATE TABLE `ordered_items` (
  `ordered_item_id` int PRIMARY KEY AUTO_INCREMENT,
  `order_id` int,
  `item_quantity` int,
  `item_id` int
);

ALTER TABLE `addresses` ADD FOREIGN KEY (`municipality_id`) REFERENCES `municipalities` (`municipality_id`) ON DELETE CASCADE;

ALTER TABLE `humans` ADD FOREIGN KEY (`address_id`) REFERENCES `addresses` (`address_id`) ON DELETE CASCADE;

ALTER TABLE `shops` ADD FOREIGN KEY (`shop_cathegory_id`) REFERENCES `shop_cathegories` (`shop_cathegory_id`) ON DELETE CASCADE;

ALTER TABLE `shops` ADD FOREIGN KEY (`address_id`) REFERENCES `addresses` (`address_id`) ON DELETE CASCADE;

ALTER TABLE `deliver_to` ADD FOREIGN KEY (`shop_id`) REFERENCES `shops` (`shop_id`);

ALTER TABLE `deliver_to` ADD FOREIGN KEY (`municipality_id`) REFERENCES `municipalities` (`municipality_id`) ON DELETE CASCADE;

ALTER TABLE `human_tokens` ADD FOREIGN KEY (`human_id`) REFERENCES `humans` (`human_id`) ON DELETE CASCADE;

ALTER TABLE `items` ADD FOREIGN KEY (`measurement_id`) REFERENCES `measurements` (`measurement_id`) ON DELETE CASCADE;

ALTER TABLE `items` ADD FOREIGN KEY (`shop_id`) REFERENCES `shops` (`shop_id`) ON DELETE CASCADE;

ALTER TABLE `items` ADD FOREIGN KEY (`item_cathegory_id`) REFERENCES `item_cathegories` (`item_cathegory_id`) ON DELETE CASCADE;

ALTER TABLE `carts` ADD FOREIGN KEY (`cart_shop_id`) REFERENCES `shops` (`shop_id`) ON DELETE CASCADE;

ALTER TABLE `carts` ADD FOREIGN KEY (`cart_human_id`) REFERENCES `humans` (`human_id`) ON DELETE CASCADE;

ALTER TABLE `carts` ADD FOREIGN KEY (`cart_item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE;

ALTER TABLE `orders` ADD FOREIGN KEY (`shop_id`) REFERENCES `shops` (`shop_id`) ON DELETE CASCADE;

ALTER TABLE `orders` ADD FOREIGN KEY (`human_id`) REFERENCES `humans` (`human_id`) ON DELETE CASCADE;

ALTER TABLE `ordered_items` ADD FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE;

ALTER TABLE `ordered_items` ADD FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE;



