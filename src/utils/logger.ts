export class Logger {
    static info(message: string, ...args: any[]): void {
        console.log(`ℹ️  ${message}`, ...args);
    }

    static success(message: string, ...args: any[]): void {
        console.log(`✅ ${message}`, ...args);
    }

    static error(message: string, ...args: any[]): void {
        console.error(`❌ ${message}`, ...args);
    }

    static warn(message: string, ...args: any[]): void {
        console.warn(`⚠️  ${message}`, ...args);
    }

    static debug(message: string, ...args: any[]): void {
        if (process.env.DEBUG === 'true') {
            console.log(`🔍 ${message}`, ...args);
        }
    }

    static trade(message: string, ...args: any[]): void {
        console.log(`💰 ${message}`, ...args);
    }

    static monitor(message: string, ...args: any[]): void {
        console.log(`📊 ${message}`, ...args);
    }
}