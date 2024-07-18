export interface ItemData {
  jan: string;
  available: boolean;
  price: number;
  url: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: any;
}
