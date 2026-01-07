const nodemailer = require('nodemailer');

const port = process.env.EMAIL_PORT || 587;
const secure = port == 465; // true for 465, false for 587

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: port,
    secure: secure,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// DISABLED: Email service verification (email sending is bypassed)
// transporter.verify(function (error, success) {
//     if (error) {
//         console.log('Email Service Error:', error);
//     } else {
//         console.log('Email Service is ready to take our messages. Port:', port, 'Secure:', secure);
//     }
// });

const sendEmail = async (to, subject, text) => {
    try {
        const info = await transporter.sendMail({
            from: '"Financial Tracker" <no-reply@tracker.com>',
            to,
            subject,
            text
        });
        console.log(`Email sent: ${info.messageId}`);
        // For Ethereal, log the URL to view the message
        console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

module.exports = { sendEmail };
