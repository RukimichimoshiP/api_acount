import GenerateQR from "../utils/qrCodeGenerator";
import verifyOTP from "../utils/verify2FA";
import FaRepository from "../respositories/2fa-repositories";
import UserRepository from "../respositories/user-repository";
import MailService from "./mail-service";
import { ICookieOptions, ICreateTwoFactorAuth, ITwoFactorAuth, IVerificationType, uuid } from "../interfaces/interfaces";
import { ConflictError, NotFoundError, UnauthorizedError, ForbiddenAccessError, GoneAccessError } from "../utils/err";
import MailRepository from "../respositories/mail-repository";
import { verifyTempToken } from "../utils/token";
import LoginService from "./login-service";
import { validate as uuidValidate } from "uuid";
import sendMail from "../utils/nodemailer";
import { twoFactorAuth } from "../utils/mail";

// const verificationResult = verifyOTP(userOTP);
// console.log(verificationResult);
// if(verificationResult){
//     console.log('OTP verification successful!');
// }else{
//     console.log('OTP verification failed!');
// }

export default class FaService{
    static async create2FA(userID: uuid): Promise<ICreateTwoFactorAuth>{
        const user = await UserRepository.findUserByID(userID);
        if(!user){
            throw new NotFoundError('Service layer', 'User');
        }
        if(user.two_factor_auth_id){
            throw new ConflictError('Service layer', 'The account already has 2-factor verification');
        }

        const { secret, QRUrl } = await GenerateQR(user.name);

        const twoFactor = await FaRepository.create2FA(user.id, secret);

        await sendMail({
            to: user.email,
            subject: '2 Factor account',
            html: twoFactorAuth(QRUrl)
        });

        const twoFactorWithQRUrl: ICreateTwoFactorAuth = {
            ...twoFactor,
            QRUrl
        }
        return twoFactorWithQRUrl;
    }

    static async recreate2FA(userID: uuid): Promise<ICreateTwoFactorAuth | object>{
        const user = await UserRepository.findUserByID(userID);
        if(!user){
            throw new NotFoundError('Service layer', 'User');
        }
        if(!user.two_factor_auth_id){
            throw new ConflictError('Service layer', "The account don't have 2-factor verification");
        }

        const twoFactori: ITwoFactorAuth = await FaRepository.findTwoFactorById(user.two_factor_auth_id as uuid);

        const MIN_INTERVAL = 5 * 60 * 1000;
        const now = new Date().getTime();
        const lastCreated = new Date(twoFactori.created_at).getTime();
        if (now - lastCreated < MIN_INTERVAL) {
            const timeLeft = Math.ceil((MIN_INTERVAL - (now - lastCreated)) / 1000);

            throw new GoneAccessError('Service layer', `You must wait ${Math.ceil(timeLeft / 60)} minutes and ${timeLeft % 60} seconds to request a new 2FA code.`);
        }

        if(twoFactori.validate){
            const Code6Digits = await MailService.generateCode6Digits(userID, IVerificationType.TWO_FACTOR_AUTH)

            return Code6Digits;
        }

        const { secret, QRUrl } = await GenerateQR(user.name);

        const twoFactor = await FaRepository.recreate2FA(user.id, secret, twoFactori.id);
        await UserRepository.updateTwoFactorEnabledUser(false, userID);

        const twoFactorWithQRUrl: ICreateTwoFactorAuth = {
            ...twoFactor,
            QRUrl
        }

        await sendMail({
            to: user.email,
            subject: 'Recreate 2 factor account',
            html: twoFactorAuth(QRUrl)
        });

        return twoFactorWithQRUrl;
    }

    static async verifyCode6Digits(userID: uuid, code: string): Promise<ICreateTwoFactorAuth>{
        const user = await UserRepository.findUserByID(userID);
        if(!user){
            throw new NotFoundError('Service layer', 'User');
        }

        const isValidCode = await MailService.verifyCode6Digits(userID, code, IVerificationType.TWO_FACTOR_AUTH);
        if(!isValidCode){
            throw new GoneAccessError('Service layer','Invalid or expired verification code');
        }

        await FaRepository.remove2FA(user.two_factor_auth_id);
        const result = await this.create2FA(userID);
        await MailRepository.markAsReadCode6Digits(userID, IVerificationType.TWO_FACTOR_AUTH, code);
        await UserRepository.updateTwoFactorEnabledUser(false, userID);

        return result;
    }

    

    static async remove2FA(userID: uuid): Promise<void>{
        const user = await UserRepository.findUserByID(userID);
        if(!user){
            throw new NotFoundError('Service layer', 'User');
        }
        if(!user.two_factor_auth_id){
            throw new ConflictError('Service layer', "The account don't have 2-factor verification");
        }
    }

    static async verify2FA(tempToken: string, userOTP: string): Promise<ICookieOptions>{
        const userID = verifyTempToken(tempToken)

        if(!userID){
            throw new GoneAccessError('Service layer', 'Invalid or expired temporary token.');
        }

        const user = await UserRepository.findUserByID(userID);
        console.log(`id: ${userID}, user: ${user}`);
        if(!user){
            throw new NotFoundError('Service layer', 'User');
        }
        if(!user.two_factor_auth_id){
            throw new ConflictError('Service layer', 'This account does not have two-step verification');
        }

        const twoFactori: ITwoFactorAuth = await FaRepository.findTwoFactorById(user.two_factor_auth_id as uuid);

        const verificationResult = verifyOTP(userOTP, twoFactori.key);
        if(!verificationResult){
            throw new ForbiddenAccessError('Service layer', 'The code provided is not valid')
        }

        const accessToken = LoginService.createSessionCookie(user);
        const result = accessToken;

        return result;
    }

    static async verifyCreate2FA(userID: uuid, userOTP: string): Promise<ICookieOptions>{
        const user = await UserRepository.findUserByID(userID);
        if(!user){
            throw new NotFoundError('Service layer', 'User');
        }

        const twoFactori: ITwoFactorAuth = await FaRepository.findTwoFactorById(user.two_factor_auth_id as uuid);
        if(!user.two_factor_auth_id){
            throw new ConflictError('Service layer', 'This account does not have two-step verification');
        }

        const verificationResult = verifyOTP(userOTP, twoFactori.key);
        if(!verificationResult){
            throw new ForbiddenAccessError('Service layer', 'The code provided is not valid')
        }

        await FaRepository.validateTwoFactor(twoFactori.id);
        await UserRepository.updateTwoFactorEnabledUser(false, userID);

        const accessToken = LoginService.createSessionCookie(user);
        const result = accessToken;

        return result;
    }
}