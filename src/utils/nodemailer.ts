import nodemailer from 'nodemailer';

interface SendMailOptions{
    to: string;
    subject: string;
    html: string;
}

const sendMail = async ({ to, subject, html }: SendMailOptions): Promise<void> => {
    try {
        // Cria o transporte dentro da função para garantir que as env vars estejam disponíveis
        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: Number(process.env.MAIL_PORT),
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });

        // Opções de email
        const mailOptions = {
            from: process.env.MAIL_FROM,
            to,
            subject,
            html
        };

        // Envia o email
        const info = await transporter.sendMail(mailOptions);
    } catch (err: any) {
        console.error(`Error sending email: ${err}`);
        throw new Error('Failed to send confirmation email.')
    }
}


export default sendMail;