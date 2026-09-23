'use client';

import React, { useState, useEffect } from 'react';
import { Professor, User, OutreachStatusType, OutreachRecord } from '@/types';
import { X, Calendar, Sparkles, Check } from 'lucide-react';
import { STATUS_MAP } from '@/lib/utils';

interface StatusModalProps {
  isOpen: boolean;
  professor: Professor | null;
  me: User;
  onClose: () => void;
  onSaveStatus: (professorId: string, record: Partial<OutreachRecord>) => Promise<void>;
}

export default function StatusModal({
  isOpen,
  professor,
  me,
  onClose,
  onSaveStatus,
}: StatusModalProps) {
  const [status, setStatus] = useState<OutreachStatusType>('not_contacted');
  const [dateEmailed, setDateEmailed] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [responseDate, setResponseDate] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (professor) {
      const rec = professor.myOutreach;
      setStatus(rec?.status || 'not_contacted');
      setDateEmailed(rec?.dateEmailed || '');
      setFollowUpDate(rec?.followUpDate || '');
      setResponseDate(rec?.responseDate || '');
      setEmailSubject(rec?.emailSubject || '');
      setNotes(rec?.notes || '');
    }
  }, [professor]);

  if (!isOpen || !professor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveStatus(professor.id, {
        userId: me.id,
        status,
        dateEmailed: dateEmailed || undefined,
        followUpDate: followUpDate || undefined,
        responseDate: responseDate || undefined,
        emailSubject: emailSubject.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleSetToday = (field: 'emailed' | 'followup' | 'response') => {
    const today = new Date().toISOString().split('T')[0];
    if (field === 'emailed') setDateEmailed(today);
    if (field === 'response') setResponseDate(today);
    if (field === 'followup') {
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setFollowUpDate(nextWeek);
    }
  };

  const statusOptions: OutreachStatusType[] = [
    'not_contacted',
    'drafting',
    'emailed',
    'positive',
    'neutral',
    'negative',
    'interview',
    'applied',
    'accepted',
    'rejected',
  ];

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
          maxWidth: '580px',
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
                My Outreach — private
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Updating as <strong style={{ color: me.color }}>{me.name}</strong>
              </span>
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', margin: 0 }}>
              {professor.name}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              {professor.email ? professor.email : 'No email listed'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Status Selection Buttons */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Select Status
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {statusOptions.map((opt) => {
                const meta = STATUS_MAP[opt];
                const isSelected = status === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setStatus(opt);
                      if (opt === 'emailed' && !dateEmailed) {
                        handleSetToday('emailed');
                        handleSetToday('followup');
                      }
                      if ((opt === 'positive' || opt === 'interview' || opt === 'neutral' || opt === 'negative') && !responseDate) {
                        handleSetToday('response');
                      }
                    }}
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

          {/* Dates Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Date Emailed
                </label>
                <button
                  type="button"
                  onClick={() => handleSetToday('emailed')}
                  style={{ fontSize: '0.7rem', color: '#38bdf8', background: 'transparent', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                >
                  <Calendar size={11} />
                  Today
                </button>
              </div>
              <input
                type="date"
                className="input-field"
                value={dateEmailed}
                onChange={(e) => setDateEmailed(e.target.value)}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Follow-up Reminder
                </label>
                <button
                  type="button"
                  onClick={() => handleSetToday('followup')}
                  style={{ fontSize: '0.7rem', color: '#c084fc', background: 'transparent' }}
                >
                  +7 Days
                </button>
              </div>
              <input
                type="date"
                className="input-field"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>

            {(status === 'positive' || status === 'interview' || status === 'neutral' || status === 'negative') && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Response Date
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSetToday('response')}
                    style={{ fontSize: '0.7rem', color: '#10b981', background: 'transparent' }}
                  >
                    Today
                  </button>
                </div>
                <input
                  type="date"
                  className="input-field"
                  value={responseDate}
                  onChange={(e) => setResponseDate(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Email Subject */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Email Subject Line Used
              </label>
              <button
                type="button"
                onClick={() => setEmailSubject(`Prospective Graduate Researcher - ${professor.researchAreas[0] || 'Research'} Inquiry`)}
                style={{ fontSize: '0.7rem', color: '#a5b4fc', background: 'transparent', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                <Sparkles size={12} />
                <span>Auto-fill</span>
              </button>
            </div>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Prospective PhD Applicant (Fall 2027) - Inquiring on Lab Vacancies"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />
          </div>

          {/* Notes & Follow-up Details */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Notes, Response Summary & Meeting Details
            </label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="e.g., Prof. responded asking for my CV and transcript; invited to group Zoom call on Friday..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
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
              {saving ? 'Saving...' : 'Save My Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
