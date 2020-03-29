drop database if exists sack_v01;
create database sack_v01;
use sack_v01;

CREATE TABLE customers (
  customer_id int AUTO_INCREMENT,
  mail varchar(255),
  psw varchar(255),
  name varchar(255),
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  verified boolean,
  PRIMARY KEY (customer_id)
);

CREATE TABLE merchants (
  merchant_id int AUTO_INCREMENT,
  merchant_name varchar(255),
  shop_name varchar(255),
  mail varchar(255),
  psw varchar(255),
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  verified boolean,
  PRIMARY KEY (merchant_id)
);

CREATE TABLE customer_tokens (
  customer_token_id int AUTO_INCREMENT,
  uuid varchar(255),
  customer_id int,
  PRIMARY KEY (customer_token_id, customer_id)
);

CREATE TABLE merchant_tokens (
  merchant_token_id int AUTO_INCREMENT,
  uuid varchar(255),
  merchant_id int,
  PRIMARY KEY (merchant_token_id, merchant_id)
);

CREATE TABLE items (
  item_id int AUTO_INCREMENT,
  item_name varchar(255),
  item_vendor varchar(255),
  price double(64, 2),
  quantity int,
  merchant_id int,
  PRIMARY KEY (item_id, merchant_id)
);

CREATE TABLE orders (
  order_id int AUTO_INCREMENT,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  merchant_id int, 
  customer_id int,
  PRIMARY KEY (order_id)
);

CREATE TABLE ordered_items (
  item_id int,
  item_quantity int,
  order_id int,
  PRIMARY KEY (order_id, item_id)
);

ALTER TABLE customer_tokens ADD FOREIGN KEY (customer_id) REFERENCES customers (customer_id);

ALTER TABLE merchant_tokens ADD FOREIGN KEY (merchant_id) REFERENCES merchants (merchant_id);

ALTER TABLE items ADD FOREIGN KEY (merchant_id) REFERENCES merchants (merchant_id);

ALTER TABLE orders ADD FOREIGN KEY (merchant_id) REFERENCES merchants (merchant_id);

ALTER TABLE orders ADD FOREIGN KEY (customer_id) REFERENCES customers (customer_id);

ALTER TABLE ordered_items ADD FOREIGN KEY (item_id) REFERENCES items (item_id);

ALTER TABLE ordered_items ADD FOREIGN KEY (order_id) REFERENCES orders (order_id);
