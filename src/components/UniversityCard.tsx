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
  Globe,
} from 'lucide-react';
import DepartmentSection from './DepartmentSection';

interface UniversityCardProps {
  university: University;
  me: User;
  defaultExpanded?: boolean;
  onOpenAddDepartment: (universityId: string) => void;
  onOpenAddProfessor: (universityId: string, departmentId: string) => void;
  onOpenStatusModal: (professor: Professor) => void;
  onOpenDetail: (professor: Professor) => void;
  onEditUniversity: (university: University) => void;
  onDeleteUniversity: (universityId: string) => void;
  onEditDepartment: (department: Department) => void;
  onDeleteDepartment: (universityId: string, departmentId: string) => void;
  onEditProfessor: (professor: Professor) => void;
  onDeleteProfessor: (universityId: string, departmentId: string, professorId: string) => void;
  onToggleProfessorVisibility: (professor: Professor) => void;
  onToggleProfessorList: (professor: Professor) => void;
}

export default function UniversityCard({
  university,
  me,
  defaultExpanded = true,
  onOpenAddDepartment,
  onOpenAddProfessor,
  onOpenStatusModal,
  onOpenDetail,
  onEditUniversity,
  onDeleteUniversity,
  onEditDepartment,
  onDeleteDepartment,
  onEditProfessor,
  onDeleteProfessor,
  onToggleProfessorVisibility,
  onToggleProfessorList,
}: UniversityCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>({});

  let totalProfessors = 0;
  let myContacted = 0;
  university.departments.forEach((dept) => {
    totalProfessors += dept.professors.length;
    dept.professors.forEach((p) => {
      if (p.myOutreach && p.myOutreach.status !== 'not_contacted') myContacted++;
    });
  });

  const toggleDept = (id: string) =>
    setOpenDepts((prev) => ({ ...prev, [id]: prev[id] === undefined ? true : !prev[id] }));

  return (
    <div className="xl-wrap" style={{ marginBottom: 12 }}>
      {/* University group row — compact spreadsheet header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 12px',
          background: 'linear-gradient(90deg, #101016 0%, #0c0c10 100%)',
          borderBottom: expanded ? '1px solid var(--border-grid)' : 'none',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          className="xl-icon-btn"
          onClick={() => setExpanded(!expanded)}
          title={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        <Building2 size={15} color="#818cf8" style={{ flexShrink: 0 }} />
        <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 700 }}>
          {university.name}
        </strong>
        {university.ranking && (
          <span
            className="xl-chip"
            style={{
              color: '#fbbf24',
              background: 'rgba(251,191,36,0.1)',
              borderColor: 'rgba(251,191,36,0.28)',
            }}
          >
            <Award size={10} /> #{university.ranking}
          </span>
        )}
        <span
          className="xl-chip"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            color: 'var(--text-secondary)',
            background: 'rgba(255,255,255,0.03)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <MapPin size={10} color="#f43f5e" />
          {university.city ? `${university.city}, ` : ''}
          {university.country}
        </span>
        <span className="xl-cell-muted">
          {university.departments.length} dept · {totalProfessors} prof ·{' '}
          <span style={{ color: me.color }}>
            {myContacted}/{totalProfessors} mine
          </span>
        </span>

        <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          {university.portalUrl && (
            <a
              href={university.portalUrl}
              target="_blank"
              rel="noreferrer"
              className="xl-icon-btn"
              title="Application portal"
            >
              <ExternalLink size={13} />
            </a>
          )}
          {university.websiteUrl && (
            <a
              href={university.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="xl-icon-btn"
              title="Official site"
            >
              <Globe size={13} />
            </a>
          )}
          <button
            type="button"
            className="btn btn-primary"
            style={{ fontSize: '0.72rem', padding: '3px 8px' }}
            onClick={() => onOpenAddDepartment(university.id)}
          >
            <Plus size={12} />
            Dept
          </button>
          <button
            type="button"
            className="xl-icon-btn"
            onClick={() => onEditUniversity(university)}
            title="Edit university"
          >
            <Edit2 size={14} />
          </button>
          <button
            type="button"
            className="xl-icon-btn danger"
            onClick={() => onDeleteUniversity(university.id)}
            title="Delete university"
          >
            <Trash2 size={14} />
          </button>
        </span>
      </div>

      {expanded && university.notes && (
        <div
          style={{
            padding: '5px 12px',
            fontSize: '0.75rem',
            color: '#c7d2fe',
            background: 'rgba(99,102,241,0.04)',
            borderBottom: '1px solid var(--border-grid)',
          }}
        >
          📌 {university.notes}
        </div>
      )}

      {expanded && (
        <div style={{ padding: '8px 10px 2px' }}>
          {university.departments.length > 0 ? (
            university.departments.map((dept) => (
              <DepartmentSection
                key={dept.id}
                department={dept}
                universityId={university.id}
                universityName={university.name}
                me={me}
                expanded={openDepts[dept.id] !== false}
                onToggleExpand={() => toggleDept(dept.id)}
                onOpenAddProfessor={onOpenAddProfessor}
                onOpenStatusModal={onOpenStatusModal}
                onOpenDetail={onOpenDetail}
                onEditProfessor={onEditProfessor}
                onDeleteProfessor={(profId) => onDeleteProfessor(university.id, dept.id, profId)}
                onToggleVisibility={onToggleProfessorVisibility}
                onToggleList={onToggleProfessorList}
                onEditDepartment={onEditDepartment}
                onDeleteDepartment={(deptId) => onDeleteDepartment(university.id, deptId)}
              />
            ))
          ) : (
            <div
              style={{
                padding: '16px',
                textAlign: 'center',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                border: '1px dashed var(--border-grid)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              No departments.{' '}
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.72rem', padding: '3px 8px', marginLeft: 6 }}
                onClick={() => onOpenAddDepartment(university.id)}
              >
                <Plus size={12} />
                Add department
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
