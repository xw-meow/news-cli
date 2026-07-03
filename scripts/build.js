// scripts/build.js
import * as esbuild from 'esbuild';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: 'dist/index.js',
  banner: {
    js: '#!/usr/bin/env node',
  },
  minify: false,
  sourcemap: false,
  packages: 'external',
});

console.log('Build complete: dist/index.js');

const skillDir = join(__dirname, '..', 'skills', '专业日报编写');
const tsc = join(__dirname, '..', 'node_modules', '.bin', 'tsc');
execSync(`"${tsc}" -p tsconfig.build.json`, {
  cwd: skillDir,
  stdio: 'inherit',
});
console.log('Build complete: skills/专业日报编写/scripts/*.js');
