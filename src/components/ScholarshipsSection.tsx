'use client';

import React, { useState } from 'react';
import { Scholarship, User } from '@/types';
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  Globe,
  Lock,
  ExternalLink,
  X,
} from 'lucide-react';

interface ScholarshipsSectionProps {
  scholarships: Scholarship[];
  me: User;
  onSave: (data: Partial<Scholarship>, editingId?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggleVisibility: (scholarship: Scholarship) => Promise<void>;
}

interface ScholarshipForm {
  title: string;
  organization: string;
  degreeLevel: string;
  amount: string;
  deadline: string;
  country: string;
  applicationLink: string;
  description: string;
  visibility: 'public' | 'private';
}

const emptyForm: ScholarshipForm = {
  title: '',
  organization: '',
  degreeLevel: '',
  amount: '',
  deadline: '',
  country: '',
  applicationLink: '',
  description: '',
  visibility: 'private',
};

const AMBER = '#f59e0b';

export default function ScholarshipsSection({
  scholarships,
  me,
  onSave,
  onDelete,
  onToggleVisibility,
}: ScholarshipsSectionProps) {
  const [scope, setScope] = useState<'personal' | 'public'>('personal');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const visible =
    scope === 'personal'
      ? scholarships.filter((s) => s.isMine || s.ownerId === me.id)
      : scholarships.filter((s) => s.visibility === 'public');

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (scholarship: Scholarship) => {
    setEditingId(scholarship.id);
    setForm({
      title: scholarship.title,
      organization: scholarship.organization,
      degreeLevel: scholarship.degreeLevel,
      amount: scholarship.amount,
      deadline: scholarship.deadline,
      country: scholarship.country,
      applicationLink: scholarship.applicationLink,
      description: scholarship.description || '',
      visibility: scholarship.visibility === 'private' ? 'private' : 'public',
    });
    setFormOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await onSave(form, editingId ?? undefined);
      setFormOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    } finally {
      setSaving(false);
    }
  };

  const scopeBtn = (key: 'personal' | 'public', label: string, Icon: typeof Lock) => {
    const active = scope === key;
    return (
      <button
        type="button"
        onClick={() => setScope(key)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          height: '26px',
          padding: '0 10px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.72rem',
          fontWeight: 700,
          background: active ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255, 255, 255, 0.04)',
          border: `1px solid ${active ? AMBER : 'var(--border-subtle)'}`,
          color: active ? '#fde68a' : 'var(--text-secondary)',
        }}
      >
        <Icon size={12} />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="glass-panel" style={{ padding: '12px 12px', marginBottom: '14px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={16} color={AMBER} />
          <div>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Scholarship Programs
            </h2>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '1px 0 0' }}>
              {scope === 'personal'
                ? 'Your personal scholarships — flip any of them to Public to share with everyone'
                : 'Programs shared publicly by you and other users'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'inline-flex',
              gap: '4px',
              padding: '3px',
              background: '#0e0e12',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {scopeBtn('personal', 'Personal', Lock)}
            {scopeBtn('public', 'Public', Globe)}
          </div>
          <button
            type="button"
            className="btn btn-primary btn-glow"
            onClick={openAdd}
            style={{ fontSize: '0.78rem', padding: '5px 10px' }}
          >
            <Plus size={14} />
            <span>Add Scholarship</span>
          </button>
        </div>
      </div>

      {formOpen && (
        <form
          onSubmit={submit}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px',
            padding: '12px',
            marginBottom: '12px',
            background: '#0e0e12',
            border: `1px solid rgba(245, 158, 11, 0.25)`,
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.8rem', color: AMBER }}>
              {editingId ? 'Edit Scholarship' : 'New Scholarship'}
            </strong>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setEditingId(null);
              }}
              style={{ color: 'var(--text-muted)', background: 'transparent' }}
            >
              <X size={15} />
            </button>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
              Scholarship Title *
            </label>
            <input
              className="input-field"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Chevening Scholarship"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
              Organization
            </label>
            <input
              className="input-field"
              value={form.organization}
              onChange={(e) => setForm({ ...form, organization: e.target.value })}
              placeholder="e.g. UK Government"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
              Degree Level
            </label>
            <input
              className="input-field"
              value={form.degreeLevel}
              onChange={(e) => setForm({ ...form, degreeLevel: e.target.value })}
              placeholder="e.g. Masters"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
              Funding / Amount
            </label>
            <input
              className="input-field"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="e.g. Full tuition + stipend"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
              Deadline
            </label>
            <input
              className="input-field"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              placeholder="e.g. Nov 30, 2026"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
              Country
            </label>
            <input
              className="input-field"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              placeholder="e.g. United Kingdom"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
              Visibility
            </label>
            <select
              className="input-field"
              value={form.visibility}
              onChange={(e) => setForm({ ...form, visibility: e.target.value as 'public' | 'private' })}
              style={{ cursor: 'pointer' }}
            >
              <option value="private">🔒 Personal — only you can see this scholarship</option>
              <option value="public">🌐 Public — all users can see this scholarship</option>
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
              Application Link
            </label>
            <input
              className="input-field"
              type="url"
              value={form.applicationLink}
              onChange={(e) => setForm({ ...form, applicationLink: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
              Description
            </label>
            <textarea
              className="input-field"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Eligibility, benefits, required documents, tips..."
              style={{ cursor: 'text', caretColor: '#a5b4fc', resize: 'vertical', minHeight: '64px' }}
            />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setFormOpen(false);
                setEditingId(null);
              }}
              disabled={saving}
              style={{ fontSize: '0.78rem', padding: '5px 10px' }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ fontSize: '0.78rem', padding: '5px 10px' }}>
              {saving ? 'Saving...' : editingId ? 'Update Scholarship' : 'Add Scholarship'}
            </button>
          </div>
        </form>
      )}

      {visible.length === 0 ? (
        <div
          style={{
            padding: '16px',
            textAlign: 'center',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
          }}
        >
          {scope === 'personal'
            ? 'No personal scholarships yet. Add your first Scholarship Program.'
            : 'No public scholarships shared yet. Be the first to share one from Personal.'}
        </div>
      ) : (
        <div className="xl-wrap" style={{ margin: 0, borderRadius: 'var(--radius-sm)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="xl-table">
              <thead>
                <tr>
                  <th style={{ width: '24%' }}>Scholarship</th>
                  <th style={{ width: '16%' }}>Organization</th>
                  <th style={{ width: '10%' }}>Level</th>
                  <th style={{ width: '16%' }}>Funding</th>
                  <th style={{ width: '12%' }}>Deadline</th>
                  <th style={{ width: '6%' }}>Apply</th>
                  <th style={{ width: '6%' }}>Vis</th>
                  <th style={{ width: '10%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((scholarship) => {
                  const isOwner = scholarship.isMine || scholarship.ownerId === me.id;
                  return (
                    <tr key={scholarship.id}>
                      <td className="xl-cell-name" title={`${scholarship.title} — ${scholarship.description || 'No description'}`}>
                        {scholarship.title}
                        {!isOwner && scholarship.ownerName && (
                          <span className="xl-cell-muted" style={{ marginLeft: 6, fontWeight: 400 }}>
                            · {scholarship.ownerName}
                          </span>
                        )}
                      </td>
                      <td className="xl-cell-muted" title={scholarship.organization}>
                        {scholarship.organization || '—'}
                      </td>
                      <td title={scholarship.degreeLevel}>{scholarship.degreeLevel || '—'}</td>
                      <td title={scholarship.amount}>{scholarship.amount || '—'}</td>
                      <td title={scholarship.deadline}>{scholarship.deadline || '—'}</td>
                      <td>
                        {scholarship.applicationLink ? (
                          <a
                            href={scholarship.applicationLink}
                            target="_blank"
                            rel="noreferrer"
                            className="xl-icon-btn"
                            title="Apply"
                          >
                            <ExternalLink size={13} />
                          </a>
                        ) : (
                          <span className="xl-cell-muted">—</span>
                        )}
                      </td>
                      <td>
                        {scholarship.visibility === 'public' ? (
                          <span
                            className="xl-chip"
                            style={{
                              background: 'rgba(56, 189, 248, 0.1)',
                              color: '#7dd3fc',
                              borderColor: 'rgba(56, 189, 248, 0.3)',
                            }}
                          >
                            <Globe size={11} /> Pub
                          </span>
                        ) : (
                          <span
                            className="xl-chip"
                            style={{
                              background: 'rgba(244, 63, 94, 0.1)',
                              color: '#fda4af',
                              borderColor: 'rgba(244, 63, 94, 0.3)',
                            }}
                          >
                            <Lock size={11} /> Priv
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="xl-actions">
                          {isOwner && scope === 'personal' && (
                            <>
                              <button
                                type="button"
                                className="xl-icon-btn"
                                onClick={() => onToggleVisibility(scholarship)}
                                title={
                                  scholarship.visibility === 'public'
                                    ? 'Public — click to make personal (private)'
                                    : 'Personal — click to share publicly'
                                }
                              >
                                {scholarship.visibility === 'public' ? <Globe size={13} /> : <Lock size={13} />}
                              </button>
                              <button
                                type="button"
                                className="xl-icon-btn"
                                onClick={() => openEdit(scholarship)}
                                title="Edit"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                className="xl-icon-btn danger"
                                onClick={() => onDelete(scholarship.id)}
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
