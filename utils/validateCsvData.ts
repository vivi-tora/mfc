import { ItemData } from '../types';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  items: ItemData[];
  skippedCount: number;
}

function validateJANCode(jan: string): boolean {
  return /^\d{13}$/.test(jan) || /^EZ\d{8}$/.test(jan);
}

function shouldSkipRow(type: string): boolean {
  const skipTypes = ['', 'DL', 'test', 'デジタルコンテンツ'];
  return skipTypes.includes(type.trim());
}

export function validateCsvData(data: any[]): ValidationResult {
  const errors: string[] = [];
  const items: ItemData[] = [];
  let skippedCount = 0;

  if (data.length === 0) {
    errors.push("CSVファイルが空です。");
    return { valid: false, errors, items, skippedCount };
  }

  const requiredHeaders = ['Variant Barcode', 'Variant Price', 'URL', 'Status', 'Type'];
  const headers = Object.keys(data[0]);

  requiredHeaders.forEach(header => {
    if (!headers.includes(header)) {
      errors.push(`必須ヘッダー "${header}" が見つかりません。`);
    }
  });

  if (errors.length > 0) {
    return { valid: false, errors, items, skippedCount };
  }

  data.forEach((row, index) => {
    const rowNumber = index + 2; // ヘッダー行を考慮して2から始める

    // Status が "Active" でない行、または Type が指定の条件に合致する行はスキップ
    if (row['Status'] !== 'Active' || shouldSkipRow(row['Type'])) {
      skippedCount++;
      return;
    }

    const itemErrors: string[] = [];

    if (!row['Variant Barcode']) {
      itemErrors.push(`Variant Barcode が空です`);
    } else if (!validateJANCode(row['Variant Barcode'])) {
      itemErrors.push(`Variant Barcode は13桁の数字、もしくはEZで始まり8桁の数字が続く形式である必要があります`);
    }

    if (!row['Variant Price']) {
      itemErrors.push(`Variant Price が空です`);
    } else if (isNaN(Number(row['Variant Price'])) || Number(row['Variant Price']) <= 0) {
      itemErrors.push(`Variant Price は正の数値である必要があります`);
    }

    if (!row['URL']) {
      itemErrors.push(`URL が空です`);
    } else if (!/^https?:\/\/.+/.test(row['URL'])) {
      itemErrors.push(`URL の形式が正しくありません`);
    }

    if (itemErrors.length > 0) {
      errors.push(`行 ${rowNumber}: ${itemErrors.join(', ')}`);
    } else {
      items.push({
        jan: row['Variant Barcode'],
        available: true,
        price: Number(row['Variant Price']),
        url: row['URL']
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    items,
    skippedCount
  };
}
