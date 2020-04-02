INSERT INTO humans (name, psw, mail, verified_mail)
VALUES ("human1", SHA2('yeet', 512), "dev@dev.com", true);

INSERT INTO human_tokens (uuid, device_uuid, creation, human_id)
VALUES ('12473807-8e6d-45da-8f77-fc78878fd6ae', 'aaaa', '2020-04-01 16:32:54', '1');

INSERT INTO dow
VALUES
    (1, "lunedì"),
    (2, "martedì"),
    (3, "mercoledì"),
    (4, "giovedì"),
    (5, "venerdì"),
    (6, "sabato"),
    (7, "domenica");

INSERT INTO shops (name, delivery_from_dow,  delivery_to_dow, open_from_dow,  open_to_dow)
VALUES
    ("shop1", 1, 5, 1, 5),
    ("shop2", 1, 5, 1, 5);


INSERT INTO measurements (measurement_id, measurement_name)
VALUES
    (1, "kg"),
    (2, "cad.");

INSERT INTO items (item_name, item_vendor, image, description, inventory_applies, quantity, price, measurement_id, shop_id)
VALUES
    ("item1", "item_vendor1", "image_url1", "description1", false, 8, 10.99, 2, 1),
    ("item2", "item_vendor2", "image_url2", "description2", false, 8, 10.99, 2, 1),
    ("item3", "item_vendor3", "image_url3", "description3", false, 8, 10.99, 2, 1),
    ("item4", "item_vendor4", "image_url4", "description4", false, 8, 10.99, 2, 1),
    ("item5", "item_vendor5", "image_url5", "description5", false, 8, 10.99, 2, 1),
    ("item6", "item_vendor6", "image_url6", "description6", false, 8, 10.99, 2, 1),
    ("item7", "item_vendor7", "image_url7", "description7", false, 8, 10.99, 2, 1),
    ("item8", "item_vendor8", "image_url8", "description8", false, 8, 10.99, 2, 1),
    ("item9", "item_vendor9", "image_url9", "description9", false, 8, 10.99, 2, 1),
    ("item10", "item_vendor10", "image_url10", "description10", false, 8, 10.99, 2, 1),
    ("item11", "item_vendor11", "image_url11", "description11", false, 8, 10.99, 2, 1),
    ("item1", "item_vendor1", "image_url1", "description1", false, 8, 10.99, 2, 2),
    ("item2", "item_vendor2", "image_url2", "description2", false, 8, 10.99, 2, 2),
    ("item3", "item_vendor3", "image_url3", "description3", false, 8, 10.99, 2, 2),
    ("item4", "item_vendor4", "image_url4", "description4", false, 8, 10.99, 2, 2),
    ("item5", "item_vendor5", "image_url5", "description5", false, 8, 10.99, 2, 2),
    ("item6", "item_vendor6", "image_url6", "description6", false, 8, 10.99, 2, 2),
    ("item7", "item_vendor7", "image_url7", "description7", false, 8, 10.99, 2, 2),
    ("item8", "item_vendor8", "image_url8", "description8", false, 8, 10.99, 2, 2),
    ("item9", "item_vendor9", "image_url9", "description9", false, 8, 10.99, 2, 2),
    ("item10", "item_vendor10", "image_url10", "description10", false, 8, 10.99, 2, 2),
    ("item11", "item_vendor11", "image_url11", "description11", false, 8, 10.99, 2, 2);