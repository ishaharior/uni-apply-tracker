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
  Calendar,
  BookOpen,
  X,
} from 'lucide-react';

interface MastersCoursesSectionProps {
  courses: MastersCourse[];
  me: User;
  mode: 'manage' | 'public';
  onSave: (data: Partial<MastersCourse>, editingId?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggleVisibility: (course: MastersCourse) => Promise<void>;
}

const emptyForm = {
  universityName: '',
  departmentName: '',
  ieltsReq: '',
  lastDate: '',
  applicationLink: '',
};

export default function MastersCoursesSection({
  courses,
  me,
  mode,
  onSave,
  onDelete,
  onToggleVisibility,
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
    <div className="glass-panel" style={{ padding: '20px 22px', marginBottom: '24px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <GraduationCap size={20} color="#fbbf24" />
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Regular Master&apos;s Course
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              {mode === 'manage'
                ? 'Personal list — toggle Public to share with everyone'
                : 'Shared by other users — public Master’s courses'}
            </p>
          </div>
        </div>
        {mode === 'manage' && (
          <button type="button" className="btn btn-primary" onClick={openAdd} style={{ fontSize: '0.82rem' }}>
            <Plus size={15} />
            <span>Add Course</span>
          </button>
        )}
      </div>

      {formOpen && mode === 'manage' && (
        <form
          onSubmit={submit}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            padding: '14px',
            marginBottom: '16px',
            background: 'rgba(15, 23, 42, 0.55)',
            border: '1px solid rgba(251, 191, 36, 0.25)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.85rem', color: '#fbbf24' }}>
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
              <X size={16} />
            </button>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
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
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
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
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
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
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
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
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
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
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setFormOpen(false);
                setEditingId(null);
              }}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Course' : 'Add Course'}
            </button>
          </div>
        </form>
      )}

      {visible.length === 0 ? (
        <div
          style={{
            padding: '28px',
            textAlign: 'center',
            border: '1px dashed rgba(255, 255, 255, 0.12)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)',
            fontSize: '0.88rem',
          }}
        >
          {mode === 'manage'
            ? 'No Master’s courses yet. Add your first Regular Master’s course.'
            : 'No shared Master’s courses yet.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {visible.map((course) => {
            const isOwner = course.isMine || course.ownerId === me.id;
            return (
              <div
                key={course.id}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: 'rgba(15, 23, 42, 0.55)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      {course.universityName}
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: '#c7d2fe' }}>{course.departmentName}</span>
                    {course.visibility === 'public' ? (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(56, 189, 248, 0.12)',
                          color: '#7dd3fc',
                          border: '1px solid rgba(56, 189, 248, 0.35)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Globe size={11} /> Public
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(244, 63, 94, 0.12)',
                          color: '#fda4af',
                          border: '1px solid rgba(244, 63, 94, 0.35)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Lock size={11} /> Private
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '12px',
                      marginTop: '6px',
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {course.ieltsReq && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <BookOpen size={13} color="#38bdf8" />
                        IELTS: {course.ieltsReq}
                      </span>
                    )}
                    {course.lastDate && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} color="#f43f5e" />
                        Last date: {course.lastDate}
                      </span>
                    )}
                    {course.applicationLink && (
                      <a
                        href={course.applicationLink}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#38bdf8' }}
                      >
                        Apply <ExternalLink size={12} />
                      </a>
                    )}
                    {!isOwner && course.ownerName && (
                      <span style={{ color: 'var(--text-muted)' }}>by {course.ownerName}</span>
                    )}
                  </div>
                </div>

                {mode === 'manage' && isOwner && (
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => onToggleVisibility(course)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 10px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-full)',
                        background:
                          course.visibility === 'public'
                            ? 'rgba(56, 189, 248, 0.12)'
                            : 'rgba(168, 85, 247, 0.12)',
                        color: course.visibility === 'public' ? '#7dd3fc' : '#d8b4fe',
                        border: `1px solid ${
                          course.visibility === 'public'
                            ? 'rgba(56, 189, 248, 0.35)'
                            : 'rgba(168, 85, 247, 0.35)'
                        }`,
                      }}
                      title={
                        course.visibility === 'public'
                          ? 'Public — click to make private'
                          : 'Private — click to share publicly'
                      }
                    >
                      {course.visibility === 'public' ? <Globe size={13} /> : <Lock size={13} />}
                      <span>{course.visibility === 'public' ? 'Public' : 'Private'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(course)}
                      style={{
                        padding: '6px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.04)',
                        color: 'var(--text-muted)',
                      }}
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(course.id)}
                      style={{
                        padding: '6px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(239, 68, 68, 0.08)',
                        color: '#f87171',
                      }}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
