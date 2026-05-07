#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const TIER1_FILES = [
  'ai-guide.md',
  'guides/quick-reference.md',
  'guides/api-reference.md',
  'guides/testing-quick-reference.md',
];

function getAllMarkdownFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllMarkdownFiles(fullPath));
    } else if (entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

function resolveLinkPath(baseFile, linkPath) {
  const baseDir = path.dirname(baseFile);
  const linkWithoutAnchor = linkPath.split('#')[0];

  if (linkWithoutAnchor.startsWith('./')) {
    return path.join(baseDir, linkWithoutAnchor.slice(2));
  } else if (linkWithoutAnchor.startsWith('../')) {
    return path.resolve(baseDir, linkWithoutAnchor);
  } else {
    return path.join(baseDir, linkWithoutAnchor);
  }
}

function checkBrokenLinks() {
  console.log('=== Checking for Broken Links ===\n');

  const allFiles = getAllMarkdownFiles(DOCS_DIR);
  const allFilePaths = new Set(allFiles.map((f) => path.relative(DOCS_DIR, f)));
  const brokenLinks = [];

  const linkRegex = /\]\(([^)]+\.md[^)]*)\)/g;

  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const relFile = path.relative(DOCS_DIR, file);
    const matches = [...content.matchAll(linkRegex)];

    for (const match of matches) {
      const linkPath = match[1];
      try {
        const resolved = resolveLinkPath(file, linkPath);
        const relResolved = path.relative(DOCS_DIR, resolved);

        if (!allFilePaths.has(relResolved)) {
          const filename = path.basename(linkPath.split('#')[0]);
          const found = Array.from(allFilePaths).find((f) => path.basename(f) === filename);

          if (!found) {
            brokenLinks.push({
              source: relFile,
              link: linkPath,
              resolved: relResolved,
            });
          }
        }
      } catch (error) {
        brokenLinks.push({
          source: relFile,
          link: linkPath,
          resolved: `ERROR: ${error.message}`,
        });
      }
    }
  }

  if (brokenLinks.length > 0) {
    console.log('⚠️  Broken links found:');
    brokenLinks.forEach(({ source, link, resolved }) => {
      console.log(`  ${source} -> ${link}`);
      console.log(`    (resolved: ${resolved})`);
    });
  } else {
    console.log('✅ No broken links found');
  }

  return brokenLinks.length === 0;
}

function checkFilenameConventions() {
  console.log('\n=== Checking Filename Conventions ===\n');

  const allFiles = getAllMarkdownFiles(DOCS_DIR);
  const violations = [];

  for (const file of allFiles) {
    const basename = path.basename(file, '.md');
    const relPath = path.relative(DOCS_DIR, file);

    if (basename !== basename.toLowerCase() && !['README', 'CHANGELOG'].includes(basename)) {
      violations.push(relPath);
    }
  }

  if (violations.length > 0) {
    console.log('⚠️  Filename convention violations:');
    violations.forEach((v) => console.log(`  ${v}`));
  } else {
    console.log('✅ All filenames follow kebab-case convention');
  }

  return violations.length === 0;
}

function findOrphanedDocs() {
  console.log('\n=== Finding Orphaned Documentation ===\n');

  const allFiles = getAllMarkdownFiles(DOCS_DIR);
  const allFilePaths = new Set(allFiles.map((f) => path.relative(DOCS_DIR, f).replace(/\\/g, '/')));
  const referencedFiles = new Set();

  const linkRegex = /\]\(([^)]+\.md[^)]*)\)/g;
  const pathStringRegex = /`docs\/([^`]+\.md)`/g;

  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf-8');

    const linkMatches = [...content.matchAll(linkRegex)];
    for (const match of linkMatches) {
      const linkPath = match[1];
      try {
        const resolved = resolveLinkPath(file, linkPath);
        const relResolved = path.relative(DOCS_DIR, resolved).replace(/\\/g, '/');
        if (allFilePaths.has(relResolved)) {
          referencedFiles.add(relResolved);
        }
      } catch {
        // Ignore resolution errors
      }
    }

    const pathMatches = [...content.matchAll(pathStringRegex)];
    for (const match of pathMatches) {
      const docPath = match[1];
      if (allFilePaths.has(docPath)) {
        referencedFiles.add(docPath);
      }
    }
  }

  // Index files are not considered orphaned
  const indexFiles = new Set(['guides/frontend/index.md']);

  const orphaned = Array.from(allFilePaths).filter(
    (f) => !referencedFiles.has(f) && !indexFiles.has(f)
  );

  if (orphaned.length > 0) {
    console.log(`⚠️  Found ${orphaned.length} potentially orphaned files:`);
    orphaned.forEach((f) => console.log(`  ${f}`));
    console.log('\n  Note: These may be referenced via path strings or in code comments');
  } else {
    console.log('✅ No orphaned files found');
  }

  return orphaned;
}

function reportTier1Load() {
  console.log('\n=== Tier 1 Documentation Load ===\n');

  let totalLines = 0;
  let totalChars = 0;

  console.log('Essential Docs (from ai-loading-manifest.md):');
  for (const file of TIER1_FILES) {
    const filePath = path.join(DOCS_DIR, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').length;
      const chars = content.length;
      const tokensEst = Math.round(chars / 4);

      totalLines += lines;
      totalChars += chars;

      const filename = path.basename(file).padEnd(35);
      const linesStr = lines.toString().padStart(4);
      const tokensStr = tokensEst.toString().padStart(5);
      console.log(`  ${filename} ${linesStr} lines, ~${tokensStr} tokens`);
    }
  }

  const totalTokensEst = Math.round(totalChars / 4);
  const totalLabel = 'TOTAL'.padEnd(35);
  const totalLinesStr = totalLines.toString().padStart(4);
  const totalTokensStr = totalTokensEst.toString().padStart(5);
  console.log(`\n  ${totalLabel} ${totalLinesStr} lines, ~${totalTokensStr} tokens`);
  console.log(`\n  Note: ai-loading-manifest.md estimates ~6.5K tokens`);
  console.log(
    `  Status: ${totalTokensEst <= 7000 ? '✅ Within expected range' : '⚠️  Exceeds estimate'}`
  );

  return { totalLines, totalTokensEst };
}

function checkDuplicateHeadings() {
  console.log('\n=== Checking for Duplicate Headings ===\n');

  const allFiles = getAllMarkdownFiles(DOCS_DIR);
  const issues = [];
  const headingRegex = /^(##+)\s+(.+)$/gm;
  const codeBlockRegex = /```[\s\S]*?```/g;

  for (const file of allFiles) {
    let content = fs.readFileSync(file, 'utf-8');
    const relPath = path.relative(DOCS_DIR, file);
    const headings = [];

    // Remove code blocks before checking headings
    content = content.replace(codeBlockRegex, '');

    let match;
    while ((match = headingRegex.exec(content)) !== null) {
      headings.push(match[2].trim());
    }

    const duplicates = headings.filter((h, i) => headings.indexOf(h) !== i);
    if (duplicates.length > 0) {
      const uniqueDups = [...new Set(duplicates)];
      issues.push({
        file: relPath,
        duplicates: uniqueDups,
      });
    }
  }

  if (issues.length > 0) {
    console.log('⚠️  Duplicate headings found:');
    issues.forEach(({ file, duplicates }) => {
      console.log(`  ${file}: ${duplicates.join(', ')}`);
    });
  } else {
    console.log('✅ No duplicate headings found');
  }

  return issues.length === 0;
}

function main() {
  console.log('=== Documentation Audit ===\n');

  const results = {
    brokenLinks: checkBrokenLinks(),
    filenameConventions: checkFilenameConventions(),
    orphanedDocs: findOrphanedDocs(),
    tier1Load: reportTier1Load(),
    duplicateHeadings: checkDuplicateHeadings(),
  };

  console.log('\n=== Summary ===\n');
  console.log(`Total markdown files: ${getAllMarkdownFiles(DOCS_DIR).length}`);
  console.log(`Broken links: ${results.brokenLinks ? '✅ None' : '⚠️  Found'}`);
  console.log(
    `Filename conventions: ${results.filenameConventions ? '✅ All valid' : '⚠️  Violations found'}`
  );
  console.log(`Orphaned docs: ${results.orphanedDocs.length}`);
  console.log(`Tier 1 tokens: ~${results.tier1Load.totalTokensEst}`);
  console.log(`Duplicate headings: ${results.duplicateHeadings ? '✅ None' : '⚠️  Found'}`);

  const allPassed = results.brokenLinks && results.filenameConventions && results.duplicateHeadings;

  process.exit(allPassed ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = {
  checkBrokenLinks,
  checkFilenameConventions,
  findOrphanedDocs,
  reportTier1Load,
  checkDuplicateHeadings,
};
