var express = require("express")
const uuid = require('uuid/v4')
var router = express.Router()
var mysql = require('mysql')
var util = require('util')

var pool = mysql.createPool({
    host: "192.168.0.111",
    user: "remote",
    password: "remote",
    database: "sack_v01"
})

router.use(express.json())
router.use(express.urlencoded({ extended: true }))

//USE - stampa ip e ora richiesta
router.use(function(req, res, next) {
    console.log("> " + req.ip + " - " + (new Date(Date.now())).toUTCString())
    next()
})

//POST - chiede il rilascio di un token con login
router.post("/login", function(req, res) {
    console.log("> " + req.ip + " - token requested...")
    var mail = req.body.mail
    var psw = req.body.psw

    pool.getConnection(function(err, connection){
        if (!err) {
            var query="select count(*) as authorized from users where mail=? and psw=SHA2(?, 512);"
            var data=[]
            data.push(mail); data.push(psw)
            connection.query(query, data,  function(err, rows, fields){
                if (!err) {
                    console.log("\tselezione ok")
                    if (rows[0].authorized == 1) {
                        var query="insert into tokens(uuid, mail) values(?, ?);"
                        var data=[]
                        data.push(uuid()); data.push(mail)
                        connection.query(query,data,function(err,rows,fields){
                            if (!err) {
                                console.log("\ttoken inserted")
                                var query="select mail, uuid from tokens where mail=? order by creation desc limit 1;"
                                var data=[]
                                data.push(mail)
                                connection.query(query,data,function(err,rows,fields){
                                    if (!err) {
                                        console.log("\ttoken sent")

                                        res.json(rows)
                                    } else {
                                        console.log("\tinternal error")
                                        console.log(err)
                                        res.sendStatus(500)
                                    }
                                })
                            } else {
                                console.log("\tinternal error")
                                console.log(err)
                                res.sendStatus(500)
                            }
                        })
                    } else {
                        console.log("\tunauthorized to get token (" + rows[0].authorized + ")")
                        res.sendStatus(403)
                    }
                } else {
                    console.log("\tinternal error")
                    res.sendStatus(500)
                }
            })
            connection.release()
        }
        else {
            console.log("\tinternal pool error")
            res.sendStatus(500)
        } 
    })
})

//USE - verifica che il token sia autorizzato
router.use(function(req, res, next) {
    console.log("> " + req.ip + " - access requested...")
    pool.getConnection(function(err, connection){
        if (!err) {
            var query="select count(*) as authorized from tokens where mail=? and uuid=? and expiration>=current_timestamp;"
            var data=[]
            data.push(req.query.mail); data.push(req.query.uuid)
            connection.query(query, data,  function(err, rows, fields){
                if (!err) {
                    console.log("\ttoken examination...")
                    if (rows[0].authorized != 0) {
                        console.log("\ttoken approved")
                        next()
                    } else {
                        console.log("\ttoken rejected")
                        res.sendStatus(403);
                    }
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

//GET testa le api
router.get("/test", function(req, res) {
    pool.getConnection(function(err, connection){
        if (!err) {
            res.sendStatus(200)
        } else {
            console.log("\tinternal error")
            res.sendStatus(500)
        }
        connection.release()
    })
	res.sendStatus(200)
})

// /tracks - #### TRACKS ####
router.get("/tracks", function(req, res) {
    console.log("> " + req.ip + " - tracks requested...")
    pool.getConnection(function(err, connection){
        if (!err) {
            var query="select track_id, title, artist_id, ytid, name from tracks natural join artists where mail=?;"
            var data=[]
            data.push(req.query.mail)
            connection.query(query, data,  function(err, rows, fields){
                if (!err) {
                    console.log("\treturning tracks...")
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

router.post("/tracks", function(req, res) {
    console.log("> " + req.ip + " - adding track...")
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
    console.log("> " + req.ip + " - updating track...")
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
    console.log("> " + req.ip + " - deleting track...")
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

module.exports = router
