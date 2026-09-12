// src/main/services/processing/fileScan.ts
import fs from 'node:fs';
import path from 'node:path';

export const SUPPORTED_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.bmp',
  '.gif',
  '.tiff',
  '.tif',
  '.avif',
]);

export function isSupportedFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return SUPPORTED_EXTENSIONS.has(ext);
}

export function scanDirectoryRecursively(dirPath: string): string[] {
  const results: string[] = [];
  try {
    const list = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of list) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'Remake' || entry.name === 'node_modules' || entry.name === '.git') {
          continue;
        }
        results.push(...scanDirectoryRecursively(fullPath));
      } else if (entry.isFile() && isSupportedFile(fullPath)) {
        results.push(fullPath);
      }
    }
  } catch {
    // スキャン不可フォルダはスキップ
  }
  return results;
}
