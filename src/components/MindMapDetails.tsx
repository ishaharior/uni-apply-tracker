'use client';

import React from 'react';
import { University, Department, Professor, MastersCourse, Scholarship } from '@/types';
import { getStatusMeta, getCourseStatusMeta, getCountryFlag, formatDate } from '@/lib/utils';
import {
  X,
  Building2,
  BookOpen,
  User,
  GraduationCap,
  Award,
  ExternalLink,
  Info,
} from 'lucide-react';

export type MindMapSelection =
  | { kind: 'university'; data: University }
  | { kind: 'department'; data: Department; universityName: string }
  | { kind: 'professor'; data: Professor; departmentName: string; universityName: string }
  | { kind: 'masters'; data: MastersCourse }
  | { kind: 'scholarship'; data: Scholarship };

interface MindMapDetailsProps {
  selection: MindMapSelection | null;
  onClose: () => void;
}

const isAttempted = (p: Professor): boolean =>
  Boolean(p.myOutreach && p.myOutreach.status !== 'not_contacted');

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
    return null;
  }
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '124px 1fr',
        gap: '8px',
        padding: '6px 0',
        borderBottom: '1px solid var(--border-grid)',
        fontSize: '0.78rem',
      }}
    >
      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

function SectionTitle({ text }: { text: string }) {
  return (
    <div
      style={{
        fontSize: '0.68rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--text-muted)',
        margin: '14px 0 6px',
      }}
    >
      {text}
    </div>
  );
}

function LinkButton({ href, label }: { href: string; label: string }) {
  if (!href) return null;
  const isExternal = href.startsWith('http');
  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className="btn btn-secondary"
      style={{ fontSize: '0.72rem', padding: '5px 9px', width: '100%' }}
    >
      <ExternalLink size={12} />
      <span>{label}</span>
    </a>
  );
}

function NoteBlock({ text }: { text?: string }) {
  if (!text?.trim()) return null;
  return (
    <div
      style={{
        background: '#0e0e12',
        border: '1px solid var(--border-grid)',
        borderRadius: 'var(--radius-sm)',
        padding: '9px 11px',
        fontSize: '0.78rem',
        lineHeight: 1.55,
        color: 'var(--text-primary)',
        whiteSpace: 'pre-wrap',
        marginTop: '4px',
      }}
    >
      {text}
    </div>
  );
}

function Chip({ text, color, bg, border }: { text: string; color: string; bg: string; border: string }) {
  return (
    <span
      className="mm-chip"
      style={{ color, background: bg, border: `1px solid ${border}`, height: '20px', fontSize: '0.64rem' }}
    >
      {text}
    </span>
  );
}

function DetailHeader({
  icon,
  accent,
  title,
  subtitle,
  onClose,
}: {
  icon: React.ReactNode;
  accent: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        paddingBottom: '10px',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '4px',
      }}
    >
      <div
        style={{
          width: '34px',
          height: '34px',
          borderRadius: 'var(--radius-sm)',
          background: `${accent}1f`,
          border: `1px solid ${accent}55`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '0.92rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: 1.25,
            wordBreak: 'break-word',
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{subtitle}</div>
        )}
      </div>
      <button
        type="button"
        className="xl-icon-btn"
        onClick={onClose}
        title="Close details"
        style={{ flexShrink: 0 }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

function UniversityDetails({ uni, onClose }: { uni: University; onClose: () => void }) {
  const professors = uni.departments.flatMap((d) => d.professors);
  const attempted = professors.filter(isAttempted).length;

  return (
    <>
      <DetailHeader
        icon={<Building2 size={17} color="#818cf8" />}
        accent="#818cf8"
        title={`${getCountryFlag(uni.country)} ${uni.name}`}
        subtitle={[uni.city, uni.country].filter(Boolean).join(' · ')}
        onClose={onClose}
      />
      {uni.ranking ? (
        <div style={{ margin: '8px 0 2px' }}>
          <Chip text={`Rank #${uni.ranking}`} color="#fde68a" bg="rgba(251,191,36,0.14)" border="rgba(251,191,36,0.4)" />
        </div>
      ) : null}
      <div style={{ marginTop: '6px' }}>
        <Row label="Country" value={uni.country} />
        <Row label="City" value={uni.city} />
        <Row label="Departments" value={uni.departments.length} />
        <Row label="Professors" value={professors.length} />
        <Row
          label="Attempted"
          value={
            <span style={{ color: attempted > 0 ? '#34d399' : '#fbbf24', fontWeight: 700 }}>
              {attempted} / {professors.length} professors contacted
            </span>
          }
        />
        <Row label="Added" value={formatDate(uni.createdAt)} />
      </div>

      {uni.departments.length > 0 && (
        <>
          <SectionTitle text="Subjects (Departments)" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {uni.departments.map((d) => {
              const dAttempted = d.professors.filter(isAttempted).length;
              return (
                <div
                  key={d.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    background: dAttempted > 0 ? 'rgba(56,189,248,0.07)' : 'rgba(255,255,255,0.025)',
                    border: `1px solid ${dAttempted > 0 ? 'rgba(56,189,248,0.25)' : 'var(--border-grid)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 9px',
                    fontSize: '0.75rem',
                  }}
                >
                  <span style={{ color: dAttempted > 0 ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: 600 }}>
                    {d.name}
                  </span>
                  <span style={{ color: dAttempted > 0 ? '#38bdf8' : 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {dAttempted}/{d.professors.length}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      <SectionTitle text="Links" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <LinkButton href={uni.websiteUrl || ''} label="University Website" />
        <LinkButton href={uni.portalUrl || ''} label="Application Portal" />
      </div>

      {uni.notes && (
        <>
          <SectionTitle text="Notes" />
          <NoteBlock text={uni.notes} />
        </>
      )}
    </>
  );
}

function DepartmentDetails({
  dept,
  universityName,
  onClose,
}: {
  dept: Department;
  universityName: string;
  onClose: () => void;
}) {
  const attempted = dept.professors.filter(isAttempted).length;
  const feeWaiver =
    dept.requirements?.feeWaiverAvailable === undefined
      ? undefined
      : dept.requirements.feeWaiverAvailable
        ? 'Available'
        : 'Not available';

  return (
    <>
      <DetailHeader
        icon={<BookOpen size={17} color="#38bdf8" />}
        accent="#38bdf8"
        title={dept.name}
        subtitle={universityName}
        onClose={onClose}
      />
      <div style={{ margin: '8px 0 2px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <Chip text={dept.degreeLevel} color="#bae6fd" bg="rgba(56,189,248,0.12)" border="rgba(56,189,248,0.35)" />
        <Chip
          text={`${attempted}/${dept.professors.length} attempted`}
          color={attempted > 0 ? '#34d399' : '#6b6b75'}
          bg={attempted > 0 ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.04)'}
          border={attempted > 0 ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}
        />
      </div>
      <div style={{ marginTop: '6px' }}>
        <Row label="Degree Level" value={dept.degreeLevel} />
        <Row label="Fall Deadline" value={formatDate(dept.deadlines?.fall)} />
        <Row label="Spring Deadline" value={formatDate(dept.deadlines?.spring)} />
        <Row label="GRE" value={dept.requirements?.gre} />
        <Row label="TOEFL / IELTS" value={dept.requirements?.toeflOrIelts} />
        <Row label="Fee Waiver" value={feeWaiver} />
        <Row label="Fee Waiver Notes" value={dept.requirements?.feeWaiverNotes} />
        <Row label="Professors" value={dept.professors.length} />
      </div>
      <SectionTitle text="Links" />
      <LinkButton href={dept.websiteUrl || ''} label="Department Website" />
    </>
  );
}

function ProfessorDetails({
  prof,
  departmentName,
  universityName,
  onClose,
}: {
  prof: Professor;
  departmentName: string;
  universityName: string;
  onClose: () => void;
}) {
  const attempted = isAttempted(prof);
  const status = prof.myOutreach?.status || 'not_contacted';
  const meta = getStatusMeta(status);
  const acceptingColor =
    prof.acceptingStudents === 'yes'
      ? '#34d399'
      : prof.acceptingStudents === 'no'
        ? '#fca5a5'
        : prof.acceptingStudents === 'maybe'
          ? '#fbbf24'
          : 'var(--text-muted)';

  return (
    <>
      <DetailHeader
        icon={<User size={17} color={attempted ? meta.color : '#6b6b75'} />}
        accent={attempted ? meta.color : '#6b6b75'}
        title={prof.name}
        subtitle={[prof.title, departmentName, universityName].filter(Boolean).join(' · ')}
        onClose={onClose}
      />
      {!attempted && (
        <div
          style={{
            margin: '8px 0 2px',
            padding: '7px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255,255,255,0.03)',
            border: '1px dashed rgba(255,255,255,0.14)',
            color: 'var(--text-muted)',
            fontSize: '0.72rem',
            fontWeight: 600,
          }}
        >
          Unattempted — you have not started outreach with this professor yet.
        </div>
      )}
      <div style={{ margin: '8px 0 2px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <Chip text={meta.label} color={meta.color} bg={meta.bg} border={meta.border} />
        <Chip
          text={`Accepting: ${prof.acceptingStudents}`}
          color={acceptingColor}
          bg="rgba(255,255,255,0.05)"
          border="rgba(255,255,255,0.14)"
        />
        {prof.onMyList && (
          <Chip text="On My List" color="#c7d2fe" bg="rgba(99,102,241,0.16)" border="rgba(99,102,241,0.4)" />
        )}
      </div>
      <div style={{ marginTop: '6px' }}>
        <Row label="Email" value={prof.email ? <a href={`mailto:${prof.email}`} style={{ color: '#38bdf8' }}>{prof.email}</a> : undefined} />
        <Row
          label="Research Areas"
          value={
            prof.researchAreas.length > 0 ? (
              <span style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {prof.researchAreas.map((area) => (
                  <span
                    key={area}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-full)',
                      padding: '1px 8px',
                      fontSize: '0.68rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {area}
                  </span>
                ))}
              </span>
            ) : undefined
          }
        />
        <Row label="Emailed" value={formatDate(prof.myOutreach?.dateEmailed)} />
        <Row label="Response" value={formatDate(prof.myOutreach?.responseDate)} />
        <Row label="Follow-up" value={formatDate(prof.myOutreach?.followUpDate)} />
        <Row label="Last Updated" value={formatDate(prof.myOutreach?.lastUpdated)} />
        <Row label="Visibility" value={prof.visibility === 'private' ? 'Private' : 'Public'} />
      </div>

      {prof.myOutreach?.emailSubject && (
        <>
          <SectionTitle text="Email Subject" />
          <NoteBlock text={prof.myOutreach.emailSubject} />
        </>
      )}
      {prof.notes && (
        <>
          <SectionTitle text="Notes" />
          <NoteBlock text={prof.notes} />
        </>
      )}

      <SectionTitle text="Links" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <LinkButton href={prof.websiteUrl || ''} label="Professor Website" />
        <LinkButton href={prof.scholarUrl || ''} label="Google Scholar" />
      </div>
    </>
  );
}

function MastersDetails({ course, onClose }: { course: MastersCourse; onClose: () => void }) {
  const statusMeta = getCourseStatusMeta(course.myStatus);
  return (
    <>
      <DetailHeader
        icon={<GraduationCap size={17} color="#fbbf24" />}
        accent="#fbbf24"
        title={course.universityName}
        subtitle={course.departmentName}
        onClose={onClose}
      />
      <div style={{ margin: '8px 0 2px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <Chip
          text={course.onMyList ? statusMeta.label : 'Not in my list'}
          color={course.onMyList ? statusMeta.color : '#6b6b75'}
          bg={course.onMyList ? statusMeta.bg : 'rgba(255,255,255,0.04)'}
          border={course.onMyList ? statusMeta.border : 'rgba(255,255,255,0.1)'}
        />
        {course.isMine && (
          <Chip text="Yours" color="#34d399" bg="rgba(16,185,129,0.14)" border="rgba(16,185,129,0.4)" />
        )}
        <Chip
          text={course.visibility === 'private' ? 'Private' : 'Public'}
          color="var(--text-secondary)"
          bg="rgba(255,255,255,0.05)"
          border="rgba(255,255,255,0.14)"
        />
      </div>
      <div style={{ marginTop: '6px' }}>
        <Row label="IELTS / TOEFL" value={course.ieltsReq} />
        <Row label="Last Date" value={course.lastDate} />
        <Row label="Owner" value={course.ownerName} />
        <Row label="Added" value={formatDate(course.createdAt)} />
        <Row label="Updated" value={formatDate(course.updatedAt)} />
      </div>
      {course.description && (
        <>
          <SectionTitle text="Description" />
          <NoteBlock text={course.description} />
        </>
      )}
      <SectionTitle text="Links" />
      <LinkButton href={course.applicationLink || ''} label="Application Link" />
    </>
  );
}

function ScholarshipDetails({ scholarship, onClose }: { scholarship: Scholarship; onClose: () => void }) {
  return (
    <>
      <DetailHeader
        icon={<Award size={17} color="#f472b6" />}
        accent="#f472b6"
        title={scholarship.title}
        subtitle={scholarship.organization}
        onClose={onClose}
      />
      <div style={{ margin: '8px 0 2px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {scholarship.isMine && (
          <Chip text="Yours" color="#34d399" bg="rgba(16,185,129,0.14)" border="rgba(16,185,129,0.4)" />
        )}
        <Chip
          text={scholarship.visibility === 'private' ? 'Private' : 'Public'}
          color="var(--text-secondary)"
          bg="rgba(255,255,255,0.05)"
          border="rgba(255,255,255,0.14)"
        />
      </div>
      <div style={{ marginTop: '6px' }}>
        <Row label="Organization" value={scholarship.organization} />
        <Row label="Degree Level" value={scholarship.degreeLevel} />
        <Row label="Amount" value={scholarship.amount} />
        <Row label="Deadline" value={scholarship.deadline} />
        <Row label="Country" value={scholarship.country ? `${getCountryFlag(scholarship.country)} ${scholarship.country}` : undefined} />
        <Row label="Owner" value={scholarship.ownerName} />
        <Row label="Updated" value={formatDate(scholarship.updatedAt)} />
      </div>
      {scholarship.description && (
        <>
          <SectionTitle text="Description" />
          <NoteBlock text={scholarship.description} />
        </>
      )}
      <SectionTitle text="Links" />
      <LinkButton href={scholarship.applicationLink || ''} label="Application Link" />
    </>
  );
}

function EmptyState() {
  return (
    <div style={{ padding: '4px 0' }}>
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(99,102,241,0.14)',
          border: '1px solid rgba(129,140,248,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '10px 0 12px',
        }}
      >
        <Info size={20} color="#818cf8" />
      </div>
      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
        No node selected
      </div>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
        Click any <strong style={{ color: '#a5b4fc' }}>university</strong>,{' '}
        <strong style={{ color: '#fbbf24' }}>master&apos;s course</strong> or{' '}
        <strong style={{ color: '#f472b6' }}>scholarship</strong> in the mind map and its details will appear here
        directly — no page change needed.
      </p>

      <SectionTitle text="Legend" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#34d399', flexShrink: 0 }} />
          Attempted — outreach sent or status updated
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4b5563', flexShrink: 0 }} />
          Gray shade — unattempted professor or subject
        </div>
      </div>
    </div>
  );
}

export default function MindMapDetails({ selection, onClose }: MindMapDetailsProps) {
  return (
    <div className="glass-panel mm-details-panel" style={{ padding: '14px 14px 18px' }}>
      {!selection ? (
        <EmptyState />
      ) : selection.kind === 'university' ? (
        <UniversityDetails uni={selection.data} onClose={onClose} />
      ) : selection.kind === 'department' ? (
        <DepartmentDetails dept={selection.data} universityName={selection.universityName} onClose={onClose} />
      ) : selection.kind === 'professor' ? (
        <ProfessorDetails
          prof={selection.data}
          departmentName={selection.departmentName}
          universityName={selection.universityName}
          onClose={onClose}
        />
      ) : selection.kind === 'masters' ? (
        <MastersDetails course={selection.data} onClose={onClose} />
      ) : (
        <ScholarshipDetails scholarship={selection.data} onClose={onClose} />
      )}
    </div>
  );
}
