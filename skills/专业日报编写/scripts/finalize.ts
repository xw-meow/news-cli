import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export function finalizeReport(content: string, outputFile: string): string {
  mkdirSync(dirname(outputFile), { recursive: true });
  writeFileSync(outputFile, content, 'utf8');
  return outputFile;
}
