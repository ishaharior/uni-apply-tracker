'use client';

import React from 'react';
import { University, User, OutreachStatusType } from '@/types';
import { STATUS_MAP } from '@/lib/utils';
import { Building2, School, Users, Send } from 'lucide-react';

interface StatsDashboardProps {
  universities: University[];
  me: User;
}

const BREAKDOWN_ORDER: OutreachStatusType[] = [
  'positive',
  'interview',
  'emailed',
  'drafting',
  'applied',
  'accepted',
  'neutral',
  'negative',
  'rejected',
  'not_contacted',
];

export default function StatsDashboard({ universities, me }: StatsDashboardProps) {
  let totalDepts = 0;
  let totalProfessors = 0;
  const statusCounts: Record<OutreachStatusType, number> = {
    not_contacted: 0,
    drafting: 0,
    emailed: 0,
    positive: 0,
    neutral: 0,
    negative: 0,
    interview: 0,
    applied: 0,
    accepted: 0,
    rejected: 0,
  };

  universities.forEach((uni) => {
    totalDepts += uni.departments.length;
    uni.departments.forEach((dept) => {
      dept.professors.forEach((prof) => {
        totalProfessors += 1;
        const status = prof.myOutreach?.status || 'not_contacted';
        statusCounts[status] += 1;
      });
    });
  });

  const contacted =
    totalProfessors - statusCounts.not_contacted;
  const progressPercent =
    totalProfessors > 0 ? Math.round((contacted / totalProfessors) * 100) : 0;
  const successRate =
    contacted > 0
      ? Math.round(((statusCounts.positive + statusCounts.interview) / contacted) * 100)
      : 0;

  const breakdown = BREAKDOWN_ORDER.map((status) => ({
    status,
    count: statusCounts[status],
    meta: STATUS_MAP[status],
  })).filter((row) => row.count > 0);

  const miniCards = [
    {
      label: 'Universities',
      value: universities.length,
      icon: <Building2 size={20} color="#818cf8" />,
      bg: 'rgba(99, 102, 241, 0.15)',
      border: 'rgba(99, 102, 241, 0.3)',
    },
    {
      label: 'Departments',
      value: totalDepts,
      icon: <School size={20} color="#c084fc" />,
      bg: 'rgba(168, 85, 247, 0.15)',
      border: 'rgba(168, 85, 247, 0.3)',
    },
    {
      label: 'Professors Tracked',
      value: totalProfessors,
      icon: <Users size={20} color="#38bdf8" />,
      bg: 'rgba(56, 189, 248, 0.15)',
      border: 'rgba(56, 189, 248, 0.3)',
    },
    {
      label: 'My Outreach Sent',
      value: contacted,
      icon: <Send size={20} color="#10b981" />,
      bg: 'rgba(16, 185, 129, 0.15)',
      border: 'rgba(16, 185, 129, 0.3)',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
      {/* Compact KPI strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '8px',
        }}
      >
        {miniCards.map((card) => (
          <div
            key={card.label}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: card.bg,
                border: `1px solid ${card.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {card.icon}
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  lineHeight: 1.2,
                }}
              >
                {card.label}
              </div>
              <div
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  lineHeight: 1.2,
                }}
              >
                {card.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Personal progress — compact bar */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: `1px solid ${me.color}33`,
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {me.name}&apos;s pipeline
            </span>
            <span className="xl-cell-muted">private to you</span>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'baseline' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Contacted{' '}
              <strong style={{ color: me.color, fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                {contacted}/{totalProfessors}
              </strong>
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Success{' '}
              <strong style={{ color: '#10b981', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                {successRate}%
              </strong>
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Progress{' '}
              <strong style={{ color: me.color, fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                {progressPercent}%
              </strong>
            </span>
          </div>
        </div>

        {/* Single progress bar */}
        <div
          style={{
            height: '6px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 255, 255, 0.05)',
            overflow: 'hidden',
            marginBottom: '10px',
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: me.color,
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        {/* Status breakdown — compact rows */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {breakdown.length > 0 ? (
            breakdown.map(({ status, count, meta }) => (
              <span
                key={status}
                className="xl-chip"
                style={{ color: meta.color, background: meta.bg, borderColor: meta.border }}
                title={meta.label}
              >
                {meta.icon} {meta.shortLabel}{' '}
                <strong style={{ fontFamily: 'var(--font-mono)' }}>{count}</strong>
              </span>
            ))
          ) : (
            <span className="xl-cell-muted">No outreach yet — open a professor row to update status.</span>
          )}
        </div>
      </div>
    </div>
  );
}
