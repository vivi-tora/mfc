import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { ItemData } from '../types';
import { validateCsvData } from '../utils/validateCsvData';

interface CSVImportProps {
  onImport: (items: ItemData[], skippedCount: number) => void;
  onValidationError: (errors: string[]) => void;
}

export const CSVImport: React.FC<CSVImportProps> = ({ onImport, onValidationError }) => {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    Papa.parse(file, {
      complete: (results) => {
        const { valid, errors, items, skippedCount } = validateCsvData(results.data);
        if (!valid) {
          onValidationError(errors);
        } else {
          onImport(items, skippedCount);
        }
      },
      header: true,
      error: (error) => {
        setError(`CSVパースエラー: ${error.message}`);
      },
    });
  }, [onImport, onValidationError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed p-4 text-center cursor-pointer ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>ファイルをここにドロップ...</p>
        ) : (
          <p>CSVファイルをドラッグ＆ドロップするか、クリックして選択してください</p>
        )}
      </div>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};
