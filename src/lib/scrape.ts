import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import type { AnyNode } from 'domhandler';
import * as http from 'node:http';
import * as https from 'node:https';
import type { DegreeLevel, ScrapedProgram } from '@/types';

const FETCH_TIMEOUT_MS = 12000;
const DEPT_CANDIDATE_LIMIT = 9;
const HUB_CANDIDATE_LIMIT = 4;
const WAVE2_LIMIT = 5;
const ENRICH_LIMIT = 18;
const MAX_RESULTS = 40;
const CONCURRENCY = 4;
const MAX_PAGE_BYTES = 3_000_000;
const RESEARCH_NAME = /\b(research|phd|ph\.d|mphil|mlitt|edd|dclinpsy)\b|\(research\)/i;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const LEVEL_MATCHERS: Record<DegreeLevel, RegExp[]> = {
  bachelor: [
    /\bbachelor(?:'s|s)?\b/i,
    /\bunder[-\s]?graduate\b/i,
    /\bundergrad\b/i,
    /\bb\.?s\.?c\b/i,
    /\bb\.?eng\b/i,
    /\bbeng\b/i,
    /\bbba\b/i,
    /\bllb\b/i,
    /\bb\.?a\b/i,
    /\bbs\b/i,
  ],
  masters: [
    /\bmaster(?:'s|s)?\b/i,
    /\bm\.?s\.?c\b/i,
    /\bmeng\b/i,
    /\bm\.?eng\b/i,
    /\bmba\b/i,
    /\bllm\b/i,
    /\bmfa\b/i,
    /\bmres\b/i,
    /\bmpa\b/i,
    /\bpost[-\s]?grad/i,
    /\bgraduate (?:programme?s?|degree|study|studies|course)\b/i,
    /\bma\b/i,
    /\bms\b/i,
  ],
  phd: [/\bph\.?\s?d\b/i, /\bdphil\b/i, /\bdoctoral\b/i, /\bdoctorate\b/i, /\bdoctor of\b/i],
};

const HUB_KEYWORDS = [
  'department',
  'faculty',
  'school',
  'college',
  'program',
  'programme',
  'degree',
  'course',
  'admission',
  'apply',
  'academic',
  'study',
  'studies',
  'graduate',
  'undergraduate',
];

const DEPARTMENT_LINK = /\b(school|dept\.?|department|faculty|college|institute)(?:\s+of)?\b/i;

const SUBJECT_NOUN =
  /\b(science|sciences|engineering|technolog|business|law|legal|medicine|medical|dentistry|management|arts|education|economics|math|computer|computing|informatics|information systems|psychology|nursing|pharmacy|chemistry|physics|biolog|history|english|languages|linguistic|communication|media|architecture|finance|accounting|marketing|philosophy|sociolog|politics|analytics|data science|design|music|theatre|theater|humanities|public health|international relations|agriculture|environment|theology|journalism|social science)\b/i;

const DEADLINE_KEYWORDS = [
  'deadline',
  'last date',
  'last day',
  'apply by',
  'application due',
  'applications due',
  'closing date',
  'closes on',
  'close on',
  'applications close',
  'application date',
];

const MONTHS =
  'january|february|march|april|may|june|july|august|september|october|november|december|' +
  'jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec';

const DATE_PATTERNS: RegExp[] = [
  new RegExp(`\\b\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?(?:${MONTHS})\\.?,?\\s+\\d{4}\\b`, 'i'),
  new RegExp(`\\b(?:${MONTHS})\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?,?\\s+\\d{4}\\b`, 'i'),
  /\b\d{4}-\d{2}-\d{2}\b/,
  /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/,
  // day + month without a year (very common on UK department pages)
  new RegExp(`\\b\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?(?:${MONTHS})\\.?\\b`, 'i'),
  new RegExp(`\\b(?:${MONTHS})\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?(?!\\d)\\b`, 'i'),
];

const OPEN_PATTERNS: RegExp[] = [
  /applications?\s+(?:for\b[^.]{0,50}?)?\s*(?:are\s+)?(?:currently\s+|now\s+)?open/i,
  /open\s+for\s+applications/i,
  /accepting\s+applications/i,
  /now\s+accepting/i,
  /apply\s+(?:now|online|today)/i,
  /start\s+your\s+application/i,
  /you\s+can\s+apply/i,
  /apply\s+for\s+(?:this|our|the|a)\s+(?:course|program|programme|degree|master|study)/i,
  /applications?\s+(?:for\b[^.]{0,50}?)?\s*(?:are\s+)?welcome/i,
  /admissions?\s+(?:are\s+)?open/i,
];

const CLOSED_PATTERNS: RegExp[] = [
  /applications?\s+(?:for\b[^.]{0,50}?)?\s*(?:are\s+)?(?:currently\s+|now\s+)?closed/i,
  /closed\s+for\s+applications/i,
  /no\s+longer\s+accepting\s+(?:applications|applicants)/i,
  /we\s+are\s+not\s+accepting/i,
  /applications?\s+have\s+closed/i,
  /application\s+deadline\s+(?:has\s+)?passed/i,
  /admissions?\s+(?:are\s+)?closed/i,
];

const JUNK_NAME: RegExp[] = [
  /^(jump to|skip to|main content|toggle|log ?in|sign in|sign up|register|back to top|share|print|close|expand|collapse|cookie|accept cookies|menu|search)\b/i,
  /^(about|contact|careers|news|events?|jobs|vacanc|privacy|cookies|sitemap|accessibility|library|libraries|sports?|alumni|shop|donate|partners|press|feedback|governance|freedom of information)\b/i,
  /^(book an? open day|open days?|campus tour|visit us|visit|clearing|accommodation|term dates|student life|how to apply|apply now|prospectus|course finder|find a course|search|we also recommend|popular searches|additional links|information for|social media)\b/i,
  /^(apply|application|admissions?|postgraduate courses|undergraduate courses|graduate courses|short(?:[- ]term)? courses|part[- ]time courses|fees|funding|fees and funding|scholarships?|open (day|evening)|events?|course (search|list|finder|comparison)|explore courses|study (with us|abroad|locally)|choose (us|your)|why (study|choose)|find (a )?(course|supervisor|people)|research (opportunities|students?|degrees?)|international (students?|fees|admission)|english language|accommodation|sport|student (life|services|support)|alumni|employers?|news)\b/i,
  /^(bachelor|master|undergraduate|postgraduate|graduate|phd|m\.?sc|b\.?sc) (funding|scholarships?|events?|open day|fees|fees and funding|application|applications|prospectus|guide|handbook)\b/i,
  /^(support for|working with|living in|your .*experience|student (experience|services|support|life)|postgrad(eraduate)? life|courses? a-?z|why (choose|study))\b/i,
  /^(office|offices|office of|registrar|dean|head of|admin(istration)?|it (support|services)|web team)\b/i,
  /^(colleges?|schools?|departments?|faculties|institutes?|centres?|centers?)\s*(,|&|and|\/|:|\|)/i,
  /^(view all|see all|browse|explore|search|find|compare|all)\b/i,
  /^(our|about|the (university|college|campus))\b/i,
  /\bsessions\b/i,
  /\bblogs?\b/i,
  /\bsummer schools?\b/i,
  /\bnewsletters?\b/i,
  /\b(?:student|business|career|research|learning|it|alumni) services\b/i,
  /\bservices$/i,
];

const OFFICE_NAME = /\boffices?\b|\bregistrar\b|\bdean'?s?\b/i;

const META_URL =
  /[\/-](apply|application|applications|admission|admissions|prospectus|events?|open[-_]?day|fees|funding|scholarship|scholarships|clearing|visit|course[-_]?search|search)(\/|\?|$)/i;

const BARE_LEVEL_NAME =
  /^(bachelor(?:'s|s)?|master(?:'s|s)?|post[-\s]?grad(?:uate)?s?|under[-\s]?graduate?s?|grad(?:uate)?s?|ph\.?\s?d|m\.?s\.?c|b\.?s\.?c)(?:\s+(?:programme?s?|programs?|degrees?|courses?|studies|study))?$/i;

const JUNK_URL =
  /[\/-](news|newsletter|events?|contact|about|careers|jobs|vacanc|librar|accommodation|clearing|open[-_]?day|visit|prospectus|login|sign[-_]?up|search|privacy|cookie|sitemap|social|sports?|alumni|shop|donate|feedback|terms|weather|parking|maps?|building|blogs?|features?|stories|articles?|summer[-_]?schools?|intranet|current[-_]?students)(\/|\?|$)/i;

const isJunkPath = (pathname: string): boolean => JUNK_URL.test(pathname) || META_URL.test(pathname);

const levelPathOk = (href: string, level: DegreeLevel): boolean => {
  let parsed: URL;
  try {
    parsed = new URL(href);
  } catch {
    return true;
  }
  const path = parsed.pathname;
  if ((level === 'masters' || level === 'phd') && /\/undergraduate([-_\/]|$)/i.test(path)) return false;
  if (level === 'bachelor' && /\/(postgraduatetaught|postgraduate-taught|masters)([-_\/]|$)/i.test(path)) {
    return false;
  }
  if (level !== 'phd') {
    if (/\/(doctoral|research-students)([-_\/]|$)/i.test(path)) return false;
    if (/(^|\.)doctoral/i.test(parsed.hostname)) return false;
  }
  return true;
};

const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^::1$/,
  /\.local$/i,
];

const BLOCKED_FILE_EXTENSIONS = /\.(pdf|docx?|xlsx?|pptx?|zip|rar|jpg|jpeg|png|gif|svg|css|js|mp[34]|avi|mov)(\?|$)/i;
const BLOCKED_HOST_HINTS = [
  'facebook.com',
  'twitter.com',
  'x.com/',
  'instagram.com',
  'linkedin.com',
  'youtube.com',
  'tiktok.com',
  'wa.me',
  'web.whatsapp',
  'wiki.',
];

export interface ScrapeResult {
  universityName: string;
  homepage: string;
  degreeLevel: DegreeLevel;
  scannedPages: number;
  results: ScrapedProgram[];
}

export class ScrapeError extends Error {}

/* -------------------------------------------------------------
 * Helpers
 * ----------------------------------------------------------- */
const cleanText = (value: string): string => value.replace(/\s+/g, ' ').trim();

function isBlockedHost(hostname: string): boolean {
  return BLOCKED_HOST_PATTERNS.some((p) => p.test(hostname));
}

function normalizeUrl(raw: string): string {
  let url = raw.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  const parsed = new URL(url);
  parsed.hash = '';
  return parsed.toString();
}

function safeHostname(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (isBlockedHost(u.hostname)) return null;
    return u.hostname;
  } catch {
    return null;
  }
}

function stripHash(url: string): string {
  try {
    const u = new URL(url);
    u.hash = '';
    return u.toString().replace(/\/$/, '');
  } catch {
    return url.replace(/\/$/, '');
  }
}

/** Same site (exact host or a subdomain of it), ignoring a leading www. */
function onSameSite(rawUrl: string, siteKey: string): boolean {
  try {
    const host = new URL(rawUrl).hostname.replace(/^www\./, '');
    return host === siteKey || host.endsWith(`.${siteKey}`);
  } catch {
    return false;
  }
}

function stableId(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function matchesLevel(text: string, level: DegreeLevel): boolean {
  return LEVEL_MATCHERS[level].some((re) => re.test(text));
}

function matchesAnyLevel(text: string): DegreeLevel | null {
  for (const level of ['phd', 'masters', 'bachelor'] as DegreeLevel[]) {
    if (matchesLevel(text, level)) return level;
  }
  return null;
}

function isJunkName(name: string): boolean {
  return OFFICE_NAME.test(name) || JUNK_NAME.some((re) => re.test(name));
}

/** Anchor text without svg/hidden noise. */
function textOf($: CheerioAPI, el: AnyNode): string {
  const clone = $(el).clone();
  clone.find('svg, script, style, noscript, .sr-only, .visually-hidden').remove();
  clone.find('[aria-hidden="true"]').remove();
  return cleanText(clone.text());
}

/** In chrome (nav, header, footer, sidebar) — used when extracting program names. */
function inChrome($: CheerioAPI, el: AnyNode): boolean {
  return $(el).closest('nav, header, footer, aside, [role="navigation"], [role="banner"], [role="contentinfo"]').length > 0;
}

type HttpResult = { kind: 'html'; html: string } | { kind: 'redirect'; location: string } | { kind: 'fail' };

/** Single GET on node:http/https — abrupt server closes resolve as null instead of crashing the process (undici assertion bug). */
function requestOnce(rawUrl: string): Promise<HttpResult> {
  return new Promise((resolve) => {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      resolve({ kind: 'fail' });
      return;
    }
    const transport = parsed.protocol === 'https:' ? https : parsed.protocol === 'http:' ? http : null;
    if (!transport) {
      resolve({ kind: 'fail' });
      return;
    }

    let settled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const finish = (result: HttpResult) => {
      if (settled) return;
      settled = true;
      for (const t of timers) clearTimeout(t);
      resolve(result);
    };

    const req = transport.get(
      parsed,
      {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          Connection: 'close',
        },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const location = res.headers.location;
        if (status >= 301 && status <= 308 && location) {
          res.resume();
          finish({ kind: 'redirect', location });
          return;
        }
        if (status < 200 || status >= 300) {
          res.destroy();
          finish({ kind: 'fail' });
          return;
        }
        const contentType = res.headers['content-type'] || '';
        if (contentType && !contentType.includes('html')) {
          res.destroy();
          finish({ kind: 'fail' });
          return;
        }

        const chunks: Buffer[] = [];
        let bytes = 0;
        res.on('data', (chunk: Buffer) => {
          bytes += chunk.length;
          chunks.push(chunk);
          if (bytes >= MAX_PAGE_BYTES) {
            finish({ kind: 'html', html: Buffer.concat(chunks).subarray(0, MAX_PAGE_BYTES).toString('utf8') });
            req.destroy();
            return;
          }
        });
        res.on('end', () => finish({ kind: 'html', html: Buffer.concat(chunks).toString('utf8') }));
        res.on('error', () => finish({ kind: 'fail' }));
        res.on('aborted', () => finish({ kind: 'fail' }));
      }
    );

    req.setTimeout(FETCH_TIMEOUT_MS, () => req.destroy());
    timers.push(setTimeout(() => req.destroy(), FETCH_TIMEOUT_MS * 2));
    req.on('error', () => finish({ kind: 'fail' }));
    req.on('close', () => finish({ kind: 'fail' }));
  });
}

async function fetchHtml(rawUrl: string): Promise<{ html: string; finalUrl: string } | null> {
  if (!safeHostname(rawUrl)) return null;
  const visited = new Set<string>();
  let current = rawUrl;
  for (let hop = 0; hop < 6; hop++) {
    if (!safeHostname(current) || visited.has(current)) return null;
    visited.add(current);
    const result = await requestOnce(current);
    if (result.kind === 'fail') return null;
    if (result.kind === 'html') return { html: result.html, finalUrl: current };
    try {
      current = new URL(result.location, current).toString();
    } catch {
      return null;
    }
  }
  return null;
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      results[idx] = await fn(items[idx]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/* -------------------------------------------------------------
 * Extraction
 * ----------------------------------------------------------- */
function extractUniversityName($: CheerioAPI): string {
  const uniqueParts = (value: string): string[] => {
    const parts = value
      .split(/\s*(?:\||–|—)\s*|\s+-\s+/)
      .map(cleanText)
      .filter(Boolean);
    const unique: string[] = [];
    for (const p of parts) {
      if (!unique.some((u) => u.toLowerCase() === p.toLowerCase())) unique.push(p);
    }
    return unique;
  };

  const isInstitution = (p: string) =>
    /university|college|institute|school of|faculty of|\btech\b|\buni\b/i.test(p) && p.length <= 70;

  const ogParts = uniqueParts($('meta[property="og:site_name"]').attr('content') || '');
  const titleParts = uniqueParts($('title').first().text());
  const h1 = cleanText($('h1').first().text());
  const pools = [ogParts, titleParts, h1 ? [h1] : []];

  for (const pool of pools) {
    const hit = pool.find(isInstitution);
    if (hit) return hit;
  }
  for (const pool of pools) {
    const hit = pool.find((p) => p.length > 3 && p.length <= 70);
    if (hit) return hit;
  }
  return '';
}

export function detectApplicationStatus(text: string): boolean | null {
  if (CLOSED_PATTERNS.some((re) => re.test(text))) return false;
  if (OPEN_PATTERNS.some((re) => re.test(text))) return true;
  return null;
}

const INTAKE_BEFORE =
  /(?:start\s+date|entry\s+date|course\s+start|teaching\s+start|intake|semester)\s*[:\-–—]?\s*$/i;
const INTAKE_AFTER = /^\s*(?:entry\b|for\s+entry\b|to\s+start\b)/i;

function intakeCue(s: string, start: number, len: number): boolean {
  const before = s.slice(Math.max(0, start - 40), start);
  const after = s.slice(start + len, start + len + 24);
  return INTAKE_BEFORE.test(before) || INTAKE_AFTER.test(after);
}

export function extractDeadline(input: string): string {
  const text = input.replace(/\s+/g, ' ');
  const collectDates = (s: string) => {
    const hits: { start: number; text: string }[] = [];
    for (const pattern of DATE_PATTERNS) {
      const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
      for (const m of s.matchAll(re)) hits.push({ start: m.index ?? 0, text: m[0] });
    }
    hits.sort((a, b) => a.start - b.start || b.text.length - a.text.length);
    const deduped: { start: number; text: string }[] = [];
    for (const h of hits) {
      const covered = deduped.some(
        (d) => h.start >= d.start && h.start + h.text.length <= d.start + d.text.length
      );
      if (!covered) deduped.push(h);
    }
    return deduped.filter((h) => !intakeCue(s, h.start, h.text.length));
  };

  const lower = text.toLowerCase();

  const pickDeadline = (window: string, extend?: () => string): string => {
    const hits = collectDates(window);
    if (hits.length === 0) return '';
    let pick = hits[0];
    for (let i = 0; i < hits.length; i++) {
      const after = window.slice(hits[i].start + hits[i].text.length);
      if (/^\s*(?:-|–|—|to|until|till|through)\s+\S/i.test(after)) {
        if (i + 1 < hits.length) {
          pick = hits[i + 1];
        } else if (extend) {
          const more = collectDates(extend());
          if (more.length > i + 1) pick = more[i + 1];
        }
        break;
      }
    }
    return pick.text;
  };

  for (const kw of DEADLINE_KEYWORDS) {
    let from = 0;
    for (;;) {
      const idx = lower.indexOf(kw, from);
      if (idx === -1) break;
      const start = Math.max(0, idx - 40);
      const window = text.slice(start, idx + 160);
      const picked = pickDeadline(window, () => text.slice(start, idx + 300));
      if (picked) return cleanText(picked);
      from = idx + kw.length;
      if (from > lower.length) break;
    }
  }
  const applyIdx = lower.search(/\bapply|application|admission/);
  if (applyIdx !== -1) {
    const window = text.slice(applyIdx, applyIdx + 220);
    const picked = pickDeadline(window, () => text.slice(applyIdx, applyIdx + 420));
    if (picked) return cleanText(picked);
  }
  return '';
}

/** Derive open/closed from a page-level deadline when no explicit status text exists. */
export function statusFromDeadline(deadline: string, now = new Date()): boolean | null {
  if (!deadline) return null;
  const parsed = Date.parse(deadline);
  if (Number.isNaN(parsed)) return null;
  const ms = now.getTime();
  if (parsed > ms) return true;
  if (parsed < ms - 30 * 86400000) return false;
  return null;
}

function extractSummary($: CheerioAPI, level: DegreeLevel): string {
  let best = '';
  $('p').each((_, el) => {
    if (best.length > 80) return;
    const text = cleanText($(el).text());
    if (text.length < 60 || text.length > 400) return;
    if (matchesLevel(text, level) || /program|degree|research|application|admission/i.test(text)) {
      if (!best) best = text;
    }
  });
  if (!best) {
    const meta = $('meta[name="description"]').attr('content');
    if (meta) best = cleanText(meta);
  }
  return best.slice(0, 260);
}

interface ProgramCandidate {
  name: string;
  url: string;
  context: string;
  confidence: number;
}

function collectHubLinks(
  $: CheerioAPI,
  baseUrl: string,
  siteKey: string
): { text: string; href: string; score: number }[] {
  const seen = new Set<string>();
  const links: { text: string; href: string; score: number }[] = [];

  $('a[href]').each((_, el) => {
    const rawHref = $(el).attr('href') || '';
    const text = textOf($, el).replace(/\s*[→»>]+\s*$/, '');
    if (!text || text.length < 3 || text.length > 140) return;
    if (/^(mailto:|tel:|javascript:)/i.test(rawHref)) return;

    let absolute: string;
    try {
      absolute = new URL(rawHref, baseUrl).toString();
    } catch {
      return;
    }
    if (!safeHostname(absolute)) return;
    if (!onSameSite(absolute, siteKey)) return;
    if (BLOCKED_FILE_EXTENSIONS.test(absolute)) return;
    if (BLOCKED_HOST_HINTS.some((hint) => absolute.toLowerCase().includes(hint))) return;

    const normalized = stripHash(absolute);
    if (seen.has(normalized)) return;
    seen.add(normalized);

    const haystack = `${text} ${absolute}`.toLowerCase();
    let score = 0;
    if (matchesAnyLevel(haystack)) score += 2;
    if (HUB_KEYWORDS.some((kw) => haystack.includes(kw))) score += 2;
    if (DEPARTMENT_LINK.test(text)) score += 3;
    if (JUNK_URL.test(new URL(absolute).pathname)) score -= 4;

    if (score > 0) links.push({ text, href: absolute, score });
  });

  return links;
}

function extractPrograms(
  $: CheerioAPI,
  pageUrl: string,
  level: DegreeLevel,
  siteKey: string
): ProgramCandidate[] {
  const candidates: ProgramCandidate[] = [];

  const resolve = (href: string): string | null => {
    try {
      const abs = new URL(href, pageUrl).toString();
      if (!safeHostname(abs)) return null;
      if (!onSameSite(abs, siteKey)) return null;
      if (BLOCKED_FILE_EXTENSIONS.test(abs)) return null;
      if (BLOCKED_HOST_HINTS.some((hint) => abs.toLowerCase().includes(hint))) return null;
      return abs;
    } catch {
      return null;
    }
  };

  const push = (rawName: string, url: string, context: string, confidence: number) => {
    let raw = cleanText(rawName)
      .replace(/^(?:[-•*]\s*)+/, '')
      .replace(/\s*[→»>]+\s*$/, '')
      .trim();
    if (raw.length > 40 && /\s\(.*\)$/.test(raw)) {
      raw = raw.replace(/\s*\(.*\)$/, '').trim();
    }
    if (raw.length < 4 || raw.length > 90) return;
    if (isJunkName(raw) || BARE_LEVEL_NAME.test(raw)) return;
    const name = raw
      .replace(/^(?:view|read|open)\s+(?:the|our|all)\s+/i, '')
      .replace(/\s+(?:programme|program|course|degree|module)\s+pages?$/i, '')
      .trim()
      .replace(/^./, (c) => c.toUpperCase());
    if (name.length < 4 || name.length > 70) return;
    if (isJunkName(name) || BARE_LEVEL_NAME.test(name)) return;
    if (/\bscholarships?\b|\bbursaries\b|\bstudentships\b|\bprizes?\b|\bfunding\b|\bfees\b/i.test(name)) return;
    const pathname = new URL(url).pathname;
    if (isJunkPath(pathname)) return;
    if (!levelPathOk(url, level)) return;
    candidates.push({ name, url, context, confidence });
  };

  const usableAnchor = (el: AnyNode): string | null => {
    if (inChrome($, el)) return null;
    const text = textOf($, el);
    if (!text || text.length < 4 || text.length > 100) return null;
    if (isJunkName(text)) return null;
    return text;
  };

  // Pass A — anchors that name the degree level directly (highest confidence)
  $('a[href]').each((_, el) => {
    const text = usableAnchor(el);
    if (!text || !matchesLevel(text, level)) return;
    const href = resolve($(el).attr('href') || '');
    if (!href) return;
    const context = cleanText($(el).parent().text()) || text;
    push(text, href, context, 3);
  });

  // Pass B — sections under a level heading: collect their content links
  $('h1, h2, h3, h4, h5').each((_, el) => {
    const heading = textOf($, el);
    if (!matchesLevel(heading, level)) return;

    let container = $(el).parent();
    for (let up = 0; up < 3 && container.length; up++) {
      const before = candidates.length;
      container.find('a[href]').each((__, linkEl) => {
        if (candidates.length - before >= 30) return;
        const text = usableAnchor(linkEl);
        if (!text) return;
        const otherLevel = matchesAnyLevel(text);
        if (otherLevel && otherLevel !== level) return;
        const href = resolve($(linkEl).attr('href') || '');
        if (!href) return;
        const looksLikeProgram = matchesLevel(text, level) || DEPARTMENT_LINK.test(text) || SUBJECT_NOUN.test(text);
        if (!looksLikeProgram) return;
        const context = cleanText($(linkEl).closest('li, tr, td, p, section, article').text()) || heading;
        push(text, href, context, 2);
      });
      if (candidates.length > before) return;
      const parent = container.parent();
      if (!parent.length || parent.is('body, html')) return;
      container = parent;
    }
  });

  // Pass C — list items / table rows about the level with a subject link
  $('li, tr').each((_, el) => {
    if (inChrome($, el)) return;
    const rowText = cleanText($(el).text());
    if (rowText.length < 8 || rowText.length > 500) return;
    if (!matchesLevel(rowText, level)) return;
    const links = $(el).find('a[href]').toArray();
    let picked: { name: string; url: string } | null = null;
    for (const linkEl of links) {
      if (picked) break;
      const text = usableAnchor(linkEl);
      if (!text) continue;
      const href = resolve($(linkEl).attr('href') || '');
      if (!href) continue;
      const strong = cleanText($(linkEl).closest('li, tr').find('strong, b, h2, h3, h4').first().text());
      const name = (strong && strong.length <= 100 ? strong : text) || text;
      if (!matchesAnyLevel(name) && !DEPARTMENT_LINK.test(name) && !SUBJECT_NOUN.test(name)) continue;
      picked = { name, url: href };
    }
    if (picked) push(picked.name, picked.url, rowText, 1);
  });

  return candidates;
}

/* -------------------------------------------------------------
 * Main entry
 * ----------------------------------------------------------- */
export async function scrapeUniversity(rawUrl: string, level: DegreeLevel): Promise<ScrapeResult> {
  let homepage: string;
  try {
    homepage = normalizeUrl(rawUrl);
  } catch {
    throw new ScrapeError('Please provide a valid university homepage URL.');
  }
  if (!safeHostname(homepage)) {
    throw new ScrapeError('That URL is not allowed. Use a public http(s) university homepage.');
  }

  const home = await fetchHtml(homepage);
  if (!home) {
    throw new ScrapeError('Could not load that homepage. Check the link and try again.');
  }

  const $home = cheerio.load(home.html);
  const fallbackHost = new URL(home.finalUrl).hostname.replace(/^www\./, '');
  const universityName = extractUniversityName($home) || fallbackHost;
  const homeSummary = extractSummary($home, level);
  const homeStatus = detectApplicationStatus($home.text());
  const homeDeadline = extractDeadline($home.text());

  const results: ScrapedProgram[] = [];
  const seenUrls = new Set<string>();
  const seenNames = new Set<string>();
  const scannedHubKeys = new Set<string>([stripHash(home.finalUrl).toLowerCase()]);

  const addResult = (
    name: string,
    url: string,
    deadline: string,
    status: boolean | null,
    summary: string,
    sourceUrl: string,
    isHubFallback = false
  ) => {
    if (results.length >= MAX_RESULTS) return;
    const urlKey = stripHash(url).toLowerCase();
    const nameKey = name.toLowerCase();
    if (seenUrls.has(urlKey) || seenNames.has(nameKey)) return;
    if (!isHubFallback && scannedHubKeys.has(urlKey)) return;
    seenUrls.add(urlKey);
    seenNames.add(nameKey);
    results.push({
      id: stableId(`${nameKey}|${urlKey}`),
      name,
      universityName,
      degreeLevel: level,
      url,
      deadline: deadline || homeDeadline,
      applicationOpen: status ?? statusFromDeadline(deadline),
      summary: summary || homeSummary,
      sourceUrl,
    });
  };

  const siteKey = fallbackHost;
  const startedAt = Date.now();
  const homepageKey = stripHash(home.finalUrl).toLowerCase();
  type HubLink = { text: string; href: string; score: number };
  const byScore = (a: HubLink, b: HubLink) => b.score - a.score;
  const isDeptLink = (l: HubLink) => DEPARTMENT_LINK.test(l.text);
  const linkKey = (href: string) => stripHash(href).toLowerCase();
  const filterFresh = (links: HubLink[]) =>
    links.filter((l) => {
      const key = linkKey(l.href);
      if (scannedHubKeys.has(key) || key === homepageKey) return false;
      return levelPathOk(l.href, level);
    });

  /** Department/faculty/school pages first, then a few general program hubs for discovery. */
  const splitCandidates = (links: HubLink[], deptLimit: number, hubLimit: number): HubLink[] => {
    const depts = links.filter(isDeptLink).sort(byScore);
    const deptKeys = new Set(depts.map((l) => linkKey(l.href)));
    const hubs = links.filter((l) => !deptKeys.has(linkKey(l.href))).sort(byScore);
    return [...depts.slice(0, deptLimit), ...hubs.slice(0, hubLimit)];
  };

  // 1) Discover department / faculty / program hub pages (departments first)
  const discoveredLinks: HubLink[] = filterFresh(collectHubLinks($home, home.finalUrl, siteKey));
  const candidates = splitCandidates(discoveredLinks, DEPT_CANDIDATE_LIMIT, HUB_CANDIDATE_LIMIT);
  for (const c of candidates) scannedHubKeys.add(linkKey(c.href));

  // 2) Programs listed directly on the homepage
  for (const p of extractPrograms($home, home.finalUrl, level, siteKey)) {
    addResult(
      p.name,
      p.url,
      extractDeadline(p.context),
      detectApplicationStatus(p.context) ?? homeStatus,
      p.context.length > 60 ? p.context.slice(0, 260) : homeSummary,
      home.finalUrl
    );
  }

  interface HubEntry {
    text: string;
    href: string;
    h1: string;
    status: boolean | null;
    deadline: string;
    summary: string;
    finalUrl: string;
    hadPrograms: boolean;
  }

  let scannedPages = 1;
  const hubEntries: HubEntry[] = [];

  const processHubPage = (
    candidate: { text: string; href: string },
    fetched: { html: string; finalUrl: string }
  ) => {
    scannedPages += 1;
    const $ = cheerio.load(fetched.html);
    const pageText = $.text();
    const pageStatus = detectApplicationStatus(pageText);
    const pageDeadline = extractDeadline(pageText);
    const pageSummary = extractSummary($, level);

    for (const l of filterFresh(collectHubLinks($, fetched.finalUrl, siteKey)).slice(0, 40)) {
      discoveredLinks.push(l);
    }

    const programs = extractPrograms($, fetched.finalUrl, level, siteKey).filter(
      (p) => stripHash(p.url).toLowerCase() !== homepageKey
    );

    const before = results.length;
    for (const p of programs) {
      addResult(
        p.name,
        p.url,
        extractDeadline(p.context) || pageDeadline,
        detectApplicationStatus(p.context) ?? pageStatus,
        p.context.length > 60 ? p.context.slice(0, 260) : pageSummary,
        fetched.finalUrl
      );
    }
    hubEntries.push({
      text: candidate.text,
      href: candidate.href,
      h1: cleanText($('h1').first().text()).replace(/([a-z])([A-Z])(?=[a-z])/g, '$1 $2'),
      status: pageStatus,
      deadline: pageDeadline,
      summary: pageSummary,
      finalUrl: fetched.finalUrl,
      hadPrograms: results.length > before,
    });
  };

  const fetchAndProcess = async (list: { text: string; href: string; score: number }[]) => {
    const pages = await mapPool(list, CONCURRENCY, async (candidate) => {
      const fetched = await fetchHtml(candidate.href);
      if (!fetched) return null;
      return { candidate, fetched };
    });
    for (const page of pages) {
      if (page) processHubPage(page.candidate, page.fetched);
    }
  };

  await fetchAndProcess(candidates);

  // 3) Second wave — crawl departmental links one level deeper when departments are still missing
  const departmentCount = () => results.filter((r) => DEPARTMENT_LINK.test(r.name)).length;
  if (departmentCount() < 6 && Date.now() - startedAt < 25000) {
    const queued = new Set<string>();
    const unique: HubLink[] = [];
    for (const l of discoveredLinks) {
      const key = linkKey(l.href);
      if (queued.has(key) || scannedHubKeys.has(key)) continue;
      queued.add(key);
      unique.push(l);
    }
    const depts = unique.filter(isDeptLink).sort(byScore).slice(0, WAVE2_LIMIT);
    const wave2 =
      depts.length >= 3
        ? depts
        : [...depts, ...unique.filter((l) => !isDeptLink(l)).sort(byScore).slice(0, WAVE2_LIMIT - depts.length)];
    for (const c of wave2) scannedHubKeys.add(linkKey(c.href));
    await fetchAndProcess(wave2);
  }

  // 4) Departments/faculties whose page listed no programs — still a valid department result
  for (const hub of hubEntries) {
    if (hub.hadPrograms && results.length > 0) continue;
    const hubPath = new URL(hub.href).pathname;
    if (isJunkPath(hubPath)) continue;
    if (!levelPathOk(hub.href, level)) continue;
    const thin = results.length < 3;
    const h1 = hub.h1;
    const heading = h1 && h1.length <= 70 && !isJunkName(h1) && (thin || !BARE_LEVEL_NAME.test(h1)) ? h1 : '';
    const name = heading || hub.text;
    if (!name || name.length > 70 || isJunkName(name)) continue;
    if (BARE_LEVEL_NAME.test(name) && !thin) continue;
    if (/\bscholarships?\b|\bbursaries\b|\bfunding\b|\bfees\b/i.test(name)) continue;
    const looksLikeDepartment =
      DEPARTMENT_LINK.test(name) ||
      SUBJECT_NOUN.test(name) ||
      matchesLevel(name, level) ||
      (thin && BARE_LEVEL_NAME.test(name));
    if (!looksLikeDepartment && results.length > 0) continue;
    addResult(name, hub.href, hub.deadline, hub.status, hub.summary, hub.finalUrl, true);
  }

  if (results.length === 0) {
    throw new ScrapeError(
      `No ${level === 'phd' ? 'PhD' : level === 'masters' ? "Master's" : "Bachelor's"} programs found. The site may block scrapers — open the homepage manually and check its Admissions/Departments pages.`
    );
  }

  // 5) Enrich results that still lack a status or deadline by reading their own page (budgeted).
  //    Taught programs get the enrichment budget before research-degree listings.
  const toEnrich = results
    .filter((r) => r.applicationOpen === null || !r.deadline)
    .sort((a, b) => Number(RESEARCH_NAME.test(a.name)) - Number(RESEARCH_NAME.test(b.name)))
    .slice(0, ENRICH_LIMIT);
  await mapPool(toEnrich, 3, async (r) => {
    if (Date.now() - startedAt > 35000) return;
    const key = linkKey(r.url);
    if (scannedHubKeys.has(key)) return;
    const page = await fetchHtml(r.url);
    if (!page) return;
    scannedHubKeys.add(key);
    scannedPages += 1;
    const $ = cheerio.load(page.html);
    const text = $.text();
    const status = detectApplicationStatus(text);
    const deadline = extractDeadline(text);
    if (status !== null) r.applicationOpen = status;
    if (!r.deadline && deadline) {
      r.deadline = deadline;
      if (r.applicationOpen === null) r.applicationOpen = statusFromDeadline(deadline);
    }
  });

  // Departmental pages first, then taught programs, then research degrees, then everything else
  const rankBand = (p: ScrapedProgram): number => {
    if (DEPARTMENT_LINK.test(p.name)) return 0;
    if (matchesLevel(p.name, level)) return RESEARCH_NAME.test(p.name) ? 2 : 1;
    if (SUBJECT_NOUN.test(p.name)) return 3;
    return 4;
  };
  results.sort((a, b) => {
    const band = rankBand(a) - rankBand(b);
    if (band !== 0) return band;
    const openA = a.applicationOpen === true ? 0 : a.applicationOpen === false ? 2 : 1;
    const openB = b.applicationOpen === true ? 0 : b.applicationOpen === false ? 2 : 1;
    if (openA !== openB) return openA - openB;
    const dlA = a.deadline ? 0 : 1;
    const dlB = b.deadline ? 0 : 1;
    if (dlA !== dlB) return dlA - dlB;
    return a.name.localeCompare(b.name);
  });

  return {
    universityName,
    homepage: home.finalUrl,
    degreeLevel: level,
    scannedPages,
    results,
  };
}
