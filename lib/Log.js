"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const amqplib_1 = require("amqplib");
const ws_1 = require("ws");
require("dotenv/config");
class Log {
    static async send(message, logType) {
        if (process.env.DEBUG == 'true')
            return;
        const publicId = process.env.PUBLIC_ID;
        if (!publicId)
            throw new Error('environment-variable-public-id-not-found');
        const logData = {
            type: 'log',
            message: message,
            log_type: logType,
            public_id: publicId
        };
        this.websocketSend(logData, publicId);
        await this.rabbitmqSend(logData);
    }
    static saveLogError(logData) {
        let logsFolderPath = '';
        const userLogsFolderPath = process.env.LOGS_FOLDER;
        if (userLogsFolderPath)
            logsFolderPath = userLogsFolderPath;
        if (logsFolderPath === '')
            logsFolderPath = path.join(process.cwd(), 'storage', 'logs');
        if (!fs.existsSync(logsFolderPath)) {
            fs.mkdirSync(logsFolderPath, { recursive: true });
        }
        ;
        const currentDate = new Date;
        const logFilename = `${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;
        const logFilePath = path.join(logsFolderPath, logFilename);
        fs.appendFileSync(logFilePath, `[${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()} ${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}] [${logData.log_type}] [${logData.message}]\n`);
    }
    static async rabbitmqSend(logData) {
        try {
            const message = JSON.stringify(logData);
            const queue = 'robots.executions-logs';
            const connection = await (0, amqplib_1.connect)(process.env.AMQP_URL);
            const channel = await connection.createChannel();
            channel.assertQueue(queue, {
                durable: true,
                autoDelete: false
            });
            channel.sendToQueue(queue, Buffer.from(message));
            setTimeout(function () {
                connection.close();
                return;
            }, 500);
        }
        catch (error) {
            this.saveLogError(logData);
        }
    }
    static websocketSend(logData, publicId) {
        try {
            const message = {
                type: 'publish',
                channel: `logs.${publicId}`,
                data: logData
            };
            const socket = new ws_1.WebSocket(process.env.WS_URL);
            socket.onopen = () => {
                socket.send(JSON.stringify(message));
                socket.close();
            };
            return;
        }
        catch (error) {
            this.saveLogError(logData);
        }
    }
}
exports.Log = Log;
