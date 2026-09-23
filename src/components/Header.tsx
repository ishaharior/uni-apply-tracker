'use client';

import React from 'react';
import { User } from '@/types';
import {
  GraduationCap,
  Plus,
  Mail,
  Activity,
  Download,
  RotateCcw,
  LogOut,
} from 'lucide-react';

interface HeaderProps {
  me: User;
  onLogout: () => void;
  onOpenAddUniversity: () => void;
  onOpenTemplates: () => void;
  onOpenActivity: () => void;
  onExportData: () => void;
  onResetDemoData: () => void;
  activityCount: number;
}

export default function Header({
  me,
  onLogout,
  onOpenAddUniversity,
  onOpenTemplates,
  onOpenActivity,
  onExportData,
  onResetDemoData,
  activityCount,
}: HeaderProps) {
  return (
    <header
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: '#050506',
        backdropFilter: 'none',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GraduationCap size={18} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '0.98rem', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
                UniApply <span className="brand-text">Tracker</span>
              </h1>
              <span
                style={{
                  fontSize: '0.68rem',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#6ee7b7',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                }}
              >
                PRIVATE PROGRESS
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
              Shared university catalog · Your outreach stays <strong style={{ color: '#34d399' }}>visible only to you</strong>
            </p>
          </div>
        </div>

        {/* Logged-in user + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: `1px solid ${me.color}44`,
              borderRadius: 'var(--radius-sm)',
              padding: '4px 10px 4px 4px',
              boxShadow: 'none',
            }}
          >
            <span
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: me.color,
                color: '#000',
                fontSize: '0.7rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {me.avatar}
            </span>
            <div style={{ lineHeight: 1.15 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: me.color }}>{me.name}</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>@{me.username}</div>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={onOpenAddUniversity}
            style={{ fontSize: '0.78rem', padding: '6px 10px' }}
          >
            <Plus size={14} />
            <span>University</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={onOpenTemplates}
            title="Cold email templates"
            style={{ fontSize: '0.78rem', padding: '6px 9px' }}
          >
            <Mail size={14} color="#c084fc" />
            <span>Templates</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={onOpenActivity}
            title="My Recent Activity Log"
            style={{ fontSize: '0.78rem', padding: '6px 9px', position: 'relative' }}
          >
            <Activity size={14} color="#38bdf8" />
            <span>Timeline</span>
            {activityCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  background: '#6366f1',
                  color: '#ffffff',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-full)',
                  padding: '1px 5px',
                }}
              >
                {activityCount}
              </span>
            )}
          </button>

          <button
            className="btn btn-secondary"
            onClick={onExportData}
            title="Export Backup (JSON)"
            style={{ fontSize: '0.78rem', padding: '6px 8px' }}
          >
            <Download size={14} />
          </button>

          <button
            className="btn btn-secondary"
            onClick={onResetDemoData}
            title="Reset to Demo Data"
            style={{ fontSize: '0.78rem', padding: '6px 8px', color: 'var(--text-muted)' }}
          >
            <RotateCcw size={13} />
          </button>

          <button
            className="btn btn-secondary"
            onClick={onLogout}
            title="Log out"
            style={{ fontSize: '0.78rem', padding: '6px 9px', color: '#fca5a5' }}
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
