'use client';

import React from 'react';
import { University, User, OutreachStatusType } from '@/types';
import { STATUS_MAP } from '@/lib/utils';
import { Building2, School, Users, Send, Target } from 'lucide-react';

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
  const maxCount = Math.max(1, ...breakdown.map((r) => r.count));

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '28px' }}>
      {/* Mini cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
        }}
      >
        {miniCards.map((card) => (
          <div
            key={card.label}
            className="glass-panel"
            style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
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
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {card.label}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {card.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Personal progress visuals — visible only to the logged-in user */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          border: `1.5px solid ${me.color}55`,
          boxShadow: `0 0 28px ${me.glowColor}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: me.color,
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: me.color,
                color: '#090d16',
                fontSize: '1rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 12px ${me.glowColor}`,
              }}
            >
              {me.avatar}
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {me.name}&apos;s Progress
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {me.role} · Only you can see this
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981' }}>
              {successRate}%
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Success / Int. Rate
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '28px',
            alignItems: 'center',
          }}
        >
          {/* Progress ring */}
          <div
            style={{
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: `conic-gradient(${me.color} ${progressPercent * 3.6}deg, rgba(255, 255, 255, 0.06) 0deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 0 24px ${me.glowColor}`,
            }}
            title={`${contacted} of ${totalProfessors} professors contacted`}
          >
            <div
              style={{
                width: '116px',
                height: '116px',
                borderRadius: '50%',
                background: '#0f172a',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <span style={{ fontSize: '1.9rem', fontWeight: 800, color: me.color, lineHeight: 1 }}>
                {progressPercent}%
              </span>
              <span
                style={{
                  fontSize: '0.6rem',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.08em',
                  marginTop: '4px',
                }}
              >
                CONTACTED
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {contacted}/{totalProfessors} profs
              </span>
            </div>
          </div>

          {/* Status breakdown bars */}
          <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '9px' }}>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '2px',
              }}
            >
              <Target size={13} />
              <span>My Pipeline Breakdown</span>
            </div>

            {breakdown.length > 0 ? (
              breakdown.map(({ status, count, meta }) => (
                <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      width: '128px',
                      color: meta.color,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={meta.label}
                  >
                    {meta.icon} {meta.shortLabel}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: '10px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.max(4, (count / maxCount) * 100)}%`,
                        height: '100%',
                        borderRadius: 'var(--radius-full)',
                        background: `linear-gradient(90deg, ${meta.color}99, ${meta.color})`,
                        boxShadow: `0 0 8px ${meta.glow}`,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      width: '24px',
                      textAlign: 'right',
                    }}
                  >
                    {count}
                  </span>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                No professors tracked yet — add universities to start your pipeline.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
