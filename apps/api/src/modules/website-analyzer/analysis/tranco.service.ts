import fs from 'fs';
import path from 'path';
import https from 'https';
import { createWriteStream } from 'fs';
import type { TrafficRank } from '../types';

const CACHE_DIR  = path.join(process.cwd(), 'data', 'tranco');
const CSV_PATH   = path.join(CACHE_DIR, 'top-1m.csv');
const META_PATH  = path.join(CACHE_DIR, 'meta.json');
const TTL_MS     = 7 * 24 * 60 * 60 * 1000; // 7 days
const TRANCO_URL = 'https://tranco-list.eu/top-1m.csv.zip';

let rankMap: Map<string, number> | null = null;
let listDate: string | null = null;

// ─── Download helpers ─────────────────────────────────────────────────────────

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve()));
      file.on('error', reject);
    }).on('error', reject);
  });
}

async function extractZipCsv(zipPath: string, outCsvPath: string): Promise<void> {
  // Use Node's built-in zlib to decompress the inner CSV
  // The Tranco zip contains exactly one file: top-1m.csv
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AdmZip = require('adm-zip') as typeof import('adm-zip');
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();
  const csvEntry = entries.find((e: { entryName: string }) => e.entryName.endsWith('.csv'));
  if (!csvEntry) throw new Error('No CSV found in Tranco zip');
  zip.extractEntryTo(csvEntry.entryName, CACHE_DIR, false, true);
  // Rename if needed
  const extracted = path.join(CACHE_DIR, csvEntry.entryName);
  if (extracted !== outCsvPath && fs.existsSync(extracted)) {
    fs.renameSync(extracted, outCsvPath);
  }
}

// ─── CSV parse ────────────────────────────────────────────────────────────────

function parseCsv(csvPath: string): Map<string, number> {
  const map = new Map<string, number>();
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split('\n');
  for (const line of lines) {
    const comma = line.indexOf(',');
    if (comma === -1) continue;
    const rank   = parseInt(line.slice(0, comma).trim(), 10);
    const domain = line.slice(comma + 1).trim().toLowerCase();
    if (!isNaN(rank) && domain) map.set(domain, rank);
  }
  return map;
}

// ─── Cache management ─────────────────────────────────────────────────────────

function isCacheValid(): boolean {
  if (!fs.existsSync(CSV_PATH) || !fs.existsSync(META_PATH)) return false;
  try {
    const meta = JSON.parse(fs.readFileSync(META_PATH, 'utf8')) as { downloadedAt: number };
    return Date.now() - meta.downloadedAt < TTL_MS;
  } catch {
    return false;
  }
}

async function ensureList(): Promise<void> {
  if (rankMap) return; // already loaded in memory

  if (isCacheValid()) {
    rankMap = parseCsv(CSV_PATH);
    try {
      const meta = JSON.parse(fs.readFileSync(META_PATH, 'utf8')) as { date: string };
      listDate = meta.date;
    } catch { /* ignore */ }
    return;
  }

  // Download fresh list
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const zipPath = path.join(CACHE_DIR, 'top-1m.csv.zip');

  try {
    await downloadFile(TRANCO_URL, zipPath);
    await extractZipCsv(zipPath, CSV_PATH);
    fs.unlinkSync(zipPath);

    const today = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(META_PATH, JSON.stringify({ downloadedAt: Date.now(), date: today }));
    listDate = today;

    rankMap = parseCsv(CSV_PATH);
  } catch (err) {
    console.error('[Tranco] Download/parse failed:', (err as Error).message);
    rankMap = new Map(); // empty map so we don't retry on every request
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getTrancoRank(hostname: string): Promise<TrafficRank> {
  try {
    await Promise.race([
      ensureList(),
      new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Tranco timeout')), 15_000)),
    ]);
  } catch {
    return { inTop1M: false, rankCategory: 'Not ranked', trancoSource: 'unavailable' };
  }

  // Strip www. prefix for lookup
  const bare = hostname.replace(/^www\./, '');
  const rank = rankMap?.get(bare) ?? rankMap?.get(`www.${bare}`) ?? null;

  let rankCategory: string;
  if (!rank)             rankCategory = 'Not in top 1M';
  else if (rank <= 1000)  rankCategory = 'Top 1K';
  else if (rank <= 10_000) rankCategory = 'Top 10K';
  else if (rank <= 100_000) rankCategory = 'Top 100K';
  else                    rankCategory = 'Top 1M';

  return {
    globalRank:    rank ?? undefined,
    inTop100k:     rank !== null ? rank <= 100_000 : false,
    inTop1M:       rank !== null,
    rankCategory,
    trancoSource:  listDate ?? undefined,
  };
}
