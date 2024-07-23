// utils/logger.ts
import fs from 'fs';
import path from 'path';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  title: string;
  jan: string;
  price: string;
  vendor: string;
  url: string;
  status: string;
  details?: any;
  data?: any;
  request?: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
  };
  response?: {
    status: number;
    body?: any;
  };
}

class Logger {
  private logFile: string;

  constructor() {
    this.logFile = path.join(process.cwd(), 'logs', 'app.log');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    const dir = path.dirname(this.logFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private writeLog(entry: LogEntry) {
    const logString = `${entry.timestamp} [${entry.level.toUpperCase()}] ${entry.message}\n`;
    let detailsString = '';

    if (entry.details) {
      detailsString += `Details: ${JSON.stringify(entry.details, null, 2)}\n`;
    }
    if (entry.data) {
      detailsString += `Data: ${JSON.stringify(entry.data, null, 2)}\n`;
    }
    if (entry.request) {
      detailsString += `Request: ${JSON.stringify(entry.request, null, 2)}\n`;
    }
    if (entry.response) {
      detailsString += `Response: ${JSON.stringify(entry.response, null, 2)}\n`;
    }

    fs.appendFileSync(this.logFile, `${logString}${detailsString}\n`);
  }

  info(message: string, details?: any, data?: any) {
    this.log('info', message, details, data);
  }

  warn(message: string, details?: any, data?: any) {
    this.log('warn', message, details, data);
  }

  error(message: string, details?: any, data?: any) {
    this.log('error', message, details, data);
  }

  logRequest(message: string, request: LogEntry['request'], response?: LogEntry['response']) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      request,
      response,
      title: '',
      jan: '',
      price: '',
      vendor: '',
      url: '',
      status: ''
    };
    this.writeLog(entry);
  }

  logItemProcess(item: any, result: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: result.status === 'SUCCESS' ? 'info' : 'warn',
      title: item.title,
      jan: item.jan,
      price: item.price,
      vendor: item.vendor,
      url: item.url,
      status: result.status,
      message: result.message,
    };
    this.writeLog(entry);
  }

  private log(level: 'info' | 'warn' | 'error', message: string, details?: any, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details,
      data,
      title: '',
      jan: '',
      price: '',
      vendor: '',
      url: '',
      status: ''
    };
    this.writeLog(entry);
  }

  async getLogs(limit: number = 100): Promise<LogEntry[]> {
    return new Promise((resolve, reject) => {
      fs.readFile(this.logFile, 'utf8', (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        const logs = data.split('\n\n')
          .filter(entry => entry.trim() !== '')
          .map(entry => {
            const [header, ...detailsLines] = entry.split('\n');
            const [timestamp, level, ...messageParts] = header.split(' ');
            const message = messageParts.join(' ');
            const details: any = {};
            let currentKey: string | null = null;

            detailsLines.forEach(line => {
              if (line.startsWith('Details: ') || line.startsWith('Data: ') || line.startsWith('Request: ') || line.startsWith('Response: ')) {
                currentKey = line.split(':')[0].toLowerCase();
                details[currentKey] = line.substring(line.indexOf(':') + 1).trim();
              } else if (currentKey) {
                details[currentKey] += '\n' + line;
              }
            });

            Object.keys(details).forEach(key => {
              try {
                details[key] = JSON.parse(details[key]);
              } catch (e) {
                // パースできない場合は文字列のまま
              }
            });

            return {
              timestamp: timestamp.replace('[', '').replace(']', ''),
              level: level.replace('[', '').replace(']', '').toLowerCase() as 'info' | 'warn' | 'error',
              message,
              ...details,
            };
          })
          .slice(-limit);
        resolve(logs.reverse());
      });
    });
  }
}

export const logger = new Logger();
