import { IUser, uuid, IVerificationType } from "../interfaces/interfaces";
import UserRepository from "../respositories/user-repository";
import MailRepository from "../respositories/mail-repository";
import sendMail from "../utils/nodemailer";
import { confirmCode6Digits } from "../utils/mail";
import { GoneAccessError, NotFoundError, ConflictError } from "../utils/err";
import { generateConfirmationEmailCode } from "../utils/hash-confirmation-code";

export default class MailService{
    static async confirmEmail(codeConfirmation: string): Promise<string> {
        const user = await UserRepository.findUserByCodeConfirmation(codeConfirmation);
        if(!user){
            throw new NotFoundError('Service layer', 'Confirmation code not found');
        }

        if(user.is_confirmed){
            throw new ConflictError('Service layer', 'This account is already confirmed.');
        }

        const expirationTime = 24 * 60 * 60 * 1000
        if(new Date().getTime() - new Date(user.confirmation_code_created_at).getTime() > expirationTime){
            throw new GoneAccessError('Service layer', 'Confirmation code has expired. (24 hours)')
        }

        await MailRepository.confirmEmail(codeConfirmation);
        
        return `Email: ${user.email} confirmed successfully!`;
    }

    static async resendConfirmationEmail(email: string): Promise<string> {
        const user = await UserRepository.findUserByEmail(email);
        if(!user){
            throw new NotFoundError('Service layer', 'User');
        }
        if(user.is_confirmed){
            throw new ConflictError('Service layer', 'This account is already confirmed.');
        }

        const MIN_INTERVAL = 5 * 60 * 1000;
        const lastShipment = await MailRepository.getLastShipment(email);

        if(lastShipment.last_confirmation_email_sent_at && new Date().getTime() - new Date(lastShipment.last_confirmation_email_sent_at).getTime() < MIN_INTERVAL){
            const elapsedTimeMs = new Date().getTime() - new Date(lastShipment.last_confirmation_email_sent_at).getTime();

            const minutes = Math.floor(elapsedTimeMs / 60000); // 1 minuto = 60000 milissegundos
            const seconds = Math.floor((elapsedTimeMs % 60000) / 1000); // 1 segundo = 1000 milissegundos

            const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

            throw new ConflictError('Service layer', `wait 5 minutes to make another confirmation code request to the Email. (elapsed time: ${formattedTime})`);
        }

        const newConfirmationCode = await generateConfirmationEmailCode(email);
        await MailRepository.resendConfirmationEmail(email, newConfirmationCode);

        return newConfirmationCode
    }

    static async generateCode6Digits(userID: uuid, verificationType: IVerificationType): Promise<object>{
        function generateVerificationCode(): string {
            return Math.floor(100000 + Math.random() * 900000).toString();        
        }

        function calculateExpiry(minutes: number): Date {
            return new Date(Date.now() + minutes * 60 * 1000);
        }

        const user = await UserRepository.findUserByID(userID);
        if(!user){
            throw new NotFoundError('Service layer', 'User');
        }

        const code = generateVerificationCode();
        const expiresAt = calculateExpiry(10);
        const verificationCode = MailRepository.saveCode6Digits(userID, code, verificationType, expiresAt);

        await sendMail({
            to: user.email as string,
            subject: `${verificationType} verification code`,
            html: confirmCode6Digits(code, verificationType)
        })

        return { message: 'Verification code sent' };
    }

    static async verifyCode6Digits(userID: uuid, code: string, verificationType: IVerificationType): Promise<boolean> {
        const user = await UserRepository.findUserByID(userID);
        if(!user){
            throw new NotFoundError('Service layer', 'User');
        }

        const verificationCode = await MailRepository.verifyCode6Digits(userID, verificationType);
        if(!verificationCode){
            throw new NotFoundError('Service layer', 'Verification code for this user');
        }

        const { code: storedCode, expires_at, used_at } = verificationCode;
        if(code !== storedCode){
            return false;
        }

        const now = new Date().getTime();
        if(new Date(expires_at).getTime() < now){
            throw new GoneAccessError('Service layer', 'Verification code has expired');
        }

        if(used_at){
            throw new ConflictError('Service layer', 'Verification code has already been used');
        }

        return true;
    }
}