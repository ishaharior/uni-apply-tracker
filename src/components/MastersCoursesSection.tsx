'use client';

import React, { useState } from 'react';
import { MastersCourse, User } from '@/types';
import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  Globe,
  Lock,
  ExternalLink,
  X,
} from 'lucide-react';

interface MastersCoursesSectionProps {
  courses: MastersCourse[];
  me: User;
  mode: 'manage' | 'public';
  onSave: (data: Partial<MastersCourse>, editingId?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggleVisibility: (course: MastersCourse) => Promise<void>;
  onOpenDetail: (course: MastersCourse) => void;
}

const emptyForm = {
  universityName: '',
  departmentName: '',
  ieltsReq: '',
  lastDate: '',
  applicationLink: '',
  description: '',
};

export default function MastersCoursesSection({
  courses,
  me,
  mode,
  onSave,
  onDelete,
  onToggleVisibility,
  onOpenDetail,
}: MastersCoursesSectionProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const visible =
    mode === 'manage'
      ? courses.filter((c) => c.isMine || c.ownerId === me.id)
      : courses.filter((c) => c.visibility === 'public');

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (course: MastersCourse) => {
    setEditingId(course.id);
    setForm({
      universityName: course.universityName,
      departmentName: course.departmentName,
      ieltsReq: course.ieltsReq,
      lastDate: course.lastDate,
      applicationLink: course.applicationLink,
      description: course.description || '',
    });
    setFormOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.universityName.trim() || !form.departmentName.trim()) return;
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
          <GraduationCap size={16} color="#fbbf24" />
          <div>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Regular Master&apos;s Course
            </h2>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '1px 0 0' }}>
              {mode === 'manage'
                ? 'Personal list — toggle Public to share with everyone'
                : 'Shared by other users — public Master’s courses'}
            </p>
          </div>
        </div>
        {mode === 'manage' && (
          <button type="button" className="btn btn-primary" onClick={openAdd} style={{ fontSize: '0.78rem', padding: '5px 10px' }}>
            <Plus size={14} />
            <span>Add Course</span>
          </button>
        )}
      </div>

      {formOpen && mode === 'manage' && (
        <form
          onSubmit={submit}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px',
            padding: '12px',
            marginBottom: '12px',
            background: '#0e0e12',
            border: '1px solid rgba(251, 191, 36, 0.25)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.8rem', color: '#fbbf24' }}>
              {editingId ? 'Edit Course' : 'New Course'}
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
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
              University Name *
            </label>
            <input
              className="input-field"
              required
              value={form.universityName}
              onChange={(e) => setForm({ ...form, universityName: e.target.value })}
              placeholder="e.g. University of Toronto"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
              Department Name *
            </label>
            <input
              className="input-field"
              required
              value={form.departmentName}
              onChange={(e) => setForm({ ...form, departmentName: e.target.value })}
              placeholder="e.g. MSc Computer Science"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
              IELTS Req.
            </label>
            <input
              className="input-field"
              value={form.ieltsReq}
              onChange={(e) => setForm({ ...form, ieltsReq: e.target.value })}
              placeholder="e.g. 6.5 (no band below 6)"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
              Last Date to Apply
            </label>
            <input
              className="input-field"
              value={form.lastDate}
              onChange={(e) => setForm({ ...form, lastDate: e.target.value })}
              placeholder="e.g. Dec 15, 2026"
            />
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
              placeholder="Notes about this program, scholarship info, contact tips..."
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
              {saving ? 'Saving...' : editingId ? 'Update Course' : 'Add Course'}
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
          {mode === 'manage'
            ? 'No Master’s courses yet. Add your first Regular Master’s course.'
            : 'No shared Master’s courses yet.'}
        </div>
      ) : (
        <div className="xl-wrap" style={{ margin: 0, borderRadius: 'var(--radius-sm)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="xl-table">
              <thead>
                <tr>
                  <th style={{ width: '24%' }}>University</th>
                  <th style={{ width: '22%' }}>Department</th>
                  <th style={{ width: '14%' }}>IELTS</th>
                  <th style={{ width: '16%' }}>Last Date</th>
                  <th style={{ width: '8%' }}>Vis</th>
                  <th style={{ width: '6%' }}>Apply</th>
                  <th style={{ width: mode === 'manage' ? '10%' : '0%', display: mode === 'manage' ? undefined : 'none' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((course) => {
                  const isOwner = course.isMine || course.ownerId === me.id;
                  return (
                    <tr key={course.id}>
                      <td className="xl-cell-name" title={`${course.universityName} — click for details`}>
                        <button
                          type="button"
                          onClick={() => onOpenDetail(course)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            margin: 0,
                            font: 'inherit',
                            color: 'var(--text-primary)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {course.universityName}
                        </button>
                        {!isOwner && course.ownerName && (
                          <span className="xl-cell-muted" style={{ marginLeft: 6, fontWeight: 400 }}>
                            · {course.ownerName}
                          </span>
                        )}
                      </td>
                      <td className="xl-cell-muted" title={`${course.departmentName} — click for details`}>
                        <button
                          type="button"
                          onClick={() => onOpenDetail(course)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            margin: 0,
                            font: 'inherit',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {course.departmentName}
                        </button>
                      </td>
                      <td title={course.ieltsReq}>{course.ieltsReq || '—'}</td>
                      <td title={course.lastDate}>{course.lastDate || '—'}</td>
                      <td>
                        {course.visibility === 'public' ? (
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
                        {course.applicationLink ? (
                          <a
                            href={course.applicationLink}
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
                      {mode === 'manage' && (
                        <td>
                          <span className="xl-actions">
                            {isOwner && (
                              <>
                                <button
                                  type="button"
                                  className="xl-icon-btn"
                                  onClick={() => onToggleVisibility(course)}
                                  title={
                                    course.visibility === 'public'
                                      ? 'Public — click to make private'
                                      : 'Private — click to share publicly'
                                  }
                                >
                                  {course.visibility === 'public' ? <Globe size={13} /> : <Lock size={13} />}
                                </button>
                                <button
                                  type="button"
                                  className="xl-icon-btn"
                                  onClick={() => openEdit(course)}
                                  title="Edit"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  type="button"
                                  className="xl-icon-btn danger"
                                  onClick={() => onDelete(course.id)}
                                  title="Delete"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </span>
                        </td>
                      )}
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
