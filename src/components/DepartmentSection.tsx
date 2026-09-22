'use client';

import React from 'react';
import { Department, Professor, User } from '@/types';
import {
  GraduationCap,
  Calendar,
  FileCheck,
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
  Users,
} from 'lucide-react';
import ProfessorCard from './ProfessorCard';

interface DepartmentSectionProps {
  department: Department;
  universityId: string;
  universityName: string;
  me: User;
  onOpenAddProfessor: (universityId: string, departmentId: string) => void;
  onOpenStatusModal: (professor: Professor) => void;
  onEditProfessor: (professor: Professor) => void;
  onDeleteProfessor: (professorId: string) => void;
  onEditDepartment: (department: Department) => void;
  onDeleteDepartment: (departmentId: string) => void;
}

export default function DepartmentSection({
  department,
  universityId,
  universityName,
  me,
  onOpenAddProfessor,
  onOpenStatusModal,
  onEditProfessor,
  onDeleteProfessor,
  onEditDepartment,
  onDeleteDepartment,
}: DepartmentSectionProps) {
  return (
    <div
      style={{
        background: 'rgba(10, 16, 28, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Department Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <GraduationCap size={18} color="#818cf8" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
              {department.name}
            </h3>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(99, 102, 241, 0.18)',
                color: '#a5b4fc',
                border: '1px solid rgba(99, 102, 241, 0.35)',
              }}
            >
              {department.degreeLevel}
            </span>
          </div>

          {/* Department Meta Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', marginTop: '6px' }}>
            {department.deadlines?.fall && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={13} color="#38bdf8" />
                <span>Fall Deadline: <strong style={{ color: '#e2e8f0' }}>{department.deadlines.fall}</strong></span>
              </span>
            )}

            {department.requirements?.gre && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <FileCheck size={13} color="#10b981" />
                <span>GRE: {department.requirements.gre}</span>
              </span>
            )}

            {department.requirements?.feeWaiverAvailable && (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: '#34d399',
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
                title={department.requirements.feeWaiverNotes || 'Fee waivers available for applicants'}
              >
                ✓ Fee Waiver Available
              </span>
            )}

            {department.websiteUrl && (
              <a
                href={department.websiteUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: '0.78rem',
                  color: '#818cf8',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>Dept Website</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>

        {/* Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn btn-primary"
            onClick={() => onOpenAddProfessor(universityId, department.id)}
            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
          >
            <Plus size={14} />
            <span>Add Professor</span>
          </button>
          <button
            onClick={() => onEditDepartment(department)}
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.04)',
              color: 'var(--text-muted)',
            }}
            title="Edit Department"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onDeleteDepartment(department.id)}
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.08)',
              color: '#f87171',
            }}
            title="Delete Department"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Professors List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {department.professors && department.professors.length > 0 ? (
          department.professors.map((prof) => (
            <ProfessorCard
              key={prof.id}
              professor={prof}
              universityName={universityName}
              departmentName={department.name}
              me={me}
              onOpenStatusModal={onOpenStatusModal}
              onEditProfessor={onEditProfessor}
              onDeleteProfessor={onDeleteProfessor}
            />
          ))
        ) : (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              background: 'rgba(15, 23, 42, 0.4)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
            }}
          >
            <Users size={28} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>
              No professors added to this department yet.
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => onOpenAddProfessor(universityId, department.id)}
              style={{ fontSize: '0.78rem', margin: '0 auto' }}
            >
              <Plus size={14} />
              <span>Add First Professor</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
