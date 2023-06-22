import * as fs from 'fs';
import * as path from 'path';
import { connect } from "amqplib";
import { WebSocket } from 'ws';
import 'dotenv/config'

interface LogData {
    type: string,
    message: string,
    log_type: string,
    public_id: string
}
export class Log {
    
    static async send(message: string, logType: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'): Promise<void> 
    {
        if(process.env.DEBUG == 'true') return;

        const publicId = process.env.PUBLIC_ID;
        if(!publicId) throw new Error('environment-variable-public-id-not-found')
        
        const logData: LogData = {
            type: 'log',
            message: message,
            log_type: logType,
            public_id: publicId
        };

        this.websocketSend(logData, publicId);
        await this.rabbitmqSend(logData);
    }

    private static saveLogError(logData: LogData): void
    {
        let logsFolderPath = '';
        const userLogsFolderPath = process.env.LOGS_FOLDER;

        if(userLogsFolderPath) logsFolderPath = userLogsFolderPath;

        if(logsFolderPath === '') logsFolderPath = path.join(process.cwd(), 'storage', 'logs');
        
        if (!fs.existsSync(logsFolderPath)) {fs.mkdirSync(logsFolderPath, { recursive: true })};

        const currentDate = new Date;
        const logFilename = `${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;
        const logFilePath: string = path.join(logsFolderPath, logFilename);
        fs.appendFileSync(logFilePath, `[${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()} ${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}] [${logData.log_type}] [${logData.message}]\n`);
    }

    private static async rabbitmqSend(logData: LogData): Promise<void>
    {
        try {
            const message = JSON.stringify(logData);
            const queue = 'robots.executions-logs' 
            const connection = await connect(process.env.AMQP_URL!);
            const channel = await connection.createChannel();
            channel.assertQueue(queue, {
                durable: true,
                autoDelete: false
            });

            channel.sendToQueue(queue, Buffer.from(message))

            setTimeout(function() {
                connection.close();
                return;
            }, 500);
        } catch(error: unknown) {
            this.saveLogError(logData);
        }
    }

    private static websocketSend(logData: LogData, publicId: string): void
    {
        try {
            const message = {
                type: 'publish',
                channel: `logs.${publicId}`,
                data: logData
            }
    
            const socket = new WebSocket(process.env.WS_URL!);
    
            socket.onopen = () => {
                socket.send(JSON.stringify(message));
                socket.close();
            }
            return;
        } catch(error: unknown) {
            this.saveLogError(logData);
        }
        
    }
}