import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { DegreeLevel, ScrapedProgram } from '@/types';

const FETCH_TIMEOUT_MS = 12000;
const MAX_CANDIDATE_PAGES = 14;
const MAX_RESULTS = 40;
const CONCURRENCY = 4;
const MAX_PAGE_BYTES = 3_000_000;
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
];

const OPEN_PATTERNS: RegExp[] = [
  /applications?\s+(?:are\s+)?(?:currently\s+|now\s+)?open/i,
  /open\s+for\s+applications/i,
  /accepting\s+applications/i,
  /now\s+accepting/i,
  /apply\s+(?:now|online|today)/i,
  /admissions?\s+(?:are\s+)?open/i,
];

const CLOSED_PATTERNS: RegExp[] = [
  /applications?\s+(?:are\s+)?(?:currently\s+|now\s+)?closed/i,
  /closed\s+for\s+applications/i,
  /no\s+longer\s+accepting\s+(?:applications|applicants)/i,
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
];

const META_URL =
  /\/(apply|application|applications|admission|admissions|prospectus|events?|open[-_]?day|fees|funding|scholarship|scholarships|clearing|visit|course[-_]?search|search)(\/|\?|$)/i;

const BARE_LEVEL_NAME =
  /^(bachelor(?:'s|s)?|master(?:'s|s)?|post[-\s]?grad(?:uate)?s?|under[-\s]?graduate?s?|grad(?:uate)?s?|ph\.?\s?d|m\.?s\.?c|b\.?s\.?c)(?:\s+(?:programme?s?|programs?|degrees?|courses?|studies|study))?$/i;

const JUNK_URL =
  /\/(news|events?|contact|about|careers|jobs|vacanc|librar|accommodation|clearing|open[-_]?day|visit|prospectus|login|sign[-_]?up|search|privacy|cookie|sitemap|social|sports?|alumni|shop|donate|feedback|terms|weather|parking|maps?|building)(\/|\?|$)/i;

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
  return JUNK_NAME.some((re) => re.test(name));
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

async function fetchHtml(rawUrl: string): Promise<{ html: string; finalUrl: string } | null> {
  if (!safeHostname(rawUrl)) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(rawUrl, {
      signal: controller.signal,
      redirect: 'follow',
      cache: 'no-store',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!res.ok) return null;
    const finalUrl = res.url || rawUrl;
    if (!safeHostname(finalUrl)) return null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType && !contentType.includes('html')) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength > MAX_PAGE_BYTES) {
      return { html: buffer.subarray(0, MAX_PAGE_BYTES).toString('utf8'), finalUrl };
    }
    return { html: buffer.toString('utf8'), finalUrl };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
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

export function extractDeadline(text: string): string {
  const lower = text.toLowerCase();
  for (const kw of DEADLINE_KEYWORDS) {
    let from = 0;
    for (;;) {
      const idx = lower.indexOf(kw, from);
      if (idx === -1) break;
      const window = text.slice(Math.max(0, idx - 40), idx + 160);
      for (const pattern of DATE_PATTERNS) {
        const match = window.match(pattern);
        if (match) return cleanText(match[0]);
      }
      from = idx + kw.length;
      if (from > lower.length) break;
    }
  }
  const applyIdx = lower.search(/\bapply|application|admission/);
  if (applyIdx !== -1) {
    const window = text.slice(applyIdx, applyIdx + 220);
    for (const pattern of DATE_PATTERNS) {
      const match = window.match(pattern);
      if (match) return cleanText(match[0]);
    }
  }
  return '';
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
      return abs;
    } catch {
      return null;
    }
  };

  const push = (rawName: string, url: string, context: string, confidence: number) => {
    let name = cleanText(rawName)
      .replace(/^(?:[-•*]\s*)+/, '')
      .replace(/\s*[→»>]+\s*$/, '')
      .trim();
    if (name.length > 40 && /\s\(.*\)$/.test(name)) name = name.replace(/\s*\(.*\)$/, '').trim();
    if (name.length < 4 || name.length > 70) return;
    if (isJunkName(name)) return;
    if (BARE_LEVEL_NAME.test(name)) return;
    if (/\bscholarships?\b|\bbursaries\b|\bstudentships\b|\bprizes?\b|\bfunding\b|\bfees\b/i.test(name)) return;
    const pathname = new URL(url).pathname;
    if (JUNK_URL.test(pathname) || META_URL.test(pathname)) return;
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
      applicationOpen: status ?? homeStatus,
      summary: summary || homeSummary,
      sourceUrl,
    });
  };

  // 1) Discover department / faculty / program hub pages (departments first)
  const siteKey = fallbackHost;
  const startedAt = Date.now();
  const homepageKey = stripHash(home.finalUrl).toLowerCase();

  const pickCandidates = (html: string, pageUrl: string, limit: number) =>
    collectHubLinks(cheerio.load(html), pageUrl, siteKey)
      .filter((l) => !scannedHubKeys.has(stripHash(l.href).toLowerCase()))
      .filter((l) => stripHash(l.href).toLowerCase() !== homepageKey)
      .sort((a, b) => {
        const deptA = DEPARTMENT_LINK.test(a.text) ? 1 : 0;
        const deptB = DEPARTMENT_LINK.test(b.text) ? 1 : 0;
        if (deptA !== deptB) return deptB - deptA;
        return b.score - a.score;
      })
      .slice(0, limit);

  const candidates = pickCandidates(home.html, home.finalUrl, MAX_CANDIDATE_PAGES);
  for (const c of candidates) scannedHubKeys.add(stripHash(c.href).toLowerCase());

  // 2) Programs listed directly on the homepage
  for (const p of extractPrograms($home, home.finalUrl, level, siteKey)) {
    addResult(
      p.name,
      p.url,
      extractDeadline(p.context),
      detectApplicationStatus(p.context),
      p.context.length > 60 ? p.context.slice(0, 260) : homeSummary,
      home.finalUrl
    );
  }

  interface HubEntry {
    text: string;
    href: string;
    html: string;
    finalUrl: string;
    hadPrograms: boolean;
  }

  let scannedPages = 1;
  const hubEntries: HubEntry[] = [];
  const scannedDocs: { html: string; finalUrl: string }[] = [{ html: home.html, finalUrl: home.finalUrl }];

  const processHubPage = (
    candidate: { text: string; href: string },
    fetched: { html: string; finalUrl: string }
  ) => {
    scannedPages += 1;
    scannedDocs.push({ html: fetched.html, finalUrl: fetched.finalUrl });
    const $ = cheerio.load(fetched.html);
    const pageText = $.text();
    const pageStatus = detectApplicationStatus(pageText);
    const pageDeadline = extractDeadline(pageText);
    const pageSummary = extractSummary($, level);

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
      html: fetched.html,
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

  // 3) Second wave — crawl one level deeper when results are still thin
  if (results.length < 8 && Date.now() - startedAt < 25000) {
    const more: { text: string; href: string; score: number }[] = [];
    const queued = new Set<string>();
    for (const doc of scannedDocs) {
      for (const l of pickCandidates(doc.html, doc.finalUrl, 40)) {
        const key = stripHash(l.href).toLowerCase();
        if (queued.has(key)) continue;
        queued.add(key);
        more.push(l);
      }
    }
    more.sort((a, b) => {
      const deptA = DEPARTMENT_LINK.test(a.text) ? 1 : 0;
      const deptB = DEPARTMENT_LINK.test(b.text) ? 1 : 0;
      if (deptA !== deptB) return deptB - deptA;
      return b.score - a.score;
    });
    const wave2 = more.slice(0, 6);
    for (const c of wave2) scannedHubKeys.add(stripHash(c.href).toLowerCase());
    await fetchAndProcess(wave2);
  }

  // 4) Departments/faculties whose page listed no programs — still a valid department result
  for (const hub of hubEntries) {
    if (hub.hadPrograms && results.length > 0) continue;
    const $hub = cheerio.load(hub.html);
    const h1 = cleanText($hub('h1').first().text());
    const heading = h1 && h1.length <= 70 && !isJunkName(h1) && !BARE_LEVEL_NAME.test(h1) ? h1 : '';
    const name = heading || hub.text;
    if (!name || name.length > 70 || BARE_LEVEL_NAME.test(name) || isJunkName(name)) continue;
    if (/\bscholarships?\b|\bbursaries\b|\bfunding\b|\bfees\b/i.test(name)) continue;
    const looksLikeDepartment =
      DEPARTMENT_LINK.test(name) ||
      SUBJECT_NOUN.test(name) ||
      matchesLevel(name, level) ||
      /school|faculty|department/i.test(name);
    if (!looksLikeDepartment && results.length > 0) continue;
    const text = $hub.text();
    addResult(name, hub.href, extractDeadline(text), detectApplicationStatus(text), extractSummary($hub, level), hub.finalUrl, true);
  }

  if (results.length === 0) {
    throw new ScrapeError(
      `No ${level === 'phd' ? 'PhD' : level === 'masters' ? "Master's" : "Bachelor's"} programs found. The site may block scrapers — open the homepage manually and check its Admissions/Departments pages.`
    );
  }

  results.sort((a, b) => {
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
