import speakeasy, { otpauthURL } from 'speakeasy';
import qrcode from 'qrcode';
import { IGenerateQR, IResultGenerateQRCode } from '../interfaces/interfaces';


// Function to generate a secret key and generate a QR code URL for Google Authenticator
function generateQRCodeURL(appInfo: string): IResultGenerateQRCode{
    const secret = speakeasy.generateSecret({
        length: 20,
        name: `MyApp, ${appInfo}`,
        issuer: 'MyApp'
    });

    const otpauhURl = speakeasy.otpauthURL({
        secret: secret.base32,
        label: `${appInfo}`,
        issuer: 'MyApp',
        encoding: 'base32'
    });

    return {otpauhURl: otpauhURl, secret: secret.base32}
}

// Generate and display the QR code URL
export default async function generateQR(appInfo: string): Promise<IGenerateQR>{
    const {otpauhURl, secret} = generateQRCodeURL(appInfo);

    try {
        const QRUrl = await new Promise<string>((resolve, reject) => {
            qrcode.toDataURL(otpauhURl, (err: any, dataUrl: string) => {
                if(err){
                    console.error('Error generating QR Code:', err);
                    reject(err);
                }else{
                    console.log('QR Code URL:', dataUrl);
                    resolve(dataUrl);
                }
            });
        });

        return { secret, QRUrl };
    } catch (err: any) {
        throw new Error('Failed to generate QR Code:');
    }
}