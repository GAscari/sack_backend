const uuid = require('uuid/v4')
var mysql = require('mysql')
var util = require('util')

// <<<< QUESTA è ORO (spero) >>>>
//function oro (query, data, req, res, pool, tag="stuff") {
//    console.log("\tquery: " + query)
//    console.log("\tdata: " + data)
//   var bad = false
//    data.forEach(element => { bad = bad || element.includes(";")  || element.includes("--") || element.includes("/*") || element.includes("*/") })
//    if (bad) {
//        console.log("\tprobable sql injection")
//        res.sendStatus(400)
//    } else {
//       pool.getConnection(function(err, connection){
//            if (!err) {
//                connection.query(query, data,  function(err, rows, fields){
//                    if (!err) {
//                        console.log("\treturning [json]")
//                        res.json(rows)
//                    } else {
//                        console.log("\tinternal error")
//                        console.log(err)
//                        res.sendStatus(500)
//                    }
//                })
//                connection.release()
//            } else {
//                console.log("\tinternal pool error")
//                console.log(err)
//                res.sendStatus(500)
//            }
//        })
//    }
//}

function argento (query, data, pool, callback) {
    console.log("\tquery: " + query)
    console.log("\tdata: " + data)
    var bad = false
    data.forEach(element => { bad = bad || element.toString().includes(";")  || element.toString().includes("--") || element.toString().includes("/*") || element.toString().includes("*/") })
    if (bad) {
        console.log("\tprobable sql injection")
        callback({status: 400, rows: null, err: null})
    } else {
        pool.getConnection(function(err, connection){
            if (!err) {
                connection.query(query, data,  function(err, rows, fields){
                    if (!err) {
                        console.log("\treturning [json]")
                        callback({status: 200, rows: rows, err: null})
                    } else {
                        console.log("\tinternal error")
                        console.log(err)
                        callback({status: 500, rows: null, err: err})
                    }
                })
                connection.release()
            } else {
                console.log("\tinternal pool error")
                console.log(err)
                callback({status: 500, rows: null, err: err})
            }
        })
    }
}
module.exports.argento = argento

module.exports.get = function (query, data, req, res, pool, tag="stuff") {
    console.log("> " + req.ip + " - " + tag + " requested")
    argento(query, data, pool, (result) => {
        if (result.status == 200) res.json(result.rows)
        else res.sendStatus(result.status)
    })
    
}

module.exports.post = function (query, data, req, res, pool, tag="stuff") {
    console.log("> " + req.ip + " - adding " + tag)
    argento(query, data, pool, (result) => {
        if (result.status == 200) res.json(result.rows)
        else res.sendStatus(result.status)
    })
}

module.exports.put = function (query, data, req, res, pool, tag="stuff") {
    console.log("> " + req.ip + " - updating " + tag)
    argento(query, data, pool, (result) => {
        if (result.status == 200) res.json(result.rows)
        else res.sendStatus(result.status)
    })
}

module.exports.delete = function (query, data, req, res, pool, tag="stuff") {
    console.log("> " + req.ip + " - deleting " + tag)
    argento(query, data, pool, (result) => {
        if (result.status == 200) res.json(result.rows)
        else res.sendStatus(result.status)
    })
}
