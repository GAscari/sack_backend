drop database if exists sack_v01;
create database sack_v01;
use sack_v01;

CREATE TABLE customers (
  customer_id int PRIMARY KEY AUTO_INCREMENT,
  mail varchar(255),
  psw varchar(255),
  name varchar(255),
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  verified boolean
);

CREATE TABLE merchants (
  merchant_id int PRIMARY KEY AUTO_INCREMENT,
  merchant_name varchar(255),
  shop_name varchar(255),
  mail varchar(255),
  psw varchar(255),
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  verified boolean
);

CREATE TABLE customer_tokens (
  customer_token_id int PRIMARY KEY AUTO_INCREMENT,
  uuid varchar(255),
  customer_id varchar(255)
);

CREATE TABLE merchant_tokens (
  merchant_token_id int PRIMARY KEY AUTO_INCREMENT,
  uuid varchar(255),
  merchant_id varchar(255)
);

CREATE TABLE items (
  item_id int PRIMARY KEY AUTO_INCREMENT,
  item_name varchar(255),
  item_vendor varchar(255),
  quantity int,
  merchant_id int
);

CREATE TABLE orders (
  order_id int PRIMARY KEY AUTO_INCREMENT,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  merchant_id int,
  customer_id int
);

CREATE TABLE ordered_items (
  ordered_item_id int PRIMARY KEY AUTO_INCREMENT,
  item_id int,
  order_id int
);

ALTER TABLE customer_tokens ADD FOREIGN KEY (customer_id) REFERENCES customers (customer_id);

ALTER TABLE merchant_tokens ADD FOREIGN KEY (merchant_id) REFERENCES merchants (merchant_id);

ALTER TABLE items ADD FOREIGN KEY (merchant_id) REFERENCES merchants (merchant_id);

ALTER TABLE orders ADD FOREIGN KEY (merchant_id) REFERENCES merchants (merchant_id);

ALTER TABLE orders ADD FOREIGN KEY (customer_id) REFERENCES customers (customer_id);

ALTER TABLE ordered_items ADD FOREIGN KEY (item_id) REFERENCES items (item_id);

ALTER TABLE ordered_items ADD FOREIGN KEY (order_id) REFERENCES orders (order_id);
