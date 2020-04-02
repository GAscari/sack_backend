const uuid = require('uuid/v4')
var mysql = require('mysql')
var util = require('util')

// <<<< QUESTA è ORO (spero) >>>>

function oro (query, data, req, res, pool, tag="stuff") {
    console.log("\tquery: " + query)
    console.log("\tdata: " + data)
    var bad = false
    data.forEach(element => { bad = bad || element.includes(";")  || element.includes("--") || element.includes("/*") || element.includes("*/") })
    if (bad) {
        console.log("\tprobable sql injection")
        res.sendStatus(400)
    } else {
        pool.getConnection(function(err, connection){
            if (!err) {
                connection.query(query, data,  function(err, rows, fields){
                    if (!err) {
                        console.log("\treturning [json]")
                        res.json(rows)
                    } else {
                        console.log("\tinternal error")
                        console.log(err)
                        res.sendStatus(500)
                    }
                })
                connection.release()
            } else {
                console.log("\tinternal pool error")
                console.log(err)
                res.sendStatus(500)
            }
        })
    }
}

module.exports.get = function (query, data, req, res, pool, tag="stuff") {
    console.log("> " + req.ip + " - " + tag + " requested")
    oro(query, data, req, res, pool, tag)
}

module.exports.post = function (query, data, req, res, pool, tag="stuff") {
    console.log("> " + req.ip + " - adding " + tag)
    oro(query, data, req, res, pool, tag)
}

module.exports.put = function (query, data, req, res, pool, tag="stuff") {
    console.log("> " + req.ip + " - updating " + tag)
    oro(query, data, req, res, pool, tag)
}

module.exports.delete = function (query, data, req, res, pool, tag="stuff") {
    console.log("> " + req.ip + " - deleting " + tag)
    oro(query, data, req, res, pool, tag)
}
