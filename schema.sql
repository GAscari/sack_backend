CREATE TABLE "municipalities" (
  "municipality_id" int PRIMARY KEY AUTO_INCREMENT,
  "postal_code" int,
  "name" varchar(255),
  "image" varchar(255),
  "description" varchar(255)
);

CREATE TABLE "municipalities_fraction" (
  "city_id" int PRIMARY KEY AUTO_INCREMENT,
  "postal_code" int,
  "name" varchar(255),
  "image" varchar(255),
  "description" varchar(255),
  "municipality" int
);

CREATE TABLE "addresses" (
  "address_id" int PRIMARY KEY AUTO_INCREMENT,
  "street" varchar(255),
  "number" varchar(255),
  "city_id" int
);

CREATE TABLE "mails" (
  "mail_id" int PRIMARY KEY AUTO_INCREMENT,
  "mail" varchar(255),
  "verified_mail" boolean,
  "verification_mail_code" int
);

CREATE TABLE "telephones" (
  "telephone_id" int PRIMARY KEY AUTO_INCREMENT,
  "prefix" integer DEFAULT 39,
  "telephone" integer,
  "verified_telephone" boolean,
  "verified_telephone_code" varchar(255)
);

CREATE TABLE "humans" (
  "human_id" int PRIMARY KEY AUTO_INCREMENT,
  "name" varchar(255),
  "image" varchar(255),
  "telephone_id" int,
  "mail_id" int,
  "psw" varchar(255),
  "created_at" timestamp DEFAULT current_timestamp,
  "address_id" int
);

CREATE TABLE "customers" (
  "customer_id" int PRIMARY KEY
);

CREATE TABLE "merchants" (
  "merchant_id" int PRIMARY KEY
);

CREATE TABLE "shops" (
  "shop_id" int PRIMARY KEY AUTO_INCREMENT,
  "name" varchar(255),
  "telephone_id" int,
  "mail_id" int,
  "psw" varchar(255),
  "description" varchar(255),
  "image" varchar(255),
  "created_at" timestamp DEFAULT current_timestamp,
  "verified" boolean,
  "address_id" int
);

CREATE TABLE "owners_shops" (
  "owners_shop_id" int PRIMARY KEY AUTO_INCREMENT,
  "merchant_id" int,
  "shop_id" int
);

CREATE TABLE "humans_tokens" (
  "human_token_id" int PRIMARY KEY AUTO_INCREMENT,
  "uuid" varchar(255),
  "device_uuid" varchar(255),
  "human_id" int
);

CREATE TABLE "shops_tokens" (
  "shop_token_id" int PRIMARY KEY AUTO_INCREMENT,
  "uuid" varchar(255),
  "device_uuid" varchar(255),
  "shop_id" int
);

CREATE TABLE "items" (
  "item_id" int PRIMARY KEY AUTO_INCREMENT,
  "item_name" varchar(255),
  "item_vendor" varchar(255),
  "image" varchar(255),
  "description" varchar(255),
  "quantity" int,
  "shop_id" int
);

CREATE TABLE "orders" (
  "order_id" int PRIMARY KEY AUTO_INCREMENT,
  "created_at" timestamp DEFAULT current_timestamp,
  "shop_id" int,
  "customer_id" int,
  "seen" boolean,
  "scheduled" boolean,
  "received" boolean
);

CREATE TABLE "ordered_items" (
  "ordered_item_id" int PRIMARY KEY AUTO_INCREMENT,
  "item_id" int,
  "order_id" int
);

ALTER TABLE "municipalities_fraction" ADD FOREIGN KEY ("municipality") REFERENCES "municipalities" ("municipality_id");

ALTER TABLE "addresses" ADD FOREIGN KEY ("city_id") REFERENCES "municipalities_fraction" ("city_id");

ALTER TABLE "humans" ADD FOREIGN KEY ("telephone_id") REFERENCES "telephones" ("telephone_id");

ALTER TABLE "humans" ADD FOREIGN KEY ("mail_id") REFERENCES "mails" ("mail_id");

ALTER TABLE "humans" ADD FOREIGN KEY ("address_id") REFERENCES "addresses" ("address_id");

ALTER TABLE "customers" ADD FOREIGN KEY ("customer_id") REFERENCES "humans" ("human_id");

ALTER TABLE "merchants" ADD FOREIGN KEY ("merchant_id") REFERENCES "humans" ("human_id");

ALTER TABLE "shops" ADD FOREIGN KEY ("telephone_id") REFERENCES "telephones" ("telephone_id");

ALTER TABLE "shops" ADD FOREIGN KEY ("mail_id") REFERENCES "mails" ("mail_id");

ALTER TABLE "shops" ADD FOREIGN KEY ("address_id") REFERENCES "addresses" ("address_id");

ALTER TABLE "owners_shops" ADD FOREIGN KEY ("merchant_id") REFERENCES "merchants" ("merchant_id");

ALTER TABLE "owners_shops" ADD FOREIGN KEY ("shop_id") REFERENCES "shops" ("shop_id");

ALTER TABLE "humans_tokens" ADD FOREIGN KEY ("human_id") REFERENCES "humans" ("human_id");

ALTER TABLE "shops_tokens" ADD FOREIGN KEY ("shop_id") REFERENCES "shops" ("shop_id");

ALTER TABLE "items" ADD FOREIGN KEY ("shop_id") REFERENCES "shops" ("shop_id");

ALTER TABLE "orders" ADD FOREIGN KEY ("shop_id") REFERENCES "shops" ("shop_id");

ALTER TABLE "orders" ADD FOREIGN KEY ("customer_id") REFERENCES "customers" ("customer_id");

ALTER TABLE "ordered_items" ADD FOREIGN KEY ("item_id") REFERENCES "items" ("item_id");

ALTER TABLE "ordered_items" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("order_id");
