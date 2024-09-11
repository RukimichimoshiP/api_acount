import { Server } from "http";
import chalk from "chalk";
import { DatabaseService } from "../database/postgresConnect";

export const amb = process.env.AMB === '1' ? chalk.yellow.bold('PROD') : chalk.blueBright.bold('DEV');
export const serverMessage = chalk.green.bold('SERVER');
export const dbMessage = chalk.magenta.bold('DB');

export const InitializateServer = async (app: Server) => {
    const address = app.address();
    let host: string;
    let port: number | undefined;

    const db = new DatabaseService();

    if(typeof address === 'string'){
        // Para Unix socket
        console.info(
            `[${amb}][${serverMessage}] Server is listening at ${address} - ${chalk.gray(
                new Date()
            )}`
        );
    } else if (address && typeof address === 'object'){
        host = address.address === '::' ? 'localhost' : address.address;
        port = address.port;

        console.info(
            `[${amb}][${serverMessage}] Server is listening at ${chalk.blue(
                `http://${host}:${port}`
            )} - ${chalk.gray(new Date())}`
        );
    } else {
        console.info(
            `[${amb}][${serverMessage}] Unable to determine the server address. - ${chalk.gray(
                new Date()
            )}`
        );
    }

    const testConnectionDb = await db.query(
        'SELECT * FROM users', []
    );
    if (testConnectionDb){
        console.info(
            `[${amb}][${dbMessage}] Database Connected - ${chalk.gray(new Date())}`
        );
    }
}