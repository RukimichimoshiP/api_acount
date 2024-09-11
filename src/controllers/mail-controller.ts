import { Request, Response } from "express";
import MailService from "../services/mail-service";
import { ConflictError, GoneAccessError, NotFoundError } from "../utils/err";
import createResponse from "../utils/response";
import { IAPIResponse, IUser } from "../interfaces/interfaces";
import sendMail from "../utils/nodemailer";
import { resendMailConfirm } from "../utils/mail";

export default class MailController{
    static async confirmEmail(req: Request, res: Response): Promise<void>{
        try {
            const { key } = req.query;

            const user = await MailService.confirmEmail(key as string);

            const response: IAPIResponse<String> = createResponse(true, user, null);
            res.status(200).json(response);
        } catch (err: any) {
            const response: IAPIResponse<null> = createResponse(false, null, 'Internal server error.');

            if(err instanceof NotFoundError || err instanceof GoneAccessError || err instanceof ConflictError){
                response.error = err.message;
                res.status(err.code).json(response);
            }else{
                res.status(500).json(response);
            }
        }
    }

    static async resendConfirmationEmail(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body;

            const confirmation_code = await MailService.resendConfirmationEmail(email as string);

            await sendMail({
                to: email as string,
                subject: 'New Email Confirmation',
                html: resendMailConfirm(confirmation_code)
            });

            const response: IAPIResponse<string> = createResponse(true, `confirmation code sent to email: ${email}`, null);

            res.status(200).json(response);
        } catch (err: any) {
            const response: IAPIResponse<null> = createResponse(false, null, 'Internal server error.');

            if(err instanceof NotFoundError || err instanceof ConflictError){
                response.error = err.message;
                res.status(err.code).json(response);
            }else{
                res.status(500).json(response);
            }
        }
    }
}