import bcrypt from 'bcrypt';

export const generateConfirmationEmailCode = async (email: string): Promise<string> => {
    const timestamp = Date.now().toString();
    const data = `${email}-${timestamp}`;
    const hash = await bcrypt.hash(data, 10);
    return hash;
}
