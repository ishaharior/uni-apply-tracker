'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Check,
  CircleAlert,
  Compass,
  ExternalLink,
  Globe,
  Loader2,
  PlusCircle,
  RefreshCw,
  Search,
  Server,
} from 'lucide-react';
import { DEGREE_LEVELS, DegreeLevel, ScrapeResponse, ScrapedProgram } from '@/types';

type AddState = 'idle' | 'adding' | 'added' | 'error';

const levelLabel = (level: DegreeLevel) =>
  DEGREE_LEVELS.find((l) => l.value === level)?.label ?? 'Programs';

function StatusChip({ open }: { open: boolean | null }) {
  if (open === true) {
    return (
      <span
        className="xl-chip"
        style={{
          color: '#34d399',
          background: 'rgba(16,185,129,0.1)',
          borderColor: 'rgba(16,185,129,0.35)',
          whiteSpace: 'nowrap',
        }}
      >
        Applications open
      </span>
    );
  }
  if (open === false) {
    return (
      <span
        className="xl-chip"
        style={{
          color: '#fca5a5',
          background: 'rgba(239,68,68,0.1)',
          borderColor: 'rgba(239,68,68,0.35)',
          whiteSpace: 'nowrap',
        }}
      >
        Closed
      </span>
    );
  }
  return (
    <span
      className="xl-chip"
      style={{
        color: '#fde68a',
        background: 'rgba(251,191,36,0.1)',
        borderColor: 'rgba(251,191,36,0.35)',
        whiteSpace: 'nowrap',
      }}
    >
      Status unknown
    </span>
  );
}

function DiscoverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [url, setUrl] = useState(() => searchParams.get('u') ?? '');
  const [level, setLevel] = useState<DegreeLevel>(() => {
    const l = searchParams.get('level');
    return l === 'bachelor' || l === 'phd' || l === 'masters' ? l : 'masters';
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ScrapeResponse | null>(null);
  const [existingKeys, setExistingKeys] = useState<Set<string>>(new Set());
  const [existingLinks, setExistingLinks] = useState<Set<string>>(new Set());
  const [addStates, setAddStates] = useState<Record<string, AddState>>({});

  const runSearch = useCallback(
    async (targetUrl: string, targetLevel: DegreeLevel) => {
      const trimmed = targetUrl.trim();
      if (!trimmed) {
        setError('No homepage link provided. Search again below.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      setResult(null);
      setAddStates({});
      try {
        const res = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmed, level: targetLevel }),
        });
        if (res.status === 401) {
          router.replace('/login');
          return;
        }
        const json: ScrapeResponse = await res.json();
        if (json.success) {
          setResult(json);
        } else {
          setError(json.error || 'Scraping failed. Please try again.');
        }
      } catch {
        setError('Could not reach the server. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  // Know what is already tracked so we do not offer duplicates
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/data');
        if (res.status === 401) {
          router.replace('/login');
          return;
        }
        const json = await res.json();
        if (cancelled || !json.success) return;
        const courses = json.data?.mastersCourses ?? [];
        setExistingKeys(
          new Set(
            courses.map((c: { universityName: string; departmentName: string }) =>
              `${c.universityName.toLowerCase().trim()}|${c.departmentName.toLowerCase().trim()}`
            )
          )
        );
        setExistingLinks(
          new Set(
            courses
              .map((c: { applicationLink?: string }) => (c.applicationLink || '').replace(/\/$/, '').toLowerCase())
              .filter(Boolean)
          )
        );
      } catch {
        // non-fatal — duplicate detection simply stays empty
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    runSearch(url, level);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const results = useMemo(() => result?.results ?? [], [result]);

  const keyFor = (p: ScrapedProgram) =>
    `${p.universityName.toLowerCase().trim()}|${p.name.toLowerCase().trim()}`;

  const isExisting = (p: ScrapedProgram) =>
    existingKeys.has(keyFor(p)) || existingLinks.has(p.url.replace(/\/$/, '').toLowerCase());

  const addToMasters = async (p: ScrapedProgram) => {
    setAddStates((s) => ({ ...s, [p.id]: 'adding' }));
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_MASTERS_COURSE',
          payload: {
            universityName: p.universityName,
            departmentName: p.name,
            ieltsReq: '',
            lastDate: p.deadline,
            applicationLink: p.url,
            visibility: 'private',
            description: [
              `${levelLabel(p.degreeLevel)} program discovered from ${p.sourceUrl}`,
              p.summary ? `— ${p.summary}` : '',
            ]
              .filter(Boolean)
              .join(' '),
          },
        }),
      });
      if (res.status === 401) {
        router.replace('/login');
        return;
      }
      const json = await res.json();
      if (json.success) {
        setExistingKeys((prev) => new Set(prev).add(keyFor(p)));
        setExistingLinks((prev) => new Set(prev).add(p.url.replace(/\/$/, '').toLowerCase()));
        setAddStates((s) => ({ ...s, [p.id]: 'added' }));
      } else {
        setAddStates((s) => ({ ...s, [p.id]: 'error' }));
      }
    } catch {
      setAddStates((s) => ({ ...s, [p.id]: 'error' }));
    }
  };

  const resubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    router.replace(`/discover?u=${encodeURIComponent(trimmed)}&level=${level}`);
    runSearch(trimmed, level);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main, #000)' }}>
      {/* Top bar */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: '#050506',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push('/')}
              style={{ fontSize: '0.78rem', padding: '6px 10px' }}
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
            <div>
              <h1 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0 }}>
                Program <span className="brand-text">Discovery</span>
              </h1>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                Intelligent results scraped from the university website
              </p>
            </div>
          </div>
          <span className="xl-chip" style={{ color: '#7dd3fc', borderColor: 'rgba(56,189,248,0.35)', background: 'rgba(56,189,248,0.1)' }}>
            <Compass size={12} /> {levelLabel(level)}
          </span>
        </div>
      </header>

      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '14px 16px 48px', width: '100%' }}>
        {/* Refine search */}
        <div className="glass-panel" style={{ padding: '12px', marginBottom: '14px' }}>
          <form
            onSubmit={resubmit}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              alignItems: 'flex-end',
            }}
          >
            <div style={{ flex: '1 1 240px', minWidth: 0 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '3px',
                }}
              >
                University Homepage
              </label>
              <input
                className="input-field"
                type="text"
                inputMode="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.your-university.edu"
                style={{ cursor: 'text' }}
              />
            </div>
            <div style={{ flex: '0 1 180px', minWidth: 0 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '3px',
                }}
              >
                Degree Level
              </label>
              <select
                className="input-field"
                value={level}
                onChange={(e) => setLevel(e.target.value as DegreeLevel)}
                style={{ cursor: 'pointer' }}
              >
                {DEGREE_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ fontSize: '0.78rem', padding: '7px 14px', height: '34px', flex: '0 0 auto' }}
            >
              {loading ? <Loader2 size={14} className="spin" /> : <Search size={14} />}
              <span>Search</span>
            </button>
          </form>
        </div>

        {/* Summary strip */}
        {result && !loading && (
          <div
            className="glass-panel animate-fade-in"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '14px',
              alignItems: 'center',
              padding: '10px 12px',
              marginBottom: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px' }}>
              <Building2 size={16} color="#fbbf24" />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {result.universityName}
                </div>
                <a
                  href={result.homepage}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '0.7rem', color: '#7dd3fc', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Globe size={11} /> {result.homepage}
                </a>
              </div>
            </div>
            <span className="xl-chip" style={{ color: '#c7d2fe', borderColor: 'rgba(129,140,248,0.35)', background: 'rgba(99,102,241,0.12)' }}>
              <Server size={12} /> {result.scannedPages} page{result.scannedPages === 1 ? '' : 's'} scanned
            </span>
            <span className="xl-chip" style={{ color: '#fde68a', borderColor: 'rgba(251,191,36,0.35)', background: 'rgba(251,191,36,0.1)' }}>
              {results.length} program{results.length === 1 ? '' : 's'} found
            </span>
            <span className="xl-chip" style={{ color: '#d8b4fe', borderColor: 'rgba(168,85,247,0.35)', background: 'rgba(168,85,247,0.12)' }}>
              {levelLabel(level)}
            </span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="glass-panel" style={{ padding: '40px 16px', textAlign: 'center' }}>
            <Loader2 size={26} className="spin" color="#38bdf8" />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '12px 0 4px', fontWeight: 600 }}>
              Crawling {url || 'the university website'}…
            </p>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>
              Reading the homepage, following department &amp; faculty links, extracting deadlines and application
              status for {levelLabel(level)} programs
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="glass-panel" style={{ padding: '24px 16px', textAlign: 'center' }}>
            <CircleAlert size={26} color="#fca5a5" />
            <p style={{ fontSize: '0.85rem', color: '#fca5a5', margin: '10px 0 4px', fontWeight: 600 }}>{error}</p>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0 0 14px' }}>
              Tip: use the official homepage link (not a PDF) — many sites expose Admissions or Departments pages from
              their front page.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => runSearch(url, level)}
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Results */}
        {!loading && !error && results.length > 0 && (
          <div
            className="animate-fade-in"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
              gap: '10px',
            }}
          >
            {results.map((program) => {
              const state = addStates[program.id];
              const already = isExisting(program);
              const buttonLabel = already
                ? 'In your Master’s list'
                : state === 'added'
                  ? 'Added to Master’s Programs'
                  : state === 'adding'
                    ? 'Adding…'
                    : state === 'error'
                      ? 'Failed — retry'
                      : 'Add to Master’s Programs';
              return (
                <div
                  key={program.id}
                  className="glass-panel"
                  style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {program.name}
                    </div>
                    <StatusChip open={program.applicationOpen} />
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    <span className="xl-chip" style={{ color: '#fde68a', borderColor: 'rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.08)' }}>
                      <Building2 size={11} /> {program.universityName}
                    </span>
                    <span
                      className="xl-chip"
                      style={{
                        color: program.deadline ? '#fda4af' : 'var(--text-muted)',
                        borderColor: program.deadline ? 'rgba(244,63,94,0.3)' : 'var(--border-subtle)',
                        background: program.deadline ? 'rgba(244,63,94,0.08)' : 'transparent',
                      }}
                    >
                      <CalendarClock size={11} /> {program.deadline || 'No deadline found'}
                    </span>
                  </div>

                  {program.summary && (
                    <p
                      style={{
                        fontSize: '0.74rem',
                        color: 'var(--text-secondary)',
                        margin: 0,
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {program.summary}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className={already || state === 'added' ? 'btn btn-secondary' : 'btn btn-primary'}
                      onClick={() => addToMasters(program)}
                      disabled={already || state === 'added' || state === 'adding'}
                      style={{ fontSize: '0.74rem', padding: '5px 10px', flex: '1 1 auto' }}
                      title={
                        already
                          ? 'Already tracked in your Master’s Programs section'
                          : 'Save this program into your Master’s Programs section'
                      }
                    >
                      {already || state === 'added' ? (
                        <>
                          <Check size={13} /> <span>{buttonLabel}</span>
                        </>
                      ) : state === 'adding' ? (
                        <>
                          <Loader2 size={13} className="spin" /> <span>{buttonLabel}</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle size={13} /> <span>{buttonLabel}</span>
                        </>
                      )}
                    </button>
                    <a
                      href={program.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.74rem', padding: '5px 10px' }}
                      title="Open the program page"
                    >
                      <ExternalLink size={13} />
                      <span>Open</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <p
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
              textAlign: 'center',
              margin: '16px 0 0',
            }}
          >
            Added programs land in the <strong style={{ color: '#fde68a' }}>Master&apos;s Courses</strong> tab (private
            by default — flip the share button there to make them public).
          </p>
        )}
      </main>
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={26} className="spin" color="#38bdf8" />
        </div>
      }
    >
      <DiscoverContent />
    </Suspense>
  );
}
