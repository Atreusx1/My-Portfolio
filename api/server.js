// api/send-email.js
const nodemailer = require('nodemailer');
require('dotenv').config();

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const { name, email, subject, message } = req.body;

    // Set up the transporter with your email service
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Use your email service (e.g., Gmail, SMTP)
      auth: {
        user: process.env.EMAIL_USER, // Use environment variable for email user
        pass: process.env.EMAIL_PASS, // Use environment variable for email password
      },
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER, // Sender's email (user-provided)
      to: 'ajinkya.gajarmal@gmail.com', // Receiver's email (you or your business email)
      cc: 'ajinkya.gajarmal2001@gmail.com', // CC email (optional)
      subject: subject || 'No Subject', // Subject of the email
      text: `
        Name: ${name}
        Email: ${email}
        Subject: ${subject}
        Message: ${message}
      `, // The body of the email
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'Email sent successfully!' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error sending email' });
    }
  } else {
    // Respond with 405 if method is not POST
    res.status(405).json({ message: 'Method Not Allowed' });
  }
};
