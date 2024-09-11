import bcrypt from 'bcrypt';

export const comparePassword = async (loginPassword:string, userPassword:string): Promise<boolean> => {
    const passwordValidation = await bcrypt.compare(loginPassword, userPassword);
    return passwordValidation;
}

export const createHashPassword = async (password:string): Promise<string> => {
    const hash = await bcrypt.hash(password, 10);
    return hash;
}