#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { runSequentially } from '../dist/scripts/orchestrate.js';

export { runSequentially, runWithSubagents } from '../dist/scripts/orchestrate.js';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const request = process.argv[2] ?? '';
  runSequentially(request)
    .then((outputFile) => {
      console.log(outputFile);
    })
    .catch((err) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error(message);
      process.exit(1);
    });
}
