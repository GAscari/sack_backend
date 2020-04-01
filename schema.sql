CREATE TABLE `municipalities` (
  `municipality_id` int PRIMARY KEY AUTO_INCREMENT,
  `postal_code` int,
  `name` varchar(255),
  `image` varchar(255),
  `description` varchar(255)
);

CREATE TABLE `municipalities_fraction` (
  `city_id` int PRIMARY KEY AUTO_INCREMENT,
  `postal_code` int,
  `name` varchar(255),
  `image` varchar(255),
  `description` varchar(255),
  `municipality` int
);

CREATE TABLE `addresses` (
  `address_id` int PRIMARY KEY AUTO_INCREMENT,
  `street` varchar(255),
  `number` varchar(255),
  `city_id` int
);

CREATE TABLE `humans` (
  `human_id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255),
  `image` varchar(255),
  `psw` varchar(255),
  `created_at` timestamp DEFAULT current_timestamp,
  `address_id` int,
  `mail` varchar(255),
  `verified_mail` boolean,
  `verification_mail_code` int,
  `prefix` integer DEFAULT 39,
  `telephone` integer,
  `verified_telephone` boolean,
  `verified_telephone_code` varchar(255)
);

CREATE TABLE `shops` (
  `shop_id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255),
  `mail` varchar(255),
  `prefix` integer DEFAULT 39,
  `telephone` integer,
  `description` varchar(255),
  `image` varchar(255),
  `min_purchase` double,
  `delivery_from_dow` int,
  `delivery_to_dow` int,
  `open_from_dow` int,
  `open_to_dow` int,
  `delivery_from_time` time,
  `delivery_to_time` time,
  `open_from_time` time,
  `open_to_time` time,
  `delivery_cost` double,
  `created_at` timestamp DEFAULT current_timestamp,
  `address_id` int
);

CREATE TABLE `dow` (
  `dow_id` int PRIMARY KEY,
  `name` varchar(255)
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
  `shop_id` int
);

CREATE TABLE `measurements` (
  `measurement_id` int PRIMARY KEY,
  `measurement_name` varchar(255)
);

CREATE TABLE `orders` (
  `order_id` int PRIMARY KEY AUTO_INCREMENT,
  `created_at` timestamp DEFAULT current_timestamp,
  `shop_id` int,
  `seen` boolean,
  `scheduled` boolean,
  `received` boolean
);

CREATE TABLE `carts` (
  `cart_id` int PRIMARY KEY AUTO_INCREMENT,
  `human_id` int,
  `shop_id` int,
  `bought` boolean,
  `created_at` timestamp
);

CREATE TABLE `cart_items` (
  `in_cart_item_id` int PRIMARY KEY AUTO_INCREMENT,
  `item_id` int,
  `cart_id` int
);

CREATE TABLE `ordered_items` (
  `ordered_item_id` int PRIMARY KEY AUTO_INCREMENT,
  `item_id` int,
  `order_id` int
);

ALTER TABLE `municipalities_fraction` ADD FOREIGN KEY (`municipality`) REFERENCES `municipalities` (`municipality_id`);

ALTER TABLE `addresses` ADD FOREIGN KEY (`city_id`) REFERENCES `municipalities_fraction` (`city_id`);

ALTER TABLE `humans` ADD FOREIGN KEY (`address_id`) REFERENCES `addresses` (`address_id`);

ALTER TABLE `shops` ADD FOREIGN KEY (`delivery_from_dow`) REFERENCES `dow` (`dow_id`);

ALTER TABLE `shops` ADD FOREIGN KEY (`delivery_to_dow`) REFERENCES `dow` (`dow_id`);

ALTER TABLE `shops` ADD FOREIGN KEY (`open_from_dow`) REFERENCES `dow` (`dow_id`);

ALTER TABLE `shops` ADD FOREIGN KEY (`open_to_dow`) REFERENCES `dow` (`dow_id`);

ALTER TABLE `shops` ADD FOREIGN KEY (`address_id`) REFERENCES `addresses` (`address_id`);

ALTER TABLE `human_tokens` ADD FOREIGN KEY (`human_id`) REFERENCES `humans` (`human_id`);

ALTER TABLE `items` ADD FOREIGN KEY (`measurement_id`) REFERENCES `measurements` (`measurement_id`);

ALTER TABLE `items` ADD FOREIGN KEY (`shop_id`) REFERENCES `shops` (`shop_id`);

ALTER TABLE `orders` ADD FOREIGN KEY (`shop_id`) REFERENCES `shops` (`shop_id`);

ALTER TABLE `carts` ADD FOREIGN KEY (`human_id`) REFERENCES `humans` (`human_id`);

ALTER TABLE `carts` ADD FOREIGN KEY (`shop_id`) REFERENCES `shops` (`shop_id`);

ALTER TABLE `cart_items` ADD FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`);

ALTER TABLE `cart_items` ADD FOREIGN KEY (`cart_id`) REFERENCES `carts` (`cart_id`);

ALTER TABLE `ordered_items` ADD FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`);

ALTER TABLE `ordered_items` ADD FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`);
