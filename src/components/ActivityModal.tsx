'use client';

import React from 'react';
import { ActivityLog, User } from '@/types';
import { X, Activity, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ActivityLog[];
  me: User;
}

export default function ActivityModal({ isOpen, onClose, logs, me }: ActivityModalProps) {
  if (!isOpen) return null;

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="#38bdf8" />
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                My Activity Timeline
              </h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Private to {me.name} · {logs.length} event{logs.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="xl-icon-btn"
            style={{ width: '28px', height: '28px' }}
          >
            <X size={16} />
          </button>
        </div>

        {logs && logs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {logs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: '#0e0e12',
                  border: '1px solid var(--border-grid)',
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: me.color,
                    color: '#000',
                    fontWeight: 800,
                    fontSize: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {me.avatar}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.78rem', color: '#d4d4da', lineHeight: 1.4 }}>
                    {log.description}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    <Clock size={11} />
                    <span>{formatDate(log.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            No recent activity recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
