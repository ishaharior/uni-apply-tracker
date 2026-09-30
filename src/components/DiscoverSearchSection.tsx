'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Search, Link2 } from 'lucide-react';
import { DEGREE_LEVELS, DegreeLevel } from '@/types';

export default function DiscoverSearchSection() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [level, setLevel] = useState<DegreeLevel>('masters');
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Paste the university homepage link first.');
      return;
    }
    if (!/^(https?:\/\/)?[\w-]+(\.[\w-]+)+/.test(trimmed)) {
      setError('That does not look like a valid homepage URL.');
      return;
    }
    setError('');
    router.push(`/discover?u=${encodeURIComponent(trimmed)}&level=${level}`);
  };

  return (
    <div className="glass-panel" style={{ padding: '12px', marginBottom: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <Compass size={16} color="#38bdf8" />
        <div>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Discover Programs from a University Website
          </h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '1px 0 0' }}>
            Paste a university homepage, pick a degree level — we&apos;ll crawl its departments and pull programs with
            links, application status &amp; deadlines
          </p>
        </div>
      </div>

      <form
        onSubmit={submit}
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
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.68rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '3px',
            }}
          >
            <Link2 size={11} /> University Homepage Link *
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
          style={{ fontSize: '0.78rem', padding: '7px 14px', height: '34px', flex: '0 0 auto' }}
        >
          <Search size={14} />
          <span>Search</span>
        </button>
      </form>

      {error && (
        <p style={{ fontSize: '0.72rem', color: '#fca5a5', margin: '8px 0 0' }}>{error}</p>
      )}
    </div>
  );
}
