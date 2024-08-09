// utils/logger.ts

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
  private logs: LogEntry[] = [];

  private writeLog(entry: LogEntry) {
    this.logs.push(entry);
    const logString = `${entry.timestamp} [${entry.level.toUpperCase()}] ${entry.message}`;
    let detailsString = '';

    if (entry.details) {
      detailsString += `\nDetails: ${JSON.stringify(entry.details, null, 2)}`;
    }
    if (entry.data) {
      detailsString += `\nData: ${JSON.stringify(entry.data, null, 2)}`;
    }
    if (entry.request) {
      detailsString += `\nRequest: ${JSON.stringify(entry.request, null, 2)}`;
    }
    if (entry.response) {
      detailsString += `\nResponse: ${JSON.stringify(entry.response, null, 2)}`;
    }

    switch (entry.level) {
      case 'info':
        console.log(`${logString}${detailsString}`);
        break;
      case 'warn':
        console.warn(`${logString}${detailsString}`);
        break;
      case 'error':
        console.error(`${logString}${detailsString}`);
        break;
    }
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

  getLogs(limit: number = 100): LogEntry[] {
    return this.logs.slice(-limit).reverse();
  }
}

export const logger = new Logger();
