var nodemailer = require('nodemailer');
var smtp_transport = require('nodemailer-smtp-transport');

var sender_mail = "giacomoascari.work@gmail.com"
var sender_psw = 'qyzcxiqllrasfiqs'

var transporter = nodemailer.createTransport(smtp_transport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: sender_mail,
        pass: sender_psw
        
    }
}))

module.exports.send_mail = (name, to, subject, html, callback) => {
    var mailOptions = {
        from: `"${name}" <${sender_mail}>`,
        to: to,
        subject: subject,
        //text: text,
        html: html
    }
    transporter.sendMail(mailOptions, (error, info) => {
        callback(error, info)
    })
}
