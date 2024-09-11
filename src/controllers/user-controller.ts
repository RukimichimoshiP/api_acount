import { Request, Response } from "express";
import sendMail from "../utils/nodemailer";
import { ConflictError, InvalidDataError, ForbiddenAccessError, NotFoundError, UnauthorizedError } from "../utils/err";
import { IAPIResponse, ILoginTokenPayload, IUser, uuid } from "../interfaces/interfaces";
import UserService from "../services/user-service";
import createResponse from "../utils/response";
import { mailConfirm } from "../utils/mail";
import { validate as uuidValidate } from "uuid";

export default class UserController {
    static async createNewUser(req: Request, res: Response): Promise<void>{
        try {
            const { email } = req.body;

            const user = await UserService.createUser(req.body);

            await sendMail({
                to: email,
                subject: 'Email Confirmation',
                html: mailConfirm(user.confirmation_code as string)
            });

            const { confirmation_code, ...userWithoutConfirmationCode } = user
            const response: IAPIResponse<Partial<IUser>> = createResponse(true, userWithoutConfirmationCode, null);

            res.status(201).json(response);
        } catch (err: any) {
            const response: IAPIResponse<null> = createResponse(false, null, 'Internal server error.');

            if(err instanceof ConflictError){
                response.error = err.message;
                res.status(err.code).json({response});
            }else{
                res.status(500).json(response);
            }
        }
    }

    static async getMyUser(req: Request, res: Response): Promise<void> {
        try {
            const userID = req.user?.userID;
            if(!userID) throw new UnauthorizedError('Controller layer.');

            const isUUID = uuidValidate(userID);
            if(!isUUID) throw new UnauthorizedError('Controller layer.');

            const myUser = await UserService.getMyUser(userID);
            const response = createResponse(true, myUser, null);
            res.status(200).json(response);
        } catch (err: any) {
            const response: IAPIResponse<null> = createResponse(false, null, 'Internal server error.');

            if(err instanceof UnauthorizedError){
                response.error = err.message;
                res.status(err.code).json(response);
            }else{
                res.status(500).json(response);
            }
        }
    }

    static async updateUser(req: Request, res: Response): Promise<void> {
        try {
            const userID = req.user?.userID;
            if(!userID) throw new UnauthorizedError('Controller layer.');

            const isUUID = uuidValidate(userID);
            if(!isUUID) throw new UnauthorizedError('Controller layer.');

            const updatedUser = await UserService.updateUser(req.body, userID);

            const response = createResponse(true, updatedUser, null);
            res.status(200).json(response);
        } catch (err: any) {
            const response: IAPIResponse<null> = createResponse(false, null, 'Internal server error.');

            if(err instanceof UnauthorizedError || err instanceof NotFoundError){
                response.error = err.message;
                res.status(err.code).json(response);
            }else{
                res.status(500).json(response);
            }
            console.error(err);
        }
    }

    static async deleteUser(req: Request, res: Response): Promise<void> {
        try {
            const userID = req.user?.userID;
            if(!userID) throw new UnauthorizedError('Controller layer.');

            const isUUID = uuidValidate(userID);
            if(!isUUID) throw new UnauthorizedError('Controller layer.');

            const deletedUser = await UserService.deleteUser(userID);
            const response = createResponse(true, deletedUser, null);
            res.status(200).json(response);
        } catch (err: any) {
            const response: IAPIResponse<null> = createResponse(false, null, 'Internal server error.');

            if(err instanceof UnauthorizedError || err instanceof NotFoundError){
                response.error = err.message;
                res.status(err.code).json(response);
            }else{
                res.status(500).json(response);
            }
        }
    }
}