import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface LogEntry {
  timestamp: string;
  title: string;
  jan: string;
  price: number;
  vendor: string;
  url: string;
  status: string;
  message: string;
}

interface LogDisplayProps {
  logs: LogEntry[];
}

export const LogDisplay: React.FC<LogDisplayProps> = ({ logs }) => {
  const [filters, setFilters] = useState({
    title: '',
    jan: '',
    vendor: '',
    status: '',
  });
  const [sortColumn, setSortColumn] = useState<keyof LogEntry>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleFilterChange = (column: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [column]: value }));
  };

  const handleSort = (column: keyof LogEntry) => {
    if (column === sortColumn) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedLogs = useMemo(() => {
    return logs
      .filter(log =>
        log.title.toLowerCase().includes(filters.title.toLowerCase()) &&
        log.jan.includes(filters.jan) &&
        log.vendor.toLowerCase().includes(filters.vendor.toLowerCase()) &&
        log.status.toLowerCase().includes(filters.status.toLowerCase())
      )
      .sort((a, b) => {
        if (a[sortColumn] < b[sortColumn]) return sortDirection === 'asc' ? -1 : 1;
        if (a[sortColumn] > b[sortColumn]) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [logs, filters, sortColumn, sortDirection]);

  return (
    <div>
      <div className="mb-4">
        <Input
          placeholder="Filter by Title"
          value={filters.title}
          onChange={(e) => handleFilterChange('title', e.target.value)}
          className="mb-2"
        />
        <Input
          placeholder="Filter by JAN"
          value={filters.jan}
          onChange={(e) => handleFilterChange('jan', e.target.value)}
          className="mb-2"
        />
        <Input
          placeholder="Filter by Vendor"
          value={filters.vendor}
          onChange={(e) => handleFilterChange('vendor', e.target.value)}
          className="mb-2"
        />
        <Select
          value={filters.status}
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <option value="">All Statuses</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILED">FAILED</option>
        </Select>
      </div>
      <div className="mb-4">
        Displaying {filteredAndSortedLogs.length} of {logs.length} logs
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {['Title', 'JAN', 'Price', 'Vendor', 'URL', 'Status', 'Message'].map((header) => (
              <TableHead
                key={header}
                className="cursor-pointer"
                onClick={() => handleSort(header.toLowerCase() as keyof LogEntry)}
              >
                {header}
                {sortColumn === header.toLowerCase() && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedLogs.map((log, index) => (
            <TableRow
              key={index}
              className={log.status === 'FAILED' ? 'bg-yellow-100' : ''}
            >
              <TableCell>{log.title}</TableCell>
              <TableCell>{log.jan}</TableCell>
              <TableCell>{log.price}</TableCell>
              <TableCell>{log.vendor}</TableCell>
              <TableCell>
                <a href={log.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {log.url}
                </a>
              </TableCell>
              <TableCell>{log.status}</TableCell>
              <TableCell>{log.message}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
