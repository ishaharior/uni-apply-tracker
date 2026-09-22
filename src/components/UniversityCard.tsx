'use client';

import React, { useState } from 'react';
import { University, Department, Professor, User } from '@/types';
import { 
  Building2, 
  MapPin, 
  Award, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Edit2, 
  Trash2, 
  Globe 
} from 'lucide-react';
import DepartmentSection from './DepartmentSection';

interface UniversityCardProps {
  university: University;
  me: User;
  defaultExpanded?: boolean;
  onOpenAddDepartment: (universityId: string) => void;
  onOpenAddProfessor: (universityId: string, departmentId: string) => void;
  onOpenStatusModal: (professor: Professor) => void;
  onEditUniversity: (university: University) => void;
  onDeleteUniversity: (universityId: string) => void;
  onEditDepartment: (department: Department) => void;
  onDeleteDepartment: (universityId: string, departmentId: string) => void;
  onEditProfessor: (professor: Professor) => void;
  onDeleteProfessor: (universityId: string, departmentId: string, professorId: string) => void;
}

export default function UniversityCard({
  university,
  me,
  defaultExpanded = true,
  onOpenAddDepartment,
  onOpenAddProfessor,
  onOpenStatusModal,
  onEditUniversity,
  onDeleteUniversity,
  onEditDepartment,
  onDeleteDepartment,
  onEditProfessor,
  onDeleteProfessor,
}: UniversityCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Compute university stats (my outreach only)
  let totalProfessors = 0;
  let myContacted = 0;

  university.departments.forEach((dept) => {
    totalProfessors += dept.professors.length;
    dept.professors.forEach((p) => {
      if (p.myOutreach && p.myOutreach.status !== 'not_contacted') {
        myContacted++;
      }
    });
  });

  return (
    <div
      className="glass-panel"
      style={{
        marginBottom: '24px',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* University Card Header */}
      <div
        style={{
          padding: '20px 24px',
          background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          borderBottom: expanded ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 300px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.25))',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Building2 size={24} color="#a5b4fc" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {university.name}
              </h2>

              {university.ranking && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: 'rgba(251, 191, 36, 0.15)',
                    color: '#fbbf24',
                    border: '1px solid rgba(251, 191, 36, 0.35)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Award size={12} />
                  <span>Rank #{university.ranking}</span>
                </span>
              )}
            </div>

            {/* Sub-meta: Location, Portal, Website */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', marginTop: '6px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <MapPin size={14} color="#f43f5e" />
                <span>{university.city ? `${university.city}, ` : ''}{university.country}</span>
              </span>

              {university.portalUrl && (
                <a
                  href={university.portalUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: '0.8rem',
                    color: '#38bdf8',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>App Portal</span>
                  <ExternalLink size={12} />
                </a>
              )}

              {university.websiteUrl && (
                <a
                  href={university.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Globe size={12} />
                  <span>Official Site</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Quick Counts, Add Department, Expand Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Summary Pills */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {university.departments.length} Depts
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {totalProfessors} Professors
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                color: me.color,
                background: me.accentBg,
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${me.color}55`,
              }}
              title="Professors you have contacted"
            >
              {myContacted}/{totalProfessors} Mine
            </span>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => onOpenAddDepartment(university.id)}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            <Plus size={15} />
            <span>Add Dept</span>
          </button>

          <button
            onClick={() => onEditUniversity(university)}
            style={{
              padding: '7px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.04)',
              color: 'var(--text-muted)',
            }}
            title="Edit University"
          >
            <Edit2 size={15} />
          </button>

          <button
            onClick={() => onDeleteUniversity(university.id)}
            style={{
              padding: '7px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.08)',
              color: '#f87171',
            }}
            title="Delete University"
          >
            <Trash2 size={15} />
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              padding: '7px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-primary)',
            }}
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* University Notes (if any) */}
      {expanded && university.notes && (
        <div
          style={{
            padding: '10px 24px',
            background: 'rgba(99, 102, 241, 0.05)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            fontSize: '0.82rem',
            color: '#c7d2fe',
          }}
        >
          💡 <strong>Notes:</strong> {university.notes}
        </div>
      )}

      {/* Accordion Body: Departments */}
      {expanded && (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {university.departments.length > 0 ? (
            university.departments.map((dept) => (
              <DepartmentSection
                key={dept.id}
                department={dept}
                universityId={university.id}
                universityName={university.name}
                me={me}
                onOpenAddProfessor={onOpenAddProfessor}
                onOpenStatusModal={onOpenStatusModal}
                onEditProfessor={onEditProfessor}
                onDeleteProfessor={(profId) => onDeleteProfessor(university.id, dept.id, profId)}
                onEditDepartment={onEditDepartment}
                onDeleteDepartment={(deptId) => onDeleteDepartment(university.id, deptId)}
              />
            ))
          ) : (
            <div
              style={{
                padding: '32px',
                textAlign: 'center',
                background: 'rgba(15, 23, 42, 0.3)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed rgba(255, 255, 255, 0.1)',
              }}
            >
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                No departments added under {university.name} yet.
              </p>
              <button
                className="btn btn-secondary"
                onClick={() => onOpenAddDepartment(university.id)}
                style={{ fontSize: '0.82rem' }}
              >
                <Plus size={15} />
                <span>Add Department</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
