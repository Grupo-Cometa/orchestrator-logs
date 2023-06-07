import * as fs from 'fs';
import * as path from 'path';


export class Log {

    private static LogType = {
        INFO: 'INFO',
        WARNING: 'WARNING',
        ERROR: 'ERROR',
        CRITICAL: 'CRITICAL'
    }
    constructor(public message: string, public logType: keyof typeof Log.LogType){}

    save(): void 
    {
        if(process.env.DEBUG == 'true') return;

        const publicId = 'process.env.PUBLIC_ID';
        // if(!publicId) throw new Error('environment-variable-public-id-not-found')
        
        const logData = {
            type: 'log',
            message: this.message,
            log_type: this.logType,
            public_id: publicId
        }

        //Salvar Log Localmente
        try {
            this.localSave()
        } catch(e: unknown) {

        }
    }

    private localSave()
    {
        const logsFolderPath = path.join(__dirname, 'storage', 'logs');
        if (!fs.existsSync(logsFolderPath)) {fs.mkdirSync(logsFolderPath, { recursive: true })};

        const currentDate = new Date;
        const logFilename = `${currentDate.getDate()}-${currentDate.getMonth() + 1}`
    }

    private rabbitmqSave()
    {

    }

    private websocketSave()
    {

    }
}