require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Email Transporter (using Gmail SMTP)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Contact endpoint
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, organization, inquiry_type, message, _subject, subject } = req.body;

        const emailSubject = _subject || subject || 'New Contact Form Submission';
        
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: process.env.GMAIL_USER, // Send to yourself
            replyTo: email,
            subject: emailSubject,
            text: `
You have received a new inquiry from the Xibalba Dashboard.

---
Name: ${name || 'N/A'}
Email: ${email || 'N/A'}
Organization: ${organization || 'N/A'}
Inquiry Type: ${inquiry_type || 'N/A'}

Message:
${message || 'N/A'}
---
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ success: true, message: 'Message sent successfully.' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ success: false, error: 'Failed to send message.' });
    }
});

app.listen(PORT, () => {
    console.log(`Contact API running on port ${PORT}`);
});
