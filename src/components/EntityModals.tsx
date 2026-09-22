'use client';

import React, { useState, useEffect } from 'react';
import { University, Department, Professor } from '@/types';
import { X, Building2, School, UserPlus } from 'lucide-react';

/* -------------------------------------------------------------
 * 1. ADD / EDIT UNIVERSITY MODAL
 * ----------------------------------------------------------- */
interface UniversityModalProps {
  isOpen: boolean;
  editingUniversity: University | null;
  onClose: () => void;
  onSave: (universityData: Partial<University>) => Promise<void>;
}

export function UniversityModal({
  isOpen,
  editingUniversity,
  onClose,
  onSave,
}: UniversityModalProps) {
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [ranking, setRanking] = useState('');
  const [portalUrl, setPortalUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingUniversity) {
      setName(editingUniversity.name || '');
      setCountry(editingUniversity.country || '');
      setCity(editingUniversity.city || '');
      setRanking(editingUniversity.ranking ? String(editingUniversity.ranking) : '');
      setPortalUrl(editingUniversity.portalUrl || '');
      setWebsiteUrl(editingUniversity.websiteUrl || '');
      setNotes(editingUniversity.notes || '');
    } else {
      setName('');
      setCountry('United States');
      setCity('');
      setRanking('');
      setPortalUrl('');
      setWebsiteUrl('');
      setNotes('');
    }
  }, [editingUniversity, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        country: country.trim(),
        city: city.trim(),
        ranking: ranking ? parseInt(ranking, 10) : undefined,
        portalUrl: portalUrl.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(5, 8, 16, 0.8)',
        backdropFilter: 'blur(8px)',
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
          maxWidth: '520px',
          padding: '28px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={22} color="#818cf8" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {editingUniversity ? 'Edit University' : 'Add New University'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              University Name *
            </label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="e.g. Stanford University"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Country *
              </label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="e.g. United States"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                City / State
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Stanford, CA"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Global / CS Rank
              </label>
              <input
                type="number"
                className="input-field"
                placeholder="e.g. 5"
                value={ranking}
                onChange={(e) => setRanking(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Application Portal URL
              </label>
              <input
                type="url"
                className="input-field"
                placeholder="https://..."
                value={portalUrl}
                onChange={(e) => setPortalUrl(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Official Website
            </label>
            <input
              type="url"
              className="input-field"
              placeholder="https://stanford.edu"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Notes & Deadlines Overview
            </label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="General tips, application fees, or shared deadline notes for the catalog..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingUniversity ? 'Update University' : 'Add University'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
 * 2. ADD / EDIT DEPARTMENT MODAL
 * ----------------------------------------------------------- */
interface DepartmentModalProps {
  isOpen: boolean;
  universityId: string;
  universityName: string;
  editingDepartment: Department | null;
  onClose: () => void;
  onSave: (universityId: string, departmentData: Partial<Department>) => Promise<void>;
}

export function DepartmentModal({
  isOpen,
  universityId,
  universityName,
  editingDepartment,
  onClose,
  onSave,
}: DepartmentModalProps) {
  const [name, setName] = useState('');
  const [degreeLevel, setDegreeLevel] = useState<'PhD' | 'MS' | 'PhD & MS' | 'BS/MS'>('PhD');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [fallDeadline, setFallDeadline] = useState('');
  const [springDeadline, setSpringDeadline] = useState('');
  const [gre, setGre] = useState('');
  const [toeflOrIelts, setToeflOrIelts] = useState('');
  const [feeWaiverAvailable, setFeeWaiverAvailable] = useState(false);
  const [feeWaiverNotes, setFeeWaiverNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingDepartment) {
      setName(editingDepartment.name || '');
      setDegreeLevel(editingDepartment.degreeLevel || 'PhD');
      setWebsiteUrl(editingDepartment.websiteUrl || '');
      setFallDeadline(editingDepartment.deadlines?.fall || '');
      setSpringDeadline(editingDepartment.deadlines?.spring || '');
      setGre(editingDepartment.requirements?.gre || '');
      setToeflOrIelts(editingDepartment.requirements?.toeflOrIelts || '');
      setFeeWaiverAvailable(editingDepartment.requirements?.feeWaiverAvailable || false);
      setFeeWaiverNotes(editingDepartment.requirements?.feeWaiverNotes || '');
    } else {
      setName('');
      setDegreeLevel('PhD');
      setWebsiteUrl('');
      setFallDeadline('2026-12-15');
      setSpringDeadline('');
      setGre('Optional / Not Required');
      setToeflOrIelts('TOEFL 100+ / IELTS 7.5+');
      setFeeWaiverAvailable(false);
      setFeeWaiverNotes('');
    }
  }, [editingDepartment, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(universityId, {
        name: name.trim(),
        degreeLevel,
        websiteUrl: websiteUrl.trim() || undefined,
        deadlines: {
          fall: fallDeadline.trim() || undefined,
          spring: springDeadline.trim() || undefined,
        },
        requirements: {
          gre: gre.trim() || undefined,
          toeflOrIelts: toeflOrIelts.trim() || undefined,
          feeWaiverAvailable,
          feeWaiverNotes: feeWaiverNotes.trim() || undefined,
        },
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(5, 8, 16, 0.8)',
        backdropFilter: 'blur(8px)',
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
          maxWidth: '540px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '28px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <School size={20} color="#c084fc" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {editingDepartment ? 'Edit Department' : 'Add New Department'}
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Under {universityName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Department Name *
            </label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="e.g. Department of Computer Science"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Degree Program *
              </label>
              <select
                className="input-field"
                value={degreeLevel}
                onChange={(e) => setDegreeLevel(e.target.value as Department['degreeLevel'])}
              >
                <option value="PhD">PhD</option>
                <option value="MS">MS</option>
                <option value="PhD & MS">PhD & MS</option>
                <option value="BS/MS">BS/MS</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Fall Deadline
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Dec 15"
                value={fallDeadline}
                onChange={(e) => setFallDeadline(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                GRE Policy
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Not Required / Optional"
                value={gre}
                onChange={(e) => setGre(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                English Requirements
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. TOEFL 100+ / IELTS 7.5+"
                value={toeflOrIelts}
                onChange={(e) => setToeflOrIelts(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Department Website URL
            </label>
            <input
              type="url"
              className="input-field"
              placeholder="https://..."
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
          </div>

          {/* Fee waiver checkbox */}
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', color: '#34d399', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={feeWaiverAvailable}
                onChange={(e) => setFeeWaiverAvailable(e.target.checked)}
              />
              Application Fee Waiver Available
            </label>
            {feeWaiverAvailable && (
              <input
                type="text"
                className="input-field"
                style={{ marginTop: '8px' }}
                placeholder="e.g. Apply before Nov 15 via graduate diversity program"
                value={feeWaiverNotes}
                onChange={(e) => setFeeWaiverNotes(e.target.value)}
              />
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingDepartment ? 'Update Department' : 'Add Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
 * 3. ADD / EDIT PROFESSOR MODAL
 * ----------------------------------------------------------- */
interface ProfessorModalProps {
  isOpen: boolean;
  universityId: string;
  departmentId: string;
  departmentName: string;
  editingProfessor: Professor | null;
  onClose: () => void;
  onSave: (universityId: string, departmentId: string, professorData: Partial<Professor>) => Promise<void>;
}

export function ProfessorModal({
  isOpen,
  universityId,
  departmentId,
  departmentName,
  editingProfessor,
  onClose,
  onSave,
}: ProfessorModalProps) {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [scholarUrl, setScholarUrl] = useState('');
  const [researchAreas, setResearchAreas] = useState('');
  const [acceptingStudents, setAcceptingStudents] = useState<'yes' | 'no' | 'unknown' | 'maybe'>('unknown');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingProfessor) {
      setName(editingProfessor.name || '');
      setTitle(editingProfessor.title || 'Professor');
      setEmail(editingProfessor.email || '');
      setWebsiteUrl(editingProfessor.websiteUrl || '');
      setScholarUrl(editingProfessor.scholarUrl || '');
      setResearchAreas(
        Array.isArray(editingProfessor.researchAreas)
          ? editingProfessor.researchAreas.join(', ')
          : ''
      );
      setAcceptingStudents(editingProfessor.acceptingStudents || 'unknown');
      setNotes(editingProfessor.notes || '');
    } else {
      setName('');
      setTitle('Assistant Professor');
      setEmail('');
      setWebsiteUrl('');
      setScholarUrl('');
      setResearchAreas('Machine Learning, Deep Learning');
      setAcceptingStudents('yes');
      setNotes('');
    }
  }, [editingProfessor, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(universityId, departmentId, {
        name: name.trim(),
        title: title.trim(),
        email: email.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        scholarUrl: scholarUrl.trim() || undefined,
        researchAreas: researchAreas.split(',').map((s) => s.trim()).filter(Boolean),
        acceptingStudents,
        notes: notes.trim() || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(5, 8, 16, 0.8)',
        backdropFilter: 'blur(8px)',
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
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '28px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={20} color="#38bdf8" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {editingProfessor ? 'Edit Professor' : 'Add New Professor'}
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Adding to {departmentName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Professor Full Name *
              </label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="e.g. Prof. Michael I. Jordan"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Title
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Associate Professor"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Official Email Address *
              </label>
              <input
                type="email"
                required
                className="input-field"
                placeholder="e.g. professor@cs.university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Accepting Students?
              </label>
              <select
                className="input-field"
                value={acceptingStudents}
                onChange={(e) => setAcceptingStudents(e.target.value as Professor['acceptingStudents'])}
              >
                <option value="yes">Yes - Accepting</option>
                <option value="maybe">Maybe / Inquire</option>
                <option value="no">Not Accepting</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Research Areas / Keywords (comma-separated)
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Large Language Models, Multi-Agent Systems, Robotics Vision"
              value={researchAreas}
              onChange={(e) => setResearchAreas(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Google Scholar Profile URL
              </label>
              <input
                type="url"
                className="input-field"
                placeholder="https://scholar.google.com/citations?user=..."
                value={scholarUrl}
                onChange={(e) => setScholarUrl(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Lab / Personal Webpage
              </label>
              <input
                type="url"
                className="input-field"
                placeholder="https://lab.university.edu"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Internal Research Notes / Paper Highlights
            </label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="Recent papers of interest, grants, lab advice for cold outreach..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingProfessor ? 'Update Professor' : 'Add Professor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
