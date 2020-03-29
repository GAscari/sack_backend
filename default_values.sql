INSERT INTO customers (mail, name, psw, verified)
VALUES("cust1@dev.com", "customer1", SHA2('yeet', 512), true);

INSERT INTO merchants (merchant_name, shop_name, mail, psw, verified)
VALUES
    ("merchant 1", "my_shop 1", "merc1@dev.com", SHA2('yeet', 512), true),
    ("merchant 2", "my_shop 2", "merc2@dev.com", SHA2('yeet', 512), true),
    ("merchant 3", "my_shop 3", "merc3@dev.com", SHA2('yeet', 512), true),
    ("merchant 4", "my_shop 4", "merc4@dev.com", SHA2('yeet', 512), true),
    ("merchant 5", "my_shop 5", "merc5@dev.com", SHA2('yeet', 512), true),
    ("merchant 6", "my_shop 6", "merc6@dev.com", SHA2('yeet', 512), true);

INSERT INTO items (item_name, item_vendor, quantitymerchant_id)