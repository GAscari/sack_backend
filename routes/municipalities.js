var express = require("express")
var router = express.Router()
var db = require('./../db')
var log = require('./../log')
var mailer = require("./../mailer")
var pool = require("./../api_router").pool

// <<<< MUNICIPALITIES >>>>

router.get("", function(req, res) {
    var query
    var data = []
    if (req.query.municipality_id) {
        query="SELECT * FROM municipalities WHERE municipality_id=?;"
        data.push(req.query.municipality_id)
    } else {
        query="SELECT * FROM municipalities;"
    }
    db.get(query, data, req, res, pool, "municipality/ies")
})

router.post("", function(req, res) {
    var query = "INSERT INTO municipalities (" 
    var query2 = ") VALUES ("
    var data=[]
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
    db.post(query, data, req, res, pool, "municipality")
})

router.put("", function(req, res) {
    var query="UPDATE addresses SET "
    var data=[]
    for (var prop in req.body) {
        if (Object.prototype.hasOwnProperty.call(req.body, prop)) {
            query += prop + "=?, "
            data.push(req.body[prop])
        }
    }
    query = query.slice(0, -2)
    query += " WHERE municipality_id=?;"
    data.push(req.query.shop_id)
    db.put(query, data, req, res, pool, "municipality")
})

router.delete("", function(req, res) {
    var query="DELETE FROM municipalities WHERE municipality_id=?;"
    var data=[]
    data.push(req.query.shop_id)
    db.delete(query, data, req, res, pool, "municipality")
})

module.exports = router