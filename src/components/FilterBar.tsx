'use client';

import React from 'react';
import { FilterOptions, OutreachStatusType } from '@/types';
import { Search, Clock, X } from 'lucide-react';

interface FilterBarProps {
  filters: FilterOptions;
  onChangeFilters: (filters: FilterOptions) => void;
  countries: string[];
  totalFilteredProfessors: number;
}

export default function FilterBar({
  filters,
  onChangeFilters,
  countries,
  totalFilteredProfessors,
}: FilterBarProps) {
  const update = (partial: Partial<FilterOptions>) => {
    onChangeFilters({ ...filters, ...partial });
  };

  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.country !== 'all' ||
    filters.statusFilter !== 'all' ||
    filters.visibility !== 'all' ||
    filters.needsFollowUp;

  const resetFilters = () => {
    onChangeFilters({
      searchQuery: '',
      country: 'all',
      statusFilter: 'all',
      needsFollowUp: false,
      degreeLevel: 'all',
      visibility: 'all',
    });
  };

  return (
    <div
      className="glass-panel"
      style={{ padding: '8px 10px', marginBottom: '12px' }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
          <Search
            size={14}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="input-field"
            placeholder="Search university, professor, research area..."
            value={filters.searchQuery}
            onChange={(e) => update({ searchQuery: e.target.value })}
            style={{ paddingLeft: '30px', height: '32px', fontSize: '0.8rem' }}
          />
          {filters.searchQuery && (
            <button
              onClick={() => update({ searchQuery: '' })}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                color: 'var(--text-muted)',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          {/* Country Filter */}
          <select
            className="input-field"
            value={filters.country}
            onChange={(e) => update({ country: e.target.value })}
            style={{ width: 'auto', height: '32px', paddingRight: '26px', fontSize: '0.78rem' }}
          >
            <option value="all">🌐 All Countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Visibility Filter */}
          <select
            className="input-field"
            value={filters.visibility}
            onChange={(e) => update({ visibility: e.target.value as FilterOptions['visibility'] })}
            style={{ width: 'auto', height: '32px', paddingRight: '26px', fontSize: '0.78rem' }}
            title="Filter professors by visibility"
          >
            <option value="all">👥 All Visibility</option>
            <option value="public">🌐 Public</option>
            <option value="private">🔒 My Private</option>
          </select>

          {/* Status Filter (my statuses only) */}
          <select
            className="input-field"
            value={filters.statusFilter}
            onChange={(e) => update({ statusFilter: e.target.value as OutreachStatusType | 'all' })}
            style={{ width: 'auto', height: '32px', paddingRight: '26px', fontSize: '0.78rem' }}
          >
            <option value="all">📊 All My Statuses</option>
            <option value="positive">⭐ Positive Reply</option>
            <option value="interview">🤝 Meeting / Interview</option>
            <option value="emailed">📤 Emailed (Awaiting)</option>
            <option value="drafting">📝 Drafting</option>
            <option value="applied">🎯 Applied</option>
            <option value="accepted">🏆 Accepted</option>
            <option value="not_contacted">⚪ Not Contacted</option>
          </select>

          {/* Overdue Follow-ups Toggle */}
          <button
            type="button"
            onClick={() => update({ needsFollowUp: !filters.needsFollowUp })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              height: '32px',
              padding: '0 10px',
              borderRadius: 'var(--radius-sm)',
              background: filters.needsFollowUp ? 'rgba(244, 63, 94, 0.18)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${filters.needsFollowUp ? '#f43f5e' : 'var(--border-subtle)'}`,
              color: filters.needsFollowUp ? '#fda4af' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            <Clock size={13} color={filters.needsFollowUp ? '#f43f5e' : 'var(--text-muted)'} />
            <span>Overdue (&gt;7d)</span>
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="btn btn-secondary"
              style={{ height: '32px', padding: '0 10px', fontSize: '0.75rem' }}
            >
              <X size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>

        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {totalFilteredProfessors} professor{totalFilteredProfessors === 1 ? '' : 's'} shown
        </span>
      </div>
    </div>
  );
}
