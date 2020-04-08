var fs = require("fs")

module.exports = (s) => {
    console.log(s)
    fs.appendFile('log.txt', `${s}\n`, function (err) {
        if (err) throw err;
    })
}