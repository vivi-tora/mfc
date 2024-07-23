import { useState, useEffect } from 'react';
import { CSVImport } from '../components/CSVImport';
import { ProgressBar } from '../components/ProgressBar';
import { LogDisplay } from '../components/LogDisplay';
import { ItemData, LogEntry } from '../types';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateCSV } from '../utils/csv';
import { downloadCSV } from '../utils/download';

export default function Dashboard() {
  const [items, setItems] = useState<ItemData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentItem: '' });
  const [showForm, setShowForm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [skippedCount, setSkippedCount] = useState<number>(0);

  const handleCSVDownload = () => {
    const csvContent = generateCSV(logs);
    downloadCSV(csvContent, 'log_export.csv');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResults([]);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      setProgress({ current: i + 1, total: items.length, currentItem: item.jan });

      try {
        const response = await fetch('/api/update-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: [item] }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setResults(prev => [...prev, ...data.results]);

        // 新しいログエントリを作成
        const newLog: LogEntry = {
          timestamp: new Date().toISOString(),
          title: item.title || '',
          jan: item.jan,
          price: item.price,
          vendor: item.vendor || '',
          url: item.url,
          status: data.results[0].result.status,
          message: data.results[0].result.message || ''
        };

        // ログを更新（既存のログに新しいログを追加）
        setLogs(prevLogs => [newLog, ...prevLogs]);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        setError(prev => (prev ? `${prev}\n` : '') + `Error processing ${item.jan}: ${errorMessage}`);

        // エラーログを追加
        const errorLog: LogEntry = {
          timestamp: new Date().toISOString(),
          title: item.title || '',
          jan: item.jan,
          price: item.price,
          vendor: item.vendor || '',
          url: item.url,
          status: 'FAILED',
          message: errorMessage
        };
        setLogs(prevLogs => [errorLog, ...prevLogs]);
      }
    }

    setLoading(false);
    setItems([]);
  };

  const handleImport = (importedItems: ItemData[], skipped: number) => {
    setItems(importedItems);
    setProgress({ current: 0, total: importedItems.length, currentItem: '' });
    setValidationErrors([]);
    setSkippedCount(skipped);
  };

  const handleValidationError = (errors: string[]) => {
    setValidationErrors(errors);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">MFC Availability Management</h1>

      <div className="mb-4">
        <CSVImport onImport={handleImport} onValidationError={handleValidationError} />
      </div>

      {validationErrors.length > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>CSVバリデーションエラー</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {skippedCount > 0 && (
        <Alert variant="warning" className="mb-4">
          <AlertTitle>スキップされた行</AlertTitle>
          <AlertDescription>
            Status が "Active" でない {skippedCount} 行がスキップされました。
          </AlertDescription>
        </Alert>
      )}

      {items.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Import Progress</h2>
          <ProgressBar
            current={progress.current}
            total={progress.total}
            currentItem={progress.currentItem}
          />
        </div>
      )}

      <Button
        onClick={() => setShowForm(!showForm)}
        className="mb-4"
      >
        {showForm ? 'Hide' : 'Show'} Manual Input Form
      </Button>

      {items.length > 0 && (
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className={`mt-4 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Processing...' : 'Submit All Items'}
        </Button>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h3 className="font-bold">Error occurred:</h3>
          <pre className="whitespace-pre-wrap">{error}</pre>
        </div>
      )}

    <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">System Logs</h2>
          <Button onClick={handleCSVDownload} disabled={logs.length === 0}>
            Export CSV
          </Button>
        </div>
        <LogDisplay logs={logs} />
      </div>
  </div>
  );
}
