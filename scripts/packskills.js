import { execSync } from 'child_process';
import { readdirSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';

const skillsDir = join(process.cwd(), 'skills');
const entries = readdirSync(skillsDir, { withFileTypes: true });

for (const entry of entries) {
  if (!entry.isDirectory()) continue;

  const folderPath = join(skillsDir, entry.name);
  const zipPath = join(skillsDir, `${entry.name}.zip`);

  if (existsSync(zipPath)) {
    unlinkSync(zipPath);
  }

  execSync(`zip -r "${zipPath}" "${entry.name}"`, {
    cwd: skillsDir,
    stdio: 'pipe',
  });

  console.log(`✓ ${entry.name}.zip`);
}
