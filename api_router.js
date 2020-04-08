var express = require("express")
const uuid = require('uuid/v4')
var router = express.Router()
var mysql = require('mysql')
var util = require('util')
var db_query = require('./db_queries')
var fs = require('fs')
var log = require('./log')
var nodemailer = require('nodemailer');
var smtp_transport = require('nodemailer-smtp-transport');

var pool = mysql.createPool({
    host: "192.168.0.111",
    user: "remote",
    password: "remote",
    database: "sack_v01",
    multipleStatements: true
})

var transporter = nodemailer.createTransport(smtp_transport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'giacomoascari.work@gmail.com',
        pass: 'qyzcxiqllrasfiqs'
        
    }
}))

router.use(express.json())
router.use(express.urlencoded({ extended: true }))


//USE - stampa ip e ora richiesta
//#region
router.use(function(req, res, next) {
    log(`> ip:${req.ip} - ${(new Date(Date.now())).toUTCString()}, pid:${process.pid}`)
    next()
})
//#endregion

//POST - chiede il rilascio di un token con login
//#region
router.post("/login", function(req, res) {
    log("> " + req.ip + " - token requested")
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
                    log("\tselect ok")
                    if (rows[0].authorized == 1) {
                        var human_id = rows[0].human_id
                        var query="insert into human_tokens(uuid, device_uuid, human_id) values(?, ?, ?);"
                        var data=[]
                        data.push(uuid()); data.push(device_uuid); data.push(human_id)
                        connection.query(query,data,function(err,rows,fields){
                            if (!err) {
                                log("\ttoken inserted")
                                var query="select human_id, uuid from human_tokens where human_id=? order by creation desc limit 1;"
                                var data=[]
                                data.push(human_id)
                                connection.query(query,data,function(err,rows,fields){
                                    if (!err) {
                                        log("\ttoken sent")
                                        res.json(rows)
                                    } else {
                                        log("\tinternal server error (token_returning)")
                                        log(err)
                                        res.sendStatus(500)
                                    }
                                })
                            } else {
                                log("\tinternal server error (token_insertion)")
                                log(err)
                                res.sendStatus(500)
                            }
                        })
                    } else {
                        log("\tunauthorized to get token (" + rows[0].authorized + "???)")
                        log(err)
                        res.sendStatus(403)
                    }
                } else {
                    log("\tinternal server error (checking_auth)")
                    log(err)
                    res.sendStatus(500)
                }
            })
            connection.release()
        }
        else {
            log("\tinternal pool error")
            log(err)
            res.sendStatus(500)
        } 
    })
})
//#endregion

//POST - chiede la registrazione di un human
//#region 
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
router.post("/register", function(req, res) {
    log("> " + req.ip + " - registration requested")
    var query = "INSERT INTO addresses (address_street, address_number, municipality_id) VALUES (?, ?, ?);"
    var data = []
    data.push(req.body.address_street); data.push(req.body.address_number); data.push(req.body.municipality_id)
    db_query.argento(query, data, pool, (result) => {
        if (result.status == 200 && result.rows.affectedRows == 1) {
            address_id = result.rows.insertId
            data = []
            data.push(req.body.first_name); data.push(req.body.last_name); data.push(req.body.psw); data.push(req.body.mail); data.push(req.body.telephone); data.push(address_id)
            data.push(0); data.push(getRandomInt(1000000,9999999)); data.push(0); data.push(getRandomInt(1000000,9999999))
            query = "INSERT INTO humans (first_name, last_name, psw, mail, telephone, address_id, verified_mail, verification_mail_code, verified_telephone, verification_telephone_code)"
            query += " VALUES (?, ?, SHA2(?,512), ?, ?, ?, ?, ?, ?, ?);"
            db_query.post(query, data, req, res, pool, "humans")
        } else {
            log("\tinternal server error (inserting_address)")
            log(result)
            res.sendStatus(500)
        }
    })
})
//#endregion

//USE - verifica che il token sia autorizzato
//#region
router.use(function(req, res, next) {
    log("> " + req.ip + " - access requested")
    pool.getConnection(function(err, connection){
        if (!err) {
            var query="select count(*) as authorized from human_tokens where human_id=? and uuid=? and device_uuid=? and timestampadd(month,1,creation)>=current_timestamp;"
            var data=[]
            data.push(req.query.human_id); data.push(req.query.uuid); data.push(req.query.device_uuid)
            connection.query(query, data,  function(err, rows, fields){
                if (!err) {
                    log("\ttoken examination")
                    if (rows[0].authorized != 0) {
                        log("\ttoken approved")
                        next()
                    } else {
                        log("\ttoken rejected")
                        res.sendStatus(403);
                    }
                } else {
                    log("\tinternal error")
                    log(err)
                    res.sendStatus(500)
                }
            })
            connection.release()
        } else {
            log("\tinternal pool error")
            log(err)
            res.sendStatus(500)
        }
    })
})
//#endregion

// <<<< API TEST + MAIL >>>>
//#region
router.get("/test", function(req, res) {
    pool.getConnection(function(err, connection){
        if (!err) {
            res.sendStatus(200)
        } else {
            log("\tinternal error")
            res.sendStatus(500)
        }
        connection.release()
    })
})

function send_mail(name, from, to, subject, html, callback) {
    var mailOptions = {
        from: `"${name}" <${from}>`,
        to: to,
        subject: subject,
        //text: text,
        html: html
    }
    transporter.sendMail(mailOptions, (error, info) => {
        callback(error, info)
    })
}

router.post("/mail", function(req, res) {
    send_mail(req.body.name, "giacomoascari.work@gmail.com", req.body.to, req.body.subject, "<body><i>muahahah</i></body>", (error, info) =>{
        log("\tsending mail to " + req.body.to)
        if (error) {
            console.log(error)
            res.sendStatus(500)
        } else {
            log('\temail sent: ' + info.response)
            res.sendStatus(200)
        }
    })
})
//#endregion

// <<<< ITEMS >>>>
//#region
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
//#endregion

// <<<< SHOPS >>>>
//#region
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
//#endregion

// <<<< ADDRESSES >>>>
//#region
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
//#endregion

// <<<< MUNICIPALITIES >>>>
//#region
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
//#endregion

// <<<< HUMANS >>>>
//#region
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
router.delete("/human", function(req, res) {
    var query="DELETE FROM humans WHERE human_id=?;"
    var data=[]
    data.push(req.query.human_id)
    db_query.delete(query, data, req, res, pool, "human")
})
//#endregion

// <<<< CARTS >>>>
//#region
router.get("/carts", function(req, res) {
    var query = "SELECT * FROM carts WHERE human_id=?;"
    var data = []
    data.push(req.query.human_id)
    db_query.get(query, data, req, res, pool, "carts")
})

router.get("/cart", function(req, res) {
    var query=  "SELECT * FROM carts WHERE human_id=? and shop_id=?;" //LIMIT 1 non dovr. servire
    var data = []
    data.push(req.query.human_id)
    data.push(req.query.shop_id)
    db_query.get(query, data, req, res, pool, "cart")
})

router.get("/cart/items", function(req, res) {
    var query = "SELECT * FROM carts WHERE human_id=? and shop_id=?;"
    var data = []
    data.push(req.query.human_id)
    data.push(req.query.shop_id)
    db_query.get(query, data, req, res, pool, "cart/items")
})

router.post("/cart/item", function(req, res) {
    var query = "SELECT shop_id FROM items WHERE item_id=?;"
    var data=[]
    var cart_shop_id = null
    data.push(req.body.cart_item_id)
    db_query.argento(query, data, pool, (result) => {
        if (result.err == null) {
            cart_shop_id = result.rows[0].shop_id
            query = "SELECT * FROM carts WHERE cart_shop_id=? AND cart_human_id=? AND cart_item_id=?;"
            data=[]
            data.push(cart_shop_id); data.push(req.query.human_id); data.push(req.body.cart_item_id)
            db_query.argento(query, data, pool, (result) => {
                if (result.err == null) {
                    var cart_item_quantity_exists = false
                    try {
                        var dummy = result.rows[0].cart_item_quantity
                        cart_item_quantity_exists = true
                    } catch {}
                    if (!cart_item_quantity_exists) {
                        query = "INSERT INTO carts (cart_shop_id, cart_human_id, cart_item_quantity, cart_item_id) VALUES (?, ?, ?, ?);"
                        data=[]
                        data.push(cart_shop_id); data.push(req.query.human_id); data.push(req.body.cart_item_quantity); data.push(req.body.cart_item_id)
                        db_query.argento(query, data, pool, (result) => {
                            if (result.status == 200) res.json(result.rows)
                            else res.sendStatus(result.status)
                        })
                    } else {
                        query = "UPDATE carts SET cart_item_quantity=? WHERE cart_shop_id=? AND cart_human_id=?;"
                        data=[]
                        data.push(parseInt(req.body.cart_item_quantity) + result.rows[0].cart_item_quantity); data.push(cart_shop_id); data.push(req.query.human_id)
                        db_query.argento(query, data, pool, (result) => {
                            if (result.status == 200) res.json(result.rows)
                            else res.sendStatus(result.status)
                        })
                    }
                } else {
                    res.sendStatus(result.status)
                }
            })
        } else {
            res.sendStatus(result.status)
        }
    })
})

router.put("/cart/item", function(req, res) {
    var query = "SELECT shop_id FROM items WHERE item_id=?;"
    var data=[]
    var cart_shop_id = null
    data.push(req.body.cart_item_id)
    db_query.argento(query, data, pool, (result) => {
        if (result.err == null) {
            cart_shop_id = result.rows[0].shop_id
            query = "UPDATE carts SET cart_item_quantity=? WHERE cart_shop_id=? AND cart_human_id=?;"
            data=[]
            data.push(req.body.cart_item_quantity); data.push(cart_shop_id); data.push(req.query.human_id)
            db_query.put(query, data, req, res, pool, "cart/item")
        } else {
            res.sendStatus(result.status)
        }
    })
})

router.delete("/cart/item", function(req, res) {
    var query = "SELECT shop_id FROM items WHERE item_id=?;"
    var data=[]
    var cart_shop_id = null
    data.push(req.body.cart_item_id)
    db_query.argento(query, data, pool, (result) => {
        if (result.err == null) {
            cart_shop_id = result.rows[0].shop_id
            query="DELETE FROM carts WHERE cart_shop_id=? AND cart_human_id=? AND cart_item_id=?;"
            data=[]
            ddata.push(cart_shop_id); data.push(req.query.human_id); data.push(req.query.cart_item_id)
            db_query.delete(query, data, req, res, pool, "cart/item")
        } else {
            res.sendStatus(result.status)
        }
    })
})
//#endregion

// <<<< ORDERS >>>>
//#region 

//#endregion
module.exports = router
