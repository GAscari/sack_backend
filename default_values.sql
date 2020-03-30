INSERT INTO mails (mail, verified_mail, verified_mail_code)
VALUES ("mail1@dev.com", true, "0248");

INSERT INTO telephones (prefix, telephone, verified_telephone, verified_telephone_code)
VALUES (39, 3385897440, true, "0248");

INSERT INTO municipalities (postal_code, name, image, description)
VALUES (38068, "ROVERETO", NULL, NULL);

INSERT INTO municipalities_fracion   (postal_code, name, image, description)
VALUES (38068, "ROVERETO", NULL, NULL);

INSERT INTO humans (name, image, telephone_id, mail_id, psw, address_id)
VALUES("human1", "image_url1", 1, 1, SHA2('yeet', 512), );

INSERT INTO merchants (merchant_name, shop_name, mail, psw, verified)
VALUES
    ("merchant 1", "my_shop 1", "merc1@dev.com", SHA2('yeet', 512), true),
    ("merchant 2", "my_shop 2", "merc2@dev.com", SHA2('yeet', 512), true),
    ("merchant 3", "my_shop 3", "merc3@dev.com", SHA2('yeet', 512), true),
    ("merchant 4", "my_shop 4", "merc4@dev.com", SHA2('yeet', 512), true),
    ("merchant 5", "my_shop 5", "merc5@dev.com", SHA2('yeet', 512), true),
    ("merchant 6", "my_shop 6", "merc6@dev.com", SHA2('yeet', 512), true);

INSERT INTO items (item_name, item_vendor, quantitymerchant_id)