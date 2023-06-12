import 'dotenv/config';
export declare class Log {
    private static LogType;
    static send(message: string, logType: keyof typeof Log.LogType): Promise<void>;
    private static saveLogError;
    private static rabbitmqSend;
    private static websocketSend;
}
