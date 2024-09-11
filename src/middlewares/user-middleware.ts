import { NextFunction, Request, Response } from "express";
import { RequestBodyValidator } from "../utils/validation";
import { validationFunction, IUser } from "../interfaces/interfaces";
import ValidationMiddleware from ".";

export default class UserMiddleware {
    static async validateRequestBodyUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        const userInfos:IUser = req.body;
        const validator = new RequestBodyValidator();
        const validationFunctions: Array<validationFunction> = [];

        const nameValidation = (req.method === 'POST' || req.method === 'PATCH') && userInfos.name;
        const emailValidation = (req.method === 'POST' || req.method === 'PATCH') && userInfos.email;
        const passwordValidation = (req.method === 'POST' || req.method === 'PATCH') && userInfos.password;

        nameValidation ? validationFunctions.push(() => validator.validateName('name', userInfos.name)) : null;
        emailValidation ? validationFunctions.push(() => validator.validateUserEmail(userInfos.email)) : null;
        passwordValidation ? validationFunctions.push(() => validator.validateUserPassword(userInfos.password)) : null;

        await ValidationMiddleware.validateRequest(req, res, next, validationFunctions);
    }
}