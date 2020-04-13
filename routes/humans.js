var express = require("express")
var router = express.Router()
var db = require('./../db')
var log = require('./../log')
var mailer = require("./../mailer")
var pool = require("./../api_router").pool

// <<<< HUMANS >>>>

router.get("", function(req, res) {
    var query
    var data = []
    if (req.query.human_id) {
        query="SELECT * FROM humans NATURAL LEFT JOIN addresses NATURAL LEFT JOIN municipalities WHERE human_id=?;"
        data.push(req.query.human_id)
    } else {
        query="SELECT * FROM humans NATURAL LEFT JOIN addresses NATURAL LEFT JOIN municipalities;"
    }
    db.get(query, data, req, res, pool, "human/s")
})

router.put("", function(req, res) {
    var query="UPDATE humans SET "
    var data=[]
    for (var prop in req.body) {
        if (Object.prototype.hasOwnProperty.call(req.body, prop)) {
            if (prop == "psw")
                query += prop + "=SHA2(?, 512), "
            else
                query += prop + "=?, "
            data.push(req.body[prop])
        }
    }
    query = query.slice(0, -2)
    query += " WHERE human_id=?;"
    data.push(req.query.human_id)
    db.put(query, data, req, res, pool, "human")
})

router.delete("/human", function(req, res) {
    var query="DELETE FROM humans WHERE human_id=?;"
    var data=[]
    data.push(req.query.human_id)
    db.delete(query, data, req, res, pool, "human")
})

module.exports = router
