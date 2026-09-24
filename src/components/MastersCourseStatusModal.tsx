'use client';

import React, { useState, useEffect } from 'react';
import { MastersCourse, User, CourseApplicationStatus } from '@/types';
import { X, Check, ExternalLink, GraduationCap, PlusCircle } from 'lucide-react';
import { COURSE_STATUS_MAP, DEFAULT_COURSE_STATUS, getCourseStatusMeta } from '@/lib/utils';

interface MastersCourseStatusModalProps {
  isOpen: boolean;
  course: MastersCourse | null;
  me: User;
  onClose: () => void;
  onSaveStatus: (courseId: string, status: CourseApplicationStatus) => Promise<void>;
}

const statusOptions: CourseApplicationStatus[] = [
  'interested',
  'preparing',
  'applied',
  'interview',
  'offer',
  'rejected',
];

export default function MastersCourseStatusModal({
  isOpen,
  course,
  me,
  onClose,
  onSaveStatus,
}: MastersCourseStatusModalProps) {
  const [status, setStatus] = useState<CourseApplicationStatus>(DEFAULT_COURSE_STATUS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (course) setStatus(course.myStatus || DEFAULT_COURSE_STATUS);
  }, [course]);

  if (!isOpen || !course) return null;

  const isOwner = course.isMine || course.ownerId === me.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveStatus(course.id, status);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'none',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-modal animate-modal"
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '16px',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: me.accentBg,
                  color: me.color,
                  border: `1px solid ${me.color}`,
                }}
              >
                My Application Status — private
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Updating as <strong style={{ color: me.color }}>{me.name}</strong>
              </span>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px', margin: 0 }}>
              {course.universityName}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              {course.departmentName}
              {course.ownerName ? ` · shared by ${course.ownerName}` : ''}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Status Selection Buttons */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Select Status
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {statusOptions.map((opt) => {
                const meta = COURSE_STATUS_MAP[opt];
                const isSelected = status === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setStatus(opt)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? meta.bg : 'rgba(15, 23, 42, 0.6)',
                      border: `1.5px solid ${isSelected ? meta.color : 'rgba(255, 255, 255, 0.06)'}`,
                      color: isSelected ? meta.color : 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: isSelected ? 700 : 500,
                      textAlign: 'left',
                      boxShadow: isSelected ? `0 0 12px ${meta.glow}` : 'none',
                    }}
                  >
                    <span>{meta.icon}</span>
                    <span style={{ flex: 1 }}>{meta.label}</span>
                    {isSelected && <Check size={14} color={meta.color} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Course quick facts — status + application link */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              padding: '10px 12px',
              background: '#0e0e12',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <GraduationCap size={14} color="#fbbf24" style={{ flexShrink: 0 }} />
            <span className="xl-chip" style={{ color: 'var(--text-secondary)' }}>
              {course.ieltsReq ? `IELTS ${course.ieltsReq}` : 'IELTS —'}
            </span>
            <span className="xl-chip" style={{ color: 'var(--text-secondary)' }}>
              {course.lastDate ? `By ${course.lastDate}` : 'No deadline'}
            </span>
            <span style={{ marginLeft: 'auto' }}>
              {course.applicationLink ? (
                <a
                  href={course.applicationLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  <ExternalLink size={12} />
                  <span>Apply link</span>
                </a>
              ) : (
                <span className="xl-cell-muted">No apply link</span>
              )}
            </span>
          </div>

          {!isOwner && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PlusCircle size={13} color="#a5b4fc" />
              {course.onMyList
                ? 'This course is on your list — your status stays private to you.'
                : 'Saving will add this course to your list automatically.'}
            </p>
          )}

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ minWidth: '130px' }}
            >
              {saving ? 'Saving...' : `Save — ${getCourseStatusMeta(status).shortLabel}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
