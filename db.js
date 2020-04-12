const uuid = require('uuid/v4')
var mysql = require('mysql')
var util = require('util')
var log = require('./log')

// <<<< QUESTA è ORO (spero) >>>>
//function oro (query, data, req, res, pool, tag="stuff") {
//    log("\tquery: " + query)
//    log("\tdata: " + data)
//   var bad = false
//    data.forEach(element => { bad = bad || element.includes(";")  || element.includes("--") || element.includes("/*") || element.includes("*/") })
//    if (bad) {
//        log("\tprobable sql injection")
//        res.sendStatus(400)
//    } else {
//       pool.getConnection(function(err, connection){
//            if (!err) {
//                connection.query(query, data,  function(err, rows, fields){
//                    if (!err) {
//                        log("\treturning [json]")
//                        res.json(rows)
//                    } else {
//                        log("\tinternal error")
//                        log(err)
//                        res.sendStatus(500)
//                    }
//                })
//                connection.release()
//            } else {
//                log("\tinternal pool error")
//                log(err)
//                res.sendStatus(500)
//            }
//        })
//    }
//}

function interrogate (query, data, pool, callback) {
    log("\tquery: " + query)
    log("\tdata: " + data)
    var bad = false
    data.forEach(element => { bad = bad || element.toString().includes(";")  || element.toString().includes("--") || element.toString().includes("/*") || element.toString().includes("*/") })
    if (bad) {
        log("\tprobable sql injection")
        callback({status: 400, rows: null, err: null})
    } else {
        pool.getConnection(function(err, connection){
            if (!err) {
                connection.query(query, data,  function(err, rows, fields){
                    if (!err) {
                        log("\treturning [json]")
                        callback({status: 200, rows: rows, err: null})
                    } else {
                        log("\tinternal error")
                        log(err)
                        callback({status: 500, rows: null, err: err})
                    }
                })
                connection.release()
            } else {
                log("\tinternal pool error")
                log(err)
                callback({status: 500, rows: null, err: err})
            }
        })
    }
}
module.exports.interrogate = interrogate

module.exports.get = function (query, data, req, res, pool, tag="stuff") {
    log("> " + req.ip + " - " + tag + " requested")
    interrogate(query, data, pool, (result) => {
        if (result.status == 200) res.json(result.rows)
        else res.sendStatus(result.status)
    })
    
}

module.exports.post = function (query, data, req, res, pool, tag="stuff") {
    log("> " + req.ip + " - adding " + tag)
    interrogate(query, data, pool, (result) => {
        if (result.status == 200) res.json(result.rows)
        else res.sendStatus(result.status)
    })
}

module.exports.put = function (query, data, req, res, pool, tag="stuff") {
    log("> " + req.ip + " - updating " + tag)
    interrogate(query, data, pool, (result) => {
        if (result.status == 200) res.json(result.rows)
        else res.sendStatus(result.status)
    })
}

module.exports.delete = function (query, data, req, res, pool, tag="stuff") {
    log("> " + req.ip + " - deleting " + tag)
    interrogate(query, data, pool, (result) => {
        if (result.status == 200) res.json(result.rows)
        else res.sendStatus(result.status)
    })
}
