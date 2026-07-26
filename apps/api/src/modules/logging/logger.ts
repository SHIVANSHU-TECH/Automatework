import fs from 'fs';
import path from 'path';

const logDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, 'application.log');

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SECURITY';

export const log = (level: LogLevel, message: string, metadata?: Record<string, unknown>) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    metadata: metadata ?? {},
  };

  fs.appendFileSync(logFile, `${JSON.stringify(entry)}\n`);
};
