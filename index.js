var express = require("express")
var router = express()
var api_router = require("./api_router")
var os = require('os')
var cluster = require("cluster")
var https = require('https')
var http = require('http')
var fs = require('fs')

var key = fs.readFileSync('privkey.pem')
var cert = fs.readFileSync('cert.pem')
var ca = fs.readFileSync('fullchain.pem')
var options = {
    key: key,
    cert: cert,
    ca: ca
}

if (cluster.isMaster) {
    cluster.on('fork', function(worker) {
        console.log('worker' + worker.id + " up")
    })
    cluster.on('exit', function(worker) {
        console.log('worker' + worker.id + " down")
        cluster.fork()
    })
    var cpu_count = os.cpus().length;
    for (var i = 0; i < cpu_count; i++) cluster.fork()
} else {
    router.use("/sack/v01", api_router)
    //var server = https.createServer(options, router)
    //server.listen(443)
    var server = http.createServer(router)
    server.listen(3000)
    process.on('uncaughtException', (code) => {
        console.log('worker fatal error - ' + code);
        process.exit();
    });
}
