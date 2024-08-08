export interface ItemData {
  jan: string;
  available: boolean;
  price: number;
  url: string;
  title: string;
  vendor: string;
}

export interface LogEntry {
  timestamp: string;
  title: string;
  jan: string;
  price: number;
  vendor: string;
  url: string;
  status: string;
  message: string;
  level: string;
}
