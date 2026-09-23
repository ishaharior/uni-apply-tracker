'use client';

import React from 'react';
import { Department, Professor, User } from '@/types';
import { Calendar, FileCheck, ExternalLink, Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import ProfessorRow from './ProfessorCard';

interface DepartmentSectionProps {
  department: Department;
  universityId: string;
  universityName: string;
  me: User;
  expanded: boolean;
  onToggleExpand: () => void;
  onOpenAddProfessor: (universityId: string, departmentId: string) => void;
  onOpenStatusModal: (professor: Professor) => void;
  onEditProfessor: (professor: Professor) => void;
  onDeleteProfessor: (professorId: string) => void;
  onToggleVisibility: (professor: Professor) => void;
  onToggleList: (professor: Professor) => void;
  onEditDepartment: (department: Department) => void;
  onDeleteDepartment: (departmentId: string) => void;
}

export default function DepartmentSection({
  department,
  universityId,
  me,
  expanded,
  onToggleExpand,
  onOpenAddProfessor,
  onOpenStatusModal,
  onEditProfessor,
  onDeleteProfessor,
  onToggleVisibility,
  onToggleList,
  onEditDepartment,
  onDeleteDepartment,
}: DepartmentSectionProps) {
  const metaBits: string[] = [];
  if (department.deadlines?.fall) metaBits.push(`Fall: ${department.deadlines.fall}`);
  if (department.requirements?.gre) metaBits.push(`GRE: ${department.requirements.gre}`);

  return (
    <div className="xl-wrap" style={{ margin: '0 0 8px', borderRadius: 'var(--radius-sm)' }}>
      {/* Dept toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '5px 10px',
          background: '#0b0b0f',
          borderBottom: expanded ? '1px solid var(--border-grid)' : 'none',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          className="xl-icon-btn"
          onClick={onToggleExpand}
          title={expanded ? 'Collapse' : 'Expand'}
          style={{ width: 22, height: 22 }}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c7d2fe' }}>{department.name}</span>
        <span
          className="xl-chip"
          style={{
            color: '#a5b4fc',
            background: 'rgba(99,102,241,0.1)',
            borderColor: 'rgba(99,102,241,0.25)',
          }}
        >
          {department.degreeLevel}
        </span>
        <span className="xl-cell-muted">{department.professors.length} profs</span>
        {metaBits.length > 0 && (
          <span className="xl-cell-muted" style={{ display: 'inline-flex', gap: 10 }}>
            {department.deadlines?.fall && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <Calendar size={11} color="#38bdf8" />
                {department.deadlines.fall}
              </span>
            )}
            {department.requirements?.gre && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <FileCheck size={11} color="#10b981" />
                {department.requirements.gre}
              </span>
            )}
            {department.requirements?.feeWaiverAvailable && (
              <span style={{ color: '#34d399' }}>✓ Fee waiver</span>
            )}
          </span>
        )}
        {department.websiteUrl && (
          <a
            href={department.websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="xl-icon-btn"
            title="Dept website"
          >
            <ExternalLink size={13} />
          </a>
        )}
        <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 4 }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{ fontSize: '0.72rem', padding: '3px 8px' }}
            onClick={() => onOpenAddProfessor(universityId, department.id)}
          >
            <Plus size={12} />
            Professor
          </button>
          <button
            type="button"
            className="xl-icon-btn"
            onClick={() => onEditDepartment(department)}
            title="Edit department"
          >
            <Edit2 size={13} />
          </button>
          <button
            type="button"
            className="xl-icon-btn danger"
            onClick={() => onDeleteDepartment(department.id)}
            title="Delete department"
          >
            <Trash2 size={13} />
          </button>
        </span>
      </div>

      {expanded && (
        <div style={{ overflowX: 'auto' }}>
          {department.professors.length > 0 ? (
            <table className="xl-table">
              <thead>
                <tr>
                  <th style={{ width: '16%' }}>Professor</th>
                  <th style={{ width: '11%' }}>Title</th>
                  <th style={{ width: '7%' }}>Accepting</th>
                  <th style={{ width: '16%' }}>Research</th>
                  <th style={{ width: '15%' }}>Email</th>
                  <th style={{ width: '7%' }}>Links</th>
                  <th style={{ width: '10%' }}>My Status</th>
                  <th style={{ width: '7%' }}>List</th>
                  <th style={{ width: '5%' }}>Vis</th>
                  <th style={{ width: '6%' }} />
                </tr>
              </thead>
              <tbody>
                {department.professors.map((prof) => (
                  <ProfessorRow
                    key={prof.id}
                    professor={prof}
                    me={me}
                    onOpenStatusModal={onOpenStatusModal}
                    onEditProfessor={onEditProfessor}
                    onDeleteProfessor={onDeleteProfessor}
                    onToggleVisibility={onToggleVisibility}
                    onToggleList={onToggleList}
                  />
                ))}
              </tbody>
            </table>
          ) : (
            <div
              style={{
                padding: '14px',
                textAlign: 'center',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
              }}
            >
              No professors yet.{' '}
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.72rem', padding: '3px 8px', marginLeft: 6 }}
                onClick={() => onOpenAddProfessor(universityId, department.id)}
              >
                <Plus size={12} />
                Add first
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
