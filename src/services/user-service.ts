import { email, ILoginTokenPayload, IUser, uuid } from "../interfaces/interfaces";
import UserRepository from "../respositories/user-repository";
import { ConflictError, ForbiddenAccessError, NotFoundError } from "../utils/err";
import { createHashPassword } from "../utils/hash-password";
import { generateConfirmationEmailCode } from "../utils/hash-confirmation-code";

export default class UserService {
    static async createUser(userInfos: Partial<IUser>): Promise<Partial<IUser>> {
        const registeredEmail = await UserRepository.findUserByEmail(userInfos.email as string);
        if(registeredEmail){
            throw new ConflictError('Service layer', 'Email already registered.');
        }

        const hashedPassword = await createHashPassword(userInfos.password as string);
        const emailCodeConfirmation = await generateConfirmationEmailCode(userInfos.email as string);

        const userData: Partial<IUser> = {
            name: userInfos.name,
            email: userInfos.email,
            password: hashedPassword,
            confirmation_code: emailCodeConfirmation
        };

        const user = await UserRepository.insertNewUser(userData);
        const { password, ...userWithoutPass } = user as IUser;

        return userWithoutPass;
    }

    static async getMyUser(userID: uuid): Promise<Partial<IUser>> {
        const user = await UserRepository.findUserByID(userID);
        const { password, ...userWithoutPass } = user as IUser;

        return userWithoutPass;
    }

    static async updateUser(userInfos: Partial<IUser>, userID: uuid): Promise<Partial<IUser>>{
        if(userInfos.password){
            userInfos.password = await createHashPassword(userInfos.password)
        }

        const userObject = {
            ...(userInfos.name && { name: userInfos.name }),
            ...(userInfos.email && { email: userInfos.email }),
            ...(userInfos.password && { password: userInfos.password })
        }

        const userExist = await UserRepository.findUserByID(userID);
        if(!userExist){
            throw new NotFoundError('Service layer', 'User');
        }

        const updatedUser: IUser = {
            ...userExist,
            ...userObject
        }

        const {password, ...updatedUserData} = await UserRepository.updateUser(updatedUser);

        return updatedUserData;
    }

    static async deleteUser(userID: uuid): Promise<Partial<IUser>> {
        const checkUser: IUser | null = await UserRepository.findUserByID(userID);
        if(!checkUser){
            throw new NotFoundError('Service Layer', 'User');
        }

        const deletedUser: IUser = await UserRepository.deleteUser(userID);
        const { password, ...userWithoutPass } = deletedUser;
        return userWithoutPass;
    }
}