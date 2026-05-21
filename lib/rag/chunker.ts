interface ChunkMetadata {
  content: string;
  sourceFile: string;
  conference: string;
  section: string;
  chunkIndex: number;
  tokenCount: number;
}

interface FileConfig {
  path: string;
  conference: string;
  strategy: 'single' | 'sec' | 'big10' | 'aac' | 'generic-headers' | 'pac12' | 'stats-yearly';
  baseDir?: string;
}

const estimateTokens = (text: string): number =>
  Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.3);

const stripPageNumbers = (text: string): string =>
  text
    .split('\n')
    .filter((line) => !/^\s*\d{1,3}\s*$/.test(line))
    .join('\n');

const stripPageHeaders = (text: string): string =>
  text
    .split('\n')
    .filter((line) => !/Handbook\s*•\s*Page/i.test(line))
    .filter((line) => !/^Updated \d+\/\d+\/\d+/i.test(line))
    .filter((line) => !/^Football Regulations$/i.test(line))
    .filter((line) => !/^SPR \d+-\d+/i.test(line))
    .join('\n');

const splitByParagraph = (text: string, maxTokens: number): string[] => {
  const paragraphs = text.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    const combined = current ? `${current}\n\n${para}` : para;
    if (estimateTokens(combined) > maxTokens && current) {
      chunks.push(current.trim());
      current = para;
    } else {
      current = combined;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
};

const MAX_CHUNK_TOKENS = 800;

const chunkSec = (content: string, sourceFile: string): ChunkMetadata[] => {
  const chunks: ChunkMetadata[] = [];
  const sections: Array<{ title: string; body: string }> = [];

  const sectionPattern = /^(\d+\.\s+(?:Two-Team|Three-Team).*?:|Appendix\s+[A-Z](?:\s*[–-].*)?)/m;
  const parts = content.split(sectionPattern);

  const preamble = parts[0].trim();
  if (preamble) {
    sections.push({ title: 'Overview', body: preamble });
  }

  for (let i = 1; i < parts.length; i += 2) {
    const title = parts[i]?.trim() ?? '';
    const body = parts[i + 1]?.trim() ?? '';
    if (title) {
      sections.push({ title, body: `${title}\n${body}` });
    }
  }

  for (const section of sections) {
    const tokens = estimateTokens(section.body);
    if (tokens <= MAX_CHUNK_TOKENS) {
      chunks.push({
        content: `[SEC - ${section.title}]\n${section.body}`,
        sourceFile,
        conference: 'SEC',
        section: section.title,
        chunkIndex: chunks.length,
        tokenCount: tokens,
      });
    } else {
      const subChunks = splitByParagraph(section.body, MAX_CHUNK_TOKENS);
      for (let j = 0; j < subChunks.length; j++) {
        const label = subChunks.length > 1 ? `${section.title} (Part ${j + 1})` : section.title;
        chunks.push({
          content: `[SEC - ${label}]\n${subChunks[j]}`,
          sourceFile,
          conference: 'SEC',
          section: label,
          chunkIndex: chunks.length,
          tokenCount: estimateTokens(subChunks[j]),
        });
      }
    }
  }

  return chunks;
};

const chunkBig10 = (content: string, sourceFile: string): ChunkMetadata[] => {
  const chunks: ChunkMetadata[] = [];
  const sectionPattern = /^([A-C])\.\s+(If\s+(?:two|three|four).*?)$/m;
  const parts = content.split(sectionPattern);

  const preamble = parts[0].trim();
  if (preamble) {
    chunks.push({
      content: `[Big Ten - Overview]\n${preamble}`,
      sourceFile,
      conference: 'B1G',
      section: 'Overview',
      chunkIndex: 0,
      tokenCount: estimateTokens(preamble),
    });
  }

  for (let i = 1; i < parts.length; i += 3) {
    const letter = parts[i];
    const headerStart = parts[i + 1] ?? '';
    const body = parts[i + 2]?.trim() ?? '';
    const fullSection = `${letter}. ${headerStart}\n${body}`;
    const section = `Section ${letter}`;

    const tokens = estimateTokens(fullSection);
    if (tokens <= MAX_CHUNK_TOKENS) {
      chunks.push({
        content: `[Big Ten - ${section}]\n${fullSection}`,
        sourceFile,
        conference: 'B1G',
        section,
        chunkIndex: chunks.length,
        tokenCount: tokens,
      });
    } else {
      const subChunks = splitByParagraph(fullSection, MAX_CHUNK_TOKENS);
      for (let j = 0; j < subChunks.length; j++) {
        const label = subChunks.length > 1 ? `${section} (Part ${j + 1})` : section;
        chunks.push({
          content: `[Big Ten - ${label}]\n${subChunks[j]}`,
          sourceFile,
          conference: 'B1G',
          section: label,
          chunkIndex: chunks.length,
          tokenCount: estimateTokens(subChunks[j]),
        });
      }
    }
  }

  return chunks;
};

const chunkAac = (content: string, sourceFile: string): ChunkMetadata[] => {
  const cleaned = stripPageNumbers(content);
  const chunks: ChunkMetadata[] = [];

  const twoTeamIdx = cleaned.indexOf('TWO-TEAM TIE');
  const multiTeamIdx = cleaned.indexOf('MULTIPLE TEAM TIE');
  const endIdx = cleaned.search(/\n10\.[7-9]|$/);

  if (twoTeamIdx === -1) {
    return chunkSingle(cleaned, sourceFile, 'AAC', 'American Athletic');
  }

  const preamble = cleaned.slice(0, twoTeamIdx).trim();
  if (preamble && estimateTokens(preamble) > 50) {
    chunks.push({
      content: `[AAC - Preamble]\n${preamble}`,
      sourceFile,
      conference: 'AAC',
      section: 'Preamble',
      chunkIndex: chunks.length,
      tokenCount: estimateTokens(preamble),
    });
  }

  const twoTeamBody =
    multiTeamIdx > twoTeamIdx
      ? cleaned.slice(twoTeamIdx, multiTeamIdx).trim()
      : cleaned.slice(twoTeamIdx).trim();
  pushSection(chunks, twoTeamBody, sourceFile, 'AAC', 'Two-Team Tie');

  if (multiTeamIdx > -1) {
    const multiTeamBody = cleaned
      .slice(multiTeamIdx, endIdx > multiTeamIdx ? endIdx : undefined)
      .trim();
    pushSection(chunks, multiTeamBody, sourceFile, 'AAC', 'Multiple Team Tie');
  }

  return chunks;
};

const chunkPac12 = (content: string, sourceFile: string): ChunkMetadata[] => {
  const startMarker = 'b. Tiebreaker.';
  const endMarker = '3. Postseason Bowl Games.';

  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) return [];

  let endIdx = content.indexOf(endMarker, startIdx);
  if (endIdx === -1) endIdx = content.length;

  let tiebreaker = content.slice(startIdx, endIdx).trim();
  tiebreaker = stripPageHeaders(tiebreaker);
  tiebreaker = tiebreaker.replace(/\([0-9/]+(?:,\s*[0-9/]+)*\)/g, '').trim();

  const chunks: ChunkMetadata[] = [];
  const twoTeamIdx = tiebreaker.indexOf('(1) Two-Team Tie.');
  const multiIdx = tiebreaker.indexOf('(2) Multiple Team Tie.');

  if (twoTeamIdx > -1 && multiIdx > -1) {
    const twoTeam = tiebreaker.slice(twoTeamIdx, multiIdx).trim();
    pushSection(chunks, twoTeam, sourceFile, 'PAC', 'Two-Team Tie');

    const multi = tiebreaker.slice(multiIdx).trim();
    pushSection(chunks, multi, sourceFile, 'PAC', 'Multiple Team Tie');
  } else {
    pushSection(chunks, tiebreaker, sourceFile, 'PAC', 'Tiebreaker');
  }

  return chunks;
};

const chunkGenericHeaders = (
  content: string,
  sourceFile: string,
  conference: string,
  confName: string
): ChunkMetadata[] => {
  const chunks: ChunkMetadata[] = [];
  const headerPattern =
    /^(.*(?:Two-Team|Multiple-Team|Three.*Team|Multi.*Team).*(?:Tie|Ties).*)$/im;
  const parts = content.split(headerPattern);

  const preamble = parts[0].trim();
  if (preamble && estimateTokens(preamble) > 50) {
    chunks.push({
      content: `[${confName} - Overview]\n${preamble}`,
      sourceFile,
      conference,
      section: 'Overview',
      chunkIndex: 0,
      tokenCount: estimateTokens(preamble),
    });
  }

  for (let i = 1; i < parts.length; i += 2) {
    const header = parts[i]?.trim() ?? '';
    const body = parts[i + 1]?.trim() ?? '';
    const fullSection = `${header}\n${body}`;
    pushSection(chunks, fullSection, sourceFile, conference, header);
  }

  if (chunks.length === 0) {
    return chunkSingle(content, sourceFile, conference, confName);
  }

  return chunks;
};

const chunkSingle = (
  content: string,
  sourceFile: string,
  conference: string,
  confName: string
): ChunkMetadata[] => {
  const tokens = estimateTokens(content);
  if (tokens <= MAX_CHUNK_TOKENS) {
    return [
      {
        content: `[${confName} - Tiebreaker Rules]\n${content}`,
        sourceFile,
        conference,
        section: 'Tiebreaker Rules',
        chunkIndex: 0,
        tokenCount: tokens,
      },
    ];
  }

  const subChunks = splitByParagraph(content, MAX_CHUNK_TOKENS);
  return subChunks.map((chunk, i) => ({
    content: `[${confName} - Part ${i + 1}]\n${chunk}`,
    sourceFile,
    conference,
    section: `Part ${i + 1}`,
    chunkIndex: i,
    tokenCount: estimateTokens(chunk),
  }));
};

const pushSection = (
  chunks: ChunkMetadata[],
  text: string,
  sourceFile: string,
  conference: string,
  section: string
) => {
  const confName = CONF_DISPLAY_NAMES[conference] ?? conference;
  const tokens = estimateTokens(text);
  if (tokens <= MAX_CHUNK_TOKENS) {
    chunks.push({
      content: `[${confName} - ${section}]\n${text}`,
      sourceFile,
      conference,
      section,
      chunkIndex: chunks.length,
      tokenCount: tokens,
    });
  } else {
    const subChunks = splitByParagraph(text, MAX_CHUNK_TOKENS);
    for (let j = 0; j < subChunks.length; j++) {
      const label = subChunks.length > 1 ? `${section} (Part ${j + 1})` : section;
      chunks.push({
        content: `[${confName} - ${label}]\n${subChunks[j]}`,
        sourceFile,
        conference,
        section: label,
        chunkIndex: chunks.length,
        tokenCount: estimateTokens(subChunks[j]),
      });
    }
  }
};

const chunkStatsYearly = (
  content: string,
  sourceFile: string,
  conference: string
): ChunkMetadata[] => {
  const chunks: ChunkMetadata[] = [];
  const confGroups = new Map<string, string[]>();

  const lines = content.split('\n');
  const title = lines[0] ?? sourceFile;
  let currentConf = '';

  for (const line of lines.slice(1)) {
    const confMatch = line.match(/^\d+\.\s+.+?\(([^)]+)\)/);
    if (confMatch) {
      currentConf = confMatch[1];
      if (!confGroups.has(currentConf)) confGroups.set(currentConf, []);
    }
    if (currentConf && line.trim()) {
      confGroups.get(currentConf)!.push(line);
    }
  }

  for (const [conf, confLines] of confGroups) {
    const text = `${title} - ${conf}\n\n${confLines.join('\n')}`;
    const tokens = estimateTokens(text);
    if (tokens <= MAX_CHUNK_TOKENS) {
      chunks.push({
        content: `[${conf} Stats]\n${text}`,
        sourceFile,
        conference,
        section: `${title} - ${conf}`,
        chunkIndex: chunks.length,
        tokenCount: tokens,
      });
    } else {
      const subChunks = splitByParagraph(text, MAX_CHUNK_TOKENS);
      for (let j = 0; j < subChunks.length; j++) {
        chunks.push({
          content: `[${conf} Stats]\n${subChunks[j]}`,
          sourceFile,
          conference,
          section: `${title} - ${conf} (Part ${j + 1})`,
          chunkIndex: chunks.length,
          tokenCount: estimateTokens(subChunks[j]),
        });
      }
    }
  }

  if (chunks.length === 0) {
    return chunkSingle(content, sourceFile, conference, 'Historical Stats');
  }

  return chunks;
};

const CONF_DISPLAY_NAMES: Record<string, string> = {
  SEC: 'SEC',
  ACC: 'ACC',
  B1G: 'Big Ten',
  B12: 'Big 12',
  PAC: 'Pac-12',
  AAC: 'AAC',
  MAC: 'MAC',
  CUSA: 'Conference USA',
  MWC: 'Mountain West',
  SBC: 'Sun Belt',
  ALL: 'Cross-Conference',
};

export const FILE_CONFIGS: FileConfig[] = [
  { path: 'sec/sec-tiebreaker-rules-cleaned.txt', conference: 'SEC', strategy: 'sec' },
  { path: 'acc-tiebreaker-rules-cleaned.txt', conference: 'ACC', strategy: 'single' },
  { path: 'big10-tiebreaker-rules-cleaned.txt', conference: 'B1G', strategy: 'big10' },
  { path: 'big12-tiebreaker-rules-cleaned.txt', conference: 'B12', strategy: 'generic-headers' },
  { path: 'pac12-tiebreaker-rules-cleaned.txt', conference: 'PAC', strategy: 'pac12' },
  { path: 'aac-tiebreaker-rules-cleaned.txt', conference: 'AAC', strategy: 'aac' },
  { path: 'mac-tiebreaker-rules-cleaned.txt', conference: 'MAC', strategy: 'single' },
  { path: 'cusa-tiebreaker-rules-cleaned.txt', conference: 'CUSA', strategy: 'generic-headers' },
  { path: 'mw-tiebreaker-rules-cleaned.txt', conference: 'MWC', strategy: 'generic-headers' },
  { path: 'sunbelt-tiebreaker-rules-cleaned.txt', conference: 'SBC', strategy: 'generic-headers' },
  {
    path: 'external-analytics-by-conference.md',
    conference: 'ALL',
    strategy: 'single',
    baseDir: 'docs/guides',
  },
  { path: 'venues.txt', conference: 'ALL', strategy: 'single', baseDir: 'docs/cfbd-static' },
  { path: 'conferences.txt', conference: 'ALL', strategy: 'single', baseDir: 'docs/cfbd-static' },
  { path: 'teams.txt', conference: 'ALL', strategy: 'single', baseDir: 'docs/cfbd-static' },
  { path: 'coaches.txt', conference: 'ALL', strategy: 'single', baseDir: 'docs/cfbd-static' },
  {
    path: '2020-sp-plus.txt',
    conference: 'ALL',
    strategy: 'stats-yearly',
    baseDir: 'docs/historical-stats',
  },
  {
    path: '2021-sp-plus.txt',
    conference: 'ALL',
    strategy: 'stats-yearly',
    baseDir: 'docs/historical-stats',
  },
  {
    path: '2022-sp-plus.txt',
    conference: 'ALL',
    strategy: 'stats-yearly',
    baseDir: 'docs/historical-stats',
  },
  {
    path: '2023-sp-plus.txt',
    conference: 'ALL',
    strategy: 'stats-yearly',
    baseDir: 'docs/historical-stats',
  },
  {
    path: '2024-sp-plus.txt',
    conference: 'ALL',
    strategy: 'stats-yearly',
    baseDir: 'docs/historical-stats',
  },
  {
    path: '2020-fpi.txt',
    conference: 'ALL',
    strategy: 'stats-yearly',
    baseDir: 'docs/historical-stats',
  },
  {
    path: '2021-fpi.txt',
    conference: 'ALL',
    strategy: 'stats-yearly',
    baseDir: 'docs/historical-stats',
  },
  {
    path: '2022-fpi.txt',
    conference: 'ALL',
    strategy: 'stats-yearly',
    baseDir: 'docs/historical-stats',
  },
  {
    path: '2023-fpi.txt',
    conference: 'ALL',
    strategy: 'stats-yearly',
    baseDir: 'docs/historical-stats',
  },
  {
    path: '2024-fpi.txt',
    conference: 'ALL',
    strategy: 'stats-yearly',
    baseDir: 'docs/historical-stats',
  },
  {
    path: '2020-championships.txt',
    conference: 'ALL',
    strategy: 'single',
    baseDir: 'docs/historical-stats',
  },
  {
    path: '2021-championships.txt',
    conference: 'ALL',
    strategy: 'single',
    baseDir: 'docs/historical-stats',
  },
  {
    path: '2022-championships.txt',
    conference: 'ALL',
    strategy: 'single',
    baseDir: 'docs/historical-stats',
  },
  {
    path: '2023-championships.txt',
    conference: 'ALL',
    strategy: 'single',
    baseDir: 'docs/historical-stats',
  },
  {
    path: '2024-championships.txt',
    conference: 'ALL',
    strategy: 'single',
    baseDir: 'docs/historical-stats',
  },
  {
    path: '2020-preseason-rankings.txt',
    conference: 'ALL',
    strategy: 'single',
    baseDir: 'docs/historical-stats',
  },
  {
    path: '2021-preseason-rankings.txt',
    conference: 'ALL',
    strategy: 'single',
    baseDir: 'docs/historical-stats',
  },
  {
    path: '2022-preseason-rankings.txt',
    conference: 'ALL',
    strategy: 'single',
    baseDir: 'docs/historical-stats',
  },
  {
    path: '2023-preseason-rankings.txt',
    conference: 'ALL',
    strategy: 'single',
    baseDir: 'docs/historical-stats',
  },
  {
    path: '2024-preseason-rankings.txt',
    conference: 'ALL',
    strategy: 'single',
    baseDir: 'docs/historical-stats',
  },
];

export const chunkDocument = (content: string, config: FileConfig): ChunkMetadata[] => {
  const confName = CONF_DISPLAY_NAMES[config.conference] ?? config.conference;

  switch (config.strategy) {
    case 'sec':
      return chunkSec(content, config.path);
    case 'big10':
      return chunkBig10(content, config.path);
    case 'aac':
      return chunkAac(content, config.path);
    case 'pac12':
      return chunkPac12(content, config.path);
    case 'generic-headers':
      return chunkGenericHeaders(content, config.path, config.conference, confName);
    case 'stats-yearly':
      return chunkStatsYearly(content, config.path, config.conference);
    case 'single':
      return chunkSingle(content, config.path, config.conference, confName);
  }
};

export type { ChunkMetadata, FileConfig };
