import { Request, Response } from "express";
import FaService from "../services/2fa-service";
import { NotFoundError, ConflictError, UnauthorizedError, ForbiddenAccessError, GoneAccessError } from "../utils/err";
import createResponse from "../utils/response";
import { validate as uuidValidate } from "uuid";
import { IAPIResponse, ICreateTwoFactorAuth } from "../interfaces/interfaces";

export default class FaController{
    static async create2FA(req: Request, res: Response): Promise<void>{
        try {
            const userID = req.user?.userID;
            if(!userID) throw new UnauthorizedError('Controller layer.');

            const isUUID = uuidValidate(userID);
            if(!isUUID) throw new UnauthorizedError('Controller layer.');

            const twoFactor = await FaService.create2FA(userID);
            const response = createResponse(true, twoFactor, null);
            res.status(200).json(response);
        } catch (err: any) {
            const response: IAPIResponse<null> = createResponse(false, null, 'Internal server error');

            if(err instanceof UnauthorizedError || err instanceof NotFoundError || err instanceof ConflictError){
                response.error = err.message;
                res.status(err.code).json(response);
            }else{
                res.status(500).json(response);
            }
        }
    }

    static async recreate2FA(req: Request, res: Response): Promise<void>{
        try {
            const userID = req.user?.userID;
            if(!userID) throw new UnauthorizedError('Controller layer.');

            const isUUID = uuidValidate(userID);
            if(!isUUID) throw new UnauthorizedError('Controller layer.');

            const twoFactor = await FaService.recreate2FA(userID);
            const response = createResponse(true, twoFactor, null);
            res.status(200).json(response);
        } catch (err: any) {
            const response: IAPIResponse<null> = createResponse(false, null, 'Internal server error');
            if(err instanceof UnauthorizedError || err instanceof ConflictError || err instanceof NotFoundError || err instanceof GoneAccessError){
                response.error = err.message;
                res.status(err.code).json(response);
            }else{
                res.status(500).json(response);
            }
        }
    }

    static async verifyCode6Digits(req: Request, res: Response): Promise<void> {
        try {
            const userID = req.user?.userID;
            const { code } = req.body;

            if(!userID) throw new UnauthorizedError('Controller layer.');

            const isUUID = uuidValidate(userID);
            if(!isUUID) throw new UnauthorizedError('Controller layer.');

            if(!code){
                throw new ConflictError('Controller layer', '6 digit code not added');
            }

            const createTwoFactor = await FaService.verifyCode6Digits(userID, code);

            const response = createResponse(true, createTwoFactor, null);
            res.status(200).json(response);
        } catch (err: any) {
            const response: IAPIResponse<null> = createResponse(false, null, 'Internal server error');

            if(err instanceof UnauthorizedError || err instanceof ConflictError || err instanceof GoneAccessError || err instanceof NotFoundError){
                response.error = err.message;
                res.status(err.code).json(response);
            }else{ 
                res.status(500).json(response);
            }
        }
    }

    static async verify2FA(req: Request, res: Response): Promise<void>{
        try {
            const { otp, tempToken } = req.body;

            const result = await FaService.verify2FA(tempToken, otp)

            res.cookie(result.name, result.val, result.options);

            const response = createResponse(true, result, null);
            res.status(200).json(response);
        } catch (err: any) {
            const response: IAPIResponse<null> = createResponse(false, null, 'Internal server error');

            if(err instanceof UnauthorizedError || err instanceof ConflictError || err instanceof ForbiddenAccessError || err instanceof GoneAccessError || err instanceof NotFoundError){
                response.error = err.message;
                res.status(err.code).json(response);
            }else{
                res.status(500).json(response);
            }
            console.error(err);
        }
    }

    static async verifyCreate2FA(req: Request, res: Response): Promise<void>{
        try {
            const userID = req.user?.userID
            const { otp } = req.body;

            const result = await FaService.verifyCreate2FA(userID as string, otp);

            res.cookie(result.name, result.val, result.options);

            const response = createResponse(true, result, null);
            res.status(200).json(response);
        } catch (err: any) {
            const response: IAPIResponse<null> = createResponse(false, null, 'Internal server error');

            if(err instanceof ForbiddenAccessError || err instanceof NotFoundError || err instanceof ConflictError){
                response.error = err.message;
                res.status(err.code).json(response);
            }else{
                res.status(500).json(response);
            }
            console.error(err);
        }
    }
}