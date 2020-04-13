var express = require("express")
var router = express.Router()
var db = require('./../db')
var log = require('./../log')
var mailer = require("./../mailer")
var pool = require("./../api_router").pool

// <<<< SHOPS >>>>

router.get("", function(req, res) {
    var query
    var data = []
    if (req.query.shop_id) {
        query = "SELECT shops.*, addresses.*, municipalities.*, GROUP_CONCAT(category_title) as categories_concat FROM shops NATURAL LEFT JOIN addresses NATURAL LEFT JOIN municipalities NATURAL LEFT JOIN shop_categories NATURAL LEFT JOIN categories WHERE shop_id=? GROUP BY shop_id;"
        data.push(req.query.shop_id)
    } else {
        query = "SELECT shops.*, addresses.*, municipalities.*, GROUP_CONCAT(category_title) as categories_concat FROM shops NATURAL LEFT JOIN addresses NATURAL LEFT JOIN municipalities NATURAL LEFT JOIN shop_categories NATURAL LEFT JOIN categories GROUP BY shop_id;"
    }
    db.get(query, data, req, res, pool, "shop/s")
})

router.get("/local", function(req, res) {
    var query = "SELECT shops.*, addresses.*, municipalities.*, GROUP_CONCAT(category_title) as categories_concat \
        FROM shops NATURAL LEFT JOIN addresses NATURAL LEFT JOIN municipalities NATURAL LEFT JOIN shop_categories NATURAL LEFT JOIN categories INNER JOIN deliver_to ON shops.shop_id=deliver_to.shop_id \
        WHERE deliver_to.municipality_id=(SELECT municipality_id FROM humans NATURAL LEFT JOIN addresses WHERE human_id=?) \
        GROUP BY shops.shop_id;"
    var data=[]
    data.push(req.query.human_id)
    db.get(query, data, req, res, pool, "shops/local")
})

router.post("", function(req, res) {
    var query = "INSERT INTO shops (" 
    var query2 = ") VALUES ("
    var data = []
    for (var prop in req.body) {
        if (Object.prototype.hasOwnProperty.call(req.body, prop)) {
            query += prop + ", "
            query2 += "?, "
            data.push(req.body[prop])
        }
    }
    query = query.slice(0, -2)
    query2 = query2.slice(0, -2)
    query += query2 + ");"
    db.post(query, data, req, res, pool, "shop")
})

router.put("", function(req, res) {
    var query = "UPDATE shops SET "
    var data = []
    for (var prop in req.body) {
        if (Object.prototype.hasOwnProperty.call(req.body, prop)) {
            query += prop + "=?, "
            data.push(req.body[prop])
        }
    }
    query = query.slice(0, -2)
    query += " WHERE shop_id=?;"
    data.push(req.query.shop_id)
    db.put(query, data, req, res, pool, "shop")
})

router.delete("", function(req, res) {
    var query="DELETE FROM shops WHERE shop_id=?;"
    var data=[]
    data.push(req.query.shop_id)
    db.delete(query, data, req, res, pool, "shop")
})

module.exports = router