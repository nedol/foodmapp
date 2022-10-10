'use strict'

var nodemailer = require('nodemailer');

module.exports =  class Email {
    constructor() {
        // this.transporter = nodemailer.createTransport({
        //     service: 'yandex',
        //     auth: {
        //         user: 'nedol@yandex.ru', //"admin@delivery-angels.ru",//
        //         pass: 'Nissan@386'
        //     }
        // })
        // this.transporter = nodemailer.createTransport({
        //     service: 'gmail',
        //     auth: {
        //         user: 'nedol.d2d@gmail.com', //"admin@delivery-angels.ru",//
        //         pass: 'Nissan_386'
        //     }
        // })
        this.transporter = nodemailer.createTransport({
            host: "smtp.yandex.ru",
            port: 465,
            secure: true, // upgrade later with STARTTLS
            auth: {
                user: "nedol@yandex.ru",
                pass: "Nissan@386"
            }
        });
    }

    SendMail(from, to, subj, html, cb) {
        let mailOptions = {
            from: from,//'youremail@gmail.com',
            to: to,//'myfriend@yahoo.com',
            subject: subj,//'Sending Email using Node.js',
            html: html//'<h1>Welcome</h1><p>That was easy!</p>'
        }
        this.transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                cb({err:error});
                console.log(error);
            } else {
                cb('Email sent: ' + info.response);
                console.log('Email sent: ' + info.response);
            }
        })
    }
}
