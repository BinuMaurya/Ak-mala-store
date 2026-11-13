import { copyFile, cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDirectory = path.join(projectRoot, 'public');
const distDirectory = path.join(projectRoot, 'dist');
const publicAssetsDirectory = path.join(publicDirectory, '_vercel');

await rm(path.join(publicDirectory, 'index.html'), { force: true });
await rm(publicAssetsDirectory, { recursive: true, force: true });

const viteCli = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const build = spawnSync(process.execPath, [viteCli, 'build'], {
  cwd: projectRoot,
  stdio: 'inherit'
});

if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);

await mkdir(publicDirectory, { recursive: true });
await mkdir(publicAssetsDirectory, { recursive: true });
await copyFile(path.join(distDirectory, 'index.html'), path.join(publicDirectory, 'index.html'));
await cp(path.join(distDirectory, '_vercel'), publicAssetsDirectory, { recursive: true });
