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

    private static LogType = {
        INFO: 'INFO',
        WARNING: 'WARNING',
        ERROR: 'ERROR',
        CRITICAL: 'CRITICAL'
    }
    constructor(public message: string, public logType: keyof typeof Log.LogType){}

    async save(): Promise<void> 
    {
        console.log(process.env);

        if(process.env.DEBUG == 'true') return;

        const publicId = process.env.PUBLIC_ID;
        if(!publicId) throw new Error('environment-variable-public-id-not-found')
        
        const logData: LogData = {
            type: 'log',
            message: this.message,
            log_type: this.logType,
            public_id: publicId
        };

        this.localSave();
        this.websocketSave(logData, publicId);
        await this.rabbitmqSave(logData);
    }

    private localSave(): void
    {
        let logsFolderPath = '';
        const userLogsFolderPath = process.env.LOGS_FOLDER;

        if(userLogsFolderPath) logsFolderPath = userLogsFolderPath;

        if(logsFolderPath === '') logsFolderPath = path.join(process.cwd(), 'storage', 'logs');
        
        if (!fs.existsSync(logsFolderPath)) {fs.mkdirSync(logsFolderPath, { recursive: true })};

        const currentDate = new Date;
        const logFilename = `${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;
        const logFilePath: string = path.join(logsFolderPath, logFilename);
        fs.appendFileSync(logFilePath, `[${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()} ${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}] [${this.logType}] [${this.message}]\n`);
    }

    private async rabbitmqSave(logData: LogData): Promise<void>
    {
        const message = JSON.stringify(logData);
        const queue = 'robots.executions-logs' 
        const connection = await connect('amqp://rpa-orchestrator:cometa!10@localhost:5672');
        const channel = await connection.createChannel();
        channel.assertQueue(queue, {
            durable: true,
            autoDelete: true
        });

        channel.sendToQueue(queue, Buffer.from(message))

        setTimeout(function() {
            connection.close();
            return;
        }, 500);
    }

    private websocketSave(logData: LogData, publicId: string): void
    {
        const message = {
            type: 'publish',
            channel: `logs.${publicId}`,
            data: logData
        }

        const socket = new WebSocket('ws://192.168.201.239:8443/');

        socket.onopen = () => {
            socket.send(JSON.stringify(message));
            socket.close();
        }
        return;
    }
}