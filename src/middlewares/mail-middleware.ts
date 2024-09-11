import { NextFunction, Request, Response } from "express";
import { RequestBodyValidator } from "../utils/validation";
import { IUser, validationFunction } from "../interfaces/interfaces";
import ValidationMiddleware from ".";

export default class MailMiddleware {
    static async validateRequestBodyMail(req: Request, res: Response, next: NextFunction): Promise<void> {
        const mailInfos: IUser = req.body;
        const validator = new RequestBodyValidator();
        const validationFunction: Array<validationFunction> = [];

        const emailValidation = req.method === 'POST' || req.method === 'PATCH' && mailInfos.email;

        emailValidation ? validationFunction.push(() => validator.validateUserEmail(mailInfos.email)) : null

        await ValidationMiddleware.validateRequest(req, res, next, validationFunction);
    }
}