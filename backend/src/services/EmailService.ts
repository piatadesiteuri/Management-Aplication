import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async sendVerificationEmail(email: string, token: string): Promise<void> {
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: email,
            subject: 'Verificare cont DSP Dolj',
            html: `
                <h1>Bine ați venit la DSP Dolj!</h1>
                <p>Pentru a vă verifica contul, vă rugăm să introduceți următorul cod:</p>
                <h2 style="color: #4A5568; background: #EDF2F7; padding: 10px; text-align: center; font-size: 24px; letter-spacing: 5px;">
                    ${token}
                </h2>
                <p>Sau click pe link-ul de mai jos:</p>
                <a href="${verificationLink}" style="display: inline-block; background: #4299E1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                    Verifică contul
                </a>
                <p>Acest link expiră în 24 de ore.</p>
                <p>Dacă nu ați solicitat crearea unui cont, vă rugăm să ignorați acest email.</p>
            `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Error sending verification email:', error);
            throw error;
        }
    }
}

export default new EmailService(); 