const nodemailer = require('nodemailer');
const pug = require('pug');
const path = require('path');
const juice = require('juice');
const htmlToText = require('html-to-text');
const promsify = require('es6-promisify');

const transport = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});



const generateHTML = (filename, options={})=>{
    const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options);

    return html;

}
exports.send = async (options) =>{
    const html = generateHTML(options.filename, options);
    const text = htmlToText.fromString(html);
    const mailOptions = {
        from: 'Rishav Sinha <noreply@tomatoo.com>',
        to: options.user.email,
        subject: options.subject,
        html: html,
        text

    }
    const sendMail = promsify(transport.sendMail, transport);
    return sendMail(mailOptions);

}