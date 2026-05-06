import { rmSync, existsSync } from 'fs';
import { resolve } from 'path';

const env = process.argv[2];

if (!env || !['dev', 'prod', 'all'].includes(env)) {
  console.error('Usage: flush-next <dev|prod|all>');
  process.exit(1);
}

const cacheDirs: { path: string; label: string }[] = [];

if (env === 'dev' || env === 'all') {
  cacheDirs.push({ path: resolve('.next/cache'), label: 'dev (.next/cache)' });
}
if (env === 'prod' || env === 'all') {
  cacheDirs.push({ path: resolve('.next/cache'), label: 'prod (.next/cache)' });
}

for (const { path, label } of cacheDirs) {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
    console.log(`✓ Flushed ${label}`);
  } else {
    console.log(`⊘ ${label} not found, skipping`);
  }
}
