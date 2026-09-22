'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppData, University, Department, Professor, FilterOptions, OutreachRecord } from '@/types';
import { isOverdueFollowup, getCountryFlag } from '@/lib/utils';
import Header from '@/components/Header';
import StatsDashboard from '@/components/StatsDashboard';
import FilterBar from '@/components/FilterBar';
import UniversityCard from '@/components/UniversityCard';
import StatusModal from '@/components/StatusModal';
import {
  UniversityModal,
  DepartmentModal,
  ProfessorModal,
} from '@/components/EntityModals';
import EmailTemplatesModal from '@/components/EmailTemplatesModal';
import ActivityModal from '@/components/ActivityModal';
import { Plus, Building2, RefreshCw } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    country: 'all',
    statusFilter: 'all',
    needsFollowUp: false,
    degreeLevel: 'all',
  });

  // Modal States
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    professor: Professor | null;
  }>({
    isOpen: false,
    professor: null,
  });

  const [uniModal, setUniModal] = useState<{
    isOpen: boolean;
    editingUniversity: University | null;
  }>({
    isOpen: false,
    editingUniversity: null,
  });

  const [deptModal, setDeptModal] = useState<{
    isOpen: boolean;
    universityId: string;
    universityName: string;
    editingDepartment: Department | null;
  }>({
    isOpen: false,
    universityId: '',
    universityName: '',
    editingDepartment: null,
  });

  const [profModal, setProfModal] = useState<{
    isOpen: boolean;
    universityId: string;
    departmentId: string;
    departmentName: string;
    editingProfessor: Professor | null;
  }>({
    isOpen: false,
    universityId: '',
    departmentId: '',
    departmentName: '',
    editingProfessor: null,
  });

  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }, [router]);

  // Fetch my private data from server API
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
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute unique countries
  const countries = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    data.universities.forEach((u) => {
      if (u.country) set.add(u.country);
    });
    return Array.from(set).sort();
  }, [data]);

  // Filter Engine — only my outreach is ever considered
  const filteredUniversities = useMemo(() => {
    if (!data) return [];
    const q = filters.searchQuery.trim().toLowerCase();

    return data.universities
      .map((uni) => {
        if (filters.country !== 'all' && uni.country !== filters.country) {
          return null;
        }

        const uniMatchesQuery =
          q === '' ||
          uni.name.toLowerCase().includes(q) ||
          uni.city.toLowerCase().includes(q) ||
          uni.country.toLowerCase().includes(q);

        const matchingDepartments = uni.departments
          .map((dept) => {
            const deptMatchesQuery = q === '' || dept.name.toLowerCase().includes(q);

            const matchingProfessors = dept.professors.filter((prof) => {
              const profMatchesQuery =
                q === '' ||
                uniMatchesQuery ||
                deptMatchesQuery ||
                prof.name.toLowerCase().includes(q) ||
                prof.title.toLowerCase().includes(q) ||
                prof.email.toLowerCase().includes(q) ||
                prof.researchAreas.some((area) => area.toLowerCase().includes(q));

              if (!profMatchesQuery) return false;

              // Status filter — my status only
              const myStatus = prof.myOutreach?.status || 'not_contacted';
              if (filters.statusFilter !== 'all' && myStatus !== filters.statusFilter) {
                return false;
              }

              // Overdue Follow-up Filter — my outreach only
              if (filters.needsFollowUp) {
                if (!isOverdueFollowup(prof.myOutreach?.dateEmailed, prof.myOutreach?.status)) {
                  return false;
                }
              }

              return true;
            });

            if (matchingProfessors.length === 0 && !deptMatchesQuery && !uniMatchesQuery) {
              return null;
            }

            return {
              ...dept,
              professors: matchingProfessors,
            };
          })
          .filter(Boolean) as Department[];

        if (matchingDepartments.length === 0 && !uniMatchesQuery) {
          return null;
        }

        return {
          ...uni,
          departments: matchingDepartments,
        };
      })
      .filter(Boolean) as University[];
  }, [data, filters]);

  // Topology: group filtered universities under Country sections
  const groupedByCountry = useMemo(() => {
    const map = new Map<string, University[]>();
    filteredUniversities.forEach((uni) => {
      const key = uni.country || 'Unknown';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(uni);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredUniversities]);

  const countryProgress = useCallback((unis: University[]) => {
    let total = 0;
    let contacted = 0;
    unis.forEach((u) =>
      u.departments.forEach((d) =>
        d.professors.forEach((p) => {
          total += 1;
          if (p.myOutreach && p.myOutreach.status !== 'not_contacted') contacted += 1;
        })
      )
    );
    return { total, contacted, percent: total > 0 ? Math.round((contacted / total) * 100) : 0 };
  }, []);

  // Compute total filtered professors
  const totalFilteredProfessors = useMemo(() => {
    let count = 0;
    filteredUniversities.forEach((u) => {
      u.departments.forEach((d) => {
        count += d.professors.length;
      });
    });
    return count;
  }, [filteredUniversities]);

  /* -------------------------------------------------------------
   * DISPATCH ACTIONS (identity comes from session, never client)
   * ----------------------------------------------------------- */
  const dispatchAction = useCallback(
    async (action: string, payload: unknown): Promise<boolean> => {
      try {
        const res = await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, payload }),
        });
        if (res.status === 401) {
          router.replace('/login');
          return false;
        }
        const resJson = await res.json();
        if (resJson.success && resJson.data) {
          setData(resJson.data);
          return true;
        }
        return false;
      } catch (err) {
        console.error(`Failed executing ${action}:`, err);
        return false;
      }
    },
    [router]
  );

  const handleSaveStatus = async (
    professorId: string,
    record: Partial<OutreachRecord>
  ) => {
    await dispatchAction('UPDATE_OUTREACH', { professorId, record });
  };

  const handleSaveUniversity = async (uniData: Partial<University>) => {
    if (uniModal.editingUniversity) {
      await dispatchAction('UPDATE_UNIVERSITY', {
        id: uniModal.editingUniversity.id,
        updates: uniData,
      });
    } else {
      await dispatchAction('ADD_UNIVERSITY', uniData);
    }
  };

  const handleDeleteUniversity = async (id: string) => {
    if (confirm('Are you sure you want to delete this university and all its departments?')) {
      await dispatchAction('DELETE_UNIVERSITY', { id });
    }
  };

  const handleSaveDepartment = async (universityId: string, deptData: Partial<Department>) => {
    if (deptModal.editingDepartment) {
      await dispatchAction('UPDATE_DEPARTMENT', {
        universityId,
        departmentId: deptModal.editingDepartment.id,
        updates: deptData,
      });
    } else {
      await dispatchAction('ADD_DEPARTMENT', {
        universityId,
        department: deptData,
      });
    }
  };

  const handleDeleteDepartment = async (universityId: string, departmentId: string) => {
    if (confirm('Delete this department and all professors under it?')) {
      await dispatchAction('DELETE_DEPARTMENT', { universityId, departmentId });
    }
  };

  const handleSaveProfessor = async (
    universityId: string,
    departmentId: string,
    profData: Partial<Professor>
  ) => {
    if (profModal.editingProfessor) {
      await dispatchAction('UPDATE_PROFESSOR', {
        universityId,
        departmentId,
        professorId: profModal.editingProfessor.id,
        updates: profData,
      });
    } else {
      await dispatchAction('ADD_PROFESSOR', {
        universityId,
        departmentId,
        professor: profData,
      });
    }
  };

  const handleDeleteProfessor = async (
    universityId: string,
    departmentId: string,
    professorId: string
  ) => {
    if (confirm('Delete this professor from tracking?')) {
      await dispatchAction('DELETE_PROFESSOR', { universityId, departmentId, professorId });
    }
  };

  const handleExportData = () => {
    if (!data) return;
    const legacy = {
      version: data.version,
      friends: {
        [data.me.username]: {
          id: data.me.username,
          name: data.me.name,
          role: data.me.role,
          avatar: data.me.avatar,
          color: data.me.color,
          glowColor: data.me.glowColor,
          accentBg: data.me.accentBg,
        },
      },
      universities: data.universities.map((uni) => ({
        ...uni,
        departments: uni.departments.map((dept) => ({
          ...dept,
          professors: dept.professors.map((prof) => ({
            id: prof.id,
            departmentId: prof.departmentId,
            name: prof.name,
            title: prof.title,
            email: prof.email,
            websiteUrl: prof.websiteUrl,
            scholarUrl: prof.scholarUrl,
            researchAreas: prof.researchAreas,
            acceptingStudents: prof.acceptingStudents,
            notes: prof.notes,
            createdAt: prof.createdAt,
            outreach: prof.myOutreach
              ? {
                  [data.me.username]: {
                    friendId: data.me.username,
                    status: prof.myOutreach.status,
                    dateEmailed: prof.myOutreach.dateEmailed,
                    responseDate: prof.myOutreach.responseDate,
                    followUpDate: prof.myOutreach.followUpDate,
                    notes: prof.myOutreach.notes,
                    emailSubject: prof.myOutreach.emailSubject,
                    lastUpdated: prof.myOutreach.lastUpdated,
                  },
                }
              : {},
          })),
        })),
      })),
      activityLogs: data.activityLogs.map((log) => ({
        id: log.id,
        timestamp: log.timestamp,
        friendId: data.me.username,
        action: log.action,
        description: log.description,
        metadata: log.metadata,
      })),
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(legacy, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `uni-apply-backup-${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleResetDemoData = async () => {
    if (confirm('Reset tracker data to initial demo state? (This replaces the shared catalog.)')) {
      await dispatchAction('RESET_DATA', {});
    }
  };

  if (loading || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', padding: '120px 0' }}>
          <RefreshCw size={32} color="#818cf8" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '14px', color: 'var(--text-secondary)' }}>
            Loading your private tracker...
          </p>
        </div>
      </div>
    );
  }

  const me = data.me;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <Header
        me={me}
        onLogout={handleLogout}
        onOpenAddUniversity={() => setUniModal({ isOpen: true, editingUniversity: null })}
        onOpenTemplates={() => setTemplatesOpen(true)}
        onOpenActivity={() => setActivityOpen(true)}
        onExportData={handleExportData}
        onResetDemoData={handleResetDemoData}
        activityCount={data.activityLogs?.length || 0}
      />

      {/* Main Container */}
      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '28px 24px 60px', width: '100%', flex: 1 }}>
        {/* Personal Progress Dashboard — private to me */}
        <StatsDashboard universities={data.universities} me={me} />

        {/* Filter & Search Bar */}
        <FilterBar
          filters={filters}
          onChangeFilters={setFilters}
          countries={countries}
          totalFilteredProfessors={totalFilteredProfessors}
        />

        {/* Topology: Country → Universities */}
        {groupedByCountry.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {groupedByCountry.map(([country, unis]) => {
              const progress = countryProgress(unis);
              return (
                <section key={country} style={{ marginBottom: '20px' }}>
                  {/* Country section header — appears before its universities */}
                  <div
                    className="glass-panel"
                    style={{
                      padding: '14px 20px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      flexWrap: 'wrap',
                      background:
                        'linear-gradient(90deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.55) 100%)',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                    }}
                  >
                    <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{getCountryFlag(country)}</span>
                    <div>
                      <h2
                        style={{
                          fontSize: '1.15rem',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          margin: 0,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {country}
                      </h2>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {unis.length} university{unis.length === 1 ? '' : 'ies'} ·{' '}
                        {progress.total} professor{progress.total === 1 ? '' : 's'}
                      </span>
                    </div>

                    {/* My per-country progress */}
                    <div
                      style={{
                        marginLeft: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        minWidth: '200px',
                      }}
                      title={`${progress.contacted} of ${progress.total} professors contacted by you`}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.68rem',
                            color: 'var(--text-muted)',
                            marginBottom: '4px',
                          }}
                        >
                          <span>My progress</span>
                          <span style={{ color: me.color, fontWeight: 700 }}>
                            {progress.contacted}/{progress.total}
                          </span>
                        </div>
                        <div
                          style={{
                            height: '8px',
                            borderRadius: 'var(--radius-full)',
                            background: 'rgba(255, 255, 255, 0.06)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${progress.percent}%`,
                              height: '100%',
                              borderRadius: 'var(--radius-full)',
                              background: `linear-gradient(90deg, ${me.color}88, ${me.color})`,
                              boxShadow: `0 0 8px ${me.glowColor}`,
                              transition: 'width 0.4s ease',
                            }}
                          />
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '1rem',
                          fontWeight: 800,
                          color: me.color,
                          minWidth: '44px',
                          textAlign: 'right',
                        }}
                      >
                        {progress.percent}%
                      </span>
                    </div>
                  </div>

                  {/* Universities in this country */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {unis.map((uni) => (
                      <UniversityCard
                        key={uni.id}
                        university={uni}
                        me={me}
                        defaultExpanded={groupedByCountry.length === 1}
                        onOpenAddDepartment={(uniId) =>
                          setDeptModal({
                            isOpen: true,
                            universityId: uniId,
                            universityName: uni.name,
                            editingDepartment: null,
                          })
                        }
                        onOpenAddProfessor={(uniId, deptId) => {
                          const dept = uni.departments.find((d) => d.id === deptId);
                          setProfModal({
                            isOpen: true,
                            universityId: uniId,
                            departmentId: deptId,
                            departmentName: dept?.name || 'Department',
                            editingProfessor: null,
                          });
                        }}
                        onOpenStatusModal={(professor) =>
                          setStatusModal({
                            isOpen: true,
                            professor,
                          })
                        }
                        onEditUniversity={(targetUni) =>
                          setUniModal({ isOpen: true, editingUniversity: targetUni })
                        }
                        onDeleteUniversity={handleDeleteUniversity}
                        onEditDepartment={(targetDept) =>
                          setDeptModal({
                            isOpen: true,
                            universityId: uni.id,
                            universityName: uni.name,
                            editingDepartment: targetDept,
                          })
                        }
                        onDeleteDepartment={handleDeleteDepartment}
                        onEditProfessor={(targetProf) => {
                          const dept = uni.departments.find((d) => d.id === targetProf.departmentId);
                          setProfModal({
                            isOpen: true,
                            universityId: uni.id,
                            departmentId: targetProf.departmentId,
                            departmentName: dept?.name || '',
                            editingProfessor: targetProf,
                          });
                        }}
                        onDeleteProfessor={handleDeleteProfessor}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div
            className="glass-panel"
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <Building2 size={44} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              No matching universities or professors found
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 20px' }}>
              Try clearing your search criteria, adjusting status filters, or add a new university to start tracking.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setUniModal({ isOpen: true, editingUniversity: null })}
            >
              <Plus size={16} />
              <span>Add First University</span>
            </button>
          </div>
        )}
      </main>

      {/* MODALS */}
      {/* 1. Status Update Modal (my status only) */}
      <StatusModal
        isOpen={statusModal.isOpen}
        professor={statusModal.professor}
        me={me}
        onClose={() => setStatusModal({ isOpen: false, professor: null })}
        onSaveStatus={handleSaveStatus}
      />

      {/* 2. University Modal */}
      <UniversityModal
        isOpen={uniModal.isOpen}
        editingUniversity={uniModal.editingUniversity}
        onClose={() => setUniModal({ isOpen: false, editingUniversity: null })}
        onSave={handleSaveUniversity}
      />

      {/* 3. Department Modal */}
      <DepartmentModal
        isOpen={deptModal.isOpen}
        universityId={deptModal.universityId}
        universityName={deptModal.universityName}
        editingDepartment={deptModal.editingDepartment}
        onClose={() =>
          setDeptModal({
            isOpen: false,
            universityId: '',
            universityName: '',
            editingDepartment: null,
          })
        }
        onSave={handleSaveDepartment}
      />

      {/* 4. Professor Modal */}
      <ProfessorModal
        isOpen={profModal.isOpen}
        universityId={profModal.universityId}
        departmentId={profModal.departmentId}
        departmentName={profModal.departmentName}
        editingProfessor={profModal.editingProfessor}
        onClose={() =>
          setProfModal({
            isOpen: false,
            universityId: '',
            departmentId: '',
            departmentName: '',
            editingProfessor: null,
          })
        }
        onSave={handleSaveProfessor}
      />

      {/* 5. Cold Email Templates Modal */}
      <EmailTemplatesModal
        isOpen={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
      />

      {/* 6. My Activity Timeline Modal */}
      <ActivityModal
        isOpen={activityOpen}
        onClose={() => setActivityOpen(false)}
        logs={data.activityLogs || []}
        me={me}
      />
    </div>
  );
}
