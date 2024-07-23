// utils/csv.ts

import { LogEntry } from '../types';

export function generateCSV(logs: LogEntry[]): string {
  const headers = ['Title', 'JAN', 'Price', 'Vendor', 'URL', 'Status', 'Message'];
  const rows = logs.map(log => [
    log.title,
    log.jan,
    log.price.toString(),
    log.vendor,
    log.url,
    log.status,
    log.message
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
}
