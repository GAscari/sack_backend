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
/*router.post("/tracks", function(req, res) {
    console.log("> " + req.ip + " - adding track")
    pool.getConnection(function(err, connection){
        if (!err) {
            var query="insert into tracks(title, artist_id, ytid, mail) values(?, ?, ?, ?);"
            var data=[]
            data.push(req.body.title)
            data.push(req.body.artist_id)
            data.push(req.body.ytid)
            data.push(req.query.mail)
            connection.query(query, data,  function(err, rows, fields){
                if (!err) {
                    console.log("\ttrack added")
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
})*/



/*
router.get("/items", function(req, res) {
    console.log("> " + req.ip + " - items requested")
    pool.getConnection(function(err, connection){
        if (!err) {
            var shop_id = null
            shop_id = req.query.shop_id
            var query
            var data=[]
            if (shop_id == null) {
                query="select * from items natural join measurements;"
                data=[]
                data.push()
            } else {
                query="select * from items natural join measurements where shop_id=?;"
                data=[]
                data.push(shop_id)
            }
            connection.query(query, data,  function(err, rows, fields){
                if (!err) {
                    console.log("\treturning items")
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
})*/


/*
router.post("/tracks", function(req, res) {
    console.log("> " + req.ip + " - adding track")
    pool.getConnection(function(err, connection){
        if (!err) {
            var query="insert into tracks(title, artist_id, ytid, mail) values(?, ?, ?, ?);"
            var data=[]
            data.push(req.body.title)
            data.push(req.body.artist_id)
            data.push(req.body.ytid)
            data.push(req.query.mail)
            connection.query(query, data,  function(err, rows, fields){
                if (!err) {
                    console.log("\ttrack added")
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
})

router.put("/tracks", function(req, res) {
    console.log("> " + req.ip + " - updating track")
    pool.getConnection(function(err, connection){
        if (!err) {
            var query="update tracks set title=?, artist_id=?, ytid=? where mail=? and track_id=?;"
            var data=[]
            data.push(req.body.title)
            data.push(req.body.artist_id)
            data.push(req.body.ytid)
            data.push(req.query.mail)
            data.push(req.body.track_id)
            connection.query(query, data,  function(err, rows, fields){
                if (!err) {
                    console.log("\ttrack updated")
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
})

router.delete("/tracks", function(req, res) {
    console.log("> " + req.ip + " - deleting track")
    pool.getConnection(function(err, connection){
        if (!err) {
            var query="delete from tracks where mail=? and track_id=?;"
            var data=[]
            data.push(req.query.mail)
            data.push(req.body.track_id)
            connection.query(query, data,  function(err, rows, fields){
                if (!err) {
                    console.log("\ttrack deleted")
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
})
*/
