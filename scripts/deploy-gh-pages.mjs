import { execSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const temp = mkdtempSync(join(tmpdir(), 'jens-pages-'));
const remote = 'git@github.com:DKushman/jens.git';

try {
  cpSync('dist', temp, { recursive: true });
  execSync('git init', { cwd: temp, stdio: 'inherit' });
  execSync('git config user.email "deploy@local"', { cwd: temp, stdio: 'inherit' });
  execSync('git config user.name "Deploy"', { cwd: temp, stdio: 'inherit' });
  execSync('git add -A', { cwd: temp, stdio: 'inherit' });
  execSync(`git commit -m "Deploy ${new Date().toISOString()}"`, { cwd: temp, stdio: 'inherit' });
  execSync(`git push -f ${remote} HEAD:gh-pages`, { cwd: temp, stdio: 'inherit' });
  console.log('Deployed dist/ → gh-pages');
} finally {
  rmSync(temp, { recursive: true, force: true });
}
