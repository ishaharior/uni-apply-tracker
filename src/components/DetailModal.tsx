'use client';

import React from 'react';
import { Professor, MastersCourse } from '@/types';
import { X, User, GraduationCap, Globe, Lock, ExternalLink, BookOpen, Mail } from 'lucide-react';
import { getStatusMeta, getCourseStatusMeta, formatDate } from '@/lib/utils';

interface DetailModalProps {
  professor?: Professor | null;
  course?: MastersCourse | null;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
    return null;
  }
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '140px 1fr',
        gap: '8px',
        padding: '6px 0',
        borderBottom: '1px solid var(--border-grid)',
        fontSize: '0.8rem',
      }}
    >
      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

function DescriptionBlock({ text, title }: { text?: string; title: string }) {
  return (
    <div style={{ marginTop: '12px' }}>
      <div
        style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--text-muted)',
          marginBottom: '6px',
        }}
      >
        {title}
      </div>
      <div
        style={{
          background: '#0e0e12',
          border: '1px solid var(--border-grid)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 12px',
          fontSize: '0.82rem',
          lineHeight: 1.55,
          color: text ? 'var(--text-primary)' : 'var(--text-muted)',
          whiteSpace: 'pre-wrap',
          minHeight: '48px',
          cursor: text ? 'text' : 'default',
          caretColor: '#a5b4fc',
        }}
      >
        {text?.trim() || 'No description yet.'}
      </div>
    </div>
  );
}

export default function DetailModal({ professor, course, onClose }: DetailModalProps) {
  if (!professor && !course) return null;

  const isProf = Boolean(professor);
  const title = professor ? professor.name : `${course!.universityName}`;
  const subtitle = professor
    ? professor.title
    : course!.departmentName;

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
          maxWidth: '560px',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '10px',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-sm)',
                background: isProf ? 'rgba(99,102,241,0.15)' : 'rgba(251,191,36,0.12)',
                border: `1px solid ${isProf ? 'rgba(99,102,241,0.35)' : 'rgba(251,191,36,0.35)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isProf ? <User size={16} color="#818cf8" /> : <GraduationCap size={16} color="#fbbf24" />}
            </div>
            <div style={{ minWidth: 0 }}>
              <h3
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {title}
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{subtitle}</span>
            </div>
          </div>
          <button onClick={onClose} className="xl-icon-btn" style={{ width: '28px', height: '28px' }}>
            <X size={16} />
          </button>
        </div>

        {professor && (
          <>
            <Row
              label="Email"
              value={
                professor.email ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <a href={`mailto:${professor.email}`} style={{ color: '#7dd3fc' }}>
                      {professor.email}
                    </a>
                    <button
                      type="button"
                      className="xl-icon-btn"
                      style={{ width: 20, height: 20 }}
                      title="Copy email"
                      onClick={() => navigator.clipboard.writeText(professor.email)}
                    >
                      <Mail size={11} />
                    </button>
                  </span>
                ) : undefined
              }
            />
            <Row label="Research Areas" value={professor.researchAreas?.join(', ')} />
            <Row
              label="Accepting"
              value={
                <span
                  className="xl-chip"
                  style={{
                    color:
                      professor.acceptingStudents === 'yes'
                        ? '#34d399'
                        : professor.acceptingStudents === 'maybe'
                          ? '#fbbf24'
                          : professor.acceptingStudents === 'no'
                            ? '#f87171'
                            : '#94a3b8',
                    background: 'rgba(255,255,255,0.04)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  {professor.acceptingStudents || 'unknown'}
                </span>
              }
            />
            <Row
              label="Visibility"
              value={
                <span className="xl-chip" style={{ color: '#7dd3fc', background: 'rgba(56,189,248,0.08)', borderColor: 'rgba(56,189,248,0.25)' }}>
                  {professor.visibility === 'private' ? <Lock size={11} /> : <Globe size={11} />}
                  {professor.visibility}
                </span>
              }
            />
            <Row
              label="Links"
              value={
                <span style={{ display: 'inline-flex', gap: 8 }}>
                  {professor.scholarUrl && (
                    <a href={professor.scholarUrl} target="_blank" rel="noreferrer" className="xl-icon-btn" title="Scholar">
                      <BookOpen size={13} />
                    </a>
                  )}
                  {professor.websiteUrl && (
                    <a href={professor.websiteUrl} target="_blank" rel="noreferrer" className="xl-icon-btn" title="Website">
                      <ExternalLink size={13} />
                    </a>
                  )}
                </span>
              }
            />
            {professor.myOutreach && (
              <Row
                label="My status"
                value={
                  <span className="xl-chip" style={{ color: getStatusMeta(professor.myOutreach!.status).color, background: getStatusMeta(professor.myOutreach!.status).bg, borderColor: getStatusMeta(professor.myOutreach!.status).border }}>
                    {getStatusMeta(professor.myOutreach!.status).icon} {getStatusMeta(professor.myOutreach!.status).label}
                    {professor.myOutreach.lastUpdated ? ` · ${formatDate(professor.myOutreach.lastUpdated)}` : ''}
                  </span>
                }
              />
            )}
            <DescriptionBlock text={professor.notes} title="Description / Notes" />
            {professor.myOutreach?.notes && (
              <DescriptionBlock text={professor.myOutreach.notes} title="Outreach notes" />
            )}
          </>
        )}

        {course && (
          <>
            <Row label="Department" value={course.departmentName} />
            <Row label="IELTS" value={course.ieltsReq} />
            <Row label="Last date" value={course.lastDate} />
            <Row
              label="Apply"
              value={
                course.applicationLink ? (
                  <a href={course.applicationLink} target="_blank" rel="noreferrer" style={{ color: '#7dd3fc', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    Open application <ExternalLink size={12} />
                  </a>
                ) : undefined
              }
            />
            <Row
              label="Visibility"
              value={
                <span
                  className="xl-chip"
                  style={{
                    color: course.visibility === 'public' ? '#7dd3fc' : '#fda4af',
                    background: course.visibility === 'public' ? 'rgba(56,189,248,0.08)' : 'rgba(244,63,94,0.08)',
                    borderColor: course.visibility === 'public' ? 'rgba(56,189,248,0.25)' : 'rgba(244,63,94,0.25)',
                  }}
                >
                  {course.visibility === 'public' ? <Globe size={11} /> : <Lock size={11} />} {course.visibility}
                </span>
              }
            />
            {course.ownerName && <Row label="Owner" value={course.ownerName} />}
            <Row
              label="My status"
              value={
                <span
                  className="xl-chip"
                  style={{
                    color: getCourseStatusMeta(course.myStatus).color,
                    background: getCourseStatusMeta(course.myStatus).bg,
                    borderColor: getCourseStatusMeta(course.myStatus).border,
                  }}
                >
                  {getCourseStatusMeta(course.myStatus).icon} {getCourseStatusMeta(course.myStatus).label}
                </span>
              }
            />
            <DescriptionBlock text={course.description} title="Description" />
          </>
        )}
      </div>
    </div>
  );
}
