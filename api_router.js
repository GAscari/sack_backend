var express = require("express")
const uuid = require('uuid/v4')
var router = express.Router()
var mysql = require('mysql')
var util = require('util')
var db_query = require('./db_queries')
var fs = require('fs')

var pool = mysql.createPool({
    host: "192.168.0.111",
    user: "remote",
    password: "remote",
    database: "sack_v01",
    multipleStatements: true
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
    console.log("> " + req.ip + " - token requested")
    var mail = req.body.mail
    var psw = req.body.psw
    var device_uuid = req.body.device_uuid
    pool.getConnection(function(err, connection){
        if (!err) {
            var query="select count(*) as authorized, human_id from humans where mail=? and psw=SHA2(?, 512) group by human_id;"
            var data=[]
            data.push(mail); data.push(psw)
            connection.query(query, data,  function(err, rows, fields){
                if (!err) {
                    console.log("\tselezione ok")
                    if (rows[0].authorized == 1) {
                        var human_id = rows[0].human_id
                        var query="insert into human_tokens(uuid, device_uuid, human_id) values(?, ?, ?);"
                        console.log(">>> " + human_id)
                        var data=[]
                        data.push(uuid()); data.push(device_uuid); data.push(human_id)
                        connection.query(query,data,function(err,rows,fields){
                            if (!err) {
                                console.log("\ttoken inserted")
                                var query="select human_id, uuid from human_tokens where human_id=? order by creation desc limit 1;"
                                var data=[]
                                data.push(human_id)
                                connection.query(query,data,function(err,rows,fields){
                                    if (!err) {
                                        console.log("\ttoken sent")
                                        res.json(rows)
                                    } else {
                                        console.log("\tinternal server error (token_returning)")
                                        console.log(err)
                                        res.sendStatus(500)
                                    }
                                })
                            } else {
                                console.log("\tinternal server error (token_insertion)")
                                console.log(err)
                                res.sendStatus(500)
                            }
                        })
                    } else {
                        console.log("\tunauthorized to get token (" + rows[0].authorized + "???)")
                        console.log(err)
                        res.sendStatus(403)
                    }
                } else {
                    console.log("\tinternal server error (checking_auth)")
                    console.log(err)
                    res.sendStatus(500)
                }
            })
            connection.release()
        }
        else {
            console.log("\tinternal pool error")
            console.log(err)
            res.sendStatus(500)
        } 
    })
})

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// TODO: transazioni, dovrei riscrivere troppa tanta roba in troppo poco tempo (saremo intasati di indirizzi non referenziati)
router.post("/signin", function(req, res) {
    console.log("> " + req.ip + " - registration requested")
    var query = "INSERT INTO addresses (street, number, municipality_id) VALUES (?, ?, ?);"
    var data = []
    data.push(req.body.street); data.push(req.body.number); data.push(req.body.municipality_id)
    db_query.argento(query, data, pool, "address", (result) => {
        if (result.status == 200 && result.rows.affectedRows == 1) {
            address_id = result.rows.insertId
            data = []
            data.push(req.body.name); data.push(req.body.psw); data.push(req.body.mail); data.push(req.body.telephone); data.push(address_id)
            data.push(0); data.push(getRandomInt(1000000,9999999)); data.push(0); data.push(getRandomInt(1000000,9999999))
            query = "INSERT INTO humans (name, psw, mail, telephone, address_id, verified_mail, verification_mail_code, verified_telephone, verification_telephone_code)"
            query += " VALUES (?, SHA2(?,512), ?, ?, ?, ?, ?, ?, ?);"
            db_query.post(query, data, req, res, pool, "humans")
        } else {
            console.log("\tinternal server error (inserting_address)")
            console.log(result)
            res.sendStatus(500)
        }
    })
})

//USE - verifica che il token sia autorizzato
router.use(function(req, res, next) {
    console.log("> " + req.ip + " - access requested")
    pool.getConnection(function(err, connection){
        if (!err) {
            var query="select count(*) as authorized from human_tokens where human_id=? and uuid=? and device_uuid=? and timestampadd(month,1,creation)>=current_timestamp;"
            var data=[]
            data.push(req.query.human_id); data.push(req.query.uuid); data.push(req.query.device_uuid)
            connection.query(query, data,  function(err, rows, fields){
                if (!err) {
                    console.log("\ttoken examination")
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
})

// <<<< ITEMS >>>>

router.get("/items", function(req, res) {
    var shop_id = null
    shop_id = req.query.shop_id
    var query
    var data=[]
    if (shop_id == null) {
        query="SELECT * FROM items NATURAL LEFT JOIN measurements;"
        data=[]
    } else {
        query="SELECT * FROM items NATURAL LEFT JOIN measurements WHERE shop_id=?;"
        data=[]
        data.push(shop_id)
    }
    db_query.get(query, data, req, res, pool, "items")
})

router.get("/item", function(req, res) {
    var query="SELECT * FROM items NATURAL LEFT JOIN measurements WHERE item_id=?;"
    var data=[]
    data.push(req.query.item_id)
    db_query.get(query, data, req, res, pool, "item")
})

router.post("/item", function(req, res) {
    var query = "INSERT INTO items (" 
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
    db_query.post(query, data, req, res, pool, "item")
})

router.put("/item", function(req, res) {
    var query="UPDATE items SET "
    var data=[]
    for (var prop in req.body) {
        if (Object.prototype.hasOwnProperty.call(req.body, prop)) {
            query += prop + "=?, "
            data.push(req.body[prop])
        }
    }
    query = query.slice(0, -2)
    query += " WHERE item_id=?;"
    data.push(req.query.item_id)
    db_query.put(query, data, req, res, pool, "item")
})

router.delete("/item", function(req, res) {
    var query="DELETE FROM items WHERE item_id=?;"
    var data=[]
    data.push(req.query.item_id)
    db_query.delete(query, data, req, res, pool, "item")
})

// <<<< SHOPS >>>>

router.get("/shops", function(req, res) {
    var query
    var data=[]
    query="SELECT * FROM shops NATURAL JOIN addresses NATURAL JOIN municipalities;"
    //query = "SELECT * d FROM (SELECT * c FROM (SELECT * b FROM (SELECT * a FROM shops INNER JOIN dow on shops.delivery_from_dow=dow.dow_id) INNER JOIN dow on a.delivery_to_dow=dow.dow_id) INNER JOIN dow on b.opening_from_dow=dow.dow_id) INNER JOIN dow on c.opening_to_dow=dow.dow_id;"
    db_query.get(query, data, req, res, pool, "shops")
})

router.get("/shop", function(req, res) {
    var query="SELECT * FROM shops NATURAL JOIN addresses NATURAL JOIN municipalities WHERE shop_id=?;"
    var data=[]
    data.push(req.query.shop_id)
    db_query.get(query, data, req, res, pool, "shop")
})

router.post("/shop", function(req, res) {
    var query = "INSERT INTO shops (" 
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
    db_query.post(query, data, req, res, pool, "shop")
})

router.put("/shop", function(req, res) {
    var query="UPDATE shops SET "
    var data=[]
    for (var prop in req.body) {
        if (Object.prototype.hasOwnProperty.call(req.body, prop)) {
            query += prop + "=?, "
            data.push(req.body[prop])
        }
    }
    query = query.slice(0, -2)
    query += " WHERE shop_id=?;"
    data.push(req.query.shop_id)
    db_query.put(query, data, req, res, pool, "shop")
})

router.delete("/shop", function(req, res) {
    var query="DELETE FROM shops WHERE shop_id=?;"
    var data=[]
    data.push(req.query.shop_id)
    db_query.delete(query, data, req, res, pool, "shop")
})

// <<<< ADDRESSES >>>>

router.get("/addresses", function(req, res) {
    var query
    var data=[]
    query="SELECT * FROM addresses NATURAL JOIN municipalities;"
    db_query.get(query, data, req, res, pool, "addresses")
})

router.get("/address", function(req, res) {
    var query="SELECT * FROM addresses NATURAL JOIN municipalities WHERE address_id=?;"
    var data=[]
    data.push(req.query.shop_id)
    db_query.get(query, data, req, res, pool, "address")
})

router.post("/address", function(req, res) {
    var query = "INSERT INTO addresses (" 
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
    db_query.post(query, data, req, res, pool, "address")
})

router.put("/address", function(req, res) {
    var query="UPDATE addresses SET "
    var data=[]
    for (var prop in req.body) {
        if (Object.prototype.hasOwnProperty.call(req.body, prop)) {
            query += prop + "=?, "
            data.push(req.body[prop])
        }
    }
    query = query.slice(0, -2)
    query += " WHERE address_id=?;"
    data.push(req.query.shop_id)
    db_query.put(query, data, req, res, pool, "address")
})

router.delete("/address", function(req, res) {
    var query="DELETE FROM addresses WHERE address_id=?;"
    var data=[]
    data.push(req.query.shop_id)
    db_query.delete(query, data, req, res, pool, "address")
})

// <<<< MUNICIPALITIES >>>>

router.get("/municipalities", function(req, res) {
    var query
    var data=[]
    query="SELECT * FROM municipalities;"
    db_query.get(query, data, req, res, pool, "municipalities")
})

router.get("/municipality", function(req, res) {
    var query="SELECT * FROM municipalities WHERE municipality_id=?;"
    var data=[]
    data.push(req.query.shop_id)
    db_query.get(query, data, req, res, pool, "municipality")
})

router.post("/municipality", function(req, res) {
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
    db_query.post(query, data, req, res, pool, "municipality")
})

router.put("/municipalities", function(req, res) {
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
    db_query.put(query, data, req, res, pool, "municipality")
})

router.delete("/municipality", function(req, res) {
    var query="DELETE FROM municipalities WHERE municipality_id=?;"
    var data=[]
    data.push(req.query.shop_id)
    db_query.delete(query, data, req, res, pool, "shop")
})

// <<<< HUMANS >>>>

router.get("/human", function(req, res) {
    var query="SELECT * FROM humans WHERE human_id=?;"
    var data=[]
    data.push(req.query.human_id)
    db_query.get(query, data, req, res, pool, "human")
})

router.put("/human", function(req, res) {
    var query="UPDATE humans SET "
    var data=[]
    for (var prop in req.body) {
        if (Object.prototype.hasOwnProperty.call(req.body, prop)) {
            query += prop + "=?, "
            data.push(req.body[prop])
        }
    }
    query = query.slice(0, -2)
    query += " WHERE human_id=?;"
    data.push(req.query.human_id)
    db_query.put(query, data, req, res, pool, "human")
})

// <<<< CARTS >>>>

router.get("/carts", function(req, res) {
    var query="SELECT * FROM carts WHERE human_id=?;"
    var data=[]
    data.push(req.query.human_id)
    db_query.get(query, data, req, res, pool, "human")
})

router.get("/cart", function(req, res) {
    var query
    var data=[]
    data.push(req.query.human_id)

    if (req.query.cart_id == null) {
        query="SELECT * FROM carts WHERE human_id=? and shop_id=? LIMIT 1;"
        data.push(req.query.shop_id)
    } else {
        query="SELECT * FROM carts WHERE human_id=? and cart_id=?;"
        data.push(req.query.cart_id)
    }
    
    db_query.get(query, data, req, res, pool, "cart")
})

router.get("/cart/items", function(req, res) {
    /*var query="SELECT * FROM carts WHERE human_id=?;"
    var data=[]
    data.push(req.query.human_id)
    db_query.get(query, data, req, res, pool, "human")*/
})


module.exports = router
