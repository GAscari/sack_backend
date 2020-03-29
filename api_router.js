var express = require("express")
const uuid = require('uuid/v4')
var router = express.Router()
var fs = require('fs')
var mysql = require('mysql')
var util = require('util')


var pool = mysql.createPool({
    host: "192.168.0.111",
    user: "remote",
    password: "remote",
    database: "sack_v.01"
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
        }
        else {
            console.log("\tinternal pool error")
            res.sendStatus(500)
        } 
        connection.release()
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
        } else {
            console.log("\tinternal pool error")
            console.log(err)
            res.sendStatus(500)
        }
        connection.release()
    })
})

//GET testa le api
router.get("/test", function(req, res) {
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
        } else {
            console.log("\tinternal pool error")
            console.log(err)
            res.sendStatus(500)
        }
        connection.release()
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
        } else {
            console.log("\tinternal pool error")
            console.log(err)
            res.sendStatus(500)
        }
        connection.release()
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
        } else {
            console.log("\tinternal pool error")
            console.log(err)
            res.sendStatus(500)
        }
        connection.release()
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
        } else {
            console.log("\tinternal pool error")
            console.log(err)
            res.sendStatus(500)
        }
        connection.release()
    })
})


// /artists -  - #### ARTISTS ####
router.get("/artists", function(req, res) {
    console.log("> " + req.ip + " - artists requested...")

    pool.getConnection(function(err, connection){
        if (!err) {
            var query="select artist_id, name, count(track_id) as count from artists natural join tracks where mail=? group by artist_id;"
            var data=[]
            data.push(req.query.mail)
            connection.query(query, data,  function(err, rows, fields){
                if (!err) {
                    console.log("\treturning artists...")
                    res.json(rows)
                } else {
                    console.log("\tinternal error")
                    console.log(err)
                    res.sendStatus(500)
                }
            })
        } else {
            console.log("\tinternal pool error")
                    console.log(err)
                    res.sendStatus(500)
        }
        connection.release()
    })
})

router.post("/artists", function(req, res) {
    console.log("> " + req.ip + " - adding artist...")
    pool.getConnection(function(err, connection){
        if (!err) {
            var query="insert into artists(name, mail) values(?, ?);"
            var data=[]
            data.push(req.body.name)
            data.push(req.query.mail)
            connection.query(query, data,  function(err, rows, fields){
                if (!err) {
                    console.log("\tartist added")
                    res.json(rows)
                } else {
                    console.log("\tinternal error")
                    console.log(err)
                    res.sendStatus(500)
                }
            })
        } else {
            console.log("\tinternal pool error")
            console.log(err)
            res.sendStatus(500)
        }
        connection.release()
    })
})

router.put("/artists", function(req, res) {
    console.log("> " + req.ip + " - updating artist...")
    pool.getConnection(function(err, connection){
        if (!err) {
            var query="update artists set name=? where mail=? and artist_id=?;"
            var data=[]
            data.push(req.body.name)
            data.push(req.query.mail)
            data.push(req.body.artist_id)
            connection.query(query, data,  function(err, rows, fields){
                if (!err) {
                    console.log("\tartist updated")
                    res.json(rows)
                } else {
                    console.log("\tinternal error")
                    console.log(err)
                    res.sendStatus(500)
                }
            })
        } else {
            console.log("\tinternal pool error")
            console.log(err)
            res.sendStatus(500)
        }
        connection.release()
    })
})

router.delete("/artists", function(req, res) {
    console.log("> " + req.ip + " - deleting artist...")
    pool.getConnection(function(err, connection){
        if (!err) {
            var query="delete from artists where mail=? and artist_id=?;"
            var data=[]
            data.push(req.query.mail)
            data.push(req.body.artist_id)
            connection.query(query, data,  function(err, rows, fields){
                if (!err) {
                    console.log("\tartist deleted")
                    res.json(rows)
                } else {
                    console.log("\tinternal error")
                    console.log(err)
                    res.sendStatus(500)
                }
            })
        } else {
            console.log("\tinternal pool error")
            console.log(err)
            res.sendStatus(500)
        }
        connection.release()
    })
})

// /playlists - #### PLAYLISTS ####
router.get("/playlists", function(req, res) {
    console.log("> " + req.ip + " - playlists requested...")

    pool.getConnection(function(err, connection){
        if (!err) {
            var query="select playlist_id, title, creation, count(playlist_id) as count from playlists natural join links where mail=? group by (playlist_id);"
            var data=[]
            data.push(req.query.mail)
            connection.query(query, data,  function(err, rows, fields){
                if (!err) {
                    console.log("\treturning playlists...")
                    res.json(rows)
                } else {
                    console.log("\tinternal error")
                    console.log(err)
                    res.sendStatus(500)
                }
            })
        } else {
            console.log("\tinternal pool error")
            console.log(err)
            res.sendStatus(500)
        }
        connection.release()
    })
})

router.post("/playlists", function(req, res) {
    console.log("> " + req.ip + " - adding playlist...")
    pool.getConnection(function(err, connection){
        if (!err) {
            var query="insert into playlists(title, mail) values(?, ?);"
            var data=[]
            data.push(req.body.title)
            data.push(req.query.mail)
            connection.query(query, data,  function(err, rows, fields){
                if (!err) {
                    console.log("\tplaylist added")
                    res.json(rows)
                } else {
                    console.log("\tinternal error")
                    console.log(err)
                    res.sendStatus(500)
                }
            })
        } else {
            console.log("\tinternal pool error")
            console.log(err)
            res.sendStatus(500)
        }
        connection.release()
    })
})

router.put("/playlists", function(req, res) {
    console.log("> " + req.ip + " - updating playlist...")
    pool.getConnection(function(err, connection){
        if (!err) {
            var query="update playlists set title=? where mail=? and playlist_id=?;"
            var data=[]
            data.push(req.body.title)
            data.push(req.query.mail)
            data.push(req.body.playlist_id)
            connection.query(query, data,  function(err, rows, fields){
                if (!err) {
                    console.log("\tplaylist updated")
                    res.json(rows)
                } else {
                    console.log("\tinternal error")
                    console.log(err)
                    res.sendStatus(500)
                }
            })
        } else {
            console.log("\tinternal pool error")
            console.log(err)
            res.sendStatus(500)
        }
        connection.release()
    })
})

router.delete("/playlists", function(req, res) {
    console.log("> " + req.ip + " - deleting playlist...")
    pool.getConnection(function(err, connection){
        if (!err) {
            var query="delete from playlists where mail=? and playlist_id=?;"
            var data=[]
            data.push(req.query.mail)
            data.push(req.body.playlist_id)
            connection.query(query, data,  function(err, rows, fields){
                if (!err) {
                    console.log("\tplaylist deleted")
                    res.json(rows)
                } else {
                    console.log("\tinternal error")
                    console.log(err)
                    res.sendStatus(500)
                }
            })
        } else {
            console.log("\tinternal pool error")
            console.log(err)
            res.sendStatus(500)
        }
        connection.release()
    })
})

// /links - #### LINKS ####
router.get("/links", function(req, res) {
    console.log("> " + req.ip + " - links requested...")
    pool.getConnection(function(err, connection){
        if (!err) {
            var query="select playlist_id, track_id from links where mail=?;"
            var data=[]
            data.push(req.query.mail)
            connection.query(query, data,  function(err, rows, fields){
                if (!err) {
                    console.log("\treturning links...")
                    res.json(rows)
                } else {
                    console.log("\tinternal error")
                    console.log(err)
                    res.sendStatus(500)
                }
            })
        } else {
            console.log("\tinternal pool error")
            console.log(err)
            res.sendStatus(500)
        }
        connection.release()
    })
})

router.post("/links", function(req, res) {
    console.log("> " + req.ip + " - adding link...")
    pool.getConnection(function(err, connection){
        if (!err) {
            var query="insert into links(track_id, playlist_id, mail) values(?, ?, ?);"
            var data=[]
            data.push(req.body.track_id)
            data.push(req.body.playlist_id)
            data.push(req.query.mail)
            connection.query(query, data,  function(err, rows, fields){
                if (!err) {
                    console.log("\tlinks added")
                    res.json(rows)
                } else {
                    console.log("\tinternal error")
                    console.log(err)
                    res.sendStatus(500)
                }
            })
        } else {
            console.log("\tinternal pool error")
            console.log(err)
            res.sendStatus(500)
        }
        connection.release()
    })
})

router.put("/links", function(req, res) {
    console.log("> " + req.ip + " - updating link...")
    pool.getConnection(function(err, connection){
        if (!err) {
            var query="update links set playlist_id=?, track_id=? where mail=? and playlist_id=? and track_id=?;"
            var data=[]
            data.push(req.body.playlist_id)
            data.push(req.body.track_id)
            data.push(req.query.mail)
            data.push(req.body.old_playlist_id)
            data.push(req.body.old_track_id)
            connection.query(query, data,  function(err, rows, fields){
                if (!err) {
                    console.log("\tlink updated")
                    res.json(rows)
                } else {
                    console.log("\tinternal error")
                    console.log(err)
                    res.sendStatus(500)
                }
            })
        } else {
            console.log("\tinternal pool error")
            console.log(err)
            res.sendStatus(500)
        }
        connection.release()
    })
})

router.delete("/links", function(req, res) {
    console.log("> " + req.ip + " - deleting link...")
    pool.getConnection(function(err, connection){
        if (!err) {
            var query="delete from links where mail=? and playlist_id=? and  track_id=?;"
            var data=[]
            data.push(req.query.mail)
            data.push(req.body.playlist_id)
            data.push(req.body.track_id)
            connection.query(query, data,  function(err, rows, fields){
                if (!err) {
                    console.log("\tlink deleted")
                    res.json(rows)
                } else {
                    console.log("\tinternal error")
                    console.log(err)
                    res.sendStatus(500)
                }
            })
        } else {
            console.log("\tinternal pool error")
            console.log(err)
            res.sendStatus(500)
        }
        connection.release()
    })
})

module.exports = router
