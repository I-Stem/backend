
const winston = require('winston');
let { combine, timestamp, label, printf } = winston.format;

const loggerFactory = (filename: string, methodName: string) => {
    const addlabel = winston.format((info: any) => {
        info.label = filename;
        return info;
    });
    const addMethodName = winston.format((info: any) => {
        info.methodName = methodName;
        return info;
    });
    const lipLogFormat = printf(({ level, message, label, timestamp, methodName }: { level: string, message: string, label: string, timestamp: string, methodName: string }) => {
        return `${level} [${label}] ${message} | [${timestamp}] | {${methodName}}`;
    });
    const logger = winston.createLogger({
        level: 'info',
        format: combine(
            timestamp(),
            winston.format.splat(),
            addlabel(),
            addMethodName(),
            lipLogFormat
        ),
        // format: winston.format.simple(),
        transports: [
            new winston.transports.Console()
        ]
    });
    return logger;
};

export default loggerFactory;
