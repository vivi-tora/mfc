import { useState } from 'react';
import { CSVImport } from '../components/CSVImport';
import { ProgressBar } from '../components/ProgressBar';
import ItemForm from '../components/ItemForm';
import { ItemData } from '../types';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function Dashboard() {
  const [items, setItems] = useState<ItemData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentItem: '' });
  const [showForm, setShowForm] = useState(false);

  const handleAddItem = (item: ItemData) => {
    setItems([...items, item]);
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
      } catch (e) {
        setError(prev => (prev ? `${prev}\n` : '') + `Error processing ${item.jan}: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }

    setLoading(false);
    setItems([]);
    fetchLogs();
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/logs');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setLogs(data);
    } catch (e) {
      console.error('Error fetching logs:', e);
    }
  };

   const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [skippedCount, setSkippedCount] = useState<number>(0);

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

      {showForm && <ItemForm onAddItem={handleAddItem} />}

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

      {results.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Results:</h3>
          {results.map((result, index) => (
            <div key={index} className="bg-green-100 p-2 mb-2 rounded">
              <p>JAN: {result.jan}</p>
              <p>Status: {result.result.status}</p>
              {result.result.message && <p>Message: {result.result.message}</p>}
            </div>
          ))}
        </div>
      )}

      <Accordion type="single" collapsible className="mt-8">
        <AccordionItem value="logs">
          <AccordionTrigger>System Logs</AccordionTrigger>
          <AccordionContent>
            <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className={`mb-2 p-2 rounded ${
                  log.level === 'error' ? 'bg-red-200' :
                  log.level === 'warn' ? 'bg-yellow-200' : 'bg-green-200'
                }`}>
                  <p><strong>{log.timestamp}</strong> [{log.level.toUpperCase()}] {log.message}</p>
                  {log.details && <pre className="text-sm">{JSON.stringify(log.details, null, 2)}</pre>}
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
