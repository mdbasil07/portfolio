import express from 'express';
import { Resend } from 'resend';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
    res.json({ status: 'Server is running', message: 'Portfolio Email API (Resend)' });
});

// Send email endpoint
app.post('/api/send-email', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'Portfolio Contact <onboarding@resend.dev>',
            to: process.env.EMAIL,
            replyTo: email,
            subject: `Portfolio Contact: Message from ${name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="background: #000; color: #fff; padding: 20px; margin: 0;">
                        New Message from Portfolio
                    </h2>
                    <div style="padding: 20px; border: 1px solid #ddd;">
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Message:</strong></p>
                        <p style="background: #f4f4f5; padding: 15px; border-left: 3px solid #000;">
                            ${message}
                        </p>
                    </div>
                    <p style="color: #666; font-size: 12px; padding: 10px;">
                        Sent from your portfolio contact form
                    </p>
                </div>
            `
        });

        if (error) {
            console.error('Resend error:', error);
            return res.status(500).json({ error: 'Failed to send email' });
        }

        console.log('Email sent:', data);
        res.status(200).json({ success: true, message: 'Email sent successfully!' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
