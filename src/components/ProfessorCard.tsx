'use client';

import React, { useState } from 'react';
import { Professor, User } from '@/types';
import {
  Mail,
  ExternalLink,
  Copy,
  Check,
  BookOpen,
  Edit3,
  Trash2,
  PlusCircle,
  MessageSquare,
  Globe,
  Lock,
} from 'lucide-react';
import { getStatusMeta, formatDate } from '@/lib/utils';

interface ProfessorCardProps {
  professor: Professor;
  universityName: string;
  departmentName: string;
  me: User;
  onOpenStatusModal: (professor: Professor) => void;
  onEditProfessor: (professor: Professor) => void;
  onDeleteProfessor: (professorId: string) => void;
  onToggleVisibility: (professor: Professor) => void;
  onToggleList: (professor: Professor) => void;
}

export default function ProfessorCard({
  professor,
  me,
  onOpenStatusModal,
  onEditProfessor,
  onDeleteProfessor,
  onToggleVisibility,
  onToggleList,
}: ProfessorCardProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const isOwner = professor.ownerId === me.id;
  const isPrivate = professor.visibility === 'private';
  const isOnList = professor.onMyList || isOwner;

  const copyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!professor.email) return;
    navigator.clipboard.writeText(professor.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const myRecord = professor.myOutreach;
  const myStatus = myRecord?.status || 'not_contacted';
  const myMeta = getStatusMeta(myStatus);

  const acceptingBadge = {
    yes: { label: 'Accepting Students', bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)' },
    maybe: { label: 'Maybe Accepting', bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' },
    no: { label: 'Not Taking Students', bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' },
    unknown: { label: 'Inquire Availability', bg: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.2)' },
  }[professor.acceptingStudents || 'unknown'];

  return (
    <div
      className="glass-panel"
      style={{
        padding: '18px 20px',
        background: 'rgba(15, 23, 42, 0.65)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Top Header: Name, Title, Accepting status, Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {professor.name}
            </h4>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: acceptingBadge.bg,
                color: acceptingBadge.color,
                border: `1px solid ${acceptingBadge.border}`,
              }}
            >
              {acceptingBadge.label}
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
            {professor.title}
          </p>
        </div>

        {/* Action icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {isOwner ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-full)',
                background: 'rgba(168, 85, 247, 0.12)',
                color: '#d8b4fe',
                border: '1px solid rgba(168, 85, 247, 0.35)',
              }}
              title="You added this professor"
            >
              <PlusCircle size={13} />
              <span>Your list</span>
            </span>
          ) : isOnList ? (
            <button
              onClick={() => onToggleList(professor)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-full)',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.35)',
              }}
              title="On your list — click to remove"
            >
              <Check size={13} />
              <span>On my list</span>
            </button>
          ) : (
            <button
              onClick={() => onToggleList(professor)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-full)',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#a5b4fc',
                border: '1px solid rgba(99, 102, 241, 0.4)',
              }}
              title="Add this public professor to your list"
            >
              <PlusCircle size={13} />
              <span>Add to list</span>
            </button>
          )}
          {isOwner ? (
            <button
              onClick={() => onToggleVisibility(professor)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-full)',
                background: isPrivate ? 'rgba(244, 63, 94, 0.12)' : 'rgba(56, 189, 248, 0.12)',
                color: isPrivate ? '#fda4af' : '#7dd3fc',
                border: `1px solid ${isPrivate ? 'rgba(244, 63, 94, 0.35)' : 'rgba(56, 189, 248, 0.35)'}`,
              }}
              title={isPrivate ? 'Private — only you can see this professor' : 'Public — all users can see this professor'}
            >
              {isPrivate ? <Lock size={13} /> : <Globe size={13} />}
              <span>{isPrivate ? 'Private' : 'Public'}</span>
            </button>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-full)',
                background: 'rgba(56, 189, 248, 0.12)',
                color: '#7dd3fc',
                border: '1px solid rgba(56, 189, 248, 0.35)',
              }}
              title="Public — visible to all users"
            >
              <Globe size={13} />
              <span>Public</span>
            </span>
          )}
          <button
            onClick={() => onEditProfessor(professor)}
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.04)',
              color: 'var(--text-muted)',
              border: '1px solid transparent',
            }}
            title="Edit Professor"
          >
            <Edit3 size={15} />
          </button>
          {isOwner && (
            <button
              onClick={() => onDeleteProfessor(professor.id)}
              style={{
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(239, 68, 68, 0.08)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
              title="Delete Professor"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Links & Email Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        {professor.email && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <a
              href={`mailto:${professor.email}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.1)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
              }}
            >
              <Mail size={14} />
              <span>{professor.email}</span>
            </a>
            <button
              onClick={copyEmail}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 8px',
                color: copiedEmail ? '#34d399' : 'var(--text-muted)',
                fontSize: '0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Copy email to clipboard"
            >
              {copiedEmail ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}

        {professor.scholarUrl && (
          <a
            href={professor.scholarUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.8rem',
              color: '#a5b4fc',
              padding: '4px 8px',
              background: 'rgba(99, 102, 241, 0.08)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
            }}
          >
            <BookOpen size={13} />
            <span>Google Scholar</span>
            <ExternalLink size={12} />
          </a>
        )}

        {professor.websiteUrl && (
          <a
            href={professor.websiteUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              padding: '4px 8px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <span>Lab / Website</span>
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* Research Areas Keywords */}
      {professor.researchAreas && professor.researchAreas.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          {professor.researchAreas.map((area, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '0.72rem',
                fontWeight: 500,
                color: '#cbd5e1',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-sm)',
                padding: '2px 8px',
              }}
            >
              #{area}
            </span>
          ))}
        </div>
      )}

      {/* MY private outreach status row */}
      <div
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          paddingTop: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-muted)',
            }}
          >
            My Status (private)
          </span>

          <button
            onClick={() => onOpenStatusModal(professor)}
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: me.color,
              background: me.accentBg,
              border: `1px solid ${me.color}`,
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <PlusCircle size={13} />
            <span>Update My Status</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onOpenStatusModal(professor)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: 'var(--radius-sm)',
            background: myStatus === 'not_contacted' ? 'rgba(15, 23, 42, 0.9)' : myMeta.bg,
            border: `1.5px solid ${myStatus === 'not_contacted' ? 'rgba(255, 255, 255, 0.08)' : myMeta.color}`,
            textAlign: 'left',
            cursor: 'pointer',
            width: '100%',
            transition: 'all 0.2s ease',
          }}
          title="Click to update your status"
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: me.color,
              color: '#090d16',
              fontSize: '0.75rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {me.avatar}
          </div>

          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: me.color }}>
                {me.name}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {myRecord?.dateEmailed ? `Emailed ${formatDate(myRecord.dateEmailed)}` : myRecord?.lastUpdated ? `Updated ${formatDate(myRecord.lastUpdated)}` : ''}
              </span>
            </div>
            <div
              style={{
                fontSize: '0.76rem',
                fontWeight: 600,
                color: myMeta.color,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {myMeta.icon} {myMeta.label}
            </div>
          </div>

          {myRecord?.notes && (
            <span title={myRecord.notes} style={{ color: 'var(--text-muted)' }}>
              <MessageSquare size={13} />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
