import { readdirSync, readFileSync, statSync } from 'fs';
import { join, resolve } from 'path';

const NEXT_SERVER = join(process.cwd(), '.next', 'server');
const MAX_SIZE_MB = 250;
const EXCLUDE_SUBSTRINGS = ['__fixtures__', 'lib/msw'];

const nftFiles = readdirSync(NEXT_SERVER)
  .filter((f) => f.endsWith('.nft.json'))
  .map((f) => join(NEXT_SERVER, f));

let failed = false;

for (const nftPath of nftFiles) {
  const fnName = nftPath.replace(NEXT_SERVER + '/', '').replace('.nft.json', '');
  const nft = JSON.parse(readFileSync(nftPath, 'utf-8')) as { files: string[] };
  let totalBytes = 0;

  for (const relFile of nft.files) {
    if (EXCLUDE_SUBSTRINGS.some((s) => relFile.includes(s))) continue;

    const absPath = resolve(NEXT_SERVER, relFile);
    try {
      totalBytes += statSync(absPath).size;
    } catch {
      // traced file may not exist locally
    }
  }

  const sizeMB = totalBytes / (1024 * 1024);
  if (sizeMB > MAX_SIZE_MB) {
    console.error(`FAIL: ${fnName} — ${sizeMB.toFixed(1)} MB (limit ${MAX_SIZE_MB} MB)`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
} else {
  console.log(`All serverless functions under ${MAX_SIZE_MB} MB`);
}
