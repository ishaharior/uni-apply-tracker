'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppData, Professor } from '@/types';
import { getStatusMeta, getCourseStatusMeta, getCountryFlag } from '@/lib/utils';
import MindMapDetails, { MindMapSelection } from '@/components/MindMapDetails';
import {
  ArrowLeft,
  Waypoints,
  Building2,
  BookOpen,
  User,
  GraduationCap,
  Award,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Target,
  LayoutGrid,
} from 'lucide-react';

interface MMChip {
  text: string;
  color: string;
  bg: string;
  border: string;
}

interface MMNode {
  id: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  accent?: string;
  muted?: boolean;
  chip?: MMChip;
  children?: MMNode[];
  select?: MindMapSelection;
  root?: boolean;
}

const GRAY_CHIP = {
  color: '#6b6b75',
  bg: 'rgba(255, 255, 255, 0.04)',
  border: 'rgba(255, 255, 255, 0.1)',
};

const GREEN_CHIP = {
  color: '#34d399',
  bg: 'rgba(16, 185, 129, 0.14)',
  border: 'rgba(16, 185, 129, 0.4)',
};

const BRANCH_IDS = new Set(['branch:universities', 'branch:masters', 'branch:scholarships']);

const isAttempted = (p: Professor): boolean =>
  Boolean(p.myOutreach && p.myOutreach.status !== 'not_contacted');

interface TreeNodeProps {
  node: MMNode;
  collapsed: Set<string>;
  selectedId: string | null;
  onToggle: (id: string) => void;
  onSelect: (node: MMNode) => void;
}

function TreeNode({ node, collapsed, selectedId, onToggle, onSelect }: TreeNodeProps) {
  const children = node.children;
  const hasChildren = Boolean(children && children.length > 0);
  const isCollapsed = collapsed.has(node.id);
  const selectable = Boolean(node.select);
  const selected = selectedId === node.id;
  const accent = node.accent || '#818cf8';

  const style: React.CSSProperties = node.root || node.muted
    ? {}
    : { borderColor: `${accent}59`, background: `${accent}14`, color: accent };

  const className = [
    'mm-node',
    node.root ? 'mm-node--root' : null,
    node.muted ? 'mm-node--muted' : null,
    hasChildren ? 'mm-node--parent' : null,
    selectable ? null : 'mm-node--static',
    selected ? 'mm-node--selected' : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li>
      <div
        className={className}
        style={style}
        role={selectable ? 'button' : undefined}
        tabIndex={selectable ? 0 : undefined}
        onClick={selectable ? () => onSelect(node) : undefined}
        onKeyDown={
          selectable
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(node);
                }
              }
            : undefined
        }
      >
        {hasChildren && (
          <button
            type="button"
            className="mm-toggle"
            aria-label={isCollapsed ? 'Expand branch' : 'Collapse branch'}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
          >
            {isCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
          </button>
        )}
        {node.icon && <span className="mm-icon">{node.icon}</span>}
        <span className="mm-label">{node.label}</span>
        {node.sublabel && <span className="mm-sub">{node.sublabel}</span>}
        {node.chip && (
          <span
            className="mm-chip"
            style={{
              color: node.chip.color,
              background: node.chip.bg,
              border: `1px solid ${node.chip.border}`,
            }}
          >
            {node.chip.text}
          </span>
        )}
      </div>
      {hasChildren && !isCollapsed && (
        <ul>
          {children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              collapsed={collapsed}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function StatPill({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        height: '26px',
        padding: '0 10px',
        borderRadius: 'var(--radius-full)',
        background: `${color}14`,
        border: `1px solid ${color}44`,
        color,
        fontSize: '0.7rem',
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      {label} <span style={{ color: 'var(--text-primary)' }}>{value}</span>
    </span>
  );
}

export default function MindMapPage() {
  const router = useRouter();
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set<string>());
  const [selection, setSelection] = useState<MindMapSelection | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/data');
      if (res.status === 401) {
        router.replace('/login');
        return;
      }
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Error fetching mind map data:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Universities that are part of this user's individual application
  const engagedUniversities = useMemo(() => {
    if (!data) return [];
    if (showAll) return data.universities;
    return data.universities.filter((uni) =>
      uni.departments.some((d) => d.professors.some((p) => p.onMyList || isAttempted(p)))
    );
  }, [data, showAll]);

  const visibleMasters = useMemo(() => {
    if (!data) return [];
    if (showAll) return data.mastersCourses;
    return data.mastersCourses.filter((c) => c.onMyList || c.isMine);
  }, [data, showAll]);

  const visibleScholarships = useMemo(() => {
    if (!data) return [];
    if (showAll) return data.scholarships;
    return data.scholarships.filter((s) => s.isMine);
  }, [data, showAll]);

  const stats = useMemo(() => {
    let profTotal = 0;
    let profAttempted = 0;
    let subjTotal = 0;
    let subjAttempted = 0;
    engagedUniversities.forEach((uni) =>
      uni.departments.forEach((dept) => {
        subjTotal += 1;
        let anyAttempted = false;
        dept.professors.forEach((p) => {
          profTotal += 1;
          if (isAttempted(p)) {
            profAttempted += 1;
            anyAttempted = true;
          }
        });
        if (anyAttempted) subjAttempted += 1;
      })
    );
    return { profTotal, profAttempted, subjTotal, subjAttempted };
  }, [engagedUniversities]);

  const tree = useMemo<MMNode | null>(() => {
    if (!data) return null;

    const uniNodes: MMNode[] = engagedUniversities.map((uni) => {
      let uniAttempted = 0;
      let uniTotal = 0;

      const deptNodes: MMNode[] = uni.departments.map((dept) => {
        const dAttempted = dept.professors.filter(isAttempted).length;
        uniAttempted += dAttempted;
        uniTotal += dept.professors.length;

        const profNodes: MMNode[] = dept.professors.map((p) => {
          const rec = p.myOutreach;
          const attempted = Boolean(rec && rec.status !== 'not_contacted');
          const meta = attempted && rec ? getStatusMeta(rec.status) : null;
          return {
            id: `professor:${p.id}`,
            label: p.name,
            sublabel: p.title,
            icon: <User size={12} />,
            muted: !attempted,
            accent: meta ? meta.color : undefined,
            chip: meta
              ? { text: meta.shortLabel, color: meta.color, bg: meta.bg, border: meta.border }
              : { text: p.onMyList ? 'unattempted' : 'not on list', ...GRAY_CHIP },
            select: { kind: 'professor', data: p, departmentName: dept.name, universityName: uni.name },
          };
        });

        if (profNodes.length === 0) {
          profNodes.push({
            id: `professor:empty:${dept.id}`,
            label: 'No professors yet',
            muted: true,
          });
        }

        return {
          id: `department:${dept.id}`,
          label: dept.name,
          sublabel: dept.degreeLevel,
          icon: <BookOpen size={12} />,
          accent: '#38bdf8',
          muted: dAttempted === 0,
          chip:
            dAttempted > 0
              ? {
                  text: `${dAttempted}/${dept.professors.length} attempted`,
                  ...GREEN_CHIP,
                }
              : { text: 'unattempted', ...GRAY_CHIP },
          children: profNodes,
          select: { kind: 'department', data: dept, universityName: uni.name },
        };
      });

      if (deptNodes.length === 0) {
        deptNodes.push({
          id: `department:empty:${uni.id}`,
          label: 'No subjects yet',
          muted: true,
        });
      }

      return {
        id: `university:${uni.id}`,
        label: uni.name,
        sublabel: `${getCountryFlag(uni.country)} ${uni.country}`,
        icon: <Building2 size={13} />,
        accent: '#a5b4fc',
        chip:
          uniTotal > 0
            ? uniAttempted > 0
              ? { text: `${uniAttempted}/${uniTotal} attempted`, ...GREEN_CHIP }
              : { text: 'unattempted', ...GRAY_CHIP }
            : undefined,
        children: deptNodes,
        select: { kind: 'university', data: uni },
      };
    });

    if (uniNodes.length === 0) {
      uniNodes.push({
        id: 'university:empty',
        label: 'No applications yet — add professors to My List from the homepage',
        muted: true,
      });
    }

    const mastersNodes: MMNode[] = visibleMasters.map((c) => {
      const meta = getCourseStatusMeta(c.myStatus);
      const mine = Boolean(c.onMyList || c.isMine);
      return {
        id: `masters:${c.id}`,
        label: c.universityName,
        sublabel: c.departmentName,
        icon: <GraduationCap size={13} />,
        accent: '#fbbf24',
        muted: !mine,
        chip: mine
          ? { text: meta.shortLabel, color: meta.color, bg: meta.bg, border: meta.border }
          : { text: 'not in my list', ...GRAY_CHIP },
        select: { kind: 'masters', data: c },
      };
    });

    if (mastersNodes.length === 0) {
      mastersNodes.push({
        id: 'masters:empty',
        label: "No master's courses yet",
        muted: true,
      });
    }

    const scholarshipNodes: MMNode[] = visibleScholarships.map((s) => ({
      id: `scholarship:${s.id}`,
      label: s.title,
      sublabel: s.organization,
      icon: <Award size={13} />,
      accent: '#f472b6',
      muted: !s.isMine,
      chip: s.isMine ? { text: 'yours', ...GREEN_CHIP } : { text: 'public', ...GRAY_CHIP },
      select: { kind: 'scholarship', data: s },
    }));

    if (scholarshipNodes.length === 0) {
      scholarshipNodes.push({
        id: 'scholarship:empty',
        label: 'No scholarships yet',
        muted: true,
      });
    }

    return {
      id: 'root',
      root: true,
      label: `${data.me.name}'s Application Journey`,
      sublabel: 'individual application map',
      icon: <Waypoints size={15} />,
      children: [
        {
          id: 'branch:universities',
          label: 'Universities',
          sublabel: `${engagedUniversities.length}`,
          icon: <Building2 size={13} />,
          accent: '#818cf8',
          children: uniNodes,
        },
        {
          id: 'branch:masters',
          label: "Master's Courses",
          sublabel: `${visibleMasters.length}`,
          icon: <GraduationCap size={13} />,
          accent: '#fbbf24',
          children: mastersNodes,
        },
        {
          id: 'branch:scholarships',
          label: 'Scholarships',
          sublabel: `${visibleScholarships.length}`,
          icon: <Award size={13} />,
          accent: '#f472b6',
          children: scholarshipNodes,
        },
      ],
    };
  }, [data, engagedUniversities, visibleMasters, visibleScholarships]);

  const selectedId = selection ? `${selection.kind}:${selection.data.id}` : null;

  const handleToggle = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelect = useCallback((node: MMNode) => {
    if (node.select) setSelection(node.select);
  }, []);

  const handleExpandAll = useCallback(() => setCollapsed(new Set<string>()), []);

  const handleCollapseAll = useCallback(() => {
    const ids = new Set<string>();
    const collect = (nodes: MMNode[]) => {
      nodes.forEach((n) => {
        if (n.children && n.children.length > 0 && !n.root && !BRANCH_IDS.has(n.id)) {
          ids.add(n.id);
        }
        if (n.children) collect(n.children);
      });
    };
    if (tree) collect([tree]);
    setCollapsed(ids);
  }, [tree]);

  const toolbarBtn: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    height: '28px',
    padding: '0 11px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.74rem',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  };

  if (loading || !data || !tree) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', padding: '120px 0' }}>
          <RefreshCw size={32} color="#818cf8" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '14px', color: 'var(--text-secondary)' }}>Building your mind map...</p>
        </div>
      </div>
    );
  }

  const me = data.me;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: '#050506',
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
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push('/')}
              style={{ fontSize: '0.78rem', padding: '6px 10px' }}
            >
              <ArrowLeft size={14} />
              <span>Home</span>
            </button>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--grad-brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Waypoints size={16} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: '0.96rem', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
                Application <span className="brand-text">Mind Map</span>
              </h1>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0 }}>
                Your individual application journey — click a node to see details directly
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: `1px solid ${me.color}44`,
              borderRadius: 'var(--radius-sm)',
              padding: '4px 10px 4px 4px',
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
        </div>
      </header>

      <main
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '14px 16px 48px',
          width: '100%',
          flex: 1,
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
        }}
      >
        {/* Map */}
        <section
          className="glass-panel"
          style={{ flex: 1, minWidth: 0, padding: '10px 12px 20px', overflowX: 'auto' }}
        >
          {/* Toolbar */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
              flexWrap: 'wrap',
              paddingBottom: '10px',
              borderBottom: '1px solid var(--border-grid)',
              marginBottom: '10px',
            }}
          >
            <button
              type="button"
              onClick={() => setShowAll(false)}
              style={{
                ...toolbarBtn,
                background: !showAll ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${!showAll ? '#818cf8' : 'var(--border-subtle)'}`,
                color: !showAll ? '#c7d2fe' : 'var(--text-secondary)',
              }}
            >
              <Target size={13} />
              <span>My Journey</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAll(true)}
              style={{
                ...toolbarBtn,
                background: showAll ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${showAll ? '#38bdf8' : 'var(--border-subtle)'}`,
                color: showAll ? '#bae6fd' : 'var(--text-secondary)',
              }}
            >
              <LayoutGrid size={13} />
              <span>Full Catalog</span>
            </button>

            <span style={{ width: '1px', height: '18px', background: 'var(--border-subtle)', margin: '0 2px' }} />

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleExpandAll}
              style={{ height: '28px', padding: '0 10px', fontSize: '0.72rem' }}
              title="Expand every branch"
            >
              <ChevronDown size={13} />
              <span>Expand all</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCollapseAll}
              style={{ height: '28px', padding: '0 10px', fontSize: '0.72rem' }}
              title="Collapse universities and subjects"
            >
              <ChevronRight size={13} />
              <span>Collapse all</span>
            </button>

            <span
              style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399' }} />
                Attempted
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4b5563' }} />
                Gray = unattempted professor / subject
              </span>
            </span>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <StatPill
              icon={<Target size={12} />}
              label="Professors"
              value={`${stats.profAttempted}/${stats.profTotal} attempted`}
              color={stats.profAttempted > 0 ? '#34d399' : '#94a3b8'}
            />
            <StatPill
              icon={<BookOpen size={12} />}
              label="Subjects"
              value={`${stats.subjAttempted}/${stats.subjTotal} attempted`}
              color={stats.subjAttempted > 0 ? '#38bdf8' : '#94a3b8'}
            />
            <StatPill
              icon={<GraduationCap size={12} />}
              label="Master's"
              value={`${visibleMasters.length}`}
              color="#fbbf24"
            />
            <StatPill
              icon={<Award size={12} />}
              label="Scholarships"
              value={`${visibleScholarships.length}`}
              color="#f472b6"
            />
          </div>

          {/* The mind map */}
          <ul className="mm-tree">
            <TreeNode
              node={tree}
              collapsed={collapsed}
              selectedId={selectedId}
              onToggle={handleToggle}
              onSelect={handleSelect}
            />
          </ul>
        </section>

        {/* Details — shows directly, no navigation */}
        <aside className={`mm-details${selection ? ' mm-details--open' : ''}`}>
          <MindMapDetails selection={selection} onClose={() => setSelection(null)} />
        </aside>
      </main>
    </div>
  );
}
