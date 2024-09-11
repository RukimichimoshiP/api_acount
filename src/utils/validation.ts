import { IValidationResponse, email, uuid, typeName } from "../interfaces/interfaces";
import { validate as uuidValidate } from "uuid";

export class RequestBodyValidator{
    private validateField(value: string | undefined, pattern: RegExp, emptyFieldMessage: string, invalidDataMessage: string): IValidationResponse {
        const response: IValidationResponse = {
            isValid: true,
            message: null
        };

        if(!value){
            response.isValid = false;
            response.message = emptyFieldMessage;
            return response;
        }

        if(typeof value !== 'string') {
            response.isValid = false;
            response.message = 'The data must be of type string.';
            return response
        }

        if(!pattern.test(value)){
            response.isValid = false;
            response.message = invalidDataMessage;
            return response;
        }

        return response;
    }

    public validateName(typeName: typeName, value: string): IValidationResponse {
        const pattern: RegExp = /^.{4,}$/;
        return this.validateField(
            value,
            pattern,
            `Missing ${typeName} in the request body`,
            `The ${typeName} field must contain only letters, and must be at least 4 characters long.`
        );
    }

    public validateUserEmail(email: email): IValidationResponse {
        const emailPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return this.validateField(
            email,
            emailPattern,
            'Missing email in the request body',
            'The email address is not valid.'
        );
    }

    public validateUserPassword(password: string): IValidationResponse {
        const passwordPattern: RegExp = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        return this.validateField(
            password,
            passwordPattern,
            'Missing password in the request body',
            'The password must contain at least one letterm one number, and be at least 8 characters long.'
        );
    }

    public validateUUID(ID: uuid, entityName: string): IValidationResponse {
        const response: IValidationResponse = {
            isValid: true,
            message: null
        };

        if(ID && !uuidValidate(ID)){
            response.isValid = false;
            response.message = `Invalid ID. ${entityName} ID must be UUID type.`;
        }

        return response;
    }

    public validateOTP(userOTP: string): IValidationResponse{
        const otpPattern: RegExp = /^\d{6}$/;
        return this.validateField(
            userOTP,
            otpPattern,
            'Missing otp code in the request body.',
            'The otp code must contain 6 numbers, no letters or spaces.'
        )
    }
}