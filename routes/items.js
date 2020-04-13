var express = require("express")
var router = express.Router()
var db = require('./../db')
var log = require('./../log')
var mailer = require("./../mailer")
var pool = require("./../api_router").pool

// <<<< ITEMS >>>>

router.get("", function(req, res) {
    var query
    var data = []
    if (req.query.shop_id) {
        query = "SELECT items.*, measurements.*, GROUP_CONCAT(category_title) as categories_concat FROM items NATURAL LEFT JOIN measurements NATURAL LEFT JOIN item_categories NATURAL LEFT JOIN categories WHERE shop_id=? GROUP BY item_id;"
        data.push(req.query.shop_id)
    } else if (req.query.item_id) {
        query = "SELECT items.*, measurements.*, GROUP_CONCAT(category_title) as categories_concat FROM items NATURAL LEFT JOIN measurements NATURAL LEFT JOIN item_categories NATURAL LEFT JOIN categories WHERE item_id=? GROUP BY item_id;"
        data.push(req.query.item_id)
    } else {
        query = "SELECT items.*, measurements.*, GROUP_CONCAT(category_title) as categories_concat FROM items NATURAL LEFT JOIN measurements NATURAL LEFT JOIN item_categories NATURAL LEFT JOIN categories GROUP BY item_id;"
    }
    db.get(query, data, req, res, pool, "item/s")
})

router.post("", function(req, res) {
    var query = "INSERT INTO items (" 
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
    db.post(query, data, req, res, pool, "item")
})

router.put("", function(req, res) {
    var query = "UPDATE items SET "
    var data = []
    for (var prop in req.body) {
        if (Object.prototype.hasOwnProperty.call(req.body, prop)) {
            query += prop + "=?, "
            data.push(req.body[prop])
        }
    }
    query = query.slice(0, -2)
    query += " WHERE item_id=?;"
    data.push(req.query.item_id)
    db.put(query, data, req, res, pool, "item")
})

router.delete("", function(req, res) {
    var query = "DELETE FROM items WHERE item_id=?;"
    var data = []
    data.push(req.query.item_id)
    db.delete(query, data, req, res, pool, "item")
})

module.exports = router
