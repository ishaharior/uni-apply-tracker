'use client';

import React from 'react';
import { Professor, User } from '@/types';
import {
  ExternalLink,
  Copy,
  Check,
  BookOpen,
  Edit3,
  Trash2,
  PlusCircle,
  Globe,
  Lock,
} from 'lucide-react';
import { getStatusMeta, formatDate } from '@/lib/utils';

interface ProfessorRowProps {
  professor: Professor;
  me: User;
  onOpenStatusModal: (professor: Professor) => void;
  onEditProfessor: (professor: Professor) => void;
  onDeleteProfessor: (professorId: string) => void;
  onToggleVisibility: (professor: Professor) => void;
  onToggleList: (professor: Professor) => void;
}

export default function ProfessorRow({
  professor,
  me,
  onOpenStatusModal,
  onEditProfessor,
  onDeleteProfessor,
  onToggleVisibility,
  onToggleList,
}: ProfessorRowProps) {
  const isOwner = professor.ownerId === me.id;
  const isPrivate = professor.visibility === 'private';
  const isOnList = professor.onMyList || isOwner;
  const myRecord = professor.myOutreach;
  const myStatus = myRecord?.status || 'not_contacted';
  const myMeta = getStatusMeta(myStatus);

  const accepting = {
    yes: { label: 'Yes', color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
    maybe: { label: 'Maybe', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
    no: { label: 'No', color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
    unknown: { label: '—', color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)' },
  }[professor.acceptingStudents || 'unknown'];

  const research = professor.researchAreas?.slice(0, 3).join(', ');
  const researchMore = (professor.researchAreas?.length || 0) - 3;

  return (
    <tr>
      <td className="xl-cell-name" title={professor.name}>
        {professor.name}
      </td>
      <td className="xl-cell-muted" title={professor.title}>
        {professor.title}
      </td>
      <td>
        <span
          className="xl-chip"
          style={{ color: accepting.color, background: accepting.bg, borderColor: accepting.border }}
        >
          {accepting.label}
        </span>
      </td>
      <td className="xl-cell-muted" title={professor.researchAreas?.join(', ') || ''}>
        {research || '—'}
        {researchMore > 0 ? ` +${researchMore}` : ''}
      </td>
      <td>
        {professor.email ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, maxWidth: '100%' }}>
            <a
              href={`mailto:${professor.email}`}
              style={{ color: '#7dd3fc', overflow: 'hidden', textOverflow: 'ellipsis' }}
              title={professor.email}
            >
              {professor.email}
            </a>
            <button
              type="button"
              className="xl-icon-btn"
              style={{ width: 20, height: 20 }}
              title="Copy email"
              onClick={() => navigator.clipboard.writeText(professor.email)}
            >
              <Copy size={11} />
            </button>
          </span>
        ) : (
          <span className="xl-cell-muted">—</span>
        )}
      </td>
      <td>
        <span className="xl-actions">
          {professor.scholarUrl && (
            <a
              href={professor.scholarUrl}
              target="_blank"
              rel="noreferrer"
              className="xl-icon-btn"
              title="Google Scholar"
            >
              <BookOpen size={13} />
            </a>
          )}
          {professor.websiteUrl && (
            <a
              href={professor.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="xl-icon-btn"
              title="Website"
            >
              <ExternalLink size={13} />
            </a>
          )}
          {!professor.scholarUrl && !professor.websiteUrl && (
            <span className="xl-cell-muted">—</span>
          )}
        </span>
      </td>
      <td>
        <button
          type="button"
          onClick={() => onOpenStatusModal(professor)}
          className="xl-chip"
          style={{
            color: myMeta.color,
            background: myMeta.bg,
            borderColor: myMeta.border,
            cursor: 'pointer',
          }}
          title={`${myMeta.label}${myRecord?.lastUpdated ? ` · updated ${formatDate(myRecord.lastUpdated)}` : ''} — click to update`}
        >
          {myMeta.icon} {myMeta.shortLabel}
        </button>
      </td>
      <td>
        {isOwner ? (
          <span
            className="xl-chip"
            style={{ color: '#d8b4fe', background: 'rgba(168,85,247,0.1)', borderColor: 'rgba(168,85,247,0.3)' }}
            title="Your professor"
          >
            Yours
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onToggleList(professor)}
            className="xl-chip"
            style={
              isOnList
                ? {
                    color: '#34d399',
                    background: 'rgba(16,185,129,0.1)',
                    borderColor: 'rgba(16,185,129,0.3)',
                    cursor: 'pointer',
                  }
                : {
                    color: '#a5b4fc',
                    background: 'rgba(99,102,241,0.12)',
                    borderColor: 'rgba(99,102,241,0.35)',
                    cursor: 'pointer',
                  }
            }
            title={isOnList ? 'On your list — click to remove' : 'Add to your list'}
          >
            {isOnList ? (
              <>
                <Check size={11} /> On list
              </>
            ) : (
              <>
                <PlusCircle size={11} /> Add
              </>
            )}
          </button>
        )}
      </td>
      <td>
        {isOwner ? (
          <button
            type="button"
            onClick={() => onToggleVisibility(professor)}
            className="xl-chip"
            style={
              isPrivate
                ? { color: '#fda4af', background: 'rgba(244,63,94,0.1)', borderColor: 'rgba(244,63,94,0.3)', cursor: 'pointer' }
                : { color: '#7dd3fc', background: 'rgba(56,189,248,0.1)', borderColor: 'rgba(56,189,248,0.3)', cursor: 'pointer' }
            }
            title={isPrivate ? 'Private — click to share' : 'Public — click to make private'}
          >
            {isPrivate ? <Lock size={11} /> : <Globe size={11} />} {isPrivate ? 'Priv' : 'Pub'}
          </button>
        ) : (
          <span
            className="xl-chip"
            style={{ color: '#7dd3fc', background: 'rgba(56,189,248,0.08)', borderColor: 'rgba(56,189,248,0.25)' }}
            title="Public"
          >
            <Globe size={11} /> Pub
          </span>
        )}
      </td>
      <td>
        <span className="xl-actions">
          <button
            type="button"
            className="xl-icon-btn"
            onClick={() => onEditProfessor(professor)}
            title="Edit"
          >
            <Edit3 size={13} />
          </button>
          {isOwner && (
            <button
              type="button"
              className="xl-icon-btn danger"
              onClick={() => onDeleteProfessor(professor.id)}
              title="Delete"
            >
              <Trash2 size={13} />
            </button>
          )}
          {professor.notes && (
            <span className="xl-cell-muted" title={professor.notes} style={{ maxWidth: 40, display: 'inline-block', overflow: 'hidden' }}>
              📝
            </span>
          )}
        </span>
      </td>
    </tr>
  );
}
