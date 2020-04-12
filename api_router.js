var express = require("express")
const uuid = require('uuid/v4')
var router = express.Router()
var mysql = require('mysql')
var util = require('util')
var db = require('./db')
var fs = require('fs')
var log = require('./log')
var nodemailer = require('nodemailer');
var smtp_transport = require('nodemailer-smtp-transport');

var sender_mail = "giacomoascari.work@gmail.com"
var sender_psw = 'qyzcxiqllrasfiqs'

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
        user: sender_mail,
        pass: sender_psw
        
    }
}))

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

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

router.use(express.json())
router.use(express.urlencoded({ extended: true }))


// <<<< INTESTAZIONE >>>>
//#region
router.use(function(req, res, next) {
    log(`> ip:${req.ip} - ${(new Date(Date.now())).toUTCString()}, pid:${process.pid}`)
    next()
})
//#endregion

// <<<< LOGIN >>>>
//#region
router.post("/login", function(req, res) {
    log("> " + req.ip + " - token requested")
    var mail = req.body.mail
    var psw = req.body.psw
    var device_uuid = req.body.device_uuid
    pool.getConnection(function(err, connection){
        if (!err) {
            var query="select count(*) as authorized, human_id from humans where mail=? and psw=SHA2(?, 512) and verified_mail=true group by human_id;"
            var data=[]
            data.push(mail); data.push(psw)
            connection.query(query, data,  function(err, rows, fields){
                if (!err) {
                    log("\tselect ok")
                    if (rows && rows[0] && rows[0].authorized && rows[0].authorized == 1) {
                        var human_id = rows[0].human_id
                        var query="insert into human_tokens(uuid, device_uuid, human_id) values(?, ?, ?);"
                        var data=[]
                        data.push(uuid()); data.push(device_uuid); data.push(human_id)
                        connection.query(query,data,function(err,rows,fields){
                            if (!err) {
                                log("\ttoken inserted")
                                var query="select human_id, uuid, timestampadd(week, 2, creation) as expiration from human_tokens where human_id=? order by creation desc limit 1;"
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
                        log("\tunauthorized to get token")
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

// <<<< REGISTER >>>>
//#region 

router.post("/register", function(req, res) {
    log("> " + req.ip + " - registration requested")
    var query = "INSERT INTO addresses (address_street, address_number, municipality_id) VALUES (?, ?, ?);"
    var data = []
    data.push(req.body.address_street); data.push(req.body.address_number); data.push(req.body.municipality_id)
    db.interrogate(query, data, pool, (result) => {
        if (result.status == 200 && result.rows.affectedRows == 1) {
            address_id = result.rows.insertId
            data = []
            var verification_mail_code = getRandomInt(1000000,9999999)
            var verification_telephone_code = getRandomInt(1000000,9999999)
            data.push(req.body.first_name); data.push(req.body.last_name); data.push(req.body.psw); data.push(req.body.mail); data.push(req.body.telephone); data.push(address_id)
            data.push(0); data.push(verification_mail_code); data.push(0); data.push(verification_telephone_code)
            query = "INSERT INTO humans (first_name, last_name, psw, mail, telephone, address_id, verified_mail, verification_mail_code, verified_telephone, verification_telephone_code)"
            query += " VALUES (?, ?, SHA2(?,512), ?, ?, ?, ?, ?, ?, ?);"
            log("> " + req.ip + " - adding humans")
            db.interrogate(query, data, pool, (result) => {
                if (result.status == 200) {
                    res.json(result.rows)
                    var url = `http://localhost:3000/sack/v01/verify/mail?human_id=${result.rows.insertId}&verification_mail_code=${verification_mail_code}`
                    var from = `"Sack" <${sender_mail}>`
                    var html = `<p>Clicca <a href=${url}>QUI</a> per attivare il tuo account.</p>`
                    send_mail("Sack", sender_mail, req.body.mail, "Verifica la tua e-mail", html, (error, info) => {
                        log("\tsending ver. mail to " + req.body.mail)
                            if (error) {
                                log(error)
                            } else {
                                log('\temail sent: ' + info.response)
                            }
                    })
                }
                else res.sendStatus(result.status)
            })
        } else {
            log("\tinternal server error (inserting_address)")
            log(result)
            res.sendStatus(500)
        }
    })
})
//#endregion

// <<<< VERIFY (mail) >>>>
//#region 
router.get("/verify/mail", function(req, res) {
    var query
    var data=[]
    query="UPDATE humans SET verified_mail=true WHERE human_id=? AND verification_mail_code=?;"
    data.push(req.query.human_id); data.push(req.query.verification_mail_code)
    //db_query.put(query, data, req, res, pool, "humans (verify)")
    log("> " + req.ip + " - verifying ")
    db.interrogate(query, data, pool, (result) => {
        if (result.status == 200 && result.rows.changedRows == 1)  {
            res.sendStatus(200)
        } else if (result.status == 200) {
            res.sendStatus(403)
        } else {
            res.sendStatus(result.status)
        }
    })
})
//#endregion

// <<<< auth process >>>>
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
router.post("/mail", function(req, res) {
    send_mail(req.body.name, "giacomoascari.work@gmail.com", req.body.to, req.body.subject, req.body.html, (error, info) =>{
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
    var query
    var data = []
    if (req.query.shop_id) {
        query = "SELECT items.*, measurements.*, GROUP_CONCAT(category_title) as categories_concat FROM items NATURAL LEFT JOIN measurements NATURAL LEFT JOIN item_categories NATURAL LEFT JOIN categories WHERE shop_id=? GROUP BY item_id;"
        data.push(req.query.shop_id)
    } else {
        query = "SELECT items.*, measurements.*, GROUP_CONCAT(category_title) as categories_concat FROM items NATURAL LEFT JOIN measurements NATURAL LEFT JOIN item_categories NATURAL LEFT JOIN categories GROUP BY item_id;"
    }
    db.get(query, data, req, res, pool, "items")
})

router.get("/item", function(req, res) {
    var query = "SELECT items.*, measurements.*, GROUP_CONCAT(category_title) as categories_concat FROM items NATURAL LEFT JOIN measurements NATURAL LEFT JOIN item_categories NATURAL LEFT JOIN categories WHERE item_id=? GROUP BY item_id;"
    var data = []
    data.push(req.query.item_id)
    db.get(query, data, req, res, pool, "item")
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
    db.post(query, data, req, res, pool, "item")
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
    db.put(query, data, req, res, pool, "item")
})

router.delete("/item", function(req, res) {
    var query="DELETE FROM items WHERE item_id=?;"
    var data=[]
    data.push(req.query.item_id)
    db.delete(query, data, req, res, pool, "item")
})
//#endregion

// <<<< SHOPS >>>>
//#region
router.get("/shops", function(req, res) {
    var data = []
    var query = "SELECT shops.*, addresses.*, municipalities.*, GROUP_CONCAT(category_title) as categories_concat FROM shops NATURAL LEFT JOIN addresses NATURAL LEFT JOIN municipalities NATURAL LEFT JOIN shop_categories NATURAL LEFT JOIN categories GROUP BY shop_id;"
    db.get(query, data, req, res, pool, "shops")
})

router.get("/shops/local", function(req, res) {
    var query = "SELECT shops.*, addresses.*, municipalities.*, GROUP_CONCAT(category_title) as categories_concat FROM shops NATURAL LEFT JOIN addresses NATURAL LEFT JOIN municipalities NATURAL LEFT JOIN shop_categories NATURAL LEFT JOIN categories GROUP BY shop_id;"

    var query="SELECT s* FROM shops NATURAL LEFT JOIN deliver_to WHERE municipality_id=(SELECT municipality_id FROM humans NATURAL LEFT JOIN addresses NATURAL LEFT JOIN shop_categories WHERE human_id=?);"
    var data=[]
    data.push(req.query.human_id)
    db.get(query, data, req, res, pool, "shops/local")
})

router.get("/shop", function(req, res) {
    var query = "SELECT shops.*, addresses.*, municipalities.*, GROUP_CONCAT(category_title) as categories_concat FROM shops NATURAL LEFT JOIN addresses NATURAL LEFT JOIN municipalities NATURAL LEFT JOIN shop_categories NATURAL LEFT JOIN categories WHERE shop_id=? GROUP BY shop_id;"
    var data = []
    data.push(req.query.shop_id)
    db.get(query, data, req, res, pool, "shop")
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
    db.post(query, data, req, res, pool, "shop")
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
    db.put(query, data, req, res, pool, "shop")
})

router.delete("/shop", function(req, res) {
    var query="DELETE FROM shops WHERE shop_id=?;"
    var data=[]
    data.push(req.query.shop_id)
    db.delete(query, data, req, res, pool, "shop")
})
//#endregion

// <<<< ADDRESSES >>>>
//#region
router.get("/addresses", function(req, res) {
    var query
    var data=[]
    query="SELECT * FROM addresses NATURAL LEFT JOIN municipalities;"
    db.get(query, data, req, res, pool, "addresses")
})

router.get("/address", function(req, res) {
    var query="SELECT * FROM addresses NATURAL LEFT JOIN municipalities WHERE address_id=?;"
    var data=[]
    data.push(req.query.shop_id)
    db.get(query, data, req, res, pool, "address")
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
    db.post(query, data, req, res, pool, "address")
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
    db.put(query, data, req, res, pool, "address")
})

router.delete("/address", function(req, res) {
    var query="DELETE FROM addresses WHERE address_id=?;"
    var data=[]
    data.push(req.query.shop_id)
    db.delete(query, data, req, res, pool, "address")
})
//#endregion

// <<<< MUNICIPALITIES >>>>
//#region
router.get("/municipalities", function(req, res) {
    var query
    var data=[]
    query="SELECT * FROM municipalities;"
    db.get(query, data, req, res, pool, "municipalities")
})

router.get("/municipality", function(req, res) {
    var query="SELECT * FROM municipalities WHERE municipality_id=?;"
    var data=[]
    data.push(req.query.shop_id)
    db.get(query, data, req, res, pool, "municipality")
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
    db.post(query, data, req, res, pool, "municipality")
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
    db.put(query, data, req, res, pool, "municipality")
})

router.delete("/municipality", function(req, res) {
    var query="DELETE FROM municipalities WHERE municipality_id=?;"
    var data=[]
    data.push(req.query.shop_id)
    db.delete(query, data, req, res, pool, "shop")
})
//#endregion

// <<<< HUMANS >>>>
//#region
router.get("/human", function(req, res) {
    var query="SELECT * FROM humans WHERE human_id=?;"
    var data=[]
    data.push(req.query.human_id)
    db.get(query, data, req, res, pool, "human")
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
    db.put(query, data, req, res, pool, "human")
})
router.delete("/human", function(req, res) {
    var query="DELETE FROM humans WHERE human_id=?;"
    var data=[]
    data.push(req.query.human_id)
    db.delete(query, data, req, res, pool, "human")
})
//#endregion

// <<<< CARTS >>>>
//#region
router.get("/carts", function(req, res) {
    var query = "SELECT * FROM carts WHERE human_id=?;"
    var data = []
    data.push(req.query.human_id)
    db.get(query, data, req, res, pool, "carts")
})

router.get("/cart", function(req, res) {
    var query=  "SELECT * FROM carts WHERE human_id=? and shop_id=?;" //LIMIT 1 non dovr. servire
    var data = []
    data.push(req.query.human_id)
    data.push(req.query.shop_id)
    db.get(query, data, req, res, pool, "cart")
})

router.get("/cart/items", function(req, res) {
    var query = "SELECT * FROM carts NATURAL JOIN items WHERE human_id=? and shop_id=?;"
    var data = []
    data.push(req.query.human_id)
    data.push(req.query.shop_id)
    db.get(query, data, req, res, pool, "cart/items")
})

router.post("/cart/item", function(req, res) {
    var query = "SELECT shop_id FROM items WHERE item_id=?;"
    var data=[]
    var cart_shop_id = null
    data.push(req.body.cart_item_id)
    db.interrogate(query, data, pool, (result) => {
        if (result.err == null) {
            cart_shop_id = result.rows[0].shop_id
            query = "SELECT * FROM carts WHERE cart_shop_id=? AND cart_human_id=? AND cart_item_id=?;"
            data=[]
            data.push(cart_shop_id); data.push(req.query.human_id); data.push(req.body.cart_item_id)
            db.interrogate(query, data, pool, (result) => {
                if (result.err == null) {
                    var cart_item_quantity_exists = false
                    try {
                        var dummy = result.rows[0].cart_item_quantity
                        cart_item_quantity_exists = true
                    } catch (e) {}
                    if (!cart_item_quantity_exists) {
                        query = "INSERT INTO carts (cart_shop_id, cart_human_id, cart_item_quantity, cart_item_id) VALUES (?, ?, ?, ?);"
                        data=[]
                        data.push(cart_shop_id); data.push(req.query.human_id); data.push(req.body.cart_item_quantity); data.push(req.body.cart_item_id)
                        db.interrogate(query, data, pool, (result) => {
                            if (result.status == 200) res.json(result.rows)
                            else res.sendStatus(result.status)
                        })
                    } else {
                        query = "UPDATE carts SET cart_item_quantity=? WHERE cart_shop_id=? AND cart_human_id=?;"
                        data=[]
                        data.push(parseInt(req.body.cart_item_quantity) + result.rows[0].cart_item_quantity); data.push(cart_shop_id); data.push(req.query.human_id)
                        db.interrogate(query, data, pool, (result) => {
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
    db.interrogate(query, data, pool, (result) => {
        if (result.err == null) {
            cart_shop_id = result.rows[0].shop_id
            query = "UPDATE carts SET cart_item_quantity=? WHERE cart_shop_id=? AND cart_human_id=?;"
            data=[]
            data.push(req.body.cart_item_quantity); data.push(cart_shop_id); data.push(req.query.human_id)
            db.put(query, data, req, res, pool, "cart/item")
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
    db.interrogate(query, data, pool, (result) => {
        if (result.err == null) {
            cart_shop_id = result.rows[0].shop_id
            query="DELETE FROM carts WHERE cart_shop_id=? AND cart_human_id=? AND cart_item_id=?;"
            data=[]
            ddata.push(cart_shop_id); data.push(req.query.human_id); data.push(req.query.cart_item_id)
            db.delete(query, data, req, res, pool, "cart/item")
        } else {
            res.sendStatus(result.status)
        }
    })
})
//#endregion

// <<<< ORDERS >>>>
//#region 
router.get("/orders", function(req, res) {
    var query
    var data = []
    if (req.query.shop_id) {
        query="SELECT * FROM orders NATURAL LEFT JOIN shops NATURAL LEFT JOIN humans WHERE shop_id=? AND human_id=?;"
        data.push(req.query.shop_id)
        data.push(req.query.human_id)
    } else {
        query="SELECT * FROM orders NATURAL LEFT JOIN shops NATURAL LEFT JOIN humans WHERE human_id=?;"
        data.push(req.query.human_id)
    }
    db.get(query, data, req, res, pool, "orders")
})
router.get("/order", function(req, res) {
    var query
    var data = []
    query="SELECT * FROM orders NATURAL LEFT JOIN shops NATURAL LEFT JOIN humans WHERE order_id=?;"
    data.push(req.query.order_id)
    db.get(query, data, req, res, pool, "order")
})
router.get("/order/items", function(req, res) {
    var query
    var data = []
    query="SELECT * FROM ordered_items NATURAL LEFT JOIN items WHERE order_id=?;"
    data.push(req.query.order_id)
    db.get(query, data, req, res, pool, "order/items")
})
//#endregion
module.exports = router
